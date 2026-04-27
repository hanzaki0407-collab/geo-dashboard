"use client";

import {
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Link2,
  LogOut,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useMemo, useState, useCallback } from "react";
import type { BrandRow } from "@/lib/data";

const mainMenu = [
  { label: "ダッシュボード", icon: Home, href: "#top" },
  { label: "競合ランキング", icon: Users, href: "#competitors" },
  { label: "引用元ドメイン", icon: Link2, href: "#citations" },
  { label: "紹介文", icon: FileText, href: "#snippets" },
];

interface SidebarProps {
  brands: BrandRow[];
  userEmail?: string | null;
}

export function Sidebar({ brands, userEmail }: SidebarProps) {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col bg-sidebar">
      <div className="flex h-20 items-center justify-center px-3">
        <div className="rounded-lg bg-white px-2 py-1.5">
          <Image
            src="/hanchan-creative-logo.png"
            alt="HANCHAN creative"
            width={220}
            height={70}
            priority
            className="h-12 w-auto object-contain"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-4">
        <Suspense fallback={<div className="px-3 py-2 text-[11px] text-sidebar-foreground/40">読み込み中…</div>}>
          <BrandFilterTree brands={brands} />
        </Suspense>

        <div className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
          ナビゲーション
        </div>
        <ul className="space-y-0.5">
          {mainMenu.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Icon className="h-[17px] w-[17px]" />
                  <span className="flex-1">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1.5 border-t border-sidebar-border/40 p-3">
        {userEmail && (
          <div
            className="px-3 pt-1 text-[11px] text-sidebar-foreground/60"
            title={userEmail}
          >
            <div className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/40">
              Signed in as
            </div>
            <div className="truncate text-[12px] font-medium text-sidebar-foreground/80">
              {userEmail}
            </div>
          </div>
        )}
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-[17px] w-[17px]" />
            Log Out
          </button>
        </form>
      </div>
    </aside>
  );
}

/* ── Brand → Keyword filter tree (logic-tree style) ──────────── */

function BrandFilterTree({ brands }: { brands: BrandRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // URL contract: ?brand=<id1,id2>&kw=<kw1,kw2>
  // Empty = "all". Falls back to all on first load so the dashboard isn't blank.
  const selectedBrands = useMemo(() => {
    const raw = params.get("brand");
    return new Set(raw ? raw.split(",").filter(Boolean) : brands.map((b) => b.id));
  }, [params, brands]);
  const selectedKeywords = useMemo(() => {
    const raw = params.get("kw");
    return new Set(
      raw
        ? raw.split(",").filter(Boolean)
        : brands.flatMap((b) => b.keywords),
    );
  }, [params, brands]);

  // Brand expansion state — open by default so the keywords are visible.
  const [openBrands, setOpenBrands] = useState<Set<string>>(
    () => new Set(brands.map((b) => b.id)),
  );

  const writeParams = useCallback(
    (nextBrands: Set<string>, nextKeywords: Set<string>) => {
      const allBrandIds = brands.map((b) => b.id);
      const allKeywords = brands.flatMap((b) => b.keywords);
      const sp = new URLSearchParams(params.toString());

      const brandsAll =
        nextBrands.size === allBrandIds.length &&
        allBrandIds.every((id) => nextBrands.has(id));
      const kwAll =
        nextKeywords.size === allKeywords.length &&
        allKeywords.every((k) => nextKeywords.has(k));

      if (brandsAll) sp.delete("brand");
      else sp.set("brand", Array.from(nextBrands).join(","));
      if (kwAll) sp.delete("kw");
      else sp.set("kw", Array.from(nextKeywords).join(","));

      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [brands, params, pathname, router],
  );

  const toggleBrand = (brandId: string) => {
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
    writeParams(nextBrands, nextKeywords);
  };

  const toggleKeyword = (brandId: string, keyword: string) => {
    const brand = brands.find((b) => b.id === brandId);
    if (!brand) return;
    const isOn = selectedKeywords.has(keyword);
    const nextBrands = new Set(selectedBrands);
    const nextKeywords = new Set(selectedKeywords);
    if (isOn) nextKeywords.delete(keyword);
    else {
      nextKeywords.add(keyword);
      // Activating a keyword implies activating its brand.
      nextBrands.add(brandId);
    }
    // If a brand has zero selected keywords, drop the brand too.
    const brandHasAny = brand.keywords.some((k) => nextKeywords.has(k));
    if (!brandHasAny) nextBrands.delete(brandId);
    writeParams(nextBrands, nextKeywords);
  };

  const toggleOpen = (brandId: string) => {
    setOpenBrands((cur) => {
      const next = new Set(cur);
      if (next.has(brandId)) next.delete(brandId);
      else next.add(brandId);
      return next;
    });
  };

  if (brands.length === 0) return null;

  return (
    <div id="brand-filter">
      <div className="mb-2 flex items-center gap-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
        <Building2 className="h-3 w-3" />
        ブランドを選ぶ
      </div>
      <ul className="space-y-1 px-1">
        {brands.map((b) => {
          const checked = selectedBrands.has(b.id);
          const open = openBrands.has(b.id);
          const checkedKwCount = b.keywords.filter((k) =>
            selectedKeywords.has(k),
          ).length;
          const partial =
            checkedKwCount > 0 && checkedKwCount < b.keywords.length;
          return (
            <li key={b.id} className="rounded-lg bg-sidebar-accent/30">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => toggleOpen(b.id)}
                  className="rounded p-0.5 text-sidebar-foreground/60 hover:text-sidebar-accent-foreground"
                  aria-label={open ? "閉じる" : "開く"}
                >
                  {open ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-[12px] font-medium text-sidebar-foreground">
                  <input
                    type="checkbox"
                    checked={checked}
                    ref={(el) => {
                      if (el) el.indeterminate = partial && !checked;
                    }}
                    onChange={() => toggleBrand(b.id)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <span className="truncate" title={b.name}>
                    {b.name}
                  </span>
                </label>
              </div>
              {open && b.keywords.length > 0 && (
                <ul className="border-l border-sidebar-border/60 ml-5 mb-1.5 mr-2 space-y-0.5 pl-2">
                  {b.keywords.map((k) => {
                    const kwOn = selectedKeywords.has(k);
                    return (
                      <li key={k}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[11px] text-sidebar-foreground/85 hover:bg-sidebar-accent">
                          <input
                            type="checkbox"
                            checked={kwOn}
                            onChange={() => toggleKeyword(b.id, k)}
                            className="h-3 w-3 accent-primary"
                          />
                          <span className="truncate" title={k}>
                            {k}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
