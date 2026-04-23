-- Store the ranked list of establishments the LLM recommended, regardless of
-- whether our target brand was mentioned. Powers the "who did Claude recommend
-- instead" view that drives GEO-gap insights for clients.
--
-- Format: [{"name": "Store A", "rank": 1, "description": "short description"}, ...]
alter table llm_results
  add column if not exists competitors jsonb;

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
  r.competitors,
  r.collected_at
from llm_results r
join brands b on b.id = r.brand_id
join companies c on c.id = b.company_id
join weekly_runs wr on wr.id = r.run_id
order by r.brand_id, r.keyword, r.llm_provider, r.locale, wr.week_start desc;
