"use client";

import {
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  Home,
  LayoutGrid,
  Link2,
  LogOut,
  MessageSquareText,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { LiquidButton } from "@/components/ui/liquid-button";
import { cn } from "@/lib/utils";
import { useFilters } from "./filter-context";
import { BrandManager } from "./brand-manager";

const MAIN_MENU = [
  { label: "概要", icon: Home, id: "top" },
  { label: "言及マトリクス", icon: LayoutGrid, id: "matrix" },
  { label: "コンテンツの種類", icon: Sparkles, id: "content" },
  { label: "AI回答", icon: MessageSquareText, id: "answers" },
  { label: "紹介文", icon: FileText, id: "snippets" },
  { label: "引用元ドメイン", icon: Link2, id: "citations" },
  { label: "インバウンド", icon: Globe, id: "world" },
] as const;

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const { activeView, setActiveView } = useFilters();

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-center border-b border-sidebar-border px-3 py-3">
        <Image
          src="/hanchan-logo.png"
          alt="hanchan creative"
          width={420}
          height={360}
          priority
          className="logo-screen h-auto w-full max-w-[150px] object-contain"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        <BrandFilterTree />

        <div className="cc-eyebrow mt-5 mb-1.5 px-2.5 text-[10px]">
          Navigation
        </div>
        <ul className="space-y-0.5">
          {MAIN_MENU.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition-colors",
                    isActive
                      ? "bg-primary/15 text-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[15px] w-[15px]",
                      isActive ? "text-primary" : "",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-1 border-t border-sidebar-border p-2.5">
        {userEmail && (
          <div className="px-2 pt-0.5" title={userEmail}>
            <div className="cc-eyebrow text-[9px]">Operator</div>
            <div className="truncate text-[10.5px] text-sidebar-foreground/70">
              {userEmail}
            </div>
          </div>
        )}
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-[15px] w-[15px]" />
            ログアウト
          </button>
        </form>
      </div>
    </aside>
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
  } = useFilters();
  // Collapsed by default to keep the panel compact — expand a brand to filter
  // by individual keyword.
  const [openBrands, setOpenBrands] = useState<Set<string>>(() => new Set());

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
      <div className="mb-1.5 flex items-center justify-between gap-1 px-2.5">
        <div className="cc-eyebrow flex items-center gap-1.5 text-[10px]">
          <LayoutGrid className="h-3 w-3" /> Targets
        </div>
        <BrandManager brands={brands} />
      </div>

      <ul className="space-y-0.5 px-1">
        {brands.map((b) => {
          const checked = selectedBrands.has(b.id);
          const open = openBrands.has(b.id);
          const checkedKw = b.keywords.filter((k) =>
            selectedKeywords.has(k),
          ).length;
          const partial = checkedKw > 0 && checkedKw < b.keywords.length;
          return (
            <li key={b.id} className="rounded-lg">
              <div className="flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-sidebar-accent/40">
                <button
                  type="button"
                  onClick={() => toggleOpen(b.id)}
                  className="rounded p-0.5 text-sidebar-foreground/50 transition-colors hover:text-sidebar-accent-foreground"
                  aria-label={open ? "閉じる" : "開く"}
                >
                  {open ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-[11.5px] font-medium text-sidebar-foreground">
                  <Checkbox
                    checked={checked}
                    indeterminate={partial}
                    onCheckedChange={() => toggleBrand(b.id)}
                    aria-label={b.name}
                  />
                  <span className="flex-1 truncate" title={b.name}>
                    {b.name}
                  </span>
                  <span className="text-[9px] tabular-nums text-sidebar-foreground/40">
                    {checkedKw}/{b.keywords.length}
                  </span>
                </label>
              </div>
              {open && b.keywords.length > 0 && (
                <ul className="mr-1 mb-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
                  {b.keywords.map((k) => (
                    <li key={k}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-0.5 text-[10.5px] text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent">
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

      <div className="mt-1.5 flex items-center gap-2 px-2.5">
        <button
          type="button"
          onClick={selectAll}
          className="text-[10.5px] font-medium text-sidebar-foreground/55 transition-colors hover:text-primary"
        >
          すべて選択
        </button>
        {/* リセット = すべてのチェックを外す（クリア） */}
        <LiquidButton
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={selectedBrands.size === 0 && selectedKeywords.size === 0}
          className="ml-auto h-6 px-2 text-[10.5px] text-sidebar-foreground/70"
        >
          <RotateCcw className="h-3 w-3" /> リセット
        </LiquidButton>
      </div>
    </div>
  );
}
