import { redirect } from "next/navigation";
import { getContext, getMembers } from "@/lib/data";
import type { Category } from "@/lib/types";
import SettingsView from "@/components/SettingsView";

export default async function SettingsPage() {
  const { supabase, user, family } = await getContext();
  if (!family) redirect("/");

  const [{ data: categories }, members] = await Promise.all([
    supabase.from("categories").select("*").eq("family_id", family.id).order("type").order("sort_order"),
    getMembers(supabase, family.id),
  ]);

  return (
    <SettingsView
      family={family}
      userEmail={user.email ?? ""}
      categories={(categories ?? []) as Category[]}
      members={members}
    />
  );
}
