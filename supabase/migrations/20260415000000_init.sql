-- =====================================================
-- GEO Dashboard - Initial Schema
-- =====================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =====================================================
-- Enums (idempotent)
-- =====================================================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'llm_provider') then
    create type llm_provider as enum ('gemini', 'google_ai_mode', 'chatgpt', 'claude');
  end if;
  if not exists (select 1 from pg_type where typname = 'sentiment_type') then
    create type sentiment_type as enum ('positive', 'neutral', 'negative');
  end if;
  if not exists (select 1 from pg_type where typname = 'run_status') then
    create type run_status as enum ('pending', 'running', 'completed', 'failed');
  end if;
end $$;

-- =====================================================
-- Tables
-- =====================================================

-- Companies (顧客企業)
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Brands (ブランド)
create table if not exists brands (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  keywords text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create index if not exists brands_company_id_idx on brands(company_id);
create index if not exists brands_active_idx on brands(active);

-- Weekly runs (週次収集バッチ)
create table if not exists weekly_runs (
  id uuid primary key default uuid_generate_v4(),
  week_start date not null,
  status run_status not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (week_start)
);

create index if not exists weekly_runs_week_start_idx on weekly_runs(week_start desc);

-- LLM results (各LLMの収集結果)
create table if not exists llm_results (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references weekly_runs(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  keyword text not null,
  llm_provider llm_provider not null,

  mentioned boolean not null default false,
  rank smallint,
  snippet text,
  sentiment sentiment_type,
  raw_response text,

  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (run_id, brand_id, keyword, llm_provider)
);

create index if not exists llm_results_run_id_idx on llm_results(run_id);
create index if not exists llm_results_brand_id_idx on llm_results(brand_id);
create index if not exists llm_results_provider_idx on llm_results(llm_provider);
create index if not exists llm_results_mentioned_idx on llm_results(mentioned);

-- Citation sources (引用元URL)
create table if not exists citation_sources (
  id uuid primary key default uuid_generate_v4(),
  result_id uuid not null references llm_results(id) on delete cascade,
  url text not null,
  title text,
  domain text not null,
  position smallint,
  created_at timestamptz not null default now()
);

create index if not exists citation_sources_result_id_idx on citation_sources(result_id);
create index if not exists citation_sources_domain_idx on citation_sources(domain);

-- =====================================================
-- Triggers: auto-update updated_at
-- =====================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_updated_at on companies;
create trigger companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

drop trigger if exists brands_updated_at on brands;
create trigger brands_updated_at
  before update on brands
  for each row execute function set_updated_at();

-- =====================================================
-- Views: dashboard helpers
-- =====================================================

-- Latest result per brand × keyword × provider
create or replace view v_latest_results as
select distinct on (r.brand_id, r.keyword, r.llm_provider)
  r.id,
  r.run_id,
  wr.week_start,
  r.brand_id,
  b.name as brand_name,
  b.company_id,
  c.name as company_name,
  r.keyword,
  r.llm_provider,
  r.mentioned,
  r.rank,
  r.snippet,
  r.sentiment,
  r.collected_at
from llm_results r
join brands b on b.id = r.brand_id
join companies c on c.id = b.company_id
join weekly_runs wr on wr.id = r.run_id
order by r.brand_id, r.keyword, r.llm_provider, wr.week_start desc;

-- Mention rate per brand × provider (last 12 weeks)
create or replace view v_mention_rate_by_provider as
select
  b.id as brand_id,
  b.name as brand_name,
  c.name as company_name,
  r.llm_provider,
  wr.week_start,
  count(*) filter (where r.mentioned) as mentioned_count,
  count(*) as total_count,
  round(100.0 * count(*) filter (where r.mentioned) / nullif(count(*), 0), 1) as mention_rate
from llm_results r
join brands b on b.id = r.brand_id
join companies c on c.id = b.company_id
join weekly_runs wr on wr.id = r.run_id
where wr.week_start >= current_date - interval '12 weeks'
group by b.id, b.name, c.name, r.llm_provider, wr.week_start
order by wr.week_start desc;

-- Top citation domains (last 4 weeks)
create or replace view v_top_citation_domains as
select
  cs.domain,
  count(*) as citation_count,
  count(distinct r.brand_id) as distinct_brands,
  array_agg(distinct r.llm_provider::text) as providers
from citation_sources cs
join llm_results r on r.id = cs.result_id
join weekly_runs wr on wr.id = r.run_id
where wr.week_start >= current_date - interval '4 weeks'
group by cs.domain
order by citation_count desc;

-- =====================================================
-- Row Level Security
-- =====================================================
alter table companies enable row level security;
alter table brands enable row level security;
alter table weekly_runs enable row level security;
alter table llm_results enable row level security;
alter table citation_sources enable row level security;

-- Policy: authenticated users can read everything
drop policy if exists "authenticated_read_companies" on companies;
create policy "authenticated_read_companies"
  on companies for select
  to authenticated
  using (true);

drop policy if exists "authenticated_read_brands" on brands;
create policy "authenticated_read_brands"
  on brands for select
  to authenticated
  using (true);

drop policy if exists "authenticated_read_weekly_runs" on weekly_runs;
create policy "authenticated_read_weekly_runs"
  on weekly_runs for select
  to authenticated
  using (true);

drop policy if exists "authenticated_read_llm_results" on llm_results;
create policy "authenticated_read_llm_results"
  on llm_results for select
  to authenticated
  using (true);

drop policy if exists "authenticated_read_citation_sources" on citation_sources;
create policy "authenticated_read_citation_sources"
  on citation_sources for select
  to authenticated
  using (true);

-- Note: INSERT/UPDATE/DELETE are only allowed via service_role key
-- (which bypasses RLS entirely).
