import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import type { Category, HuiGroup, HuiPayment } from "@/lib/types";
import PhuongView from "@/components/PhuongView";

export default async function PhuongPage() {
  const { supabase, family } = await getContext();
  if (!family) redirect("/");

  const [{ data: groups, error }, { data: payments }, { data: saving }] = await Promise.all([
    supabase.from("hui_groups").select("*").eq("family_id", family.id).order("sort_order").order("created_at"),
    supabase.from("hui_payments").select("*").eq("family_id", family.id).order("seq"),
    supabase.from("categories").select("*").eq("family_id", family.id).eq("name", "Tiết kiệm").limit(1).maybeSingle(),
  ]);
  if (error) throw new Error(`Không đọc được phường (đã chạy 003_phuong.sql chưa?): ${error.message}`);

  return (
    <PhuongView
      familyId={family.id}
      groups={(groups ?? []) as HuiGroup[]}
      payments={(payments ?? []) as HuiPayment[]}
      savingCategory={(saving ?? null) as Category | null}
    />
  );
}
