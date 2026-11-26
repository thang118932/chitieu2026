import { getContext, getMembers } from "@/lib/data";
import { currentMonth, monthRange } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import Onboarding from "@/components/Onboarding";
import HomeView from "@/components/HomeView";

export default async function Home({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : currentMonth();

  const { supabase, user, family } = await getContext();
  if (!family) return <Onboarding />;

  const [start, end] = monthRange(month);
  const [{ data: categories }, { data: transactions }, members] = await Promise.all([
    supabase.from("categories").select("*").eq("family_id", family.id).order("sort_order"),
    supabase
      .from("transactions")
      .select("*")
      .eq("family_id", family.id)
      .is("deleted_at", null)
      .gte("date", start)
      .lt("date", end)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    getMembers(supabase, family.id),
  ]);

  return (
    <HomeView
      month={month}
      family={family}
      userId={user.id}
      categories={(categories ?? []) as Category[]}
      transactions={(transactions ?? []) as Transaction[]}
      members={members}
    />
  );
}
