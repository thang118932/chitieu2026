export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl">📡</div>
      <h1 className="text-xl font-bold mt-4">Đang mất kết nối mạng</h1>
      <p className="text-zinc-500 mt-2">Kiểm tra wifi/4G rồi thử lại nhé.</p>
      {/* cố ý dùng <a> để tải lại toàn trang khi có mạng */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="mt-6 rounded-xl bg-amber-500 text-white px-6 py-3 font-semibold">Thử lại</a>
    </main>
  );
}
