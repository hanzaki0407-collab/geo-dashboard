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
| Claude | Anthropic API (Haiku 4.5) | ~$0.05/week |
| Google AIモード | Playwright scraping (local) | ¥0 |
| ChatGPT | Manual CSV import (TODO: API) | ¥0 |

## Weekly Automation (GitHub Actions)

`.github/workflows/weekly-collect.yml` runs `scripts/collect.ts` every Monday 00:00 UTC (09:00 JST).

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
