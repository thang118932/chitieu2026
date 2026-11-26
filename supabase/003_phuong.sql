-- Phường / hụi: các dây phường và các kỳ đóng
-- Chạy trong Supabase Dashboard > SQL Editor

create table public.hui_groups (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  name text not null,
  schedule text,                                   -- vd: "T1,4,7,10 âm"
  slots int not null default 1 check (slots > 0), -- số suất
  sort_order int default 0,
  created_at timestamptz default now()
);

create table public.hui_payments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  group_id uuid not null references public.hui_groups on delete cascade,
  seq int not null,                                -- kỳ thứ (STT)
  date date,                                       -- có thể để trống
  amount bigint not null check (amount >= 0),      -- tiền 1 suất, đơn vị đồng
  note text,
  created_at timestamptz default now()
);
create index on public.hui_payments (group_id, seq);

alter table public.hui_groups   enable row level security;
alter table public.hui_payments enable row level security;

create policy "hui_groups all" on public.hui_groups for all
  using (is_member(family_id)) with check (is_member(family_id));
create policy "hui_payments all" on public.hui_payments for all
  using (is_member(family_id)) with check (is_member(family_id));

grant select, insert, update, delete on public.hui_groups, public.hui_payments to authenticated;
