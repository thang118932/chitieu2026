-- Tiền tiêu vặt cho các con
-- Chạy trong Supabase Dashboard > SQL Editor

create table public.kids (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  name text not null,
  emoji text not null default '🧒',
  color text not null default '#f59e0b',
  weekly_amount bigint not null default 0 check (weekly_amount >= 0), -- tiền tuần, đơn vị đồng
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.allowance_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  kid_id uuid not null references public.kids on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('in', 'out')),  -- in = Nhận, out = Chi
  amount bigint not null check (amount > 0),
  note text,
  created_at timestamptz default now()
);
create index on public.allowance_entries (family_id, date desc);

alter table public.kids              enable row level security;
alter table public.allowance_entries enable row level security;

create policy "kids all" on public.kids for all
  using (is_member(family_id)) with check (is_member(family_id));
create policy "allowance all" on public.allowance_entries for all
  using (is_member(family_id)) with check (is_member(family_id));

grant select, insert, update, delete on public.kids, public.allowance_entries to authenticated;
