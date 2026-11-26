import BottomNav from "./BottomNav";

/** Hiện ngay khi chuyển trang, trong lúc chờ server trả dữ liệu */
export default function PageSkeleton({ header = false }: { header?: boolean }) {
  const bar = "rounded-lg bg-zinc-200/80 dark:bg-zinc-800 animate-pulse";
  return (
    <div className="min-h-dvh pb-24">
      {header && <div className="bg-amber-500 h-36" />}
      <main className={`max-w-md mx-auto px-4 space-y-4 ${header ? "-mt-12" : "pt-6"}`}>
        {!header && <div className={`${bar} h-8 w-40`} />}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow p-4 space-y-3">
          <div className={`${bar} h-4 w-28`} />
          <div className={`${bar} h-9 w-48`} />
          <div className="grid grid-cols-2 gap-3">
            <div className={`${bar} h-14`} />
            <div className={`${bar} h-14`} />
          </div>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-zinc-900 shadow p-3 flex items-center gap-3">
            <div className={`${bar} w-10 h-10 rounded-full`} />
            <div className="flex-1 space-y-2">
              <div className={`${bar} h-4 w-1/2`} />
              <div className={`${bar} h-3 w-1/3`} />
            </div>
            <div className={`${bar} h-4 w-20`} />
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
