"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type FieldOption = {
  label: string
  value: string
}

type FieldConfig = {
  name: string
  label: string
  type?: "text" | "email" | "tel" | "date" | "number" | "money" | "select" | "textarea" | "file"
  required?: boolean
  placeholder?: string
  options?: FieldOption[]
}

type FieldSection = {
  title: string
  description?: string
  fields: FieldConfig[]
}

type MockCreateDialogProps = {
  title: string
  description: string
  triggerLabel: string
  toastMessage: string
  fields?: string[]
  sections?: FieldSection[]
  onSave?: (values: Record<string, string>, files: Record<string, File | null>) => void | Promise<void>
}

export function MockCreateDialog({
  title,
  description,
  triggerLabel,
  toastMessage,
  fields = ["Nome", "Valor", "Observacao"],
  sections,
  onSave,
}: MockCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")
  const [loading, setLoading] = useState(false)

  const formSections = sections ?? [
    {
      title: "Dados principais",
      fields: fields.map((field) => ({ name: field, label: field, type: "text" as const })),
    },
  ]

  const setField = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: "" }))
    setSubmitError("")
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    formSections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required && !values[field.name]?.trim()) {
          nextErrors[field.name] = "Campo obrigatório."
        }
      })
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    setSubmitError("")
    try {
      await onSave?.(values, files)
      toast.success(toastMessage)
      setValues({})
      setFiles({})
      setErrors({})
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar. Verifique a conexão e tente novamente."
      console.error(`[${title}] Falha ao salvar`, error)
      setSubmitError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: FieldConfig) => {
    const id = `${title}-${field.name}`
    const value = values[field.name] ?? ""

    if (field.type === "select") {
      return (
        <Select value={value} onValueChange={(nextValue) => setField(field.name, nextValue)}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={field.placeholder ?? field.label} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.length ? (
              field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="empty" disabled>Nenhum registro encontrado</SelectItem>
            )}
          </SelectContent>
        </Select>
      )
    }

    if (field.type === "textarea") {
      return (
        <textarea
          id={id}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => setField(field.name, event.target.value)}
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      )
    }

    if (field.type === "file") {
      return (
        <Input
          id={id}
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            setFiles((current) => ({ ...current, [field.name]: file }))
            setField(field.name, file?.name ?? "")
          }}
        />
      )
    }

    return (
      <Input
        id={id}
        type={field.type === "money" ? "number" : field.type ?? "text"}
        step={field.type === "money" ? "0.01" : undefined}
        min={field.type === "number" || field.type === "money" ? "0" : undefined}
        placeholder={field.placeholder}
        value={value}
        onChange={(event) => setField(field.name, event.target.value)}
      />
    )
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {formSections.map((section) => (
              <div key={section.title} className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  {section.description && <p className="text-xs text-muted-foreground">{section.description}</p>}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.fields.map((field) => (
                    <div key={field.name} className={field.type === "textarea" ? "grid gap-2 md:col-span-2" : "grid gap-2"}>
                      <Label htmlFor={`${title}-${field.name}`}>
                        {field.label}
                        {field.required && <span className="text-destructive"> *</span>}
                      </Label>
                      {renderField(field)}
                      {errors[field.name] && <p className="text-xs text-destructive">{errors[field.name]}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {submitError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
