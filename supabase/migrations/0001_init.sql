-- HealthAI — initial schema, RLS and storage
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

create extension if not exists pgcrypto;

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'doctor')),
  -- Doctors can sign up, but cannot see any patient data until an admin
  -- verifies them (update via service role / SQL editor).
  doctor_verified boolean not null default false,
  name text not null check (char_length(name) between 1 and 120),
  email text not null,
  phone text,
  date_of_birth date,
  gender text,
  blood_group text,
  height_cm numeric(5,1) check (height_cm is null or height_cm between 30 and 272),
  weight_kg numeric(5,1) check (weight_kg is null or weight_kg between 1 and 500),
  medical_registration_id text,
  specialization text,
  hospital text,
  water_goal_glasses int not null default 8 check (water_goal_glasses between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_name_idx on public.profiles (role, name);

-- Create the profile from sign-up metadata. Role may be chosen at sign-up,
-- but doctor_verified always starts false.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, role, name, email, phone, date_of_birth, gender, blood_group,
                               medical_registration_id, specialization, hospital)
  values (
    new.id,
    case when m->>'role' = 'doctor' then 'doctor' else 'patient' end,
    coalesce(nullif(m->>'name', ''), split_part(new.email, '@', 1)),
    new.email,
    m->>'phone',
    nullif(m->>'date_of_birth', '')::date,
    m->>'gender',
    m->>'blood_group',
    m->>'medical_registration_id',
    m->>'specialization',
    m->>'hospital'
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may never change their own role / verification.
create or replace function public.protect_profile_fields() returns trigger
language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.role := old.role;
    new.doctor_verified := old.doctor_verified;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ─── Helper functions (security definer so RLS policies can call them) ───────
create or replace function public.is_verified_doctor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'doctor' and doctor_verified);
$$;


-- ─── Consents ────────────────────────────────────────────────────────────────
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  access_type text not null default 'Full Records',
  status text not null check (status in ('granted', 'revoked')),
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (patient_id, doctor_id)
);
create index consents_doctor_idx on public.consents (doctor_id, status);

-- Checked by every RLS policy that grants doctor access, so revocation
-- takes effect on the very next query.
create or replace function public.doctor_has_consent(p_patient uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_verified_doctor() and exists (
    select 1 from consents
    where patient_id = p_patient and doctor_id = auth.uid() and status = 'granted'
  );
$$;

create table public.consent_audit_logs (
  id bigint generated always as identity primary key,
  consent_id uuid not null references public.consents(id) on delete cascade,
  patient_id uuid not null,
  doctor_id uuid not null,
  action text not null,
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index consent_audit_consent_idx on public.consent_audit_logs (consent_id, created_at);

create or replace function public.log_consent_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into consent_audit_logs (consent_id, patient_id, doctor_id, action, actor_id)
    values (new.id, new.patient_id, new.doctor_id,
            case when new.status = 'granted' then 'Access granted' else 'Access revoked' end,
            auth.uid());
  end if;
  return new;
end $$;
create trigger consents_audit after insert or update on public.consents
  for each row execute function public.log_consent_change();

-- ─── Patient data tables ─────────────────────────────────────────────────────
create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  type text not null check (type in ('Blood Report','MRI','CT Scan','X-Ray','Prescription','Vaccination','Other')),
  record_date date not null,
  hospital text not null default '',
  doctor text not null default '',
  notes text not null default '',
  file_path text,
  file_name text,
  file_mime text check (file_mime is null or file_mime in ('application/pdf','image/png','image/jpeg')),
  file_size int check (file_size is null or file_size <= 10485760),
  extracted_text text,
  ocr_status text not null default 'none' check (ocr_status in ('none','done','failed')),
  ai_analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index medical_records_patient_date_idx on public.medical_records (patient_id, record_date desc);
create index medical_records_patient_type_idx on public.medical_records (patient_id, type);

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  dosage text not null default '',
  frequency text not null default '',
  times text[] not null default '{}',
  start_date date not null,
  end_date date,
  instructions text not null default '',
  taken_on date,           -- last date marked as taken
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);
create index medicines_patient_idx on public.medicines (patient_id, start_date desc);

create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  dose text not null default '',
  date_administered date,
  next_due date,
  hospital text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index vaccinations_patient_idx on public.vaccinations (patient_id, date_administered desc);

-- One row per patient per day for water / sleep / exercise / weight.
create table public.wellness_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  water_glasses int not null default 0 check (water_glasses between 0 and 40),
  sleep_hours numeric(4,1) not null default 0 check (sleep_hours between 0 and 24),
  exercise_minutes int not null default 0 check (exercise_minutes between 0 and 1440),
  exercise_type text,
  weight_kg numeric(5,1) check (weight_kg is null or weight_kg between 1 and 500),
  meals text,
  created_at timestamptz not null default now(),
  unique (patient_id, entry_date)
);

create table public.health_measurements (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  measured_on date not null,
  kind text not null check (kind in ('glucose','hemoglobin','systolic','diastolic','weight','other')),
  value numeric not null,
  unit text not null,
  label text,
  record_id uuid references public.medical_records(id) on delete set null,
  created_at timestamptz not null default now()
);
create index health_measurements_patient_idx on public.health_measurements (patient_id, kind, measured_on);

