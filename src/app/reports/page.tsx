import { redirect } from "next/navigation";
import { getContext, getMembers } from "@/lib/data";
import { currentMonth, monthRange, shiftMonth } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import ReportsView from "@/components/ReportsView";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : currentMonth();

  const { supabase, family } = await getContext();
  if (!family) redirect("/");

  // lấy 2 tháng: tháng trước + tháng này, để so sánh
  const [prevStart] = monthRange(shiftMonth(month, -1));
  const [, end] = monthRange(month);

  const [{ data: categories }, { data: txs }, members] = await Promise.all([
    supabase.from("categories").select("*").eq("family_id", family.id).order("sort_order"),
    supabase
      .from("transactions")
      .select("*")
      .eq("family_id", family.id)
      .is("deleted_at", null)
      .gte("date", prevStart)
      .lt("date", end),
    getMembers(supabase, family.id),
  ]);

  return (
    <ReportsView
      month={month}
      categories={(categories ?? []) as Category[]}
      transactions={(txs ?? []) as Transaction[]}
      members={members}
    />
  );
}
