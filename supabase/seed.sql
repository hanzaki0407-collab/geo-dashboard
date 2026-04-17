-- =====================================================
-- GEO Dashboard - Seed Data (for development/testing)
-- =====================================================
-- Run this AFTER the initial migration.
-- ASCII-only to avoid Windows clipboard encoding issues.

-- Clear existing seed data first (safe re-run)
delete from citation_sources;
delete from llm_results;
delete from weekly_runs;
delete from brands;
delete from companies;

-- Sample companies
insert into companies (id, name, note) values
  ('11111111-1111-1111-1111-111111111111', 'Sample Company A', 'Test data'),
  ('22222222-2222-2222-2222-222222222222', 'Sample Company B', 'Test data');

-- Sample brands with keywords
insert into brands (id, company_id, name, keywords) values
  ('aaaaaaaa-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Brand X', array['keyword1', 'keyword2']),
  ('aaaaaaaa-0001-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Brand Y', array['keyword3', 'keyword4']),
  ('bbbbbbbb-0002-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Brand Z', array['keyword5', 'keyword6']);

-- Sample weekly run (current week's Monday)
insert into weekly_runs (id, week_start, status, completed_at) values
  ('cccccccc-0000-0000-0000-000000000001', date_trunc('week', current_date)::date, 'completed', now());

-- Sample LLM results
insert into llm_results (run_id, brand_id, keyword, llm_provider, mentioned, rank, snippet, sentiment) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'gemini', true, 2, 'Brand X is highly rated in the industry.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'google_ai_mode', true, 1, 'Brand X appears at the top of search results.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'chatgpt', false, null, null, null),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'claude', true, 3, 'Brand X explanation and features.', 'neutral'),

  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'gemini', false, null, null, null),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'google_ai_mode', true, 5, 'Brand Y mentioned as related information.', 'neutral'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'chatgpt', true, 2, 'Brand Y offers excellent services.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'claude', false, null, null, null);

-- Sample citation sources
insert into citation_sources (result_id, url, title, domain, position)
select
  r.id,
  'https://example.com/article-' || ord,
  'Sample Article ' || ord,
  'example.com',
  ord
from (
  select id, generate_series(1, 2) as ord
  from llm_results
  where mentioned = true
  limit 4
) r;
