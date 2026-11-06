/**
 * Source regression checks for the design system and copy dictionary.
 * Fails on hard-coded colours, tiny text, decorative animation, ALL-CAPS labels,
 * side-stripe cards, gradients, and copy keys missing from the dictionary.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DICT, money, shortDate, dayDiff, deliveryWords, fill, bi } from './i18n';

const SRC = join(__dirname, '..');
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'ui' ? [] : walk(p);
    return /\.(tsx?|css)$/.test(f) && !/\.(test|vitest)\.ts$/.test(f) ? [p] : [];
  });
}
const files = [...walk(join(SRC, 'components')), ...walk(join(SRC, 'pages'))].map((p) => ({ p: relative(SRC, p), t: readFileSync(p, 'utf8') }));
const allSrc = walk(SRC).map((p) => ({ p: relative(SRC, p), t: readFileSync(p, 'utf8') }));

function offenders(re: RegExp, set = files) {
  return set.flatMap(({ p, t }) => t.split('\n').map((l, i) => (re.test(l) ? `${p}:${i + 1}: ${l.trim().slice(0, 120)}` : null)).filter(Boolean));
}

describe('design source rules (components + pages, excluding ui/)', () => {
  it('has no hard-coded colours', () => {
    const re = /(?<![\w-])(?:bg-white|bg-black|text-white|text-black|(?:bg|text|border|ring|from|via|to|fill|stroke|divide|placeholder)-(?:gray|slate|stone|zinc|neutral|red|rose|pink|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple)-\d{2,3})(?![\w-])|#[0-9a-fA-F]{6}\b|rgba?\(/;
    expect(offenders(re)).toEqual([]);
  });
  it('has no text below 12px', () => {
    expect(offenders(/text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]|fontSize:\s*(?:[0-9]|1[01])\b/)).toEqual([]);
  });
  it('has no ping/bounce decoration, gradients, glow or pulsing outside skeletons', () => {
    // Built from parts so this rule file does not itself match source scanners.
    const deco = new RegExp(['animate-' + 'ping', 'animate-' + 'bou' + 'nce', 'bg-' + 'gradient-', 'linear-' + 'gradient', 'shadow-' + '\\['].join('|'));
    expect(offenders(deco)).toEqual([]);
    expect(offenders(/^(?!.*bg-muted).*animate-pulse/)).toEqual([]);
  });
  it('has no ALL-CAPS tracking labels or side-stripe cards', () => {
    expect(offenders(/(?<![\w-])uppercase(?![\w-])|tracking-widest|tracking-wider|border-[lsr]-4/)).toEqual([]);
  });
  it('has no rounded-2xl/3xl cards', () => {
    expect(offenders(/rounded-(?:2xl|3xl)/)).toEqual([]);
  });
});

describe('i18n dictionary', () => {
  it('every key has non-empty en and ur, no em-dash sentences', () => {
    for (const [k, v] of Object.entries(DICT)) {
      expect(v.en.trim(), k).not.toBe('');
      expect(v.ur.trim(), k).not.toBe('');
      expect(v.en.includes('—'), k).toBe(false);
      expect(/[\u0600-\u06FF]/.test(v.ur) || /^[\w\s.,:/+()-]+$/.test(v.ur), `${k} ur should be Urdu`).toBe(true);
    }
  });
  it('no inline bilingual copy: label/one never take two string literals', () => {
    expect(offenders(/\b(?:label|one)\(\s*['"`][^'"`]*['"`]\s*,\s*['"`]/, allSrc)).toEqual([]);
  });
  it('no Urdu text literals outside the dictionary (voice parser vocabulary and demo data excepted)', () => {
    const allowed = /i18n\.ts$|voice-parse\.ts$|demo-data\.ts$|use-settings\.ts$|\.test\.ts$/;
    const set = allSrc.filter((f) => !allowed.test(f.p));
    expect(offenders(/['"`][^'"`\n]*[\u0600-\u06FF]/, set)).toEqual([]);
  });
  it('placeholders match between en and ur', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1].replace(/(En|Ur)$/, '')).sort().join(',');
    const bad = Object.entries(DICT).filter(([, v]) => ph(v.en) !== ph(v.ur)).map(([k]) => k);
    expect(bad).toEqual([]);
  });
  it('every single-argument label/one key used in source exists', () => {
    const missing: string[] = [];
    for (const { p, t } of allSrc.filter((f) => !/i18n\.ts$|use-preferences\.ts$/.test(f.p))) {
      for (const m of t.matchAll(/\b(?:label|one|tl|bi|entry)\('([a-z0-9_]+)'[,)]/g)) if (!(m[1] in DICT)) missing.push(`${p}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });
});

describe('interpolation', () => {
  it('fills placeholders and uses Urdu digits in Urdu', () => {
    expect(fill('{n} pcs', { n: 3 }, 'en')).toBe('3 pcs');
    expect(fill('{n} جوڑے', { n: 3 }, 'ur')).toBe('۳ جوڑے');
    expect(bi('when_late', { days: 2 })).toBe('2 din late / ۲ دن تاخیر');
  });
});

describe('formatting', () => {
  it('formats money as Rs with en-PK grouping', () => {
    expect(money(12500)).toBe('Rs 12,500');
    expect(money(0)).toBe('Rs 0');
    expect(money(1234567.6)).toBe('Rs 1,234,568');
  });
  it('formats short dates by language', () => {
    const d = new Date(2025, 10, 6);
    expect(shortDate(d, 'en')).toBe('6 Nov');
    expect(shortDate(d, 'ur')).toBe('۶ نومبر');
  });
  it('counts calendar days across midnight and DST', () => {
    const late = new Date(2025, 2, 9, 23, 59);
    expect(dayDiff(new Date(2025, 2, 10, 0, 1), late)).toBe(1);
    expect(dayDiff(new Date(2025, 2, 9, 0, 0), late)).toBe(0);
    expect(dayDiff(new Date(2025, 2, 30), new Date(2025, 2, 29, 12))).toBe(1);
    expect(dayDiff(new Date(2025, 9, 27), new Date(2025, 9, 25, 23))).toBe(2);
  });
  it('words delivery as Today / Kal / N din late', () => {
    const now = new Date(2025, 5, 10, 18);
    expect(deliveryWords(new Date(2025, 5, 10, 1), now).en).toBe('Today');
    expect(deliveryWords(new Date(2025, 5, 11), now).en).toBe('Kal');
    const l = deliveryWords(new Date(2025, 5, 7), now);
    expect(l.late).toBe(true);
    expect(l.en).toBe('3 din late');
    expect(l.ur).toBe('۳ دن تاخیر');
  });
});
