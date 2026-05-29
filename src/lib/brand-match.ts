/**
 * brand-match — fuzzy matching of an AI-listed shop name against our tracked
 * brand names. Tolerant of spacing, width, location suffixes, and すき焼/すき焼き
 * style spelling variants, without matching on shared category words alone.
 * Shared by the content-types and AI-answer views.
 */

// Generic restaurant category / location words that are NOT distinctive brand
// identifiers. Stripped from a tracked brand name to derive its coined core
// (e.g. "和牛すき焼き そしじ" → "そしじ") so the AI's spelling variants
// ("和牛すき焼 そしじ 中目黒店", "和牛すき焼き そしじ 中目黒店", …) all match.
const GENERIC_TERMS = [
  "黒毛和牛", "和牛", "すき焼き", "すき焼", "しゃぶしゃぶ", "焼肉", "餃子",
  "中華", "ラーメン", "うどん", "そば", "寿司", "鮨", "居酒屋", "ホルモン",
  "専門店", "本店", "別邸", "支店", "駅前店", "店", "大阪", "東京",
  "中目黒", "代官山", "渋谷", "新宿", "恵比寿",
];

export function normalizeName(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s　・,，、。.()（）「」『』]/g, "");
}

// Brand name minus generic category/location words = its distinctive core.
export function distinctiveCore(name: string): string {
  let core = normalizeName(name);
  for (const g of GENERIC_TERMS) {
    core = core.split(normalizeName(g)).join("");
  }
  return core;
}

// Does an AI-listed competitor name refer to one of our tracked brands?
export function matchesTracked(
  competitor: string,
  trackedNames: string[],
): boolean {
  const comp = normalizeName(competitor);
  if (!comp) return false;
  for (const t of trackedNames) {
    const tn = normalizeName(t);
    if (!tn) continue;
    if (comp.includes(tn) || tn.includes(comp)) return true;
    const core = distinctiveCore(t);
    if (core.length >= 2 && comp.includes(core)) return true;
  }
  return false;
}
