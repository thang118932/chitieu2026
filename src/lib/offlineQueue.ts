import type { SupabaseClient } from "@supabase/supabase-js";
import type { TxType } from "./types";

/** Khoản chi ghi lúc mất mạng, lưu tạm trong máy rồi đồng bộ khi có mạng */
export type PendingTx = {
  id: string;
  family_id: string;
  type: TxType;
  amount: number;
  category_id: string | null;
  date: string;
  note: string | null;
};

const KEY = "kc-pending-tx";
export const PENDING_EVENT = "kc-pending";

export function getPending(): PendingTx[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function setPending(list: PendingTx[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  window.dispatchEvent(new Event(PENDING_EVENT));
}

export function addPending(tx: PendingTx) {
  setPending([...getPending(), tx]);
}

export const isNetworkError = (msg: string) => !navigator.onLine || /fetch|network/i.test(msg);

/** Gửi các khoản đang chờ lên server. Trả về số khoản đã đồng bộ. */
export async function flushPending(supabase: SupabaseClient): Promise<number> {
  const list = getPending();
  if (!list.length || !navigator.onLine) return 0;
  const { error } = await supabase.from("transactions").upsert(list, { onConflict: "id", ignoreDuplicates: true });
  if (error) {
    console.error("Đồng bộ thất bại", error);
    return 0;
  }
  // chỉ xoá những khoản đã gửi (có thể có khoản mới thêm trong lúc gửi)
  const sent = new Set(list.map((t) => t.id));
  setPending(getPending().filter((t) => !sent.has(t.id)));
  return list.length;
}
