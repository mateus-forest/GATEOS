import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  dateField,
  numberField,
  textField,
  writeCosActionLog,
} from "@/lib/cos/cos-action-utils"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nao esta configurado." }, { status: 500 })
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const payload = (body?.payload ?? body ?? {}) as Record<string, unknown>
  const source = (body?.source ?? {}) as Record<string, unknown>

  const type = textField(payload.type).toLowerCase()
  const description = textField(payload.description)
  const value = numberField(payload.value ?? payload.amount)
  const sourceContractValue = numberField(payload.source_contract_value ?? payload.sourceContractValue)
  const valueConfidence = textField(payload.value_confidence ?? payload.valueConfidence)
  const competenceDate = dateField(payload.competence_date ?? payload.competenceDate)
  const dueDate = dateField(payload.due_date ?? payload.dueDate)
  const paymentDate = dateField(payload.payment_date ?? payload.paymentDate)

  if (!["receita", "despesa"].includes(type)) {
    return NextResponse.json({ error: "Tipo financeiro invalido. Use receita ou despesa." }, { status: 400 })
  }

  if (!description) {
    return NextResponse.json({ error: "Informe a descricao do lancamento." }, { status: 400 })
  }

  if (typeof value !== "number" || value <= 0) {
    return NextResponse.json({ error: "Informe um valor financeiro positivo." }, { status: 400 })
  }

  if (typeof sourceContractValue === "number" && sourceContractValue >= 100 && value < 100) {
    return NextResponse.json(
      { error: "Valor financeiro inconsistente com o contrato. Revise o valor mensal antes de gravar." },
      { status: 400 }
    )
  }

  if (valueConfidence === "ambiguous" || valueConfidence === "baixa") {
    return NextResponse.json(
      { error: "Valor financeiro com baixa confianca. Revise manualmente antes de gravar." },
      { status: 400 }
    )
  }

  if (description.length > 180 || /\b(CL[ÁA]USULA|CLAUSULA|foro|obriga[cç][aã]o|rescis[aã]o|pessoa\s+jur[ií]dica)\b/i.test(description)) {
    return NextResponse.json(
      { error: "Descricao financeira parece conter texto juridico. Revise manualmente antes de gravar." },
      { status: 400 }
    )
  }

  if (!competenceDate && !dueDate) {
    return NextResponse.json({ error: "Informe a competencia ou o vencimento do lancamento." }, { status: 400 })
  }

  const insertPayload = {
    type,
    status: textField(payload.status) || "pendente",
    description,
    value,
    amount: value,
    competence_date: competenceDate ?? dueDate,
    due_date: dueDate ?? competenceDate,
    payment_date: paymentDate ?? null,
    supplier_name: textField(payload.vendor_name ?? payload.supplier_name ?? payload.client_name) || null,
    notes: [
      "Criado pelo COS a partir de revisao confirmada.",
      textField(payload.category) ? `Categoria sugerida pelo OCR: ${textField(payload.category)}.` : "",
      textField(source.fileName) ? `Arquivo de origem: ${textField(source.fileName)}.` : "",
      typeof source.confidence === "number" ? `Confianca da extracao: ${source.confidence}%.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    attachment_type: textField(source.type) || null,
  }

  const { data, error } = await supabase.from("financial_entries").insert(insertPayload).select("*").single()

  if (error) {
    await writeCosActionLog(supabase as unknown as SupabaseClient, {
      userId: user.id,
      actionType: "create_financial_entry",
      sourceFileName: textField(source.fileName),
      sourceFileType: textField(source.type),
      sourceConfidence: Number(source.confidence),
      payload: insertPayload,
      status: "error",
      errorMessage: error.message,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const log = await writeCosActionLog(supabase as unknown as SupabaseClient, {
    userId: user.id,
    actionType: "create_financial_entry",
    sourceFileName: textField(source.fileName),
    sourceFileType: textField(source.type),
    sourceConfidence: Number(source.confidence),
    payload: insertPayload,
    result: { id: data?.id },
    status: "success",
  })

  return NextResponse.json({ ok: true, data, log })
}
