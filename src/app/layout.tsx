import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import SWRegister from "@/components/SWRegister";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Khoai Chip",
  description: "Quản lý chi tiêu gia đình",
  appleWebApp: { capable: true, title: "Khoai Chip", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${font.className} antialiased bg-amber-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
