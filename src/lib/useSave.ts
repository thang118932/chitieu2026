"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Chạy 1 thao tác Supabase, báo lỗi nếu có, thành công thì refresh trang và đóng form */
export function useSave(onClose: () => void) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setError("");
    const { error } = await fn();
    setBusy(false);
    if (error) return setError(error.message);
    router.refresh();
    onClose();
  }

  return { busy, error, run };
}
