"use client";

import { useEffect, useMemo } from "react";
import {
  computeKpis,
  PROVIDER_LABELS,
  type CitationRow,
  type LatestResultRow,
  type MentionRateRow,
  type MentionsByCountryRow,
  type TopDomainRow,
} from "@/lib/data";
import { useFilters } from "./filter-context";
import { KpiCards } from "./kpi-cards";
import { HeatmapMatrix } from "./heatmap-matrix";
import { CitationsTable } from "./citations-table";
import { TrendChart } from "./trend-chart";
import { InboundMatrix } from "./inbound-matrix";
import { PromptAnswers } from "./prompt-answers";
import { SnippetsList } from "./snippets-list";
import { KeywordContentTypes } from "./keyword-content-types";

interface DashboardContentProps {
  results: LatestResultRow[];
  rates: MentionRateRow[];
  domains: TopDomainRow[];
  citations: CitationRow[];
  countryMentions: MentionsByCountryRow[];
  inboundResults: LatestResultRow[];
}

function aggregateCitations(rows: CitationRow[]): TopDomainRow[] {
  const byDomain = new Map<
    string,
    { count: number; brands: Set<string>; providers: Set<string> }
  >();
  for (const r of rows) {
    const slot = byDomain.get(r.domain) ?? {
      count: 0,
      brands: new Set<string>(),
      providers: new Set<string>(),
    };
    slot.count += 1;
    slot.brands.add(r.brand_id);
    slot.providers.add(r.llm_provider);
    byDomain.set(r.domain, slot);
  }
  return Array.from(byDomain.entries())
    .map(([domain, v]) => ({
      domain,
      citation_count: v.count,
      distinct_brands: v.brands.size,
      providers: Array.from(v.providers),
    }))
    .sort((a, b) => b.citation_count - a.citation_count)
    .slice(0, 10);
}

export function DashboardContent({
  results,
  rates,
  domains,
  citations,
  countryMentions,
  inboundResults,
}: DashboardContentProps) {
  const { brands, selectedBrands, selectedKeywords, cell, setCell, activeView } =
    useFilters();

  // Switching the nav view should start the reader at the top of the section,
  // not wherever the previous view was scrolled to.
  useEffect(() => {
    document
      .getElementById("dashboard-scroll")
      ?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [activeView]);

  const activeBrandIds = useMemo(
    () => new Set(brands.map((b) => b.id)),
    [brands],
  );

  // Drop any stale/non-active brand rows regardless of selection.
  const baseResults = useMemo(
    () => results.filter((r) => activeBrandIds.has(r.brand_id)),
    [results, activeBrandIds],
  );
  const baseRates = useMemo(
    () => rates.filter((r) => activeBrandIds.has(r.brand_id)),
    [rates, activeBrandIds],
  );

  const filteredResults = useMemo(
    () =>
      baseResults.filter(
        (r) =>
          selectedBrands.has(r.brand_id) && selectedKeywords.has(r.keyword),
      ),
    [baseResults, selectedBrands, selectedKeywords],
  );
  const filteredRates = useMemo(
    () => baseRates.filter((r) => selectedBrands.has(r.brand_id)),
    [baseRates, selectedBrands],
  );
  const filteredInbound = useMemo(
    () =>
      inboundResults.filter(
        (r) =>
          activeBrandIds.has(r.brand_id) &&
          selectedBrands.has(r.brand_id) &&
          selectedKeywords.has(r.keyword),
      ),
    [inboundResults, activeBrandIds, selectedBrands, selectedKeywords],
  );
  // Citations scoped to selected (and active) brands — feeds the per-keyword
  // source column in KeywordContentTypes.
  const filteredCitations = useMemo(
    () =>
      citations.filter(
        (c) => activeBrandIds.has(c.brand_id) && selectedBrands.has(c.brand_id),
      ),
    [citations, activeBrandIds, selectedBrands],
  );

  const kpis = useMemo(() => computeKpis(filteredResults), [filteredResults]);

  // Matrix cell drill-down → scope the citations table to that brand×provider.
  const cellDomains = useMemo(() => {
    if (!cell) return null;
    const rows = citations.filter(
      (c) => c.brand_id === cell.brandId && c.llm_provider === cell.provider,
    );
    return aggregateCitations(rows);
  }, [cell, citations]);

  const shownDomains = cellDomains ?? domains;
  const filterLabel = cell
    ? `${cell.brandName} × ${PROVIDER_LABELS[cell.provider]}`
    : null;
  const activeCell = cell && selectedBrands.has(cell.brandId) ? cell : null;

  const isOverview = activeView === "top";
  const showMetrics = isOverview || activeView === "matrix";

  return (
    <div className="flex flex-col gap-4">
      {showMetrics && (
        <KpiCards kpis={kpis} brandCount={selectedBrands.size} />
      )}

      {(isOverview || activeView === "matrix") && (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HeatmapMatrix
              results={filteredResults}
              selection={activeCell}
              onSelect={setCell}
            />
          </div>
          <div>
            <CitationsTable
              domains={shownDomains}
              filterLabel={filterLabel}
              onClearFilter={() => setCell(null)}
              scope={cell ? "cell" : "all"}
              activeProvider={cell?.provider ?? null}
            />
          </div>
        </section>
      )}

      {activeView === "citations" && (
        <CitationsTable domains={domains} scope="all" />
      )}

      {(isOverview || activeView === "world") && (
        <InboundMatrix results={filteredInbound} countries={countryMentions} />
      )}

      {(isOverview || activeView === "matrix") && (
        <TrendChart rates={filteredRates} />
      )}

      {(isOverview || activeView === "content") && (
        <KeywordContentTypes
          results={filteredResults}
          citations={filteredCitations}
          brands={brands}
        />
      )}

      {(isOverview || activeView === "answers") && (
        <PromptAnswers
          results={filteredResults}
          citations={filteredCitations}
          brands={brands}
        />
      )}

      {(isOverview || activeView === "snippets") && (
        <SnippetsList results={filteredResults} />
      )}

      <footer className="pt-2 pb-4 text-center text-[11px] text-muted-foreground/60">
        LLM分析 · Powered by Next.js + Supabase · FTG Company
      </footer>
    </div>
  );
}
