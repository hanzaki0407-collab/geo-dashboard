"use client";

import type { BrandRow } from "@/lib/data";
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
  userEmail,
  children,
}: {
  brands: BrandRow[];
  userEmail?: string | null;
  children: React.ReactNode;
}) {
  // Re-key the provider whenever the tracked brands/keywords change (via the
  // Targets manager) so the selection sets re-initialize to "all" against the
  // new config instead of holding stale ids/keywords.
  const brandSig = brands
    .map((b) => `${b.id}:${b.name}:${b.keywords.join(",")}`)
    .join("|");

  return (
    <FilterProvider key={brandSig} brands={brands}>
      {/*
        Center the whole app (sidebar + content) and cap its width. Without a cap
        the layout sprawled edge-to-edge, so a 27" 4K/QHD screen looked sparse and
        needed ~175% browser zoom while a 13" laptop wanted 100% — a big per-monitor
        "ブレ". Capping to a fixed canvas makes the layout identical across displays
        (wide screens just get black side margins). Screens ≤ the cap are unaffected.
        Tune the max-w value if the canvas should be wider/narrower.
      */}
      <div className="flex h-full justify-center bg-background">
        <div className="flex h-full w-full max-w-[1680px] overflow-hidden">
          <Sidebar userEmail={userEmail} />
          <div className="flex flex-1 flex-col overflow-hidden bg-transparent">
            {children}
          </div>
        </div>
      </div>
    </FilterProvider>
  );
}
