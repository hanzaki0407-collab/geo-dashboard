# GEO Dashboard

主要LLM（ChatGPT、Gemini、Google AIモード、Claude）における自社クライアントのブランド言及・引用元・紹介内容を可視化する週次ダッシュボード。

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Recharts
- Supabase (Postgres)
- Gemini API
- Playwright (Google AIモード収集用)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.local.example .env.local

# 3. Fill in .env.local with real API keys

# 4. Run dev server
npm run dev
```

## Data Collection Strategy

| LLM | Method | Cost |
|---|---|---|
| Gemini | Gemini API (free tier) | ¥0 |
| Claude | Anthropic API (Sonnet 4.6 + web_search) | ~$0.29/query (~$0.60/month at current scale) |
| Google AIモード | Playwright scraping (local) | ¥0 |
| ChatGPT | Manual CSV import (TODO: API) | ¥0 |

**Claude cost detail**: Sonnet 4.6 with `web_search` tool. Each query performs ~3 web searches; input tokens inflate to ~70K due to search results injected into context. Analysis step uses Haiku 4.5 for JSON parsing. Scale cost linearly with `brand × keyword × locale` count.

## Monthly Automation (GitHub Actions)

`.github/workflows/monthly-collect.yml` runs `scripts/collect.ts` on the 1st of each month at 00:00 UTC (09:00 JST).

**Required GitHub Secrets** (Repo Settings → Secrets and variables → Actions):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`

Manual trigger: Actions tab → "Weekly LLM Collection" → "Run workflow" (can override providers/locale).

## Scope

- 10 companies × 20 brands × 2 keywords = 40 query sets
- Weekly collection cadence
- Dashboard views: brand×LLM heatmap, trend lines, source URL ranking, snippet viewer
