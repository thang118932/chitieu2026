"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Family, Member, TxType } from "@/lib/types";
import BottomNav from "./BottomNav";

type Props = { family: Family; userEmail: string; categories: Category[]; members: Member[] };

const card = "rounded-2xl bg-white dark:bg-zinc-900 shadow p-4";
const input = "rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 outline-none focus:ring-2 ring-amber-400";

export default function SettingsView({ family, userEmail, categories, members }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);
  const [famName, setFamName] = useState(family.name);
  const [newCat, setNewCat] = useState({ icon: "📌", name: "", type: "expense" as TxType });
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  async function act(p: PromiseLike<{ error: { message: string } | null }>) {
    setError("");
    const { error } = await p;
    if (error) setError(error.message);
    else router.refresh();
    return !error;
  }

  async function setNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setPassword("");
      setPwMsg("✅ Đã lưu mật khẩu. Lần sau đăng nhập bằng email + mật khẩu.");
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(family.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    const ok = await act(supabase.from("categories").insert({
      family_id: family.id, name: newCat.name.trim(), icon: newCat.icon || "📌", type: newCat.type, sort_order: 50,
    }));
    if (ok) setNewCat({ ...newCat, name: "" });
  }

  function deleteCategory(c: Category) {
    if (confirm(`Xoá danh mục "${c.name}"? Các khoản cũ sẽ thành "Không rõ".`))
      act(supabase.from("categories").delete().eq("id", c.id));
  }

  return (
    <div className="min-h-dvh pb-24">
      <main className="max-w-md mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold pt-2">Cài đặt</h1>

        <section className={`${card} space-y-3`}>
          <h2 className="font-semibold">🏠 Gia đình</h2>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); act(supabase.from("families").update({ name: famName }).eq("id", family.id)); }}>
            <input className={`${input} flex-1 min-w-0`} value={famName} onChange={(e) => setFamName(e.target.value)} />
            {famName !== family.name && <button className="rounded-xl bg-amber-500 text-white px-4">Lưu</button>}
          </form>
          <div>
            <p className="text-sm text-zinc-500">Mã mời: gửi cho người thân để cùng ghi chi tiêu</p>
            <button onClick={copyCode} className="mt-1 w-full flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
              <span className="font-mono text-xl tracking-widest">{family.invite_code}</span>
              <span className="flex items-center gap-1 text-sm text-amber-600"><Copy size={16} />{copied ? "Đã copy!" : "Copy"}</span>
            </button>
          </div>
        </section>

        <section className={card}>
          <h2 className="font-semibold mb-2">👨‍👩‍👧 Thành viên ({members.length})</h2>
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center font-semibold">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1">{m.name}</span>
                {m.role === "owner" && <span className="text-xs text-amber-600">Chủ nhà</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="font-semibold mb-2">🗂️ Danh mục</h2>
          {(["expense", "income"] as const).map((t) => (
            <div key={t} className="mb-3">
              <p className="text-sm text-zinc-500 mb-1">{t === "expense" ? "Chi" : "Thu"}</p>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {categories.filter((c) => c.type === t).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2">
                    <span className="text-xl">{c.icon}</span>
                    <span className="flex-1">{c.name}</span>
                    <button onClick={() => deleteCategory(c)} className="text-zinc-400 hover:text-red-500 p-1" aria-label={`Xoá ${c.name}`}>
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <form onSubmit={addCategory} className="flex gap-2">
            <input className={`${input} w-14 text-center`} value={newCat.icon} maxLength={4}
              onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })} aria-label="Icon" />
            <input className={`${input} flex-1 min-w-0`} value={newCat.name} placeholder="Tên danh mục"
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
            <select className={input} value={newCat.type} onChange={(e) => setNewCat({ ...newCat, type: e.target.value as TxType })}>
              <option value="expense">Chi</option>
              <option value="income">Thu</option>
            </select>
            <button className="rounded-xl bg-amber-500 text-white px-3">Thêm</button>
          </form>
        </section>

        <section className={`${card} space-y-2`}>
          <h2 className="font-semibold">🔒 Mật khẩu đăng nhập</h2>
          <p className="text-sm text-zinc-500">Đặt mật khẩu để đăng nhập không cần chờ email.</p>
          <form className="flex gap-2" onSubmit={setNewPassword}>
            <input type="password" minLength={6} required autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu mới (≥ 6 ký tự)"
              className={`${input} flex-1 min-w-0`} />
            <button className="rounded-xl bg-amber-500 text-white px-4">Lưu</button>
          </form>
          {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
        </section>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <section className={`${card} flex items-center justify-between`}>
          <span className="text-sm text-zinc-500 truncate">{userEmail}</span>
          <form action="/auth/signout" method="post">
            <button className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm">Đăng xuất</button>
          </form>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
