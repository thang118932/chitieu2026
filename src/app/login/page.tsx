"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function loginGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
  }

  async function loginEmail(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) console.error(error);
    setErrMsg(error?.message ?? "");
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-amber-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-lg p-6 space-y-5">
        <div className="text-center">
          <div className="text-5xl">🍟</div>
          <h1 className="text-2xl font-bold mt-2">Khoai Chip</h1>
          <p className="text-sm text-zinc-500">Quản lý chi tiêu gia đình</p>
        </div>

        <button
          onClick={loginGoogle}
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 py-3 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Đăng nhập với Google
        </button>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <hr className="flex-1 border-zinc-200 dark:border-zinc-700" /> hoặc <hr className="flex-1 border-zinc-200 dark:border-zinc-700" />
        </div>

        {status === "sent" ? (
          <p className="text-center text-green-600">📧 Đã gửi link đăng nhập tới <b>{email}</b>. Kiểm tra hộp thư nhé!</p>
        ) : (
          <form onSubmit={loginEmail} className="space-y-3">
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@cua-ban.com"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-3 outline-none focus:ring-2 ring-amber-400"
            />
            <button
              disabled={status === "sending"}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-3 font-semibold disabled:opacity-60"
            >
              {status === "sending" ? "Đang gửi..." : "Gửi link đăng nhập"}
            </button>
            {status === "error" && <p className="text-sm text-red-500 text-center">Có lỗi: {errMsg || "thử lại sau."}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
