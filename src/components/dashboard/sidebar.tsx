"use client";

import {
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  Home,
  LayoutGrid,
  Link2,
  LogOut,
  RotateCcw,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { LocaleRow } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { LiquidButton } from "@/components/ui/liquid-button";
import { cn } from "@/lib/utils";
import { useFilters } from "./filter-context";

const MAIN_MENU = [
  { label: "概要", icon: Home, id: "top" },
  { label: "言及マトリクス", icon: LayoutGrid, id: "matrix" },
  { label: "引用元ドメイン", icon: Link2, id: "citations" },
  { label: "インバウンド", icon: Globe, id: "world" },
  { label: "競合ランキング", icon: Users, id: "competitors" },
  { label: "紹介文", icon: FileText, id: "snippets" },
] as const;

const SECTION_IDS = MAIN_MENU.map((m) => m.id);

/** Highlights the nav item for the section currently in view. */
function useActiveSection() {
  const [active, setActive] = useState<string>(SECTION_IDS[0]);
  useEffect(() => {
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -75% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return active;
}

export function Sidebar({
  locales,
  userEmail,
}: {
  locales: LocaleRow[];
  userEmail?: string | null;
}) {
  const activeSection = useActiveSection();

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="flex w-[264px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-20 items-center px-5">
        <div className="rounded-lg bg-white px-2 py-1.5 shadow-sm">
          <Image
            src="/hanchan-creative-logo.png"
            alt="HANCHAN creative"
            width={220}
            height={70}
            priority
            className="h-11 w-auto object-contain"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <MarketSwitcher locales={locales} />
        <BrandFilterTree />

        <SidebarLabel className="mt-6">ナビゲーション</SidebarLabel>
        <ul className="space-y-0.5">
          {MAIN_MENU.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleNav(e, item.id)}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon className="h-[17px] w-[17px]" />
                  <span className="flex-1">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-1.5 border-t border-sidebar-border/60 p-3">
        {userEmail && (
          <div className="px-3 pt-1" title={userEmail}>
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
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}

function SidebarLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-2 px-3 text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/50 uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Market / language switcher. Forward-compat for multilingual inbound work;
    drives the world map focus today, the main views next cycle. */
function MarketSwitcher({ locales }: { locales: LocaleRow[] }) {
  const { selectedLocale, setLocale } = useFilters();
  if (locales.length <= 1) return null;
  return (
    <div className="mt-1 mb-5">
      <SidebarLabel className="flex items-center gap-1.5">
        <Globe className="h-3 w-3" /> 市場（言語）
      </SidebarLabel>
      <div className="relative px-1">
        <select
          value={selectedLocale}
          onChange={(e) => setLocale(e.target.value)}
          className="w-full appearance-none rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-[12px] font-medium text-sidebar-accent-foreground outline-none transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {locales.map((l) => (
            <option key={l.code} value={l.code} className="bg-popover text-foreground">
              {l.flag} {l.country_name_ja}（{l.code}）
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-3.5 w-3.5 -translate-y-1/2 text-sidebar-foreground/50" />
      </div>
    </div>
  );
}

function BrandFilterTree() {
  const {
    brands,
    selectedBrands,
    selectedKeywords,
    toggleBrand,
    toggleKeyword,
    selectAll,
    clearAll,
    isFiltered,
  } = useFilters();
  const [openBrands, setOpenBrands] = useState<Set<string>>(
    () => new Set(brands.map((b) => b.id)),
  );

  const toggleOpen = (id: string) =>
    setOpenBrands((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (brands.length === 0) return null;

  return (
    <div id="brand-filter">
      <SidebarLabel className="flex items-center gap-1.5">
        <Building2 className="h-3 w-3" /> ブランドを選ぶ
      </SidebarLabel>

      <ul className="space-y-1 px-1">
        {brands.map((b) => {
          const checked = selectedBrands.has(b.id);
          const open = openBrands.has(b.id);
          const checkedKw = b.keywords.filter((k) =>
            selectedKeywords.has(k),
          ).length;
          const partial = checkedKw > 0 && checkedKw < b.keywords.length;
          return (
            <li key={b.id} className="rounded-lg bg-sidebar-accent/30">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => toggleOpen(b.id)}
                  className="rounded p-0.5 text-sidebar-foreground/60 transition-colors hover:text-sidebar-accent-foreground"
                  aria-label={open ? "閉じる" : "開く"}
                >
                  {open ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-[12px] font-medium text-sidebar-foreground">
                  <Checkbox
                    checked={checked}
                    indeterminate={partial}
                    onCheckedChange={() => toggleBrand(b.id)}
                    aria-label={b.name}
                  />
                  <span className="truncate" title={b.name}>
                    {b.name}
                  </span>
                </label>
              </div>
              {open && b.keywords.length > 0 && (
                <ul className="mb-1.5 ml-5 mr-2 space-y-0.5 border-l border-sidebar-border/60 pl-2">
                  {b.keywords.map((k) => (
                    <li key={k}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[11px] text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent">
                        <Checkbox
                          checked={selectedKeywords.has(k)}
                          onCheckedChange={() => toggleKeyword(b.id, k)}
                          aria-label={k}
                        />
                        <span className="truncate" title={k}>
                          {k}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-2.5 flex items-center gap-2 px-3">
        <button
          type="button"
          onClick={selectAll}
          className="text-[11px] font-medium text-sidebar-foreground/55 transition-colors hover:text-primary"
        >
          全選択
        </button>
        <span className="text-sidebar-foreground/20">·</span>
        <button
          type="button"
          onClick={clearAll}
          className="text-[11px] font-medium text-sidebar-foreground/55 transition-colors hover:text-primary"
        >
          全解除
        </button>
        {isFiltered && (
          <LiquidButton
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="ml-auto h-6 px-2 text-[11px] text-sidebar-foreground/70"
          >
            <RotateCcw className="h-3 w-3" /> リセット
          </LiquidButton>
        )}
      </div>
    </div>
  );
}
