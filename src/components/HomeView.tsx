"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dayLabel, formatVND, monthLabel, shiftMonth } from "@/lib/format";
import { flushPending, getPending, PENDING_EVENT, type PendingTx } from "@/lib/offlineQueue";
import type { Category, Family, Member, Transaction } from "@/lib/types";
import BottomNav from "./BottomNav";
import TransactionSheet from "./TransactionSheet";

type Props = {
  month: string;
  family: Family;
  userId: string;
  categories: Category[];
  transactions: Transaction[];
  members: Member[];
};

export default function HomeView({ month, family, userId, categories, transactions: serverTx, members }: Props) {
  const router = useRouter();
  const [sheet, setSheet] = useState<{ open: boolean; tx?: Transaction }>({ open: false });
  const [pending, setPending] = useState<PendingTx[]>([]);

  // Hàng đợi offline: hiện các khoản chưa đồng bộ, có mạng thì gửi lên
  useEffect(() => {
    const supabase = createClient();
    const sync = () => setPending(getPending());
    const flush = () => flushPending(supabase).then((n) => n && router.refresh());
    sync();
    flush();
    window.addEventListener(PENDING_EVENT, sync);
    window.addEventListener("online", flush);
    return () => {
      window.removeEventListener(PENDING_EVENT, sync);
      window.removeEventListener("online", flush);
    };
  }, [router]);

  const pendingIds = useMemo(() => new Set(pending.map((p) => p.id)), [pending]);
  const transactions = useMemo(() => {
    const extra: Transaction[] = pending
      .filter((p) => p.family_id === family.id && p.date.startsWith(month) && !serverTx.some((t) => t.id === p.id))
      .map((p) => ({ ...p, user_id: userId, created_at: new Date().toISOString() }));
    return [...extra, ...serverTx].sort((a, b) => b.date.localeCompare(a.date));
  }, [pending, serverTx, family.id, month, userId]);

  // Realtime: người khác thêm/sửa thì tự cập nhật
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`tx-${family.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `family_id=eq.${family.id}` },
        () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [family.id, router]);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members]);

  const totals = useMemo(() => {
    let expense = 0, income = 0;
    for (const t of transactions) {
      if (t.type === "expense") expense += t.amount;
      else income += t.amount;
    }
    return { expense, income, balance: income - expense };
  }, [transactions]);

  const groups = useMemo(() => {
    const g = new Map<string, Transaction[]>();
    for (const t of transactions) g.set(t.date, [...(g.get(t.date) ?? []), t]);
    return [...g.entries()];
  }, [transactions]);

  return (
    <div className="min-h-dvh pb-28">
      <header className="bg-amber-500 text-white px-4 pt-6 pb-16">
        <div className="max-w-md mx-auto">
          <p className="text-sm opacity-90">🍟 {family.name}</p>
          <div className="flex items-center justify-between mt-2">
            <Link href={`/?m=${shiftMonth(month, -1)}`} className="p-2 -ml-2" aria-label="Tháng trước"><ChevronLeft /></Link>
            <h1 className="text-lg font-semibold">{monthLabel(month)}</h1>
            <Link href={`/?m=${shiftMonth(month, 1)}`} className="p-2 -mr-2" aria-label="Tháng sau"><ChevronRight /></Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-12 space-y-4">
        <section className="rounded-2xl bg-white dark:bg-zinc-900 shadow p-4">
          <p className="text-sm text-zinc-500">Đã chi tháng này</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{formatVND(totals.expense)}</p>
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div className="rounded-xl bg-green-50 dark:bg-green-950/40 p-3">
              <p className="text-zinc-500">Thu</p>
              <p className="font-semibold text-green-600">{formatVND(totals.income)}</p>
            </div>
            <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3">
              <p className="text-zinc-500">Còn lại</p>
              <p className={`font-semibold ${totals.balance < 0 ? "text-red-500" : ""}`}>{formatVND(totals.balance)}</p>
            </div>
          </div>
        </section>

        {groups.length === 0 && (
          <div className="text-center text-zinc-500 py-12">
            <div className="text-4xl">🧾</div>
            <p className="mt-2">Chưa có khoản nào. Bấm <b>+</b> để ghi chi tiêu đầu tiên!</p>
          </div>
        )}

        {groups.map(([date, list]) => {
          const dayExpense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
          return (
            <section key={date}>
              <div className="flex justify-between text-sm text-zinc-500 px-1 mb-1">
                <span>{dayLabel(date)}</span>
                {dayExpense > 0 && <span>-{formatVND(dayExpense)}</span>}
              </div>
              <ul className="rounded-2xl bg-white dark:bg-zinc-900 shadow divide-y divide-zinc-100 dark:divide-zinc-800">
                {list.map((t) => {
                  const c = t.category_id ? catMap.get(t.category_id) : undefined;
                  const isPending = pendingIds.has(t.id);
                  const who = isPending ? "⏳ chờ đồng bộ" : memberMap.get(t.user_id)?.name;
                  return (
                    <li key={t.id}>
                      <button onClick={() => setSheet({ open: true, tx: t })} disabled={isPending}
                        className={`w-full flex items-center gap-3 p-3 text-left ${isPending ? "opacity-60" : ""}`}>
                        <span className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                          style={{ background: `${c?.color ?? "#64748b"}22` }}>
                          {c?.icon ?? "💸"}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium truncate">{c?.name ?? "Không rõ"}</span>
                          <span className="block text-xs text-zinc-500 truncate">
                            {[t.note, who].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className={`font-semibold whitespace-nowrap ${t.type === "income" ? "text-green-600" : ""}`}>
                          {t.type === "income" ? "+" : "-"}{formatVND(t.amount)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </main>

      <button
        onClick={() => setSheet({ open: true })}
        className="fixed z-30 bottom-20 right-1/2 translate-x-1/2 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center"
        aria-label="Thêm khoản chi"
      >
        <Plus size={28} />
      </button>

      <TransactionSheet
        key={sheet.tx?.id ?? (sheet.open ? "new" : "closed")}
        open={sheet.open}
        tx={sheet.tx}
        familyId={family.id}
        categories={categories}
        onClose={() => setSheet({ open: false })}
      />
      <BottomNav />
    </div>
  );
}
