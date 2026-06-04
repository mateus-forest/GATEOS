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

type MockCreateDialogProps = {
  title: string
  description: string
  triggerLabel: string
  toastMessage: string
  fields?: string[]
  onSave?: (values: Record<string, string>) => void
}

export function MockCreateDialog({
  title,
  description,
  triggerLabel,
  toastMessage,
  fields = ["Nome", "Valor", "Observacao"],
  onSave,
}: MockCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    onSave?.(values)
    toast.success(toastMessage)
    setValues({})
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {fields.map((field) => (
              <div key={field} className="grid gap-2">
                <Label htmlFor={`${title}-${field}`}>{field}</Label>
                <Input
                  id={`${title}-${field}`}
                  value={values[field] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
