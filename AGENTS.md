# AGENTS.md — Guardrails for Antigravity AI Agents

This document defines the strict architectural and design-system rules governing all AI coding agents working on the FinStat codebase.

---

## 1. Design Direction & Core Tokens

- **Palette**: Dark graphite canvas (`--fs-page-bg: #101114`, recessed chrome shell `--fs-chrome-bg: #0c0d0f`, surface `--fs-card-bg: #16181d`, border `--fs-border: #23272f`).
- **Interactive Accent**: Teal (`#14b8a6`, `--fs-accent`).
  - **Interactivity only**: Accent is exclusively for interactive controls (buttons, toggles, active indicators). It is **not** a brand wash or background fill.
  - **Text on Accent**: Always `--fs-ink` (`#101114`). **White text on accent is strictly banned** (fails WCAG 2.1 at 1.94:1; `--fs-ink` passes at 10.82:1).
- **Typography**: IBM Plex Sans for UI prose; IBM Plex Mono for numerical tabular values.
- **Mobile Responsive Pattern (D19)**: At viewports $\le 768\text{px}$, tables collapse into compact-expand vertical cards. **Page-level horizontal table scroll is rejected.**
- **Single Source of Truth**: `frontend/src/styles/tokens.json`.

---

## 2. Canonical Reference Frames

Every agent modifying visual components or creating new interfaces must review and adhere to the three reference frames established in Phase 1B:

1. **Dense Table**: [`docs/UI-UX_Plan/reference/01-dense-table.html`](docs/UI-UX_Plan/reference/01-dense-table.html) (Variant B: group-by controls, neutral chips, compact-expand mobile cards).
2. **Form**: [`docs/UI-UX_Plan/reference/02-form.html`](docs/UI-UX_Plan/reference/02-form.html) (Variant B: stacked field cards, inline error placement, safe neutral discard).
3. **Dashboard**: [`docs/UI-UX_Plan/reference/03-dashboard.html`](docs/UI-UX_Plan/reference/03-dashboard.html) (Variant B: recessed `#0c0d0f` chrome, graphite KPI tiles, single accent CTA).

---

## 3. Strictly Banned Patterns (Enforced by Tooling)

The following anti-patterns are mechanically blocked by linters (`.stylelintrc.json`, `lint-tones.js`, `.eslintrc.json`, and `lint-ratchet.js`):

1. **Gradients**:
   - `background: linear-gradient(...)`, `background-image: linear-gradient(...)`
   - Canvas: `ctx.createLinearGradient(...)`, `ctx.createRadialGradient(...)`
   - `mask: linear-gradient(...)`, `mask-image: linear-gradient(...)`
   - `border-image: linear-gradient(...)`, `border-image-source: linear-gradient(...)`
2. **Blurs & Frosting**:
   - `filter: blur(...)`, `backdrop-filter: blur(...)`
3. **Box-Shadow Glows**:
   - Only `box-shadow: none` or `var(--fs-shadow)` is allowed. Arbitrary pixel shadows and glows are banned.
4. **Unlisted Radii (8px Ceiling)**:
   - Allowed: `0`, `var(--fs-radius-sm)` (4px), `var(--fs-radius-md)` (6px), `var(--fs-radius-lg)` (8px), `var(--fs-radius-pill)`.
   - Radius > 8px is forbidden (except pill, which is reserved for chips and avatars, never buttons).
   - Radius longhands (`border-top-left-radius`, etc.) are completely disallowed.
5. **White Text on Accent**:
   - White text on `--fs-accent` is banned. Use `.fs-btn-primary` or `--fs-ink`.
6. **Direct Usage of `var(--fs-accent)` in Page CSS**:
   - `var(--fs-accent)` cannot be referenced directly in page CSS files. Use primitive utility classes (`.fs-btn-primary`, etc.) from `theme.css` and `theme-components.css`.
7. **Colour-Bearing Inline Styles in JSX**:
   - `style={{ color: ... }}`, `style={{ background: ... }}` are banned in `.js`/`.jsx` files.
8. **Raw Hex Literals in JS**:
   - `#14b8a6` and raw hex colors are banned across `.js`/`.jsx` files outside theme files.
9. **Deleting `data-testid` or `aria-label`**:
   - Existing test IDs and accessibility labels must be preserved (Invariant I5).

---

## 4. Local Verification & Baseline Architecture (A5-Local, D21)

- **Baseline Storage**: Visual regression baselines live in a separate local git repo (`D:\Projects\FinStat-visual-baselines`) linked via Windows directory junction:
  ```cmd
  cmd /c mklink /J frontend\tests\visual\baseline D:\Projects\FinStat-visual-baselines
  ```
- **App Repo Untracked**: `frontend/tests/visual/baseline/` is `.gitignore`'d in the app repo. Zero baseline PNGs are tracked in `main`.
- **Manifest Integrity**: `verify-baseline-manifest.js` enforces that all 325 images have $\ge 1000$ bytes, non-1x1 dimensions, and match SHA-256 hashes in `manifest.json`.

---

## Multi-theme door-preservation (D22)

Multi-theme (T2 user-selectable accents, T3 light/dark/high-contrast) is deferred to a post-Phase-14 initiative. The plan preserves the door through four constraints. **Do not close the door without a recorded plan amendment.**

1. **`tokens.css` scoped blocks.** `tokens.js --write` emits `:root[data-fs-theme="dark"] { ... }`, not flat `:root { ... }`. Adding a new theme is a generator addition (new block), not a selector rewrite. If you find flat `:root` in `tokens.css`, the generator has regressed — fix `tokens.js`, regenerate, never hand-edit `tokens.css`.

2. **Attribute-existence CSS selectors.** Any CSS rule that gates on theme uses `[data-fs-theme]` (existence) — e.g. `html[data-fs-theme] body { ... }`. The value-specific form `[data-fs-theme="dark"]` is used **only** inside `tokens.css` to scope a theme's token block. Everywhere else (theme.css, theme-components.css, index.css, page CSS), use the existence form. Reason: `[data-fs-theme="dark"]` stops matching when the attribute value changes; the page falls back to unstyled defaults.

3. **Theme-aware chart palette.** `chartTheme.js` exports `getChartPalette()` reading `--fs-chart-grey-1..4` and `--fs-positive|negative|warning` via `getComputedStyle(document.documentElement)` at chart render time. No hardcoded palette in the returned function. Test-mode fallback (`process.env.NODE_ENV === 'test'` or `window.__VISUAL_TEST__`) returns dark-theme constants so jsdom tests pass. The ESLint override in `.eslintrc.json` still bans `#14b8a6` inside `chartTheme.js` — accent must never be a chart series.

4. **Phase 12 preserves the attribute.** Cleanup deletes the allowlist conditional (the logic that decided *whether* to apply the theme attribute). The attribute itself (`<html data-fs-theme="dark">`) stays applied on every route. Deleting the attribute entirely would require re-adding the application path when T2/T3 launches.

**Cost of violation:** generator rewrite, ~50-file specificity audit, `chartTheme.js` refactor plus 5 chart re-verifications, attribute-path re-addition — estimated 2–3 phases of rework when a future multi-theme initiative launches. Violations are caught at walkthrough and reject the PR.


