-- =====================================================
-- GEO Dashboard - Add locales for inbound analysis
-- =====================================================

-- Locales table (対象国/言語)
create table if not exists locales (
  code text primary key,              -- 'ja', 'zh-TW', 'ko', 'en', etc.
  country_code text not null,         -- 'JP', 'TW', 'KR', 'US', etc.
  country_name text not null,         -- 'Japan', 'Taiwan', 'South Korea', etc.
  country_name_ja text not null,      -- '日本', '台湾', '韓国', etc.
  flag text not null default '',      -- emoji flag
  active boolean not null default true,
  -- Map visualization hints
  map_center_x real not null default 0,
  map_center_y real not null default 0,
  map_radius real not null default 5,
  created_at timestamptz not null default now()
);

-- Seed initial locales
insert into locales (code, country_code, country_name, country_name_ja, flag, map_center_x, map_center_y, map_radius) values
  ('ja',    'JP', 'Japan',         '日本',           '🇯🇵', 135, 29, 6),
  ('zh-TW', 'TW', 'Taiwan',        '台湾',           '🇹🇼', 132, 33, 5),
  ('ko',    'KR', 'South Korea',   '韓国',           '🇰🇷', 133, 25, 5),
  ('en',    'US', 'United States', 'アメリカ',       '🇺🇸', 30,  28, 14),
  ('th',    'TH', 'Thailand',      'タイ',           '🇹🇭', 124, 36, 6),
  ('en-AU', 'AU', 'Australia',     'オーストラリア', '🇦🇺', 144, 56, 10),
  ('en-SG', 'SG', 'Singapore',     'シンガポール',   '🇸🇬', 128, 42, 4),
  ('en-GB', 'GB', 'United Kingdom','イギリス',       '🇬🇧', 88,  20, 5),
  ('zh-HK', 'HK', 'Hong Kong',     '香港',           '🇭🇰', 128, 34, 4)
on conflict (code) do nothing;

-- Add locale column to llm_results (default 'ja' for existing domestic queries)
alter table llm_results
  add column if not exists locale text not null default 'ja' references locales(code);

-- Drop old unique constraint and create new one including locale
alter table llm_results
  drop constraint if exists llm_results_run_id_brand_id_keyword_llm_provider_key;

alter table llm_results
  add constraint llm_results_run_brand_kw_provider_locale_key
  unique (run_id, brand_id, keyword, llm_provider, locale);

create index if not exists llm_results_locale_idx on llm_results(locale);

-- =====================================================
-- View: mentions aggregated by country
-- =====================================================
create or replace view v_mentions_by_country as
select
  l.code as locale,
  l.country_code,
  l.country_name,
  l.country_name_ja,
  l.flag,
  l.map_center_x,
  l.map_center_y,
  l.map_radius,
  count(*) as total_queries,
  count(*) filter (where r.mentioned) as mentioned_count,
  round(100.0 * count(*) filter (where r.mentioned) / nullif(count(*), 0), 1) as mention_rate,
  count(distinct r.brand_id) as distinct_brands
from llm_results r
join locales l on l.code = r.locale
join weekly_runs wr on wr.id = r.run_id
where wr.week_start >= current_date - interval '4 weeks'
group by l.code, l.country_code, l.country_name, l.country_name_ja,
         l.flag, l.map_center_x, l.map_center_y, l.map_radius
order by total_queries desc;

-- =====================================================
-- Update existing views to include locale
-- (must DROP first — column order changed)
-- =====================================================

drop view if exists v_latest_results;
create view v_latest_results as
select distinct on (r.brand_id, r.keyword, r.llm_provider, r.locale)
  r.id,
  r.run_id,
  wr.week_start,
  r.brand_id,
  b.name as brand_name,
  b.company_id,
  c.name as company_name,
  r.keyword,
  r.llm_provider,
  r.locale,
  r.mentioned,
  r.rank,
  r.snippet,
  r.sentiment,
  r.collected_at
from llm_results r
join brands b on b.id = r.brand_id
join companies c on c.id = b.company_id
join weekly_runs wr on wr.id = r.run_id
order by r.brand_id, r.keyword, r.llm_provider, r.locale, wr.week_start desc;

drop view if exists v_mention_rate_by_provider;
create view v_mention_rate_by_provider as
select
  b.id as brand_id,
  b.name as brand_name,
  c.name as company_name,
  r.llm_provider,
  r.locale,
  wr.week_start,
  count(*) filter (where r.mentioned) as mentioned_count,
  count(*) as total_count,
  round(100.0 * count(*) filter (where r.mentioned) / nullif(count(*), 0), 1) as mention_rate
from llm_results r
join brands b on b.id = r.brand_id
join companies c on c.id = b.company_id
join weekly_runs wr on wr.id = r.run_id
where wr.week_start >= current_date - interval '12 weeks'
group by b.id, b.name, c.name, r.llm_provider, r.locale, wr.week_start
order by wr.week_start desc;

-- =====================================================
-- RLS for locales
-- =====================================================
alter table locales enable row level security;

drop policy if exists "authenticated_read_locales" on locales;
create policy "authenticated_read_locales"
  on locales for select
  to authenticated
  using (true);

-- Also allow anon to read locales (for public dashboard)
drop policy if exists "anon_read_locales" on locales;
create policy "anon_read_locales"
  on locales for select
  to anon
  using (true);
