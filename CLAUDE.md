# Khoai Chip — app quản lý chi tiêu gia đình

## Stack
- Next.js 15 (App Router, src/), TypeScript, Tailwind v4
- Supabase (Postgres + Auth + Realtime) qua `@supabase/ssr`
  - Browser: `@/lib/supabase/client`, Server: `@/lib/supabase/server`
- PWA (sẽ thêm ở tuần 4 bằng Serwist), deploy Vercel

## Quy ước
- UI tiếng Việt, mobile-first, có dark mode
- Tiền lưu `bigint` đơn vị đồng; hiển thị `1.250.000 ₫` bằng `Intl.NumberFormat('vi-VN')`
- Mọi bảng có `family_id`; quyền truy cập do RLS (`is_member`) đảm bảo — không bỏ RLS
- Schema ở `supabase/schema.sql`; thay đổi schema thì thêm file migration mới trong `supabase/`
- Project Supabase này KHÔNG tự grant bảng mới cho `authenticated` → bảng/function mới phải kèm `grant` (xem `supabase/002_grants.sql`)
- Xoá giao dịch = soft delete (`deleted_at`)
