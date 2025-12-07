create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  owner_id uuid not null,
  email text,
  phone text,
  full_name text,
  stage text not null default 'new',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_tenant_id on public.leads (tenant_id);
create index if not exists idx_leads_owner_id on public.leads (owner_id);
create index if not exists idx_leads_stage on public.leads (stage);
create index if not exists idx_leads_created_at on public.leads (created_at);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  lead_id uuid not null references public.leads(id) on delete cascade,
  program_id uuid,
  intake_id uuid,
  stage text not null default 'inquiry',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_applications_tenant_id on public.applications (tenant_id);
create index if not exists idx_applications_lead_id on public.applications (lead_id);
create index if not exists idx_applications_stage on public.applications (stage);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  application_id uuid not null references public.applications(id) on delete cascade,
  title text,
  type text not null,
  status text not null default 'open',
  due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_type_allowed check (type in ('call', 'email', 'review')),
  constraint tasks_due_not_before_created check (due_at >= created_at)
);

create index if not exists idx_tasks_tenant_id on public.tasks (tenant_id);
create index if not exists idx_tasks_due_at on public.tasks (due_at);
create index if not exists idx_tasks_status on public.tasks (status);
