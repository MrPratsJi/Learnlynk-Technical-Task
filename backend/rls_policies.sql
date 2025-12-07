alter table public.leads enable row level security;

create policy "leads_select_policy"
on public.leads
for select
using (
  tenant_id = ((current_setting('request.jwt.claims', true)::jsonb)->>'tenant_id')::uuid
  and (
    ((current_setting('request.jwt.claims', true)::jsonb)->>'role') = 'admin'
    or (
      ((current_setting('request.jwt.claims', true)::jsonb)->>'role') = 'counselor'
      and (
        owner_id = ((current_setting('request.jwt.claims', true)::jsonb)->>'user_id')::uuid
        or exists (
          select 1
          from public.user_teams ut
          join public.teams t on t.id = ut.team_id
          where ut.user_id = ((current_setting('request.jwt.claims', true)::jsonb)->>'user_id')::uuid
            and t.id = public.leads.team_id
            and t.tenant_id = public.leads.tenant_id
        )
      )
    )
  )
);

create policy "leads_insert_policy"
on public.leads
for insert
with check (
  tenant_id = ((current_setting('request.jwt.claims', true)::jsonb)->>'tenant_id')::uuid
  and ((current_setting('request.jwt.claims', true)::jsonb)->>'role') in ('admin', 'counselor')
);
