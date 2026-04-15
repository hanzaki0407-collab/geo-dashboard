export type LLMProvider = "gemini" | "google_ai_mode" | "chatgpt" | "claude";

export type Sentiment = "positive" | "neutral" | "negative";

export interface Brand {
  id: string;
  company: string;
  brandName: string;
  keywords: string[];
  createdAt: string;
}

export interface Query {
  id: string;
  brandId: string;
  keyword: string;
  llmProvider: LLMProvider;
  executedAt: string;
}

export interface CitationSource {
  url: string;
  title?: string;
  domain: string;
}

export interface QueryResult {
  id: string;
  queryId: string;
  brandId: string;
  llmProvider: LLMProvider;
  keyword: string;
  mentioned: boolean;
  rank: number | null;
  snippet: string | null;
  sentiment: Sentiment | null;
  sources: CitationSource[];
  rawResponse: string;
  collectedAt: string;
  weekStart: string;
}
