"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatNumber, parseAmount, todayVN } from "@/lib/format";
import { addPending, isNetworkError } from "@/lib/offlineQueue";
import type { Category, Transaction, TxType } from "@/lib/types";

type Props = {
  open: boolean;
  tx?: Transaction;
  familyId: string;
  categories: Category[];
  onClose: () => void;
};

const QUICK = [10_000, 20_000, 50_000, 100_000, 200_000, 500_000];

export default function TransactionSheet({ open, tx, familyId, categories, onClose }: Props) {
  const router = useRouter();
  const [type, setType] = useState<TxType>(tx?.type ?? "expense");
  const [amount, setAmount] = useState(tx?.amount ?? 0);
  const [categoryId, setCategoryId] = useState<string | null>(tx?.category_id ?? null);
  const [date, setDate] = useState(tx?.date ?? todayVN());
  const [note, setNote] = useState(tx?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const cats = categories.filter((c) => c.type === type);
  const selectedCat = cats.some((c) => c.id === categoryId) ? categoryId : cats[0]?.id ?? null;

  async function save() {
    if (amount <= 0) return setError("Nhập số tiền");
    setBusy(true);
    setError("");
    const supabase = createClient();
    const row = { type, amount, category_id: selectedCat, date, note: note.trim() || null };

    // Mất mạng + thêm mới → lưu tạm trong máy, có mạng sẽ tự đồng bộ
    const newRow = { ...row, id: crypto.randomUUID(), family_id: familyId };
    if (!tx && !navigator.onLine) {
      addPending(newRow);
      setBusy(false);
      return onClose();
    }

    const { error } = tx
      ? await supabase.from("transactions").update({ ...row, updated_at: new Date().toISOString() }).eq("id", tx.id)
      : await supabase.from("transactions").insert(newRow);
    setBusy(false);
    if (error && !tx && isNetworkError(error.message)) {
      addPending(newRow);
      return onClose();
    }
    if (error) return setError(isNetworkError(error.message) ? "Mất mạng, chưa sửa được. Thử lại sau." : error.message);
    router.refresh();
    onClose();
  }

  async function remove() {
    if (!tx || !confirm("Xoá khoản này?")) return;
    setBusy(true);
    const { error } = await createClient()
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", tx.id);
    setBusy(false);
    if (error) return setError(error.message);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{tx ? "Sửa khoản" : "Thêm khoản mới"}</h2>
          <button onClick={onClose} className="p-1" aria-label="Đóng"><X /></button>
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-sm font-medium">
          {(["expense", "income"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`rounded-lg py-2 ${type === t ? "bg-white dark:bg-zinc-700 shadow" : "text-zinc-500"}`}>
              {t === "expense" ? "Chi" : "Thu"}
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-baseline gap-2 border-b-2 border-amber-400">
            <input
              autoFocus={!tx}
              inputMode="numeric"
              value={formatNumber(amount)}
              onChange={(e) => setAmount(parseAmount(e.target.value))}
              placeholder="0"
              className={`flex-1 min-w-0 bg-transparent text-4xl font-bold py-2 outline-none ${type === "income" ? "text-green-600" : "text-red-500"}`}
            />
            <span className="text-2xl text-zinc-400">₫</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => setAmount(amount * 1000)} disabled={!amount || amount >= 1e9}
              className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-sm disabled:opacity-40">,000</button>
            {QUICK.map((q) => (
              <button key={q} onClick={() => setAmount(amount + q)}
                className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1 text-sm">
                +{q / 1000}k
              </button>
            ))}
            {amount > 0 && (
              <button onClick={() => setAmount(0)} className="rounded-full px-3 py-1 text-sm text-zinc-500">Xoá</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {cats.map((c) => (
            <button key={c.id} onClick={() => setCategoryId(c.id)}
              className={`rounded-xl p-2 flex flex-col items-center gap-1 text-xs border-2 ${selectedCat === c.id ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "border-transparent"}`}>
              <span className="text-2xl">{c.icon}</span>
              <span className="truncate w-full text-center">{c.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (tuỳ chọn)"
            className="min-w-0 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          {tx && (
            <button onClick={remove} disabled={busy} aria-label="Xoá"
              className="rounded-xl border border-red-300 text-red-500 px-4 disabled:opacity-60"><Trash2 size={20} /></button>
          )}
          <button onClick={save} disabled={busy}
            className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-3 font-semibold disabled:opacity-60">
            {busy ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
