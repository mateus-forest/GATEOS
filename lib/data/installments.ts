import { insertRow, selectRows, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getInstallments() {
  return selectRows("installments", [])
}

export async function getOverdueInstallments() {
  return selectRows("v_overdue_installments", [])
}

export async function createInstallment(payload: SupabaseRow) {
  return insertRow("installments", payload, { ...payload, id: crypto.randomUUID() })
}

export async function markInstallmentAsPaid(id: string, paidValue: number, paymentDate: string) {
  return updateRows("installments", {
    status: "paga",
    paid_value: paidValue,
    payment_date: paymentDate,
  } satisfies SupabaseRow, { id }, [{ id, status: "paga", paid_value: paidValue, payment_date: paymentDate }])
}
