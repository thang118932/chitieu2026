"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Onboarding() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("Nhà mình");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: "create_family" | "join_family", args: Record<string, string>) {
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) setError(error.message);
    else router.refresh();
  }

  const input = "w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-3 outline-none focus:ring-2 ring-amber-400";
  const card = "rounded-2xl bg-white dark:bg-zinc-900 shadow p-5 space-y-3";

  return (
    <main className="min-h-dvh max-w-md mx-auto p-4 flex flex-col justify-center gap-4">
      <div className="text-center mb-2">
        <div className="text-5xl">🍟</div>
        <h1 className="text-2xl font-bold mt-2">Chào mừng tới Khoai Chip!</h1>
        <p className="text-zinc-500 text-sm">Tạo sổ chi tiêu cho gia đình, hoặc tham gia sổ của người thân.</p>
      </div>

      <form className={card} onSubmit={(e) => { e.preventDefault(); run("create_family", { fname: name.trim() }); }}>
        <h2 className="font-semibold">🏠 Tạo gia đình mới</h2>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tên gia đình" />
        <button disabled={busy} className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-3 font-semibold disabled:opacity-60">
          Tạo gia đình
        </button>
      </form>

      <form className={card} onSubmit={(e) => { e.preventDefault(); run("join_family", { code }); }}>
        <h2 className="font-semibold">🔑 Tham gia bằng mã mời</h2>
        <input className={`${input} font-mono tracking-widest`} value={code} onChange={(e) => setCode(e.target.value)} required placeholder="vd: a1b2c3d4" />
        <button disabled={busy} className="w-full rounded-xl border border-amber-500 text-amber-600 py-3 font-semibold disabled:opacity-60">
          Tham gia
        </button>
      </form>

      {error && <p className="text-center text-red-500 text-sm">{error}</p>}
    </main>
  );
}
