"use client";

import type { BrandRow, LocaleRow } from "@/lib/data";
import { FilterProvider } from "./filter-context";
import { Sidebar } from "./sidebar";

/**
 * AppShell — the client boundary for the authenticated dashboard. It provides
 * the FilterContext and lays out the sidebar + main column. The server-rendered
 * page is passed through as `children`, so data still fetches on the server
 * while filter state lives in the client (see filter-context.tsx).
 */
export function AppShell({
  brands,
  locales,
  userEmail,
  children,
}: {
  brands: BrandRow[];
  locales: LocaleRow[];
  userEmail?: string | null;
  children: React.ReactNode;
}) {
  return (
    <FilterProvider brands={brands}>
      <div className="flex h-full">
        <Sidebar locales={locales} userEmail={userEmail} />
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          {children}
        </div>
      </div>
    </FilterProvider>
  );
}
