"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useSave } from "@/lib/useSave";
import { createClient } from "@/lib/supabase/client";
import { formatNumber, formatVND, parseAmount, todayVN } from "@/lib/format";
import type { Category, HuiGroup, HuiPayment } from "@/lib/types";
import BottomNav from "./BottomNav";
import Sheet from "./Sheet";

type Props = { familyId: string; groups: HuiGroup[]; payments: HuiPayment[]; savingCategory: Category | null };

const card = "rounded-2xl bg-white dark:bg-zinc-900 shadow";
const input = "w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 ring-amber-400";
const fmtDate = (d: string | null) => (d ? d.split("-").reverse().join("/") : "—");

export default function PhuongView({ familyId, groups, payments, savingCategory }: Props) {
  const [groupSheet, setGroupSheet] = useState<{ group?: HuiGroup } | null>(null);
  const [paySheet, setPaySheet] = useState<{ group: HuiGroup; payment?: HuiPayment } | null>(null);

  const grandTotal = groups.reduce(
    (s, g) => s + payments.filter((p) => p.group_id === g.id).reduce((a, p) => a + p.amount * g.slots, 0),
    0
  );

  return (
    <div className="min-h-dvh pb-24">
      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="pt-2">
          <h1 className="text-2xl font-bold">Phường</h1>
          {groups.length > 0 && <p className="text-sm text-zinc-500">Tổng đã đóng: <b className="text-zinc-800 dark:text-zinc-200">{formatVND(grandTotal)}</b></p>}
        </div>

        {groups.length === 0 && (
          <div className="text-center text-zinc-500 py-12">
            <div className="text-4xl">🤝</div>
            <p className="mt-2">Chưa có dây phường nào.</p>
          </div>
        )}

        {groups.map((g) => {
          const list = payments.filter((p) => p.group_id === g.id);
          const total = list.reduce((s, p) => s + p.amount * g.slots, 0);
          const multi = g.slots > 1;
          return (
            <section key={g.id} className={card}>
              <div className="p-4 pb-2 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold leading-tight">{g.name}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs">
                    {g.schedule && <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5">📅 {g.schedule}</span>}
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5">{g.slots} suất</span>
                  </div>
                </div>
                <button onClick={() => setGroupSheet({ group: g })} className="p-1.5 text-zinc-400" aria-label="Sửa dây phường"><Pencil size={18} /></button>
              </div>

              <table className="w-full text-sm">
                <thead className="text-xs text-zinc-500 border-y border-zinc-100 dark:border-zinc-800">
                  <tr>
                    <th className="py-2 pl-4 text-left font-medium w-10">STT</th>
                    <th className="py-2 text-left font-medium">Ngày</th>
                    <th className="py-2 text-right font-medium">{multi ? "1 suất" : "Số tiền"}</th>
                    {multi && <th className="py-2 pr-4 text-right font-medium">{g.slots} suất</th>}
                    {!multi && <th className="pr-4" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {list.map((p) => (
                    <tr key={p.id} onClick={() => setPaySheet({ group: g, payment: p })} className="cursor-pointer hover:bg-amber-50/60 dark:hover:bg-zinc-800/60">
                      <td className="py-2.5 pl-4 text-zinc-500">{p.seq}</td>
                      <td className={`py-2.5 ${p.date ? "" : "text-zinc-400"}`}>{fmtDate(p.date)}</td>
                      <td className={`py-2.5 text-right ${multi ? "text-zinc-500" : "font-semibold"}`}>{formatNumber(p.amount)}</td>
                      <td className="py-2.5 pr-4 text-right font-semibold">{multi ? formatNumber(p.amount * g.slots) : ""}</td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-zinc-400">Chưa đóng kỳ nào</td></tr>
                  )}
                </tbody>
              </table>

              <div className="flex items-center justify-between p-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-500">{list.length} kỳ · <b className="text-zinc-800 dark:text-zinc-200">{formatVND(total)}</b></span>
                <button onClick={() => setPaySheet({ group: g })}
                  className="flex items-center gap-1 rounded-full bg-amber-500 text-white text-sm px-3 py-1.5">
                  <Plus size={16} /> Thêm kỳ
                </button>
              </div>
            </section>
          );
        })}

        <button onClick={() => setGroupSheet({})}
          className="w-full rounded-2xl border-2 border-dashed border-amber-300 text-amber-600 py-3 font-medium">
          + Thêm dây phường
        </button>
      </main>

      {groupSheet && <GroupForm familyId={familyId} group={groupSheet.group} onClose={() => setGroupSheet(null)} />}
      {paySheet && (
        <PaymentForm
          familyId={familyId}
          group={paySheet.group}
          payment={paySheet.payment}
          nextSeq={Math.max(0, ...payments.filter((p) => p.group_id === paySheet.group.id).map((p) => p.seq)) + 1}
          lastAmount={payments.filter((p) => p.group_id === paySheet.group.id).at(-1)?.amount ?? 0}
          savingCategory={savingCategory}
          onClose={() => setPaySheet(null)}
        />
      )}
      <BottomNav />
    </div>
  );
}

function GroupForm({ familyId, group, onClose }: { familyId: string; group?: HuiGroup; onClose: () => void }) {
  const supabase = createClient();
  const { busy, error, run } = useSave(onClose);
  const [name, setName] = useState(group?.name ?? "");
  const [schedule, setSchedule] = useState(group?.schedule ?? "");
  const [slots, setSlots] = useState(group?.slots ?? 1);

  const save = () => {
    const row = { name: name.trim(), schedule: schedule.trim() || null, slots };
    return run(() =>
      group
        ? supabase.from("hui_groups").update(row).eq("id", group.id)
        : supabase.from("hui_groups").insert({ ...row, family_id: familyId })
    );
  };
  const remove = () => {
    if (group && confirm(`Xoá "${group.name}" và toàn bộ các kỳ đã đóng?`))
      run(() => supabase.from("hui_groups").delete().eq("id", group.id));
  };

  return (
    <Sheet title={group ? "Sửa dây phường" : "Thêm dây phường"} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="block text-sm">Tên
          <input className={`${input} mt-1`} required value={name} onChange={(e) => setName(e.target.value)} placeholder="vd: Phường nhà bà A" />
        </label>
        <label className="block text-sm">Lịch đóng
          <input className={`${input} mt-1`} value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="vd: T1, 4, 7, 10 âm lịch" />
        </label>
        <label className="block text-sm">Số suất
          <input className={`${input} mt-1`} type="number" min={1} max={20} required value={slots} onChange={(e) => setSlots(Math.max(1, Number(e.target.value)))} />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          {group && (
            <button type="button" onClick={remove} disabled={busy} aria-label="Xoá"
              className="rounded-xl border border-red-300 text-red-500 px-4"><Trash2 size={20} /></button>
          )}
          <button disabled={busy} className="flex-1 rounded-xl bg-amber-500 text-white py-3 font-semibold disabled:opacity-60">Lưu</button>
        </div>
      </form>
    </Sheet>
  );
}

type PaymentFormProps = {
  familyId: string;
  group: HuiGroup;
  payment?: HuiPayment;
  nextSeq: number;
  lastAmount: number;
  savingCategory: Category | null;
  onClose: () => void;
};

function PaymentForm({ familyId, group, payment, nextSeq, lastAmount, savingCategory, onClose }: PaymentFormProps) {
  const supabase = createClient();
  const { busy, error, run } = useSave(onClose);
  const [seq, setSeq] = useState(payment?.seq ?? nextSeq);
  const [date, setDate] = useState(payment ? payment.date ?? "" : todayVN());
  const [amount, setAmount] = useState(payment?.amount ?? lastAmount);
  const [addTx, setAddTx] = useState(!payment);

  const save = () => {
    const row = { seq, date: date || null, amount };
    return run(async () => {
      if (payment) return supabase.from("hui_payments").update(row).eq("id", payment.id);
      const res = await supabase.from("hui_payments").insert({ ...row, group_id: group.id, family_id: familyId });
      if (res.error || !addTx || !date) return res;
      return supabase.from("transactions").insert({
        family_id: familyId,
        type: "expense",
        amount: amount * group.slots,
        category_id: savingCategory?.id ?? null,
        date,
        note: `${group.name} – kỳ ${seq}`,
      });
    });
  };
  const remove = () => {
    if (payment && confirm(`Xoá kỳ ${payment.seq}?`))
      run(() => supabase.from("hui_payments").delete().eq("id", payment.id));
  };

  return (
    <Sheet title={`${payment ? "Sửa" : "Thêm"} kỳ – ${group.name}`} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <label className="text-sm">Kỳ
            <input className={`${input} mt-1`} type="number" min={1} required value={seq} onChange={(e) => setSeq(Number(e.target.value))} />
          </label>
          <label className="text-sm">Ngày đóng <span className="text-zinc-400">(có thể để trống)</span>
            <input className={`${input} mt-1`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <label className="block text-sm">Tiền {group.slots > 1 ? "1 suất" : ""}
          <div className="flex items-baseline gap-2 border-b-2 border-amber-400 mt-1">
            <input inputMode="numeric" required value={formatNumber(amount)} onChange={(e) => setAmount(parseAmount(e.target.value))}
              placeholder="0" className="flex-1 min-w-0 bg-transparent text-3xl font-bold py-1 outline-none" />
            <span className="text-xl text-zinc-400">₫</span>
          </div>
        </label>
        {group.slots > 1 && amount > 0 && (
          <p className="text-sm text-zinc-500">× {group.slots} suất = <b className="text-zinc-800 dark:text-zinc-200">{formatVND(amount * group.slots)}</b></p>
        )}
        {!payment && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={addTx} onChange={(e) => setAddTx(e.target.checked)} className="w-4 h-4 accent-amber-500" />
            Ghi luôn vào sổ chi tiêu{savingCategory ? ` (${savingCategory.icon} ${savingCategory.name})` : ""}
          </label>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          {payment && (
            <button type="button" onClick={remove} disabled={busy} aria-label="Xoá"
              className="rounded-xl border border-red-300 text-red-500 px-4"><Trash2 size={20} /></button>
          )}
          <button disabled={busy || amount <= 0} className="flex-1 rounded-xl bg-amber-500 text-white py-3 font-semibold disabled:opacity-60">Lưu</button>
        </div>
      </form>
    </Sheet>
  );
}