create table public.symptoms (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  symptom text not null,
  duration text not null default '',
  severity text not null check (severity in ('Mild','Moderate','Severe')),
  frequency text not null default '',
  notes text not null default '',
  ai_response text,
  created_at timestamptz not null default now()
);
create index symptoms_patient_idx on public.symptoms (patient_id, created_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index chat_messages_patient_idx on public.chat_messages (patient_id, created_at);

create table public.emergency_profiles (
  patient_id uuid primary key references public.profiles(id) on delete cascade,
  blood_group text not null default '',
  allergies text[] not null default '{}',
  conditions text[] not null default '{}',
  active_medicines text[] not null default '{}',
  contact_name text not null default '',
  contact_phone text not null default '',
  contact_relation text not null default '',
  -- Random, revocable token used in the QR URL. NULL = sharing disabled.
  access_token text unique,
  updated_at timestamptz not null default now()
);

-- Used by the API to rate-limit expensive AI calls.
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  created_at timestamptz not null default now()
);
create index ai_usage_user_time_idx on public.ai_usage (user_id, created_at desc);

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.consent_audit_logs enable row level security;
alter table public.medical_records enable row level security;
alter table public.medicines enable row level security;
alter table public.vaccinations enable row level security;
alter table public.wellness_entries enable row level security;
alter table public.health_measurements enable row level security;
alter table public.symptoms enable row level security;
alter table public.chat_messages enable row level security;
alter table public.emergency_profiles enable row level security;
alter table public.ai_usage enable row level security;

-- Profiles: self; any signed-in user can see verified doctors (to pick one);
-- doctors see patients who granted them consent.
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or (role = 'doctor' and doctor_verified)
  or (role = 'patient' and public.doctor_has_consent(id))
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Consents: patient manages own; doctor reads those addressed to them.
create policy consents_select on public.consents for select to authenticated
  using (patient_id = auth.uid() or doctor_id = auth.uid());
create policy consents_insert on public.consents for insert to authenticated
  with check (patient_id = auth.uid()
              and exists (select 1 from profiles d where d.id = doctor_id and d.role = 'doctor' and d.doctor_verified));
create policy consents_update on public.consents for update to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

create policy audit_select on public.consent_audit_logs for select to authenticated
  using (patient_id = auth.uid() or doctor_id = auth.uid());

-- Generic patient-owned tables: owner full access, consented doctor read-only.
do $$
declare t text;
begin
  foreach t in array array['medical_records','medicines','vaccinations','wellness_entries',
                           'health_measurements','symptoms','emergency_profiles']
  loop
    execute format('create policy %1$s_owner on public.%1$s for all to authenticated
                    using (patient_id = auth.uid()) with check (patient_id = auth.uid())', t);
    execute format('create policy %1$s_doctor_read on public.%1$s for select to authenticated
                    using (public.doctor_has_consent(patient_id))', t);
  end loop;
end $$;

-- Chat history is private to the patient.
create policy chat_owner on public.chat_messages for all to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- ai_usage: written by the API with the user's token; users can read their own.
create policy ai_usage_insert on public.ai_usage for insert to authenticated with check (user_id = auth.uid());
create policy ai_usage_select on public.ai_usage for select to authenticated using (user_id = auth.uid());

-- ─── Storage: private bucket, files stored under <patient_id>/... ────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medical-files', 'medical-files', false, 10485760,
        array['application/pdf','image/png','image/jpeg'])
on conflict (id) do nothing;

create policy medical_files_owner on storage.objects for all to authenticated
  using (bucket_id = 'medical-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'medical-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy medical_files_doctor_read on storage.objects for select to authenticated
  using (bucket_id = 'medical-files' and public.is_verified_doctor()
         and exists (select 1 from public.consents c
                     where c.patient_id::text = (storage.foldername(name))[1]
                       and c.doctor_id = auth.uid() and c.status = 'granted'));

-- ─── Emergency QR access ─────────────────────────────────────────────────────
-- The QR encodes /emergency/<token>. The token is 32 random bytes, unguessable,
-- and the patient can rotate it (old QR stops working) or disable it.
create or replace function public.regenerate_emergency_token(p_enable boolean default true)
returns text language plpgsql security definer set search_path = public as $$
declare t text := case when p_enable then encode(gen_random_bytes(32), 'hex') else null end;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into emergency_profiles (patient_id, access_token) values (auth.uid(), t)
  on conflict (patient_id) do update set access_token = excluded.access_token, updated_at = now();
  return t;
end $$;
revoke all on function public.regenerate_emergency_token(boolean) from public, anon;
grant execute on function public.regenerate_emergency_token(boolean) to authenticated;

-- Public lookup: returns ONLY the emergency fields, never the medical record.
create or replace function public.get_emergency_profile(p_token text)
returns table (name text, blood_group text, allergies text[], conditions text[],
               active_medicines text[], contact_name text, contact_phone text,
               contact_relation text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.name, e.blood_group, e.allergies, e.conditions, e.active_medicines,
         e.contact_name, e.contact_phone, e.contact_relation, e.updated_at
  from emergency_profiles e join profiles p on p.id = e.patient_id
  where e.access_token is not null and length(p_token) = 64 and e.access_token = p_token;
$$;
grant execute on function public.get_emergency_profile(text) to anon, authenticated;
