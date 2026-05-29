"use client";

import { useMemo } from "react";
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
import { WorldHeatmap } from "./world-heatmap";
import { CompetitorsList } from "./competitors-list";
import { SnippetsList } from "./snippets-list";

interface DashboardContentProps {
  results: LatestResultRow[];
  rates: MentionRateRow[];
  domains: TopDomainRow[];
  citations: CitationRow[];
  countryMentions: MentionsByCountryRow[];
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
}: DashboardContentProps) {
  const {
    brands,
    selectedBrands,
    selectedKeywords,
    selectedLocale,
    cell,
    setCell,
    isFiltered,
    allKeywordsSelected,
  } = useFilters();

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

  const selectedBrandList = brands.filter((b) => selectedBrands.has(b.id));

  return (
    <div id="top" className="flex scroll-mt-4 flex-col gap-5">
      {isFiltered && selectedBrandList.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-[11px] text-primary">
          <span className="opacity-70">表示中:</span>
          <span className="font-semibold">
            {selectedBrandList.length === 1
              ? selectedBrandList[0].name
              : `${selectedBrandList.length} ブランド`}
          </span>
          {!allKeywordsSelected && (
            <span className="text-primary/70">
              · キーワード: {Array.from(selectedKeywords).slice(0, 6).join(" / ")}
              {selectedKeywords.size > 6 ? " …" : ""}
            </span>
          )}
        </div>
      )}

      <KpiCards kpis={kpis} brandCount={selectedBrands.size} />

      <section id="matrix" className="grid scroll-mt-4 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HeatmapMatrix
            results={filteredResults}
            selection={activeCell}
            onSelect={setCell}
          />
        </div>
        <div id="citations" className="scroll-mt-4">
          <CitationsTable
            domains={shownDomains}
            filterLabel={filterLabel}
            onClearFilter={() => setCell(null)}
            scope={cell ? "cell" : "all"}
            activeProvider={cell?.provider ?? null}
          />
        </div>
      </section>

      <section id="world" className="scroll-mt-4">
        <WorldHeatmap data={countryMentions} selectedLocale={selectedLocale} />
      </section>

      <TrendChart rates={filteredRates} />

      <section id="competitors" className="scroll-mt-4">
        <CompetitorsList results={filteredResults} />
      </section>

      <section id="snippets" className="scroll-mt-4">
        <SnippetsList results={filteredResults} />
      </section>

      <footer className="pt-2 pb-4 text-center text-[11px] text-muted-foreground/60">
        GEO Dashboard · Powered by Next.js + Supabase · FTG Company
      </footer>
    </div>
  );
}
