-- Cấp quyền cho user đã đăng nhập truy cập các bảng (RLS vẫn giới hạn theo gia đình)
-- Chạy trong Supabase Dashboard > SQL Editor

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.families,
  public.family_members,
  public.categories,
  public.transactions
to authenticated;

grant execute on function
  public.is_member(uuid),
  public.create_family(text),
  public.join_family(text)
to authenticated;

-- Bảng tạo sau này tự có quyền
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;
