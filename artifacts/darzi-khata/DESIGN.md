# Darzi Khata design system

Direction: **Ledger Calm**. It should feel like a quiet, trustworthy shop register on a phone. Ink-green on warm paper, flat surfaces, a yellow accent only for highlights.

## Tokens (src/index.css)
- Primary ink green `158 64% 22%` (#155B43); accent yellow; success, warning, danger and info, each with `-soft` and `-foreground`; plus neutral-soft, delivered and primary-soft.
- Background is a warm off-white (~#F9FAF9). Never use pure white or black, and never use raw Tailwind palette classes. A unit test enforces this (src/lib/design-source.vitest.ts).
- Type: IBM Plex Sans (Latin) and Noto Nastaliq Urdu, both self-hosted through @fontsource. The scale is 12/14/16/18/22/28 and nothing goes below 12px. Urdu text uses line-height 2. Numbers use `.num` (tabular figures).
- Radius 8/6. Surfaces are flat with borders; shadows appear only on floating layers. Motion is 180ms, and `prefers-reduced-motion` turns it off.
- Dark mode is supported through `.dark`.

## Copy
- Show only the selected language, never duplicate English/Urdu label pairs. Keep a visible English/اردو switch on main screens and tool pages; selection persists per shop and Urdu uses RTL layout. Put secondary guidance inside expandable Help.
- All UI copy lives in `src/lib/i18n.ts` (`DICT`, keyed en/ur). Use `label('key')` or `one('key')` from `usePreferences`. Money is formatted with `money()` (`Rs 12,500`) and dates with `shortDate()`.
- No em-dash sentences, no ALL CAPS, no emojis.

## Patterns
- Navigation uses a bottom nav with routed sections, and modals open as routed pages with a back bar (`page-dialog.tsx`).
- Order status changes through a single dropdown (`status-menu.tsx`). Deletes are soft, with a 5s undo.
- The order form has 4 labelled steps and a sticky Back/Next bar, and validates inline (phone 03XXXXXXXXX, delivery date not in the past, advance no more than total).
- Receipts print on A4, 80mm or 58mm paper (`body[data-paper]`).
- Tap targets are at least 44px, and primary actions are 48px.
