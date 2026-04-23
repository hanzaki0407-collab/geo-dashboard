-- =====================================================
-- Filter v_mentions_by_country to active brands only
-- =====================================================
-- Without this filter, deactivated brands' historical rows
-- continue polluting the inbound heatmap.
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
join brands b on b.id = r.brand_id and b.active = true
join weekly_runs wr on wr.id = r.run_id
where wr.week_start >= current_date - interval '4 weeks'
group by l.code, l.country_code, l.country_name, l.country_name_ja,
         l.flag, l.map_center_x, l.map_center_y, l.map_radius
order by total_queries desc;
