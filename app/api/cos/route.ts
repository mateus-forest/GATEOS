import { NextResponse } from "next/server"

import { analyzeCosFiles } from "@/lib/cos/cos-file-analysis"
import { answerCosQuestion } from "@/lib/cos/cos-router"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase não está configurado." },
        { status: 500 }
      )
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      )
    }

    const contentType = request.headers.get("content-type") ?? ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const message = String(formData.get("message") ?? "").trim()
      const files = formData.getAll("files").filter((item): item is File => item instanceof File)

      if (!message && files.length === 0) {
        return NextResponse.json(
          { error: "Envie uma pergunta ou anexe um arquivo para o COS." },
          { status: 400 }
        )
      }

      if (files.length > 0) {
        const response = await analyzeCosFiles(files)
        return NextResponse.json(response)
      }

      const response = await answerCosQuestion(supabase, message)
      return NextResponse.json(response)
    }

    const body = await request.json().catch(() => null)
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!message) {
      return NextResponse.json(
        { error: "Envie uma pergunta para o COS." },
        { status: 400 }
      )
    }

    const response = await answerCosQuestion(supabase, message)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[cos] Falha ao responder pergunta", error)
    return NextResponse.json(
      { error: "Não consegui acessar esses dados no momento." },
      { status: 500 }
    )
  }
}
