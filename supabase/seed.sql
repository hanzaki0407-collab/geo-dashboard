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

-- Sample inbound results (Taiwan - zh-TW)
insert into llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'gemini', 'zh-TW', true, 1, 'Brand X 在業界評價很高。', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'google_ai_mode', 'zh-TW', true, 2, 'Brand X 是搜尋結果中的熱門選擇。', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'chatgpt', 'zh-TW', true, 3, 'Brand X 提供優質的服務體驗。', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'claude', 'zh-TW', false, null, null, null),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'gemini', 'zh-TW', true, 4, 'Brand Y 也是不錯的選擇。', 'neutral'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'chatgpt', 'zh-TW', false, null, null, null);

-- Sample inbound results (Korea - ko)
insert into llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'gemini', 'ko', true, 2, 'Brand X는 업계에서 높은 평가를 받고 있습니다.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'chatgpt', 'ko', true, 1, 'Brand X는 최고의 서비스를 제공합니다.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'claude', 'ko', false, null, null, null),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'gemini', 'ko', true, 3, 'Brand Y도 추천할 만합니다.', 'neutral');

-- Sample inbound results (US - en)
insert into llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'gemini', 'en', true, 3, 'Brand X is well-known for quality service.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'chatgpt', 'en', false, null, null, null),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'claude', 'en', true, 5, 'Brand X provides excellent experiences.', 'neutral'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'chatgpt', 'en', true, 2, 'Brand Y is a solid alternative.', 'positive');

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
