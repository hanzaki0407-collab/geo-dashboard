-- Step 1: Insert for L'OCCITANE brand (zh-TW, ko, en)
INSERT INTO llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment, raw_response, collected_at)
SELECT '336c128b-0c8a-4ae8-8479-4e3421464f28', b.id, b.keywords[1], 'gemini', 'zh-TW', true, 3, 'Popular cafe in Shibuya', 'positive'::sentiment_type, 'test', NOW()
FROM brands b WHERE b.name LIKE '%OCCITANE%'
ON CONFLICT (run_id, brand_id, keyword, llm_provider, locale) DO UPDATE SET mentioned=true, rank=3, snippet=EXCLUDED.snippet, sentiment=EXCLUDED.sentiment;

INSERT INTO llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment, raw_response, collected_at)
SELECT '336c128b-0c8a-4ae8-8479-4e3421464f28', b.id, b.keywords[1], 'gemini', 'ko', true, 2, 'Famous cafe in Shibuya', 'positive'::sentiment_type, 'test', NOW()
FROM brands b WHERE b.name LIKE '%OCCITANE%'
ON CONFLICT (run_id, brand_id, keyword, llm_provider, locale) DO UPDATE SET mentioned=true, rank=2, snippet=EXCLUDED.snippet, sentiment=EXCLUDED.sentiment;

INSERT INTO llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment, raw_response, collected_at)
SELECT '336c128b-0c8a-4ae8-8479-4e3421464f28', b.id, b.keywords[1], 'gemini', 'en', false, NULL, NULL, NULL, 'test', NOW()
FROM brands b WHERE b.name LIKE '%OCCITANE%'
ON CONFLICT (run_id, brand_id, keyword, llm_provider, locale) DO UPDATE SET mentioned=false, rank=NULL, snippet=NULL, sentiment=NULL;

-- Step 2: Insert for Soshiji brand (zh-TW, ko, en)
INSERT INTO llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment, raw_response, collected_at)
SELECT '336c128b-0c8a-4ae8-8479-4e3421464f28', b.id, b.keywords[1], 'gemini', 'zh-TW', true, 1, 'Top sukiyaki in Nakameguro', 'positive'::sentiment_type, 'test', NOW()
FROM brands b WHERE b.company_id = (SELECT id FROM companies WHERE name = 'FTG Company')
ON CONFLICT (run_id, brand_id, keyword, llm_provider, locale) DO UPDATE SET mentioned=true, rank=1, snippet=EXCLUDED.snippet, sentiment=EXCLUDED.sentiment;

INSERT INTO llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment, raw_response, collected_at)
SELECT '336c128b-0c8a-4ae8-8479-4e3421464f28', b.id, b.keywords[1], 'gemini', 'ko', false, NULL, NULL, NULL, 'test', NOW()
FROM brands b WHERE b.company_id = (SELECT id FROM companies WHERE name = 'FTG Company')
ON CONFLICT (run_id, brand_id, keyword, llm_provider, locale) DO UPDATE SET mentioned=false, rank=NULL, snippet=NULL, sentiment=NULL;

INSERT INTO llm_results (run_id, brand_id, keyword, llm_provider, locale, mentioned, rank, snippet, sentiment, raw_response, collected_at)
SELECT '336c128b-0c8a-4ae8-8479-4e3421464f28', b.id, b.keywords[1], 'gemini', 'en', true, 4, 'Popular sukiyaki restaurant', 'neutral'::sentiment_type, 'test', NOW()
FROM brands b WHERE b.company_id = (SELECT id FROM companies WHERE name = 'FTG Company')
ON CONFLICT (run_id, brand_id, keyword, llm_provider, locale) DO UPDATE SET mentioned=true, rank=4, snippet=EXCLUDED.snippet, sentiment=EXCLUDED.sentiment;
