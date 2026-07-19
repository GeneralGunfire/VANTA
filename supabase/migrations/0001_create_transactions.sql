create table transactions (
  id uuid primary key default gen_random_uuid(),
  raw_input text not null,
  source text not null check (source in ('text', 'excel')),
  amount numeric,
  direction text check (direction in ('in', 'out')),
  category text check (category in ('Sales', 'Stock', 'Rent', 'Utilities', 'Transport', 'Wages', 'Other')),
  description text,
  confidence numeric,
  needs_review boolean default false,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "Allow anon read" on transactions
  for select using (true);
