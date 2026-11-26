"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "password" | "magic";

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "Sai email hoặc mật khẩu",
  "User already registered": "Email này đã có tài khoản, hãy đăng nhập",
  "email rate limit exceeded": "Đã gửi quá nhiều email, thử lại sau 1 tiếng hoặc dùng mật khẩu",
  "Email not confirmed": "Email chưa xác nhận. Chủ app cần tắt 'Confirm email' trong Supabase",
};
const vi = (msg: string) =>
  ERRORS[msg] ?? (msg.startsWith("Password should be") ? "Mật khẩu cần ít nhất 6 ký tự" : msg);

export default function LoginPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const redirectTo = () => `${window.location.origin}/auth/callback`;
  const goHome = () => window.location.assign("/");

  async function run(fn: () => Promise<{ error: { message: string } | null }>, onOk: () => void) {
    setBusy(true);
    setError("");
    setInfo("");
    const { error } = await fn();
    setBusy(false);
    if (error) setError(vi(error.message));
    else onOk();
  }

  const signIn = () =>
    run(() => supabase.auth.signInWithPassword({ email, password }), goHome);

  const signUp = () =>
    run(
      async () => {
        const res = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
        if (!res.error && !res.data.session) setInfo("📧 Kiểm tra email để xác nhận tài khoản.");
        else if (!res.error) goHome();
        return res;
      },
      () => {}
    );

  const sendMagic = () =>
    run(
      () => supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } }),
      () => setInfo(`📧 Đã gửi link đăng nhập tới ${email}. Kiểm tra hộp thư nhé!`)
    );

  const loginGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });

  const input = "w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-3 outline-none focus:ring-2 ring-amber-400";

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-lg p-6 space-y-5">
        <div className="text-center">
          <div className="text-5xl">🍟</div>
          <h1 className="text-2xl font-bold mt-2">Khoai Chip</h1>
          <p className="text-sm text-zinc-500">Quản lý chi tiêu gia đình</p>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); if (mode === "password") signIn(); else sendMagic(); }}
        >
          <input type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="email@cua-ban.com" className={input} />

          {mode === "password" && (
            <input type="password" required minLength={6} autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu (ít nhất 6 ký tự)" className={input} />
          )}

          <button disabled={busy}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-3 font-semibold disabled:opacity-60">
            {busy ? "Đang xử lý..." : mode === "password" ? "Đăng nhập" : "Gửi link đăng nhập"}
          </button>

          {mode === "password" && (
            <button type="button" disabled={busy || !email || password.length < 6} onClick={signUp}
              className="w-full rounded-xl border border-amber-500 text-amber-600 py-3 font-semibold disabled:opacity-50">
              Tạo tài khoản mới
            </button>
          )}
        </form>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        {info && <p className="text-sm text-green-600 text-center">{info}</p>}

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <hr className="flex-1 border-zinc-200 dark:border-zinc-700" /> hoặc <hr className="flex-1 border-zinc-200 dark:border-zinc-700" />
        </div>

        <div className="grid gap-2 text-sm">
          <button onClick={() => { setMode(mode === "password" ? "magic" : "password"); setError(""); setInfo(""); }}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 py-2.5">
            {mode === "password" ? "Đăng nhập bằng link qua email" : "Đăng nhập bằng mật khẩu"}
          </button>
          <button onClick={loginGoogle} className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 py-2.5">
            Đăng nhập với Google
          </button>
        </div>
      </div>
    </main>
  );
}
