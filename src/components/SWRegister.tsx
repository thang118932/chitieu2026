"use client";

import { useEffect } from "react";

/** Đăng ký service worker (chỉ ở bản production để không phá hot-reload khi dev) */
export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);
  return null;
}
