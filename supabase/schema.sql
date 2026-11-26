-- Khoai Chip - schema v1
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor > New query > Run

-- ========== TABLES ==========
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'VND',
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_by uuid references auth.users default auth.uid(),
  created_at timestamptz default now()
);

create table public.family_members (
  family_id uuid references public.families on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz default now(),
  primary key (family_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  name text not null,
  icon text not null default '💸',
  color text not null default '#64748b',
  type text not null default 'expense' check (type in ('expense','income')),
  sort_order int default 0
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  user_id uuid not null references auth.users default auth.uid(),
  category_id uuid references public.categories on delete set null,
  amount bigint not null check (amount > 0),   -- đơn vị: đồng
  type text not null default 'expense' check (type in ('expense','income')),
  date date not null default current_date,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create index on public.transactions (family_id, date desc);

-- ========== HELPERS ==========
create or replace function public.is_member(fid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from family_members where family_id = fid and user_id = auth.uid());
$$;

-- Tự tạo profile khi user đăng ký
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tạo gia đình + thêm mình làm owner + danh mục mặc định
create or replace function public.create_family(fname text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  insert into families (name, created_by) values (fname, auth.uid()) returning id into fid;
  insert into family_members (family_id, user_id, role) values (fid, auth.uid(), 'owner');
  insert into categories (family_id, name, icon, color, type, sort_order) values
    (fid,'Ăn uống','🍜','#f97316','expense',1),
    (fid,'Đi chợ','🛒','#22c55e','expense',2),
    (fid,'Điện nước','💡','#eab308','expense',3),
    (fid,'Xăng xe','⛽','#ef4444','expense',4),
    (fid,'Con cái','🧸','#ec4899','expense',5),
    (fid,'Sức khỏe','💊','#14b8a6','expense',6),
    (fid,'Hiếu hỉ','🎁','#a855f7','expense',7),
    (fid,'Mua sắm','🛍️','#3b82f6','expense',8),
    (fid,'Khác','💸','#64748b','expense',99),
    (fid,'Lương','💰','#16a34a','income',1),
    (fid,'Thu khác','🪙','#0ea5e9','income',99);
  return fid;
end $$;

-- Tham gia gia đình bằng mã mời
create or replace function public.join_family(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  select id into fid from families where invite_code = lower(trim(code));
  if fid is null then raise exception 'Mã mời không hợp lệ'; end if;
  insert into family_members (family_id, user_id) values (fid, auth.uid())
    on conflict do nothing;
  return fid;
end $$;

-- ========== ROW LEVEL SECURITY ==========
alter table public.profiles       enable row level security;
alter table public.families       enable row level security;
alter table public.family_members enable row level security;
alter table public.categories     enable row level security;
alter table public.transactions   enable row level security;

-- profiles: tự sửa của mình; xem được người cùng gia đình
create policy "profiles self" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles same family" on public.profiles for select
  using (exists (select 1 from family_members a join family_members b using (family_id)
                 where a.user_id = auth.uid() and b.user_id = profiles.id));

create policy "families read"   on public.families for select using (is_member(id));
create policy "families update" on public.families for update using (is_member(id));

create policy "members read"  on public.family_members for select using (is_member(family_id));
create policy "members leave" on public.family_members for delete using (user_id = auth.uid());

create policy "categories all" on public.categories for all
  using (is_member(family_id)) with check (is_member(family_id));

create policy "transactions all" on public.transactions for all
  using (is_member(family_id)) with check (is_member(family_id));

-- ========== REALTIME ==========
alter publication supabase_realtime add table public.transactions;
