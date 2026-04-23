"use client";

import type { BrandRow, CompanyRow } from "@/lib/data";

interface BrandFilterProps {
  brands: BrandRow[];
  companies: CompanyRow[];
  selectedBrandId: string | null;
  onChange: (brandId: string | null) => void;
}

export function BrandFilter({ brands, companies, selectedBrandId, onChange }: BrandFilterProps) {
  const companyById = new Map(companies.map((c) => [c.id, c.name]));
  const sorted = [...brands]
    .filter((b) => b.active !== false)
    .sort((a, b) => {
      const ca = companyById.get(a.company_id) ?? "";
      const cb = companyById.get(b.company_id) ?? "";
      if (ca !== cb) return ca.localeCompare(cb);
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">ブランド選択</h2>
          <p className="text-[11px] text-muted-foreground">
            選択したブランドのキーワード・言及状況のみを表示します
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
            selectedBrandId === null
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-border bg-white/[0.02] text-muted-foreground hover:border-border/80 hover:text-foreground"
          }`}
        >
          全ブランド
          <span className="ml-1.5 text-[10px] opacity-70">({sorted.length})</span>
        </button>
        {sorted.map((b) => {
          const active = selectedBrandId === b.id;
          const company = companyById.get(b.company_id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange(b.id)}
              title={company ?? undefined}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-white/[0.02] text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
            >
              {b.name}
              {company && company !== b.name && (
                <span className="ml-1.5 text-[10px] opacity-60">{company}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
