-- ============================================================
-- PawPal – Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ─── Pets ─────────────────────────────────────────────────────────────────────
create table if not exists public.pets (
  id                uuid primary key default uuid_generate_v4(),
  owner_id          uuid not null references auth.users on delete cascade,
  name              text not null,
  species           text not null,
  breed             text,
  birth_date        date,
  current_weight_kg numeric(6,2),
  target_weight_kg  numeric(6,2),
  activity_level    text not null default 'moderate'
                      check (activity_level in ('low', 'moderate', 'high')),
  is_neutered       boolean not null default false,
  allergies         text[] not null default '{}',
  medical_conditions text[] not null default '{}',
  photo_path        text,
  created_at        timestamptz not null default now()
);

alter table public.pets enable row level security;

create policy "Users manage own pets"
  on public.pets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists pets_owner_id_idx on public.pets(owner_id);

-- ─── Foods ────────────────────────────────────────────────────────────────────
create table if not exists public.foods (
  id               uuid primary key default uuid_generate_v4(),
  owner_id         uuid not null references auth.users on delete cascade,
  brand            text,
  product_name     text not null,
  food_type        text not null default 'dry'
                     check (food_type in ('dry','wet','raw','treats','supplement','other')),
  kcal_per_100g    numeric(7,2) not null,
  ingredients      text[] not null default '{}',
  allergens        text[] not null default '{}',
  stock_quantity_g numeric(10,2) not null default 0,
  created_at       timestamptz not null default now()
);

alter table public.foods enable row level security;

create policy "Users manage own foods"
  on public.foods for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─── Meal Plans ───────────────────────────────────────────────────────────────
