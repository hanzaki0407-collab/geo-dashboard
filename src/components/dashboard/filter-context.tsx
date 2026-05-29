"use client";

/**
 * FilterContext — single client-side source of truth for the dashboard's
 * filter selection (brands, keywords, market/locale) and the matrix→citations
 * cell drill-down.
 *
 * This replaces the previous design that synced state through URL search params
 * across the layout↔page boundary on a statically-rendered route, which left the
 * sidebar checkboxes unresponsive. Here the provider lives in the (app) layout
 * (a client component wrapping the server-rendered page via `children`), so the
 * Sidebar and DashboardContent share plain React state and re-render instantly.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BrandRow } from "@/lib/data";
import type { LLMProvider } from "@/lib/types";

export interface CellSelection {
  brandId: string;
  brandName: string;
  provider: LLMProvider;
}

interface FilterContextValue {
  brands: BrandRow[];
  allBrandIds: string[];
  allKeywords: string[];

  selectedBrands: Set<string>;
  selectedKeywords: Set<string>;
  selectedLocale: string;
  cell: CellSelection | null;
  activeView: string;

  allBrandsSelected: boolean;
  allKeywordsSelected: boolean;
  isFiltered: boolean;

  toggleBrand: (brandId: string) => void;
  toggleKeyword: (brandId: string, keyword: string) => void;
  setLocale: (code: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  setCell: (cell: CellSelection | null) => void;
  setActiveView: (view: string) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({
  brands,
  children,
}: {
  brands: BrandRow[];
  children: ReactNode;
}) {
  const allBrandIds = useMemo(() => brands.map((b) => b.id), [brands]);
  const allKeywords = useMemo(() => brands.flatMap((b) => b.keywords), [brands]);

  // Default to "everything selected" so the dashboard is never blank on load.
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(
    () => new Set(allBrandIds),
  );
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    () => new Set(allKeywords),
  );
  const [selectedLocale, setSelectedLocale] = useState("ja");
  const [cell, setCell] = useState<CellSelection | null>(null);
  // Which section the main area shows. The sidebar nav switches this (a real
  // view switch, not a scroll anchor). "top" = full overview.
  const [activeView, setActiveView] = useState("top");

  // One user toggle at a time, so deriving "next" from the closed-over current
  // sets is correct (and matches the prior, proven sidebar logic).
  const toggleBrand = useCallback(
    (brandId: string) => {
      const brand = brands.find((b) => b.id === brandId);
      if (!brand) return;
      const isOn = selectedBrands.has(brandId);
      const nextBrands = new Set(selectedBrands);
      const nextKeywords = new Set(selectedKeywords);
      if (isOn) {
        nextBrands.delete(brandId);
        for (const k of brand.keywords) nextKeywords.delete(k);
      } else {
        nextBrands.add(brandId);
        for (const k of brand.keywords) nextKeywords.add(k);
      }
      setSelectedBrands(nextBrands);
      setSelectedKeywords(nextKeywords);
    },
    [brands, selectedBrands, selectedKeywords],
  );

  const toggleKeyword = useCallback(
    (brandId: string, keyword: string) => {
      const brand = brands.find((b) => b.id === brandId);
      if (!brand) return;
      const isOn = selectedKeywords.has(keyword);
      const nextKeywords = new Set(selectedKeywords);
      const nextBrands = new Set(selectedBrands);
      if (isOn) {
        nextKeywords.delete(keyword);
      } else {
        nextKeywords.add(keyword);
        nextBrands.add(brandId); // activating a keyword implies its brand
      }
      // Drop a brand once it has no selected keywords left.
      const brandHasAny = brand.keywords.some((k) => nextKeywords.has(k));
      if (!brandHasAny) nextBrands.delete(brandId);
      setSelectedKeywords(nextKeywords);
      setSelectedBrands(nextBrands);
    },
    [brands, selectedBrands, selectedKeywords],
  );

  const setLocale = useCallback((code: string) => setSelectedLocale(code), []);
  const selectAll = useCallback(() => {
    setSelectedBrands(new Set(allBrandIds));
    setSelectedKeywords(new Set(allKeywords));
  }, [allBrandIds, allKeywords]);
  const clearAll = useCallback(() => {
    setSelectedBrands(new Set());
    setSelectedKeywords(new Set());
    setCell(null);
  }, []);

  const allBrandsSelected =
    selectedBrands.size === allBrandIds.length && allBrandIds.length > 0;
  const allKeywordsSelected =
    selectedKeywords.size === allKeywords.length && allKeywords.length > 0;

  const value = useMemo<FilterContextValue>(
    () => ({
      brands,
      allBrandIds,
      allKeywords,
      selectedBrands,
      selectedKeywords,
      selectedLocale,
      cell,
      activeView,
      allBrandsSelected,
      allKeywordsSelected,
      isFiltered: !(allBrandsSelected && allKeywordsSelected),
      toggleBrand,
      toggleKeyword,
      setLocale,
      selectAll,
      clearAll,
      setCell,
      setActiveView,
    }),
    [
      brands,
      allBrandIds,
      allKeywords,
      selectedBrands,
      selectedKeywords,
      selectedLocale,
      cell,
      activeView,
      allBrandsSelected,
      allKeywordsSelected,
      toggleBrand,
      toggleKeyword,
      setLocale,
      selectAll,
      clearAll,
    ],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilters must be used within a <FilterProvider>");
  }
  return ctx;
}
