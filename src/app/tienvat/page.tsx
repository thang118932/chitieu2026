import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import type { AllowanceEntry, Kid } from "@/lib/types";
import TienVatView from "@/components/TienVatView";

export default async function TienVatPage() {
  const { supabase, family } = await getContext();
  if (!family) redirect("/");

  const [{ data: kids, error }, { data: entries }] = await Promise.all([
    supabase.from("kids").select("*").eq("family_id", family.id).order("sort_order").order("created_at"),
    supabase
      .from("allowance_entries")
      .select("*")
      .eq("family_id", family.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw new Error(`Không đọc được tiền tiêu vặt (đã chạy 004_tienvat.sql chưa?): ${error.message}`);

  return (
    <TienVatView
      familyId={family.id}
      kids={(kids ?? []) as Kid[]}
      entries={(entries ?? []) as AllowanceEntry[]}
    />
  );
}
