import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  normalizeDocumentNumber,
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

  const name = textField(payload.name ?? payload.legalName ?? payload.legal_name)
  const legalName = textField(payload.legalName ?? payload.legal_name ?? payload.name)
  const documentNumber = normalizeDocumentNumber(
    payload.documentNumber ?? payload.document_number ?? payload.document ?? payload.cnpj ?? payload.cpf
  )
  const confirmNoDocument = Boolean(body?.confirmNoDocument)

  if (!name && !legalName) {
    return NextResponse.json({ error: "Informe o nome ou a razao social do cliente." }, { status: 400 })
  }

  if (!documentNumber && !confirmNoDocument) {
    return NextResponse.json(
      { error: "Cliente sem CNPJ/CPF exige confirmacao adicional antes do cadastro.", requiresNoDocumentConfirmation: true },
      { status: 409 }
    )
  }

  if (documentNumber) {
    const { data: existingByDocument, error: duplicateError } = await supabase
      .from("clients")
      .select("id,name,legal_name,document_number")
      .eq("document_number", documentNumber)
      .limit(1)

    if (duplicateError) {
      await writeCosActionLog(supabase as unknown as SupabaseClient, {
        userId: user.id,
        actionType: "create_client",
        sourceFileName: textField(source.fileName),
        sourceFileType: textField(source.type),
        sourceConfidence: Number(source.confidence),
        payload,
        status: "error",
        errorMessage: duplicateError.message,
      })
      return NextResponse.json({ error: duplicateError.message }, { status: 500 })
    }

    if (existingByDocument && existingByDocument.length > 0) {
      return NextResponse.json(
        { error: "Ja existe um cliente cadastrado com este CNPJ/CPF.", duplicate: existingByDocument[0] },
        { status: 409 }
      )
    }
  }

  const insertPayload = {
    name: name || legalName,
    legal_name: legalName || name,
    document_number: documentNumber || null,
    address: textField(payload.address) || null,
    city: textField(payload.city) || null,
    state: textField(payload.state) || null,
    zip_code: textField(payload.postalCode ?? payload.zip_code ?? payload.cep) || null,
    status: textField(payload.status) || "ativo",
    notes: [
      "Criado pelo COS a partir de revisao confirmada.",
      textField(source.fileName) ? `Arquivo de origem: ${textField(source.fileName)}.` : "",
      typeof source.confidence === "number" ? `Confianca da extracao: ${source.confidence}%.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  }

  const { data, error } = await supabase.from("clients").insert(insertPayload).select("*").single()

  if (error) {
    await writeCosActionLog(supabase as unknown as SupabaseClient, {
      userId: user.id,
      actionType: "create_client",
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
    actionType: "create_client",
    sourceFileName: textField(source.fileName),
    sourceFileType: textField(source.type),
    sourceConfidence: Number(source.confidence),
    payload: insertPayload,
    result: { id: data?.id },
    status: "success",
  })

  return NextResponse.json({ ok: true, data, log })
}
