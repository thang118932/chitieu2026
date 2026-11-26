"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatVND, monthLabel, shiftMonth } from "@/lib/format";
import type { Category, Member, Transaction, TxType } from "@/lib/types";
import BottomNav from "./BottomNav";

type Props = { month: string; categories: Category[]; transactions: Transaction[]; members: Member[] };

const card = "rounded-2xl bg-white dark:bg-zinc-900 shadow p-4";
const short = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(".", ",")}tr` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : `${n}`;

export default function ReportsView({ month, categories, transactions, members }: Props) {
  const [type, setType] = useState<TxType>("expense");
  const [member, setMember] = useState<string>("all");

  const filtered = useMemo(
    () => transactions.filter((t) => t.type === type && (member === "all" || t.user_id === member)),
    [transactions, type, member]
  );
  const current = filtered.filter((t) => t.date.startsWith(month));
  const prevTotal = filtered.filter((t) => !t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);
  const total = current.reduce((s, t) => s + t.amount, 0);
  const diff = prevTotal ? ((total - prevTotal) / prevTotal) * 100 : null;

  const byCategory = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const sums = new Map<string, number>();
    for (const t of current) sums.set(t.category_id ?? "none", (sums.get(t.category_id ?? "none") ?? 0) + t.amount);
    return [...sums.entries()]
      .map(([id, value]) => {
        const c = catMap.get(id);
        return { id, name: c?.name ?? "Không rõ", icon: c?.icon ?? "💸", color: c?.color ?? "#64748b", value };
      })
      .sort((a, b) => b.value - a.value);
  }, [current, categories]);

  const byDay = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const arr = Array.from({ length: days }, (_, i) => ({ day: i + 1, value: 0 }));
    for (const t of current) arr[Number(t.date.slice(8, 10)) - 1].value += t.amount;
    return arr;
  }, [current, month]);

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm whitespace-nowrap ${active ? "bg-amber-500 text-white" : "bg-white dark:bg-zinc-900 shadow-sm"}`;

  return (
    <div className="min-h-dvh pb-24">
      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <Link href={`/reports?m=${shiftMonth(month, -1)}`} className="p-2 -ml-2" aria-label="Tháng trước"><ChevronLeft /></Link>
          <h1 className="text-xl font-bold">Báo cáo {monthLabel(month).toLowerCase()}</h1>
          <Link href={`/reports?m=${shiftMonth(month, 1)}`} className="p-2 -mr-2" aria-label="Tháng sau"><ChevronRight /></Link>
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 p-1 text-sm font-medium">
          {(["expense", "income"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`rounded-lg py-2 ${type === t ? "bg-white dark:bg-zinc-700 shadow" : "text-zinc-500"}`}>
              {t === "expense" ? "Chi" : "Thu"}
            </button>
          ))}
        </div>

        {members.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button className={chip(member === "all")} onClick={() => setMember("all")}>Cả nhà</button>
            {members.map((m) => (
              <button key={m.user_id} className={chip(member === m.user_id)} onClick={() => setMember(m.user_id)}>{m.name}</button>
            ))}
          </div>
        )}

        <section className={card}>
          <p className="text-sm text-zinc-500">Tổng {type === "expense" ? "chi" : "thu"}</p>
          <p className={`text-3xl font-bold ${type === "expense" ? "text-red-500" : "text-green-600"}`}>{formatVND(total)}</p>
          {diff !== null && (
            <p className="text-sm mt-1 flex items-center gap-1 text-zinc-500">
              {diff >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {diff >= 0 ? "Tăng" : "Giảm"} {Math.abs(diff).toFixed(0)}% so với tháng trước ({formatVND(prevTotal)})
            </p>
          )}
        </section>

        {byCategory.length === 0 ? (
          <p className="text-center text-zinc-500 py-10">📊 Chưa có dữ liệu tháng này</p>
        ) : (
          <>
            <section className={card}>
              <h2 className="font-semibold mb-2">Theo danh mục</h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="95%" paddingAngle={2} stroke="none">
                      {byCategory.map((c) => <Cell key={c.id} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatVND(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-3">
                {byCategory.map((c) => {
                  const pct = (c.value / total) * 100;
                  return (
                    <li key={c.id}>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{c.icon}</span>
                        <span className="flex-1">{c.name}</span>
                        <span className="text-zinc-500">{pct.toFixed(0)}%</span>
                        <span className="font-semibold w-28 text-right">{formatVND(c.value)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 mt-1">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className={card}>
              <h2 className="font-semibold mb-2">Theo ngày</h2>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDay} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} interval={4} />
                    <Tooltip
                      cursor={{ fill: "rgba(245,158,11,0.1)" }}
                      labelFormatter={(d) => `Ngày ${d}`}
                      formatter={(v) => [formatVND(Number(v)), type === "expense" ? "Chi" : "Thu"]}
                    />
                    <Bar dataKey="value" fill={type === "expense" ? "#f59e0b" : "#16a34a"} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Trung bình {formatVND(Math.round(total / byDay.length))}/ngày · cao nhất {short(Math.max(...byDay.map((d) => d.value)))}
              </p>
            </section>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
