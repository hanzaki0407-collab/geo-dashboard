"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Settings2, Trash2, X } from "lucide-react";
import type { BrandRow } from "@/lib/data";
import {
  createBrand,
  deleteBrand,
  renameBrand,
  setBrandKeywords,
} from "@/app/(app)/brand-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LiquidButton } from "@/components/ui/liquid-button";
import { cn } from "@/lib/utils";

const sameKeywords = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** Trim + drop empties (display-side mirror of the server normalizer). */
const clean = (arr: string[]) => arr.map((k) => k.trim()).filter(Boolean);

export function BrandManager({ brands }: { brands: BrandRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex h-6 items-center gap-1 rounded-md border border-sidebar-border bg-white/[0.02] px-1.5 text-[10px] font-medium text-sidebar-foreground/70 transition-colors hover:border-primary/40 hover:text-primary"
        aria-label="ターゲットを管理"
      >
        <Settings2 className="h-3 w-3" />
        管理
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ターゲット管理</DialogTitle>
          <DialogDescription>
            ブランド名と対策キーワードを編集・追加・削除できます。変更は保存後すぐ反映され、次回の収集から新しいキーワードが計測されます。
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 max-h-[58vh] space-y-2.5 overflow-y-auto px-1 py-1">
          {brands.map((b) => (
            <BrandEditor
              key={`${b.id}::${b.name}::${b.keywords.join("")}`}
              brand={b}
            />
          ))}
          <NewBrand />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BrandEditor({ brand }: { brand: BrandRow }) {
  const router = useRouter();
  const [name, setName] = useState(brand.name);
  const [keywords, setKeywords] = useState<string[]>(brand.keywords);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const cleanedName = name.trim();
  const cleanedKw = clean(keywords);
  const dirty =
    (cleanedName.length > 0 && cleanedName !== brand.name) ||
    !sameKeywords(cleanedKw, brand.keywords);

  const updateKw = (i: number, v: string) =>
    setKeywords((cur) => cur.map((k, idx) => (idx === i ? v : k)));
  const removeKw = (i: number) =>
    setKeywords((cur) => cur.filter((_, idx) => idx !== i));
  const addDraft = () => {
    const v = draft.trim();
    if (!v) return;
    setKeywords((cur) => [...cur, v]);
    setDraft("");
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      if (cleanedName.length > 0 && cleanedName !== brand.name) {
        const r = await renameBrand(brand.id, cleanedName);
        if (!r.ok) return setError(r.error);
      }
      if (!sameKeywords(cleanedKw, brand.keywords)) {
        const r = await setBrandKeywords(brand.id, cleanedKw);
        if (!r.ok) return setError(r.error);
      }
      router.refresh();
    });
  };

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const r = await deleteBrand(brand.id);
      if (!r.ok) return setError(r.error);
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ブランド名"
        className="h-8 text-[13px] font-semibold"
      />

      <div className="mt-2.5 space-y-1.5">
        <div className="cc-eyebrow text-[9px]">対策キーワード</div>
        {keywords.length === 0 && (
          <p className="text-[11px] text-muted-foreground/60">
            キーワード未設定 — 下で追加してください
          </p>
        )}
        {keywords.map((k, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={k}
              onChange={(e) => updateKw(i, e.target.value)}
              placeholder="キーワード"
              className="h-7 text-[12px]"
            />
            <button
              type="button"
              onClick={() => removeKw(i)}
              aria-label="キーワードを削除"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder="新しいキーワードを追加"
            className="h-7 text-[12px]"
          />
          <button
            type="button"
            onClick={addDraft}
            aria-label="キーワードを追加"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}

      <div className="mt-3 flex items-center justify-between gap-2">
        {confirmingDelete ? (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-destructive">全データ削除？</span>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="rounded-md bg-destructive px-2 py-1 text-[11px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              削除する
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            ブランド削除
          </button>
        )}

        <LiquidButton
          variant="default"
          size="sm"
          onClick={save}
          disabled={!dirty || pending}
          className="h-7 px-3 text-[11px]"
        >
          <Check className="h-3.5 w-3.5" />
          {pending ? "保存中…" : "保存"}
        </LiquidButton>
      </div>
    </div>
  );
}

function NewBrand() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const addDraft = () => {
    const v = draft.trim();
    if (!v) return;
    setKeywords((cur) => [...cur, v]);
    setDraft("");
  };

  const create = () => {
    const n = name.trim();
    if (!n) return setError("ブランド名を入力してください");
    setError(null);
    startTransition(async () => {
      const r = await createBrand(n, clean(keywords));
      if (!r.ok) return setError(r.error);
      setName("");
      setKeywords([]);
      setDraft("");
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-3">
      <div className="cc-eyebrow mb-1.5 flex items-center gap-1 text-[9px] text-primary/80">
        <Plus className="h-3 w-3" /> ブランドを追加
      </div>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例: 大阪餃子専門店よしこ"
        className="h-8 text-[13px] font-semibold"
      />
      {keywords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {keywords.map((k, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-foreground"
            >
              {k}
              <button
                type="button"
                onClick={() =>
                  setKeywords((cur) => cur.filter((_, idx) => idx !== i))
                }
                aria-label="削除"
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="対策キーワード（任意）"
          className="h-7 text-[12px]"
        />
        <button
          type="button"
          onClick={addDraft}
          aria-label="キーワードを追加"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}

      <LiquidButton
        variant="outline"
        size="sm"
        onClick={create}
        disabled={pending || !name.trim()}
        className={cn("mt-2.5 h-7 w-full px-3 text-[11px]")}
      >
        <Plus className="h-3.5 w-3.5" />
        {pending ? "追加中…" : "ブランドを追加"}
      </LiquidButton>
    </div>
  );
}
