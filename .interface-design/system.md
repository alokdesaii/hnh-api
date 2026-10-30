# Harbour & Hills API Portal — Design System

## Direction: "Specification Ledger", in parent-brand monochrome
The V2.3.3 specification, made into a calm, precise working tool for integration engineers. Follows harbourandhills.com: **near-black #0C0F19 and white carry the page**; brand teal #1DBAB0 is a scarce accent for live or active things (active nav bar, method tags, section numbers, the console's send button, status dots). Navy isn't used. Feels like a well-set financial document, not a cyber terminal.

**Who:** an engineer at a client firm wiring up payments, cross-checking the signed PDF.
**Focal point per page:** the method's field list, with the console beside it.

## Tokens (src/index.css)
All colour goes through tokens. No raw hex in components (the console's dark panel is the one exception, see below).

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | #ffffff | #0c0f19 (brand near-black) | page background, sidebar |
| `folio` | #ffffff | #121621 | cards / raised surfaces |
| `well` | #f3f3f1 | #080a11 | inputs, inset areas, hover fill |
| `ink` → `ink-4` | #0c0f19 / #3b3e47 / #6c6f77 / #a8aaaf | #ffffff / #bcbcbc / #85878e / #50535b | primary / secondary / meta / disabled text |
| `rule` / `rule-soft` / `rule-strong` | near-black at 10% / 6% / 20% | white at 9% / 5% / 18% | borders (rgba, never solid hex) |
| `solid` / `solid-ink` | #0c0f19 on #ffffff | #ffffff on #0c0f19 | primary buttons, mandatory (Y) marks, avatar: always the brand's black/white pair |
| `primary` / `primary-ink` | #0c0f19 on #ffffff | #1dbab0 (brand teal) on #0c0f19 | `.btn-primary` only |
| `tide` | #0e8a82 | #1dbab0 | teal **text** (section numbers, method tags). Light mode uses a deeper shade because #1DBAB0 fails contrast on white |
| `tide-mark` | #1dbab0 | #1dbab0 | teal **non-text** marks: active nav bar, status dots |
| `cond` | #9a5b00 | #e0a24a | conditional (C) marks, validation-rules aside |
| `ok` / `hold` / `fail` | green / amber / red | desaturated | status codes only |
| `code` / `code-ink` / `code-dim` | #0c0f19 / #e4e5e8 / #7c7f88 | #080a11 / … | console + code blocks (always dark); accent #1dbab0 with #0c0f19 text on it |

Theme switch: the `.dark` class on `<html>` (ThemeContext).

Brand colours only, taken from harbourandhills.com: near-black #0C0F19, white, teal #1DBAB0, grey #BCBCBC. Don't introduce blues. Teal stays under ~10% of any screen.

Logo: the emblem's upper wave is `currentColor` (`text-ink`, so near-black in light mode and white in dark); the lower wave is teal. Favicon: white + teal waves on a near-black rounded tile.

## Typography
- **Inter** for UI (the parent site's intended face, `int`), **IBM Plex Mono** for field names, paths, codes and section numbers.
- Base 14px / 1.5. Scale: eyebrow 11 · meta 12 · label/body-small 13 · body 14–15 · h2 16–18 · h1 30 (method pages) / 36 (overview).
- Hierarchy comes from weight + ink level more than size: value 500–600 `ink`, label 400 `ink-2`, meta `ink-3`.
- `.eyebrow`: mono 11px, 500, uppercase, 0.06em tracking, `ink-3`. Used for running heads ("§1.2 TRANSACTION · SPEC P.4").
- Headings get `-0.015em` tracking and `text-wrap: balance`; numbers get `tabular-nums`.

## Depth, radius, spacing
- **Borders only.** No drop shadows except menus/modals (one soft shadow) and the 1px ring on selected segments.
- Radius: 4 (chips, segments) · 6 (inputs) · 10 (cards, console, menus) · pill (buttons).
- 4px base grid. Card rows 12–14px vertical / 16px horizontal. Sections are 40px apart; page head has 28–36px under it.
- Layout: sidebar 264px · content max 760px (overview 860px) · console 520px docked right at 2xl and up, stacked below otherwise · page gutters 20 / 32 / 48px.

## Signature: the requirement margin rule
Every field row has a 2px left rule (`.req-rule .req-Y|C|O`):
- **Y** solid `solid` (near-black / white) · **C** dashed `cond` · **O** faint `rule`.
- When the "Which fields do I need?" picker resolves a C field to required, its rule becomes solid and the row says "→ required" plus the reason; fields that aren't needed fade to 45% opacity.
- Section numbers (`§1.2`) in mono `tide`, plus "Spec p.N", tie every page back to the PDF.

## Components
- **Button** `.btn` 34px tall · 0 14px padding · **pill radius** (as on the parent site) · 13px/500 · press `scale(0.97)`. `.btn-primary` `primary` fill (near-black in light, brand teal in dark); `.btn-ghost` folio with `rule` border.
- **Field** `.field` 36px · `well` fill (inset, darker than its surroundings) · `rule` border → `tide` on focus.
- **Segmented control** `.seg` (`well` track, 2px padding; 26px buttons; the selected one gets `folio` + 1px ring). State is `aria-pressed`.
- **Method tag** `.method` mono 10px/600, `tide` on `tide-wash`.
- **Chip** `.chip` mono 11px, 20px tall, `well`. Used for enum values.
- **Card** `.folio` with rows split by `rule-soft`, last row with no border.
- **Field row:** two columns `minmax(200px,38%) | 1fr`. Left: name (mono 13/500), then "Requirement · Type · max N" (mono 12). Right: spec remark, then the **Guidance** eyebrow + portal help, enum chips, and "e.g." example.
- **Callout aside:** a 2px left border with no background. `cond` for validation rules, `tide` for "what changed".
- **Stepper** (integration path, guides): 32px numbered circle, 1px `rule` connector, title + body.
- **Sidebar item** 32px · 13px · active = `folio` + ring + 2px `tide-mark` bar on the left · section number column 28px mono `ink-4`. Items are real `<a href="#/id">` links.
- **Menu** `.menu` 10 radius, `rule-strong` border, one soft shadow, pops in from the top right at 160ms. Items are 8px/10px padding. Closes on outside click or Escape.
- **Console** (always dark, `code` tokens): 44px tab bar with a 2px teal underline on the active tab · Form/JSON switch · inputs `bg-black/25` with a `white/7%` border · send button full width, 36px, `#1dbab0` fill with `#0c0f19` text · validation errors in `#ec7a70` under the field.

## Motion
120ms colour/border transitions; menus 160ms with `cubic-bezier(0.23,1,0.32,1)`; nothing animates from scale 0. `prefers-reduced-motion` turns animation off.

## Content rules
- **The spec is the source of truth** for fields, lengths, Y/C/O, codes and sample shapes (src/data/apiSpec.ts). Never invent requirements or response fields.
- **Proposed rules are labelled.** Anything recommended but not in the signed spec lives in src/data/proposedRules.ts and shows a dashed-teal `ProposedTag` ("Proposed"), a dashed-teal "Proposed — pending approval" aside on the method page, and an entry at the top of Version control. Sandbox errors from these rules end in "(proposed rule)".
- **Portal help is labelled.** Field `guidance` shows under a "Guidance" eyebrow; guides live in src/data/guides.ts. Where the spec has no remark and there's no guidance, show "No remarks in the specification."
- **Sandbox only.** The console never sends real requests. It validates with src/utils/validate.ts (the same rules the docs picker uses) and returns documented response shapes. The code samples and exports point at the production URL for clients' own servers.
- **Copy:** sentence case, plain verbs ("Send request", "Reset", "Forget"), no marketing claims or compliance badges.
