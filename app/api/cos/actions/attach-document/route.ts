import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import { textField, writeCosActionLog } from "@/lib/cos/cos-action-utils"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
}

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

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: "Envie o arquivo e os metadados do documento." }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo de origem nao encontrado para anexar." }, { status: 400 })
  }

  const sourceFileName = textField(formData.get("sourceFileName") ?? file.name)
  const sourceFileType = textField(formData.get("sourceFileType") ?? file.type)
  const sourceConfidence = Number(formData.get("sourceConfidence"))
  const detectedType = textField(formData.get("detectedType")) || "documento_operacional"
  const notes = textField(formData.get("notes"))
  const clientId = textField(formData.get("clientId"))
  const contractId = textField(formData.get("contractId"))
  const financialEntryId = textField(formData.get("financialEntryId"))

  const path = `cos-documents/${crypto.randomUUID()}-${safeFileName(file.name) || "arquivo"}`
  const { error: uploadError } = await supabase.storage.from("gate-documents").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    const log = await writeCosActionLog(supabase as unknown as SupabaseClient, {
      userId: user.id,
      actionType: "attach_document",
      sourceFileName,
      sourceFileType,
      sourceConfidence,
      payload: { sourceFileName, sourceFileType, detectedType, notes },
      status: "error",
      errorMessage: uploadError.message,
    })
    return NextResponse.json({ error: uploadError.message, log }, { status: 500 })
  }

  const insertPayload = {
    name: sourceFileName || file.name,
    type: detectedType,
    mime_type: file.type || sourceFileType || null,
    size_bytes: file.size,
    file_path: path,
    path,
    bucket: "gate-documents",
    client_id: clientId || null,
    contract_id: contractId || null,
    financial_entry_id: financialEntryId || null,
    notes:
      notes ||
      [
        "Anexado pelo COS a partir de revisao confirmada.",
        Number.isFinite(sourceConfidence) ? `Confianca da extracao: ${sourceConfidence}%.` : "",
      ]
        .filter(Boolean)
        .join("\n"),
  }

  const { data, error } = await supabase.from("documents").insert(insertPayload).select("*").single()

  if (error) {
    const log = await writeCosActionLog(supabase as unknown as SupabaseClient, {
      userId: user.id,
      actionType: "attach_document",
      sourceFileName,
      sourceFileType,
      sourceConfidence,
      payload: insertPayload,
      status: "error",
      errorMessage: error.message,
    })
    return NextResponse.json({ error: error.message, log }, { status: 500 })
  }

  const log = await writeCosActionLog(supabase as unknown as SupabaseClient, {
    userId: user.id,
    actionType: "attach_document",
    sourceFileName,
    sourceFileType,
    sourceConfidence,
    payload: insertPayload,
    result: { id: data?.id, path },
    status: "success",
  })

  return NextResponse.json({ ok: true, data, log })
}

