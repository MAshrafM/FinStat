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

