import { parcelas } from "@/lib/mock-data"
import { selectRows, updateRows } from "@/lib/data/supabase-helpers"
import type { SupabaseRow } from "@/lib/supabase/types"

export async function getInstallments() {
  return selectRows("installments", parcelas)
}

export async function getOverdueInstallments() {
  return selectRows("v_overdue_installments", parcelas.filter((item) => item.status === "overdue"))
}

export async function markInstallmentAsPaid(id: string, paidValue: number, paymentDate: string) {
  return updateRows("installments", {
    status: "paid",
    paid_value: paidValue,
    payment_date: paymentDate,
  } satisfies SupabaseRow, { id }, [{ id, status: "paid", paid_value: paidValue, payment_date: paymentDate }])
}
