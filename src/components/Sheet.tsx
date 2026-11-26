"use client";

import { X } from "lucide-react";

/** Khung bottom-sheet (mobile) / hộp thoại (desktop) */
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1" aria-label="Đóng"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
