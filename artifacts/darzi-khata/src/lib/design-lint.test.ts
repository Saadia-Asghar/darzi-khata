/**
 * CI design lint. Fails if any pattern removed in the clean-up (section B)
 * comes back. Scans every .ts/.tsx/.css file under src, including
 * components/ui, excluding tests. Exemptions are listed below with the reason;
 * each one is an output medium that is not the themed screen.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DICT } from './i18n';

const SRC = join(__dirname, '..');
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(tsx?|css)$/.test(f) && !/\.(test|vitest)\.tsx?$/.test(f) ? [p] : [];
  });
}

/** Print CSS paints on paper, which is white by definition. Drop it before scanning. */
function stripPrint(path: string, text: string) {
  if (!path.endsWith('index.css')) return text;
  return text.replace(/\/\* Print:[\s\S]*?(?=\/\* Motion)/, '');
}
const files = walk(SRC).map((p) => {
  const rel = relative(SRC, p).replaceAll('\\', '/');
  return { p: rel, t: stripPrint(rel, readFileSync(p, 'utf8')) };
});
const isComment = (l: string) => /^\s*(\/\/|\*|\/\*)/.test(l);

/**
 * Documented exemptions (file -> rule names):
 * - lib/brand.ts: QR ink/paper and the browser theme-color meta need literal hex;
 *   a QR scanner needs dark-on-white contrast that does not follow dark mode.
 * - hooks/use-preferences.ts: writes theme-color meta (hex required by browsers).
 * - lib/photos.ts: fills the JPEG canvas white before drawing a fabric photo
 *   (transparent pixels would otherwise turn black in the compressed image).
 * - components/ui/chart.tsx: selectors that match recharts' own default
 *   stroke attributes ('#ccc', '#fff') so they can be re-themed with tokens.
 */
const EXEMPT: Record<string, string[]> = {
  'lib/brand.ts': ['hex'],
  'hooks/use-preferences.ts': ['hex'],
  'lib/photos.ts': ['hex'],
  'components/ui/chart.tsx': ['hex'],
};

function offenders(rule: string, re: RegExp, only?: RegExp) {
  return files
    .filter(({ p }) => !(EXEMPT[p] ?? []).includes(rule) && (!only || only.test(p)))
    .flatMap(({ p, t }) => t.split('\n').map((l, i) => (!isComment(l) && re.test(l) ? `${p}:${i + 1}: ${l.trim().slice(0, 140)}` : null)))
    .filter(Boolean);
}

describe('design lint: type scale', () => {
  it('has no text under 12px', () => {
    expect(offenders('tiny', /text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]|text-\[0?\.(?:[0-6]\d*|7[0-4]\d*)rem\]|fontSize:\s*['"]?(?:[0-9]|1[01])(?:px)?\b/)).toEqual([]);
  });
});

describe('design lint: colour tokens only', () => {
  it('has no raw white/black or Tailwind palette classes', () => {
    const re = /(?<![\w-])(?:bg-white|bg-black|text-white|text-black|border-white|border-black|(?:bg|text|border|ring|from|via|to|fill|stroke|divide|placeholder|outline|decoration|shadow)-(?:gray|slate|stone|zinc|neutral|red|rose|pink|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia)-\d{2,3})(?![\w-])/;
    expect(offenders('palette', re)).toEqual([]);
  });
  it('has no arbitrary colour values in classes', () => {
    expect(offenders('arbitrary', /(?:bg|text|border|fill|stroke|ring)-\[(?:#|rgb|hsl\()/)).toEqual([]);
  });
  it('has no hex or rgb colours in source', () => {
    expect(offenders('hex', /#[0-9a-fA-F]{6}\b|['"`]#[0-9a-fA-F]{3}['"`]|rgba?\(/)).toEqual([]);
  });
  it('keeps background and card tokens off pure white and black', () => {
    const css = files.find((f) => f.p === 'index.css')!.t;
    expect(css).not.toMatch(/--(?:background|card|popover|sidebar):\s*0 0% (?:100|0)%/);
  });
});

describe('design lint: no decoration', () => {
  it('has no ALL-CAPS or wide-tracked labels', () => {
    expect(offenders('caps', /(?<![\w-])uppercase(?![\w-])|tracking-(?:wide|wider|widest)|text-transform:\s*uppercase/)).toEqual([]);
  });
  it('has no ping/bounce/blur/glass/gradient/glow', () => {
    const re = new RegExp(['animate-' + 'ping', 'animate-' + 'bounce', 'animate-' + 'spin-slow', 'backdrop-' + 'blur', 'backdrop-filter', 'bg-' + 'gradient-', 'linear-' + 'gradient', 'radial-' + 'gradient', 'shadow-' + '\\[', 'drop-shadow'].join('|'));
    expect(offenders('deco', re)).toEqual([]);
  });
  it('only pulses skeleton placeholders', () => {
    expect(offenders('pulse', /^(?!.*bg-muted).*animate-pulse/)).toEqual([]);
  });
  it('has no side-stripe cards or oversized radius', () => {
    expect(offenders('stripe', /border-[lrse]-(?:4|8)\b|rounded-(?:2xl|3xl|\[(?:1[0-9]|[2-9]\d)px\])/)).toEqual([]);
  });
  it('keeps big shadows to floating layers (ui primitives only)', () => {
    expect(offenders('shadow', /shadow-2xl/, /^(?!components\/ui\/).*\.tsx$/)).toEqual([]);
  });
  it('has no cream or hand-picked receipt backgrounds', () => {
    expect(offenders('cream', /bg-\[#|bg-\[hsl/)).toEqual([]);
  });
});

describe('design lint: dialogs and copy', () => {
  it('never uses native confirm, prompt or alert', () => {
    expect(offenders('native', /\bwindow\.(?:confirm|prompt|alert)\(|(?<![\w.])(?:confirm|prompt|alert)\(\s*['"`a-zA-Z]/, /\.tsx?$/)).toEqual([]);
  });
  it('has no inline "English / Urdu" label pairs', () => {
    expect(offenders('pair', /['"`>][^'"`<\n]* \/ [^'"`<\n]*[\u0600-\u06FF]|[\u0600-\u06FF][^'"`<\n]* \/ [A-Za-z]/, /\.tsx$/)).toEqual([]);
  });
  it('has no emoji anywhere in source or copy', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    expect(offenders('emoji', emoji)).toEqual([]);
    expect(Object.entries(DICT).filter(([, v]) => emoji.test(v.en) || emoji.test(v.ur)).map(([k]) => k)).toEqual([]);
  });
  it('has no em-dash sentences or ALL-CAPS words in copy', () => {
    const bad = Object.entries(DICT).filter(([, v]) => v.en.includes('\u2014') || v.ur.includes('\u2014') || /\b(?!(?:QR|PDF|PIN|DK|SBP|GIKI|JS|OK|ID|URL|PK|FY\d*|SMS|USB|KB|MB|A4|BC|Rs|II|AM|PM|JSON|CSV|AI|PKR|HTTPS|IBAN|EN|UR)\b)[A-Z]{3,}\b/.test(v.en)).map(([k]) => k);
    expect(bad).toEqual([]);
  });
});
