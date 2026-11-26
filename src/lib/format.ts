const vnd = new Intl.NumberFormat("vi-VN");

/** 1250000 -> "1.250.000 ₫" */
export const formatVND = (n: number) => `${vnd.format(n)} ₫`;

/** 1250000 -> "1.250.000" (dùng trong ô nhập) */
export const formatNumber = (n: number) => (n ? vnd.format(n) : "");

/** "1.250.000" -> 1250000 */
export const parseAmount = (s: string) => Number(s.replace(/\D/g, "")) || 0;

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD */
export const todayVN = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

export const currentMonth = () => todayVN().slice(0, 7);

/** "2026-11" -> ["2026-11-01", "2026-12-01"] */
export function monthRange(month: string): [string, string] {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return [`${month}-01`, `${next}-01`];
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const monthLabel = (month: string) => {
  const [y, m] = month.split("-");
  return `Tháng ${Number(m)}/${y}`;
};

const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
export function dayLabel(date: string) {
  if (date === todayVN()) return "Hôm nay";
  const [y, m, d] = date.split("-").map(Number);
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${wd}, ${d}/${m}`;
}
