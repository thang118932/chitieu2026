import { createClient } from "@/lib/supabase/server";
import type { Family, Member } from "@/lib/types";

/** User hiện tại + gia đình đầu tiên mà user tham gia (null nếu chưa có) */
export async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: mem, error } = await supabase
    .from("family_members")
    .select("role, families(id, name, currency, invite_code)")
    .eq("user_id", user!.id)
    .order("joined_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Không đọc được gia đình: ${error.message}`);

  return {
    supabase,
    user: user!,
    family: (mem?.families ?? null) as unknown as Family | null,
    role: (mem?.role ?? null) as Member["role"] | null,
  };
}

export async function getMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  familyId: string
): Promise<Member[]> {
  const { data: rows } = await supabase
    .from("family_members")
    .select("user_id, role")
    .eq("family_id", familyId)
    .order("joined_at");
  if (!rows?.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", rows.map((r) => r.user_id));

  return rows.map((r) => {
    const p = profiles?.find((x) => x.id === r.user_id);
    return { user_id: r.user_id, role: r.role, name: p?.name ?? "Thành viên", avatar_url: p?.avatar_url ?? null };
  });
}
