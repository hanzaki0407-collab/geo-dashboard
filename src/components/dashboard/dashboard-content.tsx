"use client";

import { useMemo, useState } from "react";
import {
  computeKpis,
  type BrandRow,
  type CitationRow,
  type CompanyRow,
  type LatestResultRow,
  type MentionRateRow,
  type MentionsByCountryRow,
  type TopDomainRow,
} from "@/lib/data";
import { PROVIDER_LABELS } from "@/lib/data";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import {
  HeatmapMatrix,
  HeatmapLegend,
  type HeatmapSelection,
} from "@/components/dashboard/heatmap-matrix";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CitationsTable } from "@/components/dashboard/citations-table";
import { SnippetsList } from "@/components/dashboard/snippets-list";
import { CompetitorsList } from "@/components/dashboard/competitors-list";
import { WorldHeatmap } from "@/components/dashboard/world-heatmap";
import { BrandFilter } from "@/components/dashboard/brand-filter";

interface DashboardContentProps {
  brands: BrandRow[];
  companies: CompanyRow[];
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
  brands,
  companies,
  results,
  rates,
  domains,
  citations,
  countryMentions,
}: DashboardContentProps) {
  // Only show brands the user actually tracks today. Keeps legacy/seed rows
  // (e.g. Brand X/Y/Z from Sample Company) out of the UI entirely.
  const activeBrands = useMemo(
    () => brands.filter((b) => b.active !== false),
    [brands],
  );
  const activeBrandIds = useMemo(
    () => new Set(activeBrands.map((b) => b.id)),
    [activeBrands],
  );

  // Default to the first active brand instead of "全ブランド" so the dashboard
  // never displays a mixed genre heatmap on first paint.
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    activeBrands[0]?.id ?? null,
  );
  const [cellSelection, setCellSelection] = useState<HeatmapSelection | null>(null);

  // Active-brand-only base (drops stale brand rows regardless of selection).
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
      selectedBrandId
        ? baseResults.filter((r) => r.brand_id === selectedBrandId)
        : baseResults,
    [baseResults, selectedBrandId],
  );
  const filteredRates = useMemo(
    () =>
      selectedBrandId ? baseRates.filter((r) => r.brand_id === selectedBrandId) : baseRates,
    [baseRates, selectedBrandId],
  );
  const kpis = useMemo(() => computeKpis(filteredResults), [filteredResults]);
  const brandCount = selectedBrandId ? 1 : activeBrands.length;

  const cellDomains = useMemo(() => {
    if (!cellSelection) return null;
    const rows = citations.filter(
      (c) =>
        c.brand_id === cellSelection.brandId && c.llm_provider === cellSelection.provider,
    );
    return aggregateCitations(rows);
  }, [cellSelection, citations]);

  const shownDomains = cellDomains ?? domains;
  const filterLabel = cellSelection
    ? `${cellSelection.brandName} × ${PROVIDER_LABELS[cellSelection.provider]}`
    : null;

  const activeCellSelection =
    cellSelection && (!selectedBrandId || cellSelection.brandId === selectedBrandId)
      ? cellSelection
      : null;

  const selectedBrand = activeBrands.find((b) => b.id === selectedBrandId) ?? null;

  return (
    <div id="top" className="flex flex-col gap-5">
      <div id="brand-filter">
        <BrandFilter
          brands={activeBrands}
          companies={companies}
          selectedBrandId={selectedBrandId}
          onChange={(id) => {
            setSelectedBrandId(id);
            setCellSelection(null);
          }}
        />
      </div>

      {selectedBrand && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-[11px] text-primary">
          表示中: <span className="font-semibold">{selectedBrand.name}</span>
          {selectedBrand.keywords.length > 0 && (
            <span className="ml-2 text-primary/70">
              キーワード: {selectedBrand.keywords.join(" / ")}
            </span>
          )}
        </div>
      )}

      <KpiCards kpis={kpis} brandCount={brandCount} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HeatmapMatrix
            results={filteredResults}
            selection={activeCellSelection}
            onSelect={setCellSelection}
          />
        </div>
        <div id="citations">
          <CitationsTable
            domains={shownDomains}
            filterLabel={filterLabel}
            onClearFilter={() => setCellSelection(null)}
            scope={cellSelection ? "cell" : "all"}
            activeProvider={cellSelection?.provider ?? null}
          />
        </div>
      </div>

      <HeatmapLegend />

      <WorldHeatmap data={countryMentions} />

      <TrendChart rates={filteredRates} />

      <div id="competitors">
        <CompetitorsList results={filteredResults} />
      </div>

      <div id="snippets">
        <SnippetsList results={filteredResults} />
      </div>

      <footer className="pt-2 pb-4 text-center text-[11px] text-muted-foreground/60">
        GEO Dashboard · Powered by Next.js + Supabase · FTG Company
      </footer>
    </div>
  );
}
