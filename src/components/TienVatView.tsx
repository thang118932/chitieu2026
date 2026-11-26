"use client";

import { useMemo, useState } from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dayLabel, formatNumber, formatVND, parseAmount, todayVN } from "@/lib/format";
import { useSave } from "@/lib/useSave";
import type { AllowanceEntry, Kid } from "@/lib/types";
import BottomNav from "./BottomNav";
import Sheet from "./Sheet";

type Props = { familyId: string; kids: Kid[]; entries: AllowanceEntry[] };

const card = "rounded-2xl bg-white dark:bg-zinc-900 shadow";
const input = "w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 ring-amber-400";
const QUICK = [5_000, 10_000, 20_000, 35_000, 50_000];

export default function TienVatView({ familyId, kids, entries }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [entrySheet, setEntrySheet] = useState<{ entry?: AllowanceEntry; kidId?: string } | null>(null);
  const [kidSheet, setKidSheet] = useState(false);
  const [paying, setPaying] = useState(false);
  const { run: runPay } = useSave(() => setPaying(false));

  const stats = useMemo(() => {
    const m = new Map<string, { in: number; out: number }>();
    for (const k of kids) m.set(k.id, { in: 0, out: 0 });
    for (const e of entries) {
      const s = m.get(e.kid_id);
      if (s) s[e.type] += e.amount;
    }
    return m;
  }, [kids, entries]);

  const kidMap = useMemo(() => new Map(kids.map((k) => [k.id, k])), [kids]);
  const shown = filter === "all" ? entries : entries.filter((e) => e.kid_id === filter);
  const groups = useMemo(() => {
    const g = new Map<string, AllowanceEntry[]>();
    for (const e of shown) g.set(e.date, [...(g.get(e.date) ?? []), e]);
    return [...g.entries()];
  }, [shown]);

  const weeklyKids = kids.filter((k) => k.weekly_amount > 0);
  function payWeekly() {
    if (!weeklyKids.length) return setKidSheet(true);
    const list = weeklyKids.map((k) => `${k.name} ${formatVND(k.weekly_amount)}`).join(", ");
    if (!confirm(`Phát tiền tuần hôm nay?\n${list}`)) return;
    setPaying(true);
    runPay(() =>
      createClient().from("allowance_entries").insert(
        weeklyKids.map((k) => ({ family_id: familyId, kid_id: k.id, date: todayVN(), type: "in", amount: k.weekly_amount, note: "Tiền tuần" }))
      )
    );
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm whitespace-nowrap ${active ? "bg-amber-500 text-white" : "bg-white dark:bg-zinc-900 shadow-sm"}`;

  return (
    <div className="min-h-dvh pb-28">
      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold">Tiền tiêu vặt</h1>
          <button onClick={() => setKidSheet(true)} className="p-2 text-zinc-500" aria-label="Quản lý các bé"><Settings2 size={20} /></button>
        </div>

        {kids.length === 0 ? (
          <div className="text-center text-zinc-500 py-12">
            <div className="text-4xl">🧒</div>
            <p className="mt-2">Chưa có bé nào.</p>
            <button onClick={() => setKidSheet(true)} className="mt-3 rounded-xl bg-amber-500 text-white px-4 py-2">+ Thêm bé</button>
          </div>
        ) : (
          <>
            <div className={`grid gap-3 ${kids.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {kids.map((k) => {
                const s = stats.get(k.id)!;
                const balance = s.in - s.out;
                return (
                  <button key={k.id} onClick={() => setEntrySheet({ kidId: k.id })}
                    className={`${card} p-4 text-left border-t-4`} style={{ borderTopColor: k.color }}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{k.emoji}</span>
                      <span className="font-semibold">{k.name}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Còn lại</p>
                    <p className={`text-2xl font-bold ${balance < 0 ? "text-red-500" : "text-green-600"}`}>{formatNumber(balance) || "0"} ₫</p>
                    <p className="text-xs text-zinc-500 mt-1">Nhận {formatNumber(s.in) || 0} · Chi {formatNumber(s.out) || 0}</p>
                  </button>
                );
              })}
            </div>

            <button onClick={payWeekly} disabled={paying}
              className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white py-3 font-semibold disabled:opacity-60">
              💵 {paying ? "Đang phát..." : "Phát tiền tuần"}
            </button>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button className={chip(filter === "all")} onClick={() => setFilter("all")}>Tất cả</button>
              {kids.map((k) => (
                <button key={k.id} className={chip(filter === k.id)} onClick={() => setFilter(k.id)}>{k.emoji} {k.name}</button>
              ))}
            </div>

            {groups.length === 0 && <p className="text-center text-zinc-500 py-6">Chưa có giao dịch</p>}

            {groups.map(([date, list]) => (
              <section key={date}>
                <p className="text-sm text-zinc-500 px-1 mb-1">{dayLabel(date)}</p>
                <ul className={`${card} divide-y divide-zinc-100 dark:divide-zinc-800`}>
                  {list.map((e) => {
                    const k = kidMap.get(e.kid_id);
                    return (
                      <li key={e.id}>
                        <button onClick={() => setEntrySheet({ entry: e })} className="w-full flex items-center gap-3 p-3 text-left">
                          <span className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: `${k?.color ?? "#64748b"}22` }}>
                            {k?.emoji}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-medium truncate">{e.note || (e.type === "in" ? "Nhận tiền" : "Chi tiêu")}</span>
                            <span className="block text-xs text-zinc-500">{k?.name}</span>
                          </span>
                          <span className={`font-semibold whitespace-nowrap ${e.type === "in" ? "text-green-600" : "text-red-500"}`}>
                            {e.type === "in" ? "+" : "-"}{formatNumber(e.amount)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </>
        )}
      </main>

      {kids.length > 0 && (
        <button onClick={() => setEntrySheet({ kidId: filter !== "all" ? filter : undefined })}
          className="fixed z-30 bottom-20 right-1/2 translate-x-1/2 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center"
          aria-label="Ghi tiền tiêu vặt">
          <Plus size={28} />
        </button>
      )}

      {entrySheet && (
        <EntryForm familyId={familyId} kids={kids} entry={entrySheet.entry} kidId={entrySheet.kidId} onClose={() => setEntrySheet(null)} />
      )}
      {kidSheet && <KidsForm familyId={familyId} kids={kids} onClose={() => setKidSheet(false)} />}
      <BottomNav />
    </div>
  );
}

function EntryForm({ familyId, kids, entry, kidId, onClose }: {
  familyId: string; kids: Kid[]; entry?: AllowanceEntry; kidId?: string; onClose: () => void;
}) {
  const supabase = createClient();
  const { busy, error, run } = useSave(onClose);
  const [kid, setKid] = useState(entry?.kid_id ?? kidId ?? kids[0]?.id);
  const [type, setType] = useState<"in" | "out">(entry?.type ?? "out");
  const [amount, setAmount] = useState(entry?.amount ?? 0);
  const [date, setDate] = useState(entry?.date ?? todayVN());
  const [note, setNote] = useState(entry?.note ?? "");

  const save = () => {
    const row = { kid_id: kid, type, amount, date, note: note.trim() || null };
    return run(() =>
      entry
        ? supabase.from("allowance_entries").update(row).eq("id", entry.id)
        : supabase.from("allowance_entries").insert({ ...row, family_id: familyId })
    );
  };
  const remove = () => {
    if (entry && confirm("Xoá khoản này?")) run(() => supabase.from("allowance_entries").delete().eq("id", entry.id));
  };

  return (
    <Sheet title={entry ? "Sửa khoản" : "Ghi tiền tiêu vặt"} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="flex gap-2 flex-wrap">
          {kids.map((k) => (
            <button type="button" key={k.id} onClick={() => setKid(k.id)}
              className={`rounded-xl px-4 py-2 border-2 ${kid === k.id ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "border-zinc-200 dark:border-zinc-700"}`}>
              {k.emoji} {k.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-sm font-medium">
          {(["out", "in"] as const).map((t) => (
            <button type="button" key={t} onClick={() => setType(t)}
              className={`rounded-lg py-2 ${type === t ? "bg-white dark:bg-zinc-700 shadow" : "text-zinc-500"}`}>
              {t === "out" ? "Chi" : "Nhận"}
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-baseline gap-2 border-b-2 border-amber-400">
            <input autoFocus={!entry} inputMode="numeric" value={formatNumber(amount)} onChange={(e) => setAmount(parseAmount(e.target.value))}
              placeholder="0" className={`flex-1 min-w-0 bg-transparent text-4xl font-bold py-2 outline-none ${type === "in" ? "text-green-600" : "text-red-500"}`} />
            <span className="text-2xl text-zinc-400">₫</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" onClick={() => setAmount(amount * 1000)} disabled={!amount || amount >= 1e9}
              className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-sm disabled:opacity-40">,000</button>
            {QUICK.map((q) => (
              <button type="button" key={q} onClick={() => setAmount(q)}
                className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1 text-sm">{q / 1000}k</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-2">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`${input} w-auto`} />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === "in" ? "vd: Tiền tuần" : "vd: Mua lego"} className={`${input} min-w-0`} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          {entry && (
            <button type="button" onClick={remove} disabled={busy} aria-label="Xoá" className="rounded-xl border border-red-300 text-red-500 px-4"><Trash2 size={20} /></button>
          )}
          <button disabled={busy || amount <= 0 || !kid} className="flex-1 rounded-xl bg-amber-500 text-white py-3 font-semibold disabled:opacity-60">
            {busy ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function KidsForm({ familyId, kids, onClose }: { familyId: string; kids: Kid[]; onClose: () => void }) {
  const supabase = createClient();
  const [rows, setRows] = useState(kids.map((k) => ({ ...k })));
  const [newKid, setNewKid] = useState({ name: "", emoji: "🧒", weekly_amount: 0 });
  const { busy, error, run } = useSave(onClose);

  const update = (i: number, patch: Partial<Kid>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = () =>
    run(async () => {
      for (const r of rows) {
        const orig = kids.find((k) => k.id === r.id)!;
        if (r.name !== orig.name || r.emoji !== orig.emoji || r.weekly_amount !== orig.weekly_amount) {
          const res = await supabase.from("kids").update({ name: r.name.trim(), emoji: r.emoji, weekly_amount: r.weekly_amount }).eq("id", r.id);
          if (res.error) return res;
        }
      }
      if (newKid.name.trim()) {
        return supabase.from("kids").insert({ ...newKid, name: newKid.name.trim(), family_id: familyId, sort_order: kids.length + 1 });
      }
      return { error: null };
    });

  const remove = (k: Kid) => {
    if (confirm(`Xoá ${k.name} và toàn bộ lịch sử tiền tiêu vặt?`)) run(() => supabase.from("kids").delete().eq("id", k.id));
  };

  return (
    <Sheet title="Các bé" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <p className="text-xs text-zinc-500">Emoji · Tên · Tiền tuần</p>
        {rows.map((r, i) => (
          <div key={r.id} className="flex gap-2 items-center">
            <input className={`${input} w-12 text-center px-1`} value={r.emoji} maxLength={4} onChange={(e) => update(i, { emoji: e.target.value })} />
            <input className={`${input} flex-1 min-w-0`} value={r.name} required onChange={(e) => update(i, { name: e.target.value })} />
            <input className={`${input} w-24 text-right`} inputMode="numeric" value={formatNumber(r.weekly_amount)}
              onChange={(e) => update(i, { weekly_amount: parseAmount(e.target.value) })} placeholder="0" />
            <button type="button" onClick={() => remove(r)} className="p-1 text-zinc-400 hover:text-red-500" aria-label={`Xoá ${r.name}`}><Trash2 size={18} /></button>
          </div>
        ))}
        <div className="flex gap-2 items-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <input className={`${input} w-12 text-center px-1`} value={newKid.emoji} maxLength={4} onChange={(e) => setNewKid({ ...newKid, emoji: e.target.value })} />
          <input className={`${input} flex-1 min-w-0`} value={newKid.name} placeholder="Thêm bé mới" onChange={(e) => setNewKid({ ...newKid, name: e.target.value })} />
          <input className={`${input} w-24 text-right`} inputMode="numeric" value={formatNumber(newKid.weekly_amount)} placeholder="Tiền tuần"
            onChange={(e) => setNewKid({ ...newKid, weekly_amount: parseAmount(e.target.value) })} />
          <span className="w-[26px]" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-amber-500 text-white py-3 font-semibold disabled:opacity-60">Lưu</button>
      </form>
    </Sheet>
  );
}
