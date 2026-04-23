-- Citation rows with brand/provider context for client-side per-cell filtering.
-- Scoped to last 4 weeks, locale=ja (dashboard primary view).
create or replace view v_citations_with_context as
select
  cs.url,
  cs.title,
  cs.domain,
  cs.position,
  r.brand_id,
  r.llm_provider,
  r.locale,
  wr.week_start
from citation_sources cs
join llm_results r on r.id = cs.result_id
join weekly_runs wr on wr.id = r.run_id
where wr.week_start >= current_date - interval '4 weeks';
