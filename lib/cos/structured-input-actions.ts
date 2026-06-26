import type { CosAnswer } from "@/lib/cos/cos-context"
import { isStructuredOperationalInput } from "@/lib/cos/structured-input-detector"
import { parseStructuredOperationalInput } from "@/lib/cos/structured-input-parser"
import { buildStructuredInputPreview, composeStructuredInputAnswer } from "@/lib/cos/structured-input-preview"

export function answerStructuredInput(message: string): CosAnswer | null {
  if (!isStructuredOperationalInput(message)) return null

  const parsed = parseStructuredOperationalInput(message)
  const preview = buildStructuredInputPreview(parsed)

  return {
    intent: "read_only_foundation",
    sources: ["structured_input"],
    answer: composeStructuredInputAnswer(preview),
    preview,
  }
}