create table if not exists public.meal_plans (
  id                   uuid primary key default uuid_generate_v4(),
  owner_id             uuid not null references auth.users on delete cascade,
  pet_id               uuid not null references public.pets on delete cascade,
  name                 text not null,
  goal                 text not null default 'maintenance'
                         check (goal in ('maintenance','gradual_weight_loss','weight_gain',
                                         'puppy_growth','kitten_growth','senior_diet')),
  daily_kcal_target    integer not null,
  start_date           date,
  end_date             date,
  veterinarian_notes   text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

alter table public.meal_plans enable row level security;

create policy "Users manage own meal plans"
  on public.meal_plans for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists meal_plans_pet_id_idx on public.meal_plans(pet_id);

-- ─── Meal Plan Items ──────────────────────────────────────────────────────────
create table if not exists public.meal_plan_items (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users on delete cascade,
  meal_plan_id  uuid not null references public.meal_plans on delete cascade,
  food_id       uuid references public.foods on delete set null,
  day_of_week   smallint not null check (day_of_week between 0 and 6),
  meal_time     time not null,
  meal_type     text not null check (meal_type in ('breakfast','lunch','snack','dinner')),
  quantity_g    numeric(8,2) not null,
  calories      integer not null,
  notes         text,
  created_at    timestamptz not null default now()
);

alter table public.meal_plan_items enable row level security;

create policy "Users manage own meal plan items"
  on public.meal_plan_items for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists meal_plan_items_plan_id_idx on public.meal_plan_items(meal_plan_id);

-- ─── Meal Logs ────────────────────────────────────────────────────────────────
create table if not exists public.meal_logs (
  id                 uuid primary key default uuid_generate_v4(),
  owner_id           uuid not null references auth.users on delete cascade,
  pet_id             uuid not null references public.pets on delete cascade,
  meal_plan_item_id  uuid references public.meal_plan_items on delete set null,
  food_id            uuid references public.foods on delete set null,
  served_at          timestamptz not null,
  quantity_g         numeric(8,2) not null,
  calories           integer not null,
  status             text not null default 'completed'
                       check (status in ('completed','partial','skipped')),
  notes              text
);

alter table public.meal_logs enable row level security;

create policy "Users manage own meal logs"
  on public.meal_logs for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists meal_logs_pet_id_idx on public.meal_logs(pet_id);
create index if not exists meal_logs_served_at_idx on public.meal_logs(served_at desc);

-- ─── Weight Logs ──────────────────────────────────────────────────────────────
create table if not exists public.weight_logs (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users on delete cascade,
  pet_id      uuid not null references public.pets on delete cascade,
  weight_kg   numeric(6,2) not null,
  recorded_at timestamptz not null,
  notes       text
);

alter table public.weight_logs enable row level security;

create policy "Users manage own weight logs"
  on public.weight_logs for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists weight_logs_pet_id_idx on public.weight_logs(pet_id);
create index if not exists weight_logs_recorded_at_idx on public.weight_logs(recorded_at desc);

-- ─── Activity Logs ────────────────────────────────────────────────────────────
create table if not exists public.activity_logs (
  id               uuid primary key default uuid_generate_v4(),
  owner_id         uuid not null references auth.users on delete cascade,
  pet_id           uuid not null references public.pets on delete cascade,
  activity_type    text not null check (activity_type in ('walk','run','play','swim','training','other')),
  duration_minutes integer not null,
  distance_km      numeric(6,2),
  steps            integer,
  sleep_hours      numeric(4,1),
  started_at       timestamptz not null,
  notes            text
);

alter table public.activity_logs enable row level security;

create policy "Users manage own activity logs"
  on public.activity_logs for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists activity_logs_pet_id_idx on public.activity_logs(pet_id);
create index if not exists activity_logs_started_at_idx on public.activity_logs(started_at desc);

-- ─── Health Records ───────────────────────────────────────────────────────────
create table if not exists public.health_records (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users on delete cascade,
  pet_id        uuid not null references public.pets on delete cascade,
  record_type   text not null check (record_type in (
                  'vaccination','checkup','surgery','dental','allergy_test',
                  'blood_test','xray','prescription','other')),
  title         text not null,
  record_date   date not null,
  veterinarian  text,
  notes         text,
  next_due_date date,
  created_at    timestamptz not null default now()
);

alter table public.health_records enable row level security;

create policy "Users manage own health records"
  on public.health_records for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists health_records_pet_id_idx on public.health_records(pet_id);

-- ─── Medications ──────────────────────────────────────────────────────────────
create table if not exists public.medications (
  id             uuid primary key default uuid_generate_v4(),
  owner_id       uuid not null references auth.users on delete cascade,
  pet_id         uuid not null references public.pets on delete cascade,
  name           text not null,
  dosage         text,
  instructions   text,
  start_date     date not null,
  end_date       date,
  scheduled_time time,
  is_active      boolean not null default true
);

alter table public.medications enable row level security;

create policy "Users manage own medications"
  on public.medications for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists medications_pet_id_idx on public.medications(pet_id);

-- ─── Reminders ────────────────────────────────────────────────────────────────
create table if not exists public.reminders (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references auth.users on delete cascade,
  pet_id          uuid not null references public.pets on delete cascade,
  reminder_type   text not null check (reminder_type in (
                    'meal','medication','grooming','vaccination',
                    'vet_appointment','food_restock','device_charging')),
  title           text not null,
  due_at          timestamptz not null,
  repeat_rule     text,
  is_completed    boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table public.reminders enable row level security;

create policy "Users manage own reminders"
  on public.reminders for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists reminders_owner_due_at_idx on public.reminders(owner_id, due_at);

-- ─── Devices ──────────────────────────────────────────────────────────────────
create table if not exists public.devices (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users on delete cascade,
  pet_id        uuid not null references public.pets on delete cascade,
  device_name   text not null,
  device_type   text not null check (device_type in (
                  'gps_collar','smart_feeder','smart_water_bowl',
                  'pet_camera','temperature_sensor','humidity_sensor')),
  status        text not null default 'offline'
                  check (status in ('online','offline')),
  battery_percent integer not null default 100 check (battery_percent between 0 and 100),
  last_seen_at  timestamptz not null default now(),
  metadata      jsonb not null default '{}'
);

alter table public.devices enable row level security;

create policy "Users manage own devices"
  on public.devices for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─── Alerts ───────────────────────────────────────────────────────────────────
create table if not exists public.alerts (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users on delete cascade,
  pet_id      uuid not null references public.pets on delete cascade,
  alert_type  text not null check (alert_type in (
                'missed_medication','missed_meal','low_food','low_water',
                'low_battery','unusual_inactivity','outside_safe_zone','high_temperature')),
  severity    text not null check (severity in ('info','warning','critical')),
  title       text not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.alerts enable row level security;

create policy "Users manage own alerts"
  on public.alerts for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists alerts_owner_read_idx on public.alerts(owner_id, is_read);
create index if not exists alerts_created_at_idx on public.alerts(created_at desc);

-- ─── Storage: pet-photos bucket ───────────────────────────────────────────────
-- Run separately in Storage section, or via SQL:

insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', false)
on conflict (id) do nothing;

create policy "Users can upload own pet photos"
  on storage.objects for insert
  with check (
    bucket_id = 'pet-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own pet photos"
  on storage.objects for select
  using (
    bucket_id = 'pet-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own pet photos"
  on storage.objects for update
  using (
    bucket_id = 'pet-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own pet photos"
  on storage.objects for delete
  using (
    bucket_id = 'pet-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
