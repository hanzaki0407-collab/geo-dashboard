-- Sample inbound results (Taiwan - zh-TW)
INSERT INTO llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'gemini', 'zh-TW', true, 1, 'Brand X is highly rated in Taiwan market.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'google_ai_mode', 'zh-TW', true, 2, 'Brand X is a popular choice in search results.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'chatgpt', 'zh-TW', true, 3, 'Brand X offers quality service experience.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'claude', 'zh-TW', false, null, null, null),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'gemini', 'zh-TW', true, 4, 'Brand Y is also a good choice.', 'neutral'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'chatgpt', 'zh-TW', false, null, null, null);

-- Sample inbound results (Korea - ko)
INSERT INTO llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'gemini', 'ko', true, 2, 'Brand X is highly evaluated in the industry.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'chatgpt', 'ko', true, 1, 'Brand X provides the best service.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'claude', 'ko', false, null, null, null),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'gemini', 'ko', true, 3, 'Brand Y is also worth recommending.', 'neutral');

-- Sample inbound results (US - en)
INSERT INTO llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'gemini', 'en', true, 3, 'Brand X is well-known for quality service.', 'positive'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'chatgpt', 'en', false, null, null, null),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'keyword1', 'claude', 'en', true, 5, 'Brand X provides excellent experiences.', 'neutral'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'keyword3', 'chatgpt', 'en', true, 2, 'Brand Y is a solid alternative.', 'positive');
