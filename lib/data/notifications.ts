import { selectRows, updateRows } from "@/lib/data/supabase-helpers"

export async function getNotifications() {
  return selectRows("notifications", [], { orderBy: "created_at", ascending: false })
}

export async function markNotificationAsRead(id: string) {
  return updateRows("notifications", { read: true, lida: true }, { id }, [{ id, read: true }])
}
