# Implementation Plan — UI Phase 2D: Shared Component Overrides (v2 — Revised)

## 1. Goal Description

Phase 2D implements comprehensive `.fs-page`-scoped shadow overrides in [`frontend/src/styles/theme-components.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css) for all core shared UI components (`Table`, `Form`, `Modal`, `ConfirmModal`, `ViewOnlyBanner`, `ProtectedAction`, `PaginationControls`, `SummaryRow`, `AnalysisCard`, `ComponentTable`, and `AppLauncher`), and adapts [`frontend/src/components/DataLoader.js`](file:///d:/Projects/FinStat/frontend/src/components/DataLoader.js) to inherit `currentColor`.

This phase establishes the foundational styling required before route migrations begin in Phase 3A (Dashboard). In strict adherence to **Constraint E1**, the legacy shared CSS files (`Table.css`, `Form.css`, `Modal.css`, `ConfirmModal.css`, `index.css`, etc.) remain completely untouched. Unmigrated routes (`THEMED_PATTERNS = []`) remain 100% bit-for-bit identical (**Invariant I13**, zero visual diff across all 326 baseline routes).

---

## 2. User Review Required

> [!IMPORTANT]
> **Constraint E1 — Zero Modifications to Shared Legacy Files**:
> Shared legacy CSS files (`Table.css`, `Form.css`, `Modal.css`, `ConfirmModal.css`, `index.css`, `SummaryRow.css`, `AnalysisCard.css`, `PaginationControls.css`, `ComponentTable.css`, `AppLauncher.css`, `ViewOnlyBanner.css`, `ProtectedAction.css`) are **not** edited in this phase. They retain their legacy rules and stylelint ratchet counts until Phase 12 consolidation. All overrides are added to [`frontend/src/styles/theme-components.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css).

> [!NOTE]
> **Plan Amendment v10.3 Landed on `main` (B1)**:
> Plan amendment v10.3 is committed to `main` at `5d14422`. This adds:
> - Sub-phase 2F (Universal loading pattern, D23) between 2E and 3A (shifting 3A's opening dependency from 2E to 2F).
> - Primitive #8 (`Loading`) to §8.4.
> - `--fs-danger-hover: #c36066` under `actions` in `tokens.json` and generated in `tokens.css`.
> - Updated contrast verification in §4.9.1 (`--fs-ink` on `--fs-danger-hover` `#c36066` = 4.77:1, Pass).

> [!NOTE]
> **Scoping Architecture & Dual-Gating (`.fs-page` & `html[data-fs-theme]`)**:
> - Page-embedded shared components (`.styled-table`, `.form-group`, `.summary-row`, `.analysis-card`, `.component-table-wrapper`, `.pagination-container`) are strictly scoped under `.fs-page` (specificity `0,2,0`, which cleanly defeats legacy `0,1,0`).
> - Top-level and overlay components (`Modal`, `ConfirmModal`, `ViewOnlyBanner`, `AppLauncher`): React renders `Modal` and `ConfirmModal` in-tree without portals; however, to ensure full coverage when rendered either inside `.fs-page` or mounted at body level under a themed layout, modal and overlay selectors will be dual-gated using both `.fs-page <selector>` and `html[data-fs-theme] <selector>`.
> - **Multi-theme door preservation (D22)**: Gated theme selectors strictly use attribute existence (`html[data-fs-theme]`), never the value-specific `[data-fs-theme="dark"]`.

> [!NOTE]
> **Design System Guardrails & Stylelint Ceilings**:
> - **Radius Ceiling (8px / §4.8 / D15)**: Legacy modals (`12px`), app launcher (`22px`), and inputs (`5px`) are capped to design tokens: `var(--fs-radius-sm)` (4px), `var(--fs-radius-md)` (6px), or `var(--fs-radius-lg)` (8px). Status chips and badges use `var(--fs-radius-pill)`. Literal `50%` and pixel radii > 8px are strictly banned.
> - **No Gradients, Blurs, or Frosting (§3 / §4.15)**: Legacy `backdrop-filter: blur(...)` in `ConfirmModal.css` (2px), `ViewOnlyBanner.css` (8px), and `AppLauncher.css` (10px) is eliminated (`backdrop-filter: none; -webkit-backdrop-filter: none;`). Overlays use opaque `var(--fs-scrim)` (`rgba(12, 13, 15, 0.72)`). Legacy radial/linear background gradients are replaced with solid `var(--fs-surface)`.
> - **No Raw Hex / Literal Colours (§3 / E3)**: All color declarations in `theme-components.css` reference CSS custom properties (`var(--fs-*)`).
> - **No White Text on Accent (§1 / §3)**: Accent buttons and active toggles pair `--fs-accent` (`#14b8a6`) exclusively with `--fs-ink` (`#0d0e10`).
> - **Neutral Zebra & Table Hierarchy (§4.7 / §6.4)**: Table headers use `var(--fs-surface-sunken)`. Alternating row zebra uses `var(--fs-surface-sunken)` (never a color tint). Row hover uses `var(--fs-surface-raised)`. Active sort header uses `var(--fs-accent)` for the indicator and heading weight. Numeric columns use `.fs-num` with `font-variant-numeric: tabular-nums; text-align: right;`.

> [!NOTE]
> **`DataLoader.js` Colour Inheritance (B5)**:
> In accordance with UI-UX-PLAN §6.6 and §4.16, [`frontend/src/components/DataLoader.js`](file:///d:/Projects/FinStat/frontend/src/components/DataLoader.js) replaces hardcoded `#3b82f6` on the progress SVG circle stroke and bouncing dots with `currentColor`. This allows the loader to automatically inherit the text color of whatever container it renders in, requiring zero route gating. All loading standardization, `.loading-spinner` refactoring, Suspense fallbacks, and page migrations are deferred to Sub-phase 2F.

---

## 3. Component-by-Component Override Inventory (Plain CSS Expanded, B2)

All new CSS rules will be added to [`frontend/src/styles/theme-components.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css) using plain, fully expanded CSS selectors (no SCSS-style nesting `&:hover`, `&:disabled`, etc.):

### 3.1. Tables (`Table.css` / `.styled-table`)
Governed by UI-UX-PLAN §4.7, §6.4, and Reference Frame 01:
- Container & Table Base:
  - `.fs-page .table-container { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 1.25rem auto; }`
  - `.fs-page .styled-table { width: 100%; border-collapse: collapse; background: var(--fs-surface); color: var(--fs-text); font-family: var(--fs-font-sans); font-size: var(--fs-text-sm); box-shadow: none; }`
- Headers & Rows:
  - `.fs-page .styled-table thead tr { background: var(--fs-surface-sunken); color: var(--fs-text-3); font-weight: var(--fs-weight-medium); text-align: left; }`
  - `.fs-page .styled-table th { padding: 10px 14px; border: var(--fs-border-width) solid var(--fs-border); color: var(--fs-text-3); font-size: 12px; font-weight: 500; white-space: nowrap; }`
  - `.fs-page .styled-table td { padding: 10px 14px; border: var(--fs-border-width) solid var(--fs-border); color: var(--fs-text-2); white-space: nowrap; }`
  - `.fs-page .styled-table tbody tr { background: var(--fs-surface); border-bottom: var(--fs-border-width) solid var(--fs-border); transition: background var(--fs-duration-fast) var(--fs-ease-standard); }`
  - `.fs-page .styled-table tbody tr:nth-of-type(even) { background: var(--fs-surface-sunken); }` (Zebra uses surface step, never a tint)
  - `.fs-page .styled-table tbody tr:hover { background: var(--fs-surface-raised); }`
  - `.fs-page .styled-table tbody tr:last-of-type { border-bottom: var(--fs-border-width) solid var(--fs-border); }` (eliminates legacy `#009879` 2px border)
  - `.fs-page .styled-table tbody tr.fs-row-selected { background: var(--fs-surface-raised); border-left: 2px solid var(--fs-accent); }`
- Sorted Header State:
  - `.fs-page .styled-table th.fs-th-sortable { cursor: pointer; user-select: none; }`
  - `.fs-page .styled-table th.fs-th-active, .fs-page .styled-table th.sorted { color: var(--fs-text); font-weight: var(--fs-weight-semibold); }`
  - `.fs-page .styled-table .fs-sort-arrow, .fs-page .styled-table .sort-arrow { color: var(--fs-accent); margin-left: 4px; }`
- Empty States & Numeric Figures:
  - `.fs-page .styled-table .empty-row, .fs-page .styled-table .empty-state { text-align: center; color: var(--fs-text-3); padding: 2rem 1rem; }`
  - `.fs-page .fs-num, .fs-page .styled-table .fs-num { text-align: right; font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }`
- Action Icons & Tooltips:
  - `.fs-page .action-icon { color: var(--fs-text-3); transition: color var(--fs-duration-fast) var(--fs-ease-standard); cursor: pointer; }`
  - `.fs-page .action-icon:hover { color: var(--fs-text); transform: none; }`
  - `.fs-page .edit-icon { color: var(--fs-text-3); }`
  - `.fs-page .edit-icon:hover { color: var(--fs-text); }`
  - `.fs-page .delete-icon { color: var(--fs-danger); }`
  - `.fs-page .delete-icon:hover { color: var(--fs-danger-hover); }`
  - `.fs-page .tooltip-container:hover::after { background: var(--fs-surface-raised); color: var(--fs-text); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-md); box-shadow: var(--fs-shadow); font-family: var(--fs-font-sans); }`

### 3.2. Forms (`Form.css` / `.paycheck-form-container`, Controls)
Governed by UI-UX-PLAN §4.6, §6.4, and Reference Frame 02:
- Container & Headings:
  - `.fs-page .paycheck-form-container { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-lg); box-shadow: none; color: var(--fs-text); padding: 2rem; margin: 2rem auto; }`
  - `.fs-page .paycheck-form-container h3 { color: var(--fs-text); font-family: var(--fs-font-sans); font-weight: var(--fs-weight-semibold); }`
  - `.fs-page .form-group label { display: block; color: var(--fs-text-2); font-size: 12px; font-weight: var(--fs-weight-medium); margin-bottom: 0.5rem; }`
- Form Controls (Universal Inputs, Selects, Textareas inside `.fs-page`):
  - `.fs-page .form-group input, .fs-page .form-group select, .fs-page .form-group textarea, .fs-page input[type="text"], .fs-page input[type="number"], .fs-page input[type="email"], .fs-page input[type="password"], .fs-page input[type="date"], .fs-page input[type="time"], .fs-page input[type="datetime-local"] { background: var(--fs-surface); color: var(--fs-text); border: var(--fs-border-width) solid var(--fs-border-control); border-radius: var(--fs-radius-sm); padding: 8px 12px; font-size: 13px; font-family: var(--fs-font-sans); outline: none; width: 100%; box-sizing: border-box; transition: border-color var(--fs-duration-fast) var(--fs-ease-standard); }`
- Focus State:
  - `.fs-page input:focus, .fs-page select:focus, .fs-page textarea:focus, .fs-page .form-group input:focus, .fs-page .form-group select:focus, .fs-page .form-group textarea:focus { outline: var(--fs-focus-ring); outline-offset: var(--fs-focus-offset); border-color: var(--fs-border-strong); box-shadow: none; }`
- Placeholders:
  - `.fs-page input::placeholder, .fs-page textarea::placeholder, .fs-page select::placeholder { color: var(--fs-text-3); opacity: 1; }`
- Disabled State:
  - `.fs-page input:disabled, .fs-page select:disabled, .fs-page textarea:disabled, .fs-page .form-group.disabled { opacity: var(--fs-disabled-opacity); cursor: not-allowed; color: var(--fs-text-4); background: var(--fs-surface-sunken); border-color: var(--fs-border); }`
- Error State:
  - `.fs-page .form-group.has-error input, .fs-page .form-group.has-error select, .fs-page .form-group.has-error textarea, .fs-page input[aria-invalid="true"], .fs-page select[aria-invalid="true"] { border-color: var(--fs-negative); }`
  - `.fs-page .form-error, .fs-page .error-message { color: var(--fs-negative); font-size: 12px; font-weight: var(--fs-weight-medium); margin-top: 4px; }`
- Native Select Options:
  - `.fs-page select option { background: var(--fs-surface); color: var(--fs-text); }`
- Submit Button:
  - `.fs-page .submit-button { background: var(--fs-action-bg); color: var(--fs-action-text); border: var(--fs-border-width) solid transparent; border-radius: var(--fs-radius-sm); font-size: 13px; font-weight: var(--fs-weight-semibold); cursor: pointer; transition: background var(--fs-duration-fast) var(--fs-ease-standard); width: 100%; padding: 10px; }`
  - `.fs-page .submit-button:hover { background: var(--fs-action-hover); color: var(--fs-action-text); }`
  - `.fs-page .submit-button:disabled { opacity: var(--fs-disabled-opacity); cursor: not-allowed; background: var(--fs-surface-sunken); color: var(--fs-text-4); border-color: var(--fs-border); }`

### 3.3. Modals (`Modal.css` & `ConfirmModal.css`)
Governed by UI-UX-PLAN §4.14, §4.16, and §6.4:
- Modal Overlay:
  - `.fs-page .modal-overlay, html[data-fs-theme] .modal-overlay { background: var(--fs-scrim); z-index: var(--fs-z-modal); display: flex; align-items: center; justify-content: center; backdrop-filter: none; -webkit-backdrop-filter: none; }`
- Modal Content:
  - `.fs-page .modal-content, html[data-fs-theme] .modal-content { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-lg); box-shadow: var(--fs-shadow); color: var(--fs-text); max-width: 520px; width: 100%; box-sizing: border-box; }`
- Modal Header:
  - `.fs-page .modal-header, html[data-fs-theme] .modal-header { border-bottom: var(--fs-border-width) solid var(--fs-border); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }`
  - `.fs-page .modal-header h2, html[data-fs-theme] .modal-header h2 { color: var(--fs-text); font-size: var(--fs-text-lg); font-weight: var(--fs-weight-semibold); margin: 0; }`
  - `.fs-page .modal-close-button, html[data-fs-theme] .modal-close-button { color: var(--fs-text-3); font-size: 1.25rem; background: transparent; border: none; cursor: pointer; }`
  - `.fs-page .modal-close-button:hover, html[data-fs-theme] .modal-close-button:hover { color: var(--fs-text); }`
- Modal Body:
  - `.fs-page .modal-body, html[data-fs-theme] .modal-body { color: var(--fs-text); padding: 16px 20px; }`
- ConfirmModal Overlay:
  - `.fs-page .confirm-modal-overlay, html[data-fs-theme] .confirm-modal-overlay { background: var(--fs-scrim); backdrop-filter: none; -webkit-backdrop-filter: none; z-index: var(--fs-z-modal); }`
- ConfirmModal Content:
  - `.fs-page .confirm-modal-content, html[data-fs-theme] .confirm-modal-content { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-lg); box-shadow: var(--fs-shadow); color: var(--fs-text); max-width: 440px; width: 90%; overflow: hidden; }`
- ConfirmModal Header & Body:
  - `.fs-page .confirm-modal-header, html[data-fs-theme] .confirm-modal-header { padding: 1.25rem 1.5rem 0.75rem; border-bottom: var(--fs-border-width) solid var(--fs-border); }`
  - `.fs-page .confirm-modal-title, html[data-fs-theme] .confirm-modal-title { color: var(--fs-text); font-size: 1.125rem; font-weight: var(--fs-weight-semibold); margin: 0; }`
  - `.fs-page .confirm-modal-body, html[data-fs-theme] .confirm-modal-body { padding: 1rem 1.5rem; color: var(--fs-text); }`
  - `.fs-page .confirm-modal-message, html[data-fs-theme] .confirm-modal-message { color: var(--fs-text-2); font-size: 0.95rem; line-height: 1.5; }`
- ConfirmModal Actions & Buttons:
  - `.fs-page .confirm-modal-actions, html[data-fs-theme] .confirm-modal-actions { background: var(--fs-surface-sunken); border-top: var(--fs-border-width) solid var(--fs-border); padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; }`
  - `.fs-page .confirm-modal-btn, html[data-fs-theme] .confirm-modal-btn { border-radius: var(--fs-radius-sm); padding: 0.5rem 1.125rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: 1px solid transparent; }`
  - Cancel Button:
    - `.fs-page .confirm-modal-btn-cancel, html[data-fs-theme] .confirm-modal-btn-cancel { background: var(--fs-surface); border-color: var(--fs-border-control); color: var(--fs-text); }`
    - `.fs-page .confirm-modal-btn-cancel:hover:not(:disabled), html[data-fs-theme] .confirm-modal-btn-cancel:hover:not(:disabled) { background: var(--fs-surface-raised); border-color: var(--fs-border-strong); }`
  - Primary Confirm Button:
    - `.fs-page .confirm-modal-btn-primary, html[data-fs-theme] .confirm-modal-btn-primary { background: var(--fs-action-bg); color: var(--fs-action-text); border-color: var(--fs-action-bg); }`
    - `.fs-page .confirm-modal-btn-primary:hover:not(:disabled), html[data-fs-theme] .confirm-modal-btn-primary:hover:not(:disabled) { background: var(--fs-action-hover); border-color: var(--fs-action-hover); }`
  - Danger Confirm Button:
    - `.fs-page .confirm-modal-btn-danger, html[data-fs-theme] .confirm-modal-btn-danger { background: var(--fs-danger); color: var(--fs-ink); border-color: var(--fs-danger); }`
    - `.fs-page .confirm-modal-btn-danger:hover:not(:disabled), html[data-fs-theme] .confirm-modal-btn-danger:hover:not(:disabled) { background: var(--fs-danger-hover); border-color: var(--fs-danger-hover); }`
    - *(Contrast verified per B3: `--fs-ink` `#0d0e10` on `--fs-danger` `#d97076` = 6.00:1 per §4.9.1; on `--fs-danger-hover` `#c36066` = 4.77:1 per §4.9.1 after v10.3 amendment. Both above 4.5:1 threshold.)*

### 3.4. Banners & Protected Actions (`ViewOnlyBanner.css` & `ProtectedAction.css`)
- `.fs-page .view-only-banner, html[data-fs-theme] .view-only-banner { background: var(--fs-surface-raised); border-bottom: var(--fs-border-width) solid var(--fs-border); color: var(--fs-warning); font-size: 0.875rem; font-weight: 500; backdrop-filter: none; -webkit-backdrop-filter: none; z-index: var(--fs-z-nav); }`
- `.fs-page .view-only-banner .view-only-icon, html[data-fs-theme] .view-only-banner .view-only-icon { color: var(--fs-warning); }`
- `.fs-page .view-only-banner strong, html[data-fs-theme] .view-only-banner strong { color: var(--fs-warning); font-weight: var(--fs-weight-semibold); }`
- `.fs-page .protected-action-wrapper { display: inline-flex; align-items: center; vertical-align: middle; position: relative; }`
- `.fs-page .protected-action-wrapper > * { opacity: var(--fs-disabled-opacity); }`

### 3.5. Pagination Controls (`PaginationControls.css`)
- `.fs-page .pagination-container { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem; }`
- `.fs-page .pagination-container button { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border-control); color: var(--fs-text); border-radius: var(--fs-radius-sm); padding: 0.5rem 1rem; font-size: 13px; cursor: pointer; transition: background var(--fs-duration-fast) var(--fs-ease-standard); }`
- `.fs-page .pagination-container button:hover:not(:disabled) { background: var(--fs-surface-raised); border-color: var(--fs-border-strong); }`
- `.fs-page .pagination-container button:disabled { background: var(--fs-surface-sunken); color: var(--fs-text-4); border-color: var(--fs-border); cursor: not-allowed; }`
- `.fs-page .pagination-container span { color: var(--fs-text-3); font-size: 13px; font-weight: 500; }`

### 3.6. Summary Row (`SummaryRow.css`)
- `.fs-page .summary-row { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-md); padding: 1.5rem; margin-bottom: 2rem; }`
- `.fs-page .summary-item h4 { color: var(--fs-text-2); border-bottom: var(--fs-border-width) solid var(--fs-border); font-size: 14px; font-weight: 600; padding-bottom: 0.5rem; margin-bottom: 1rem; }`
- `.fs-page .grand-total p { color: var(--fs-text); font-size: 2rem; font-weight: bold; font-variant-numeric: tabular-nums; margin: 0; }`
- `.fs-page .period-item { background: var(--fs-surface-raised); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-sm); padding: 1rem; box-shadow: none; }`
- `.fs-page .period-item strong { color: var(--fs-text); }`
- `.fs-page .period-change > .change-positive { color: var(--fs-positive); }`
- `.fs-page .period-change > .change-negative { color: var(--fs-negative); }`
- `.fs-page .period-change > .change-neutral { color: var(--fs-text-3); }`

### 3.7. Analysis Card (`AnalysisCard.css`)
- `.fs-page .analysis-card { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-md); box-shadow: none; padding: 2rem; margin-bottom: 2rem; color: var(--fs-text); }`
- `.fs-page .analysis-card h2 { color: var(--fs-text); font-size: 1.25rem; font-weight: 600; text-align: center; margin-bottom: 1.5rem; }`
- `.fs-page .stat-item h4 { color: var(--fs-text-3); font-size: 13px; margin-bottom: 0.5rem; }`
- `.fs-page .stat-item p { color: var(--fs-text); font-size: 1.5rem; font-weight: bold; font-variant-numeric: tabular-nums; }`
- `.fs-page .chart-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }`

### 3.8. Salary Component Table (`ComponentTable.css`)
- `.fs-page .component-table-wrapper { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-md); padding: 1.25rem; margin-bottom: 1.5rem; }`
- `.fs-page .component-table-heading { color: var(--fs-text); font-size: 1.1rem; font-weight: 600; }`
- `.fs-page .component-count-badge { background: var(--fs-surface-raised); color: var(--fs-text-3); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-pill); font-size: 0.75rem; padding: 2px 8px; font-weight: 600; }`
- `.fs-page .add-component-btn, .fs-page .add-first-component-btn { background: var(--fs-action-bg); color: var(--fs-action-text); border: var(--fs-border-width) solid var(--fs-action-bg); border-radius: var(--fs-radius-sm); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background var(--fs-duration-fast) var(--fs-ease-standard); }`
- `.fs-page .add-component-btn:hover, .fs-page .add-first-component-btn:hover { background: var(--fs-action-hover); border-color: var(--fs-action-hover); }`
- `.fs-page .component-empty-state { background: var(--fs-surface-sunken); border: var(--fs-border-width) dashed var(--fs-border); border-radius: var(--fs-radius-sm); color: var(--fs-text-3); text-align: center; padding: 2rem 1rem; }`
- `.fs-page .custom-component-table th { background: var(--fs-surface-sunken); color: var(--fs-text-3); border-bottom: var(--fs-border-width) solid var(--fs-border); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }`
- `.fs-page .custom-component-table td { border-bottom: var(--fs-border-width) solid var(--fs-border); color: var(--fs-text); padding: 0.65rem 0.75rem; }`
- `.fs-page .custom-component-table tr:hover td { background: var(--fs-surface-raised); }`
- `.fs-page .custom-component-table tr.row-deduction td { background: var(--fs-surface-sunken); }` (replaces legacy `#fff1f2` pink tint with surface step)
- `.fs-page .component-input, .fs-page .component-select { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border-control); border-radius: var(--fs-radius-sm); color: var(--fs-text); font-size: 0.9rem; padding: 0.45rem 0.65rem; }`
- `.fs-page .component-checkbox { appearance: none; -webkit-appearance: none; width: 16px; height: 16px; background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border-control); border-radius: var(--fs-radius-sm); cursor: pointer; }`
- `.fs-page .component-checkbox:checked { background: var(--fs-accent); border-color: var(--fs-accent); }`
- `.fs-page .remove-component-btn { background: transparent; border: none; color: var(--fs-danger); cursor: pointer; border-radius: var(--fs-radius-sm); }`
- `.fs-page .remove-component-btn:hover { background: var(--fs-surface-raised); color: var(--fs-danger-hover); }`

### 3.9. App Launcher (`AppLauncher.css`)
- `.fs-page .launcher-backdrop, html[data-fs-theme] .launcher-backdrop { background: var(--fs-scrim); backdrop-filter: none; -webkit-backdrop-filter: none; z-index: var(--fs-z-modal); }`
- `.fs-page .launcher-panel, html[data-fs-theme] .launcher-panel { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-lg); box-shadow: var(--fs-shadow); color: var(--fs-text); max-height: 84vh; width: min(880px, 100%); overflow: hidden; }`
- `.fs-page .launcher-header, html[data-fs-theme] .launcher-header { padding: 20px 24px 16px; border-bottom: var(--fs-border-width) solid var(--fs-border); }`
- `.fs-page .launcher-mark, html[data-fs-theme] .launcher-mark { background: var(--fs-action-bg); color: var(--fs-action-text); border-radius: var(--fs-radius-md); box-shadow: none; }`
- `.fs-page .launcher-heading h2, html[data-fs-theme] .launcher-heading h2 { color: var(--fs-text); }`
- `.fs-page .launcher-heading p, html[data-fs-theme] .launcher-heading p { color: var(--fs-text-3); }`
- `.fs-page .launcher-close, html[data-fs-theme] .launcher-close { background: var(--fs-surface-raised); border: var(--fs-border-width) solid var(--fs-border-control); border-radius: var(--fs-radius-sm); color: var(--fs-text-3); }`
- `.fs-page .launcher-close:hover, html[data-fs-theme] .launcher-close:hover { color: var(--fs-text); }`
- `.fs-page .launcher-tabs, html[data-fs-theme] .launcher-tabs { border-bottom: var(--fs-border-width) solid var(--fs-border); }`
- `.fs-page .launcher-tab, html[data-fs-theme] .launcher-tab { color: var(--fs-text-3); font-family: var(--fs-font-sans); border-bottom: 2px solid transparent; }`
- `.fs-page .launcher-tab:hover, html[data-fs-theme] .launcher-tab:hover { color: var(--fs-text); }`
- `.fs-page .launcher-tab.active, html[data-fs-theme] .launcher-tab.active { color: var(--fs-text); border-bottom-color: var(--fs-accent); }`
- `.fs-page .launcher-tab-count, html[data-fs-theme] .launcher-tab-count { background: var(--fs-surface-raised); color: var(--fs-text-3); border-radius: var(--fs-radius-pill); }`
- `.fs-page .launcher-search input, html[data-fs-theme] .launcher-search input { background: var(--fs-surface); border: var(--fs-border-width) solid var(--fs-border-control); color: var(--fs-text); border-radius: var(--fs-radius-sm); }`
- `.fs-page .launcher-action, html[data-fs-theme] .launcher-action { background: var(--fs-surface-raised); border: var(--fs-border-width) solid var(--fs-border); border-radius: var(--fs-radius-md); color: var(--fs-text); }`
- `.fs-page .launcher-action:hover, html[data-fs-theme] .launcher-action:hover { background: var(--fs-surface-sunken); border-color: var(--fs-border-control); }`
- `.fs-page .launcher-action-copy strong { color: var(--fs-text); }`
- `.fs-page .launcher-action-copy small { color: var(--fs-text-3); }`
- `.fs-page .launcher-footer, html[data-fs-theme] .launcher-footer { background: var(--fs-surface-sunken); border-top: var(--fs-border-width) solid var(--fs-border); color: var(--fs-text-3); }`

### 3.10. Data Loader Colour Inheritance (`components/DataLoader.js`, B5)
Narrowed scope strictly for Phase 2D:
- In [`frontend/src/components/DataLoader.js`](file:///d:/Projects/FinStat/frontend/src/components/DataLoader.js):
  - Replace `stroke="#3b82f6"` with `stroke="currentColor"` on the SVG progress circle.
  - Replace `backgroundColor: '#3b82f6'` with `backgroundColor: 'currentColor'` on the bouncing dots inline styles.
- *Note: All loading standardization, `.loading-spinner` refactoring, Suspense fallbacks, and page migrations are deferred to Sub-phase 2F.*

---

## 4. Specificity & Cascade Verification Strategy (R27)

### 4.1. Specificity Hierarchy Analysis
| Legacy Selector | Legacy Specificity | Phase 2D Override Selector | Override Specificity | Status / Result |
| :--- | :---: | :--- | :---: | :--- |
| `.styled-table` | `0,1,0` | `.fs-page .styled-table` | `0,2,0` | **Override Wins** unconditionally |
| `.styled-table thead tr` | `0,1,2` | `.fs-page .styled-table thead tr` | `0,2,2` | **Override Wins** unconditionally |
| `.styled-table th` | `0,1,1` | `.fs-page .styled-table th` | `0,2,1` | **Override Wins** unconditionally |
| `.styled-table tbody tr:nth-of-type(even)` | `0,2,1` | `.fs-page .styled-table tbody tr:nth-of-type(even)` | `0,3,1` | **Override Wins** unconditionally |
| `.styled-table tbody tr:hover` | `0,2,1` | `.fs-page .styled-table tbody tr:hover` | `0,3,1` | **Override Wins** unconditionally |
| `.paycheck-form-container` | `0,1,0` | `.fs-page .paycheck-form-container` | `0,2,0` | **Override Wins** unconditionally |
| `.form-group input` | `0,1,1` | `.fs-page .form-group input` | `0,2,1` | **Override Wins** unconditionally |
| `.form-group input:focus` | `0,2,1` | `.fs-page .form-group input:focus` | `0,3,1` | **Override Wins** unconditionally |
| `.modal-overlay` | `0,1,0` | `html[data-fs-theme] .modal-overlay` | `0,2,1` | **Override Wins** unconditionally |
| `.modal-content` | `0,1,0` | `html[data-fs-theme] .modal-content` | `0,2,1` | **Override Wins** unconditionally |
| `.confirm-modal-overlay` | `0,1,0` | `html[data-fs-theme] .confirm-modal-overlay` | `0,2,1` | **Override Wins** unconditionally |
| `.confirm-modal-content` | `0,1,0` | `html[data-fs-theme] .confirm-modal-content` | `0,2,1` | **Override Wins** unconditionally |
| `.summary-row` | `0,1,0` | `.fs-page .summary-row` | `0,2,0` | **Override Wins** unconditionally |
| `.analysis-card` | `0,1,0` | `.fs-page .analysis-card` | `0,2,0` | **Override Wins** unconditionally |
| `.component-table-wrapper` | `0,1,0` | `.fs-page .component-table-wrapper` | `0,2,0` | **Override Wins** unconditionally |
| `.launcher-panel` | `0,1,0` | `html[data-fs-theme] .launcher-panel` | `0,2,1` | **Override Wins** unconditionally |

Because `theme-components.css` is imported after `theme.css` and `index.css`, and every override selector carries higher specificity than its un-scoped legacy counterpart, every override wins in the cascade without requiring `@layer` or modifications to shared legacy CSS files.

### 4.2. Dual-Mode Computed Style Verification Test Harness & Dedicated Project (B4, W2, W3)
To satisfy Exit Gate 2D ("verify each override wins in the browser, not just in source order: inspect the computed style"), we configure a dedicated Playwright project `shared` in [`frontend/playwright.config.js`](file:///d:/Projects/FinStat/frontend/playwright.config.js):

```javascript
{
  name: 'shared',
  dependencies: ['setup'],
  testMatch: /shared-components\.spec\.js/,
}
```

Fixtures are rendered via static HTML at `frontend/tests/visual/fixtures/shared/*.html`, served by the existing `http-server` on port 3001 (same proven architecture as reference frames in 2A, introducing zero production code changes). Each fixture renders the component's DOM structure:
- **Legacy Context**: renders the component without `.fs-page` and without `data-fs-theme`.
- **Themed Context**: wraps the component in `<div class="fs-page">` inside `<html data-fs-theme="dark">`.

The test file [`frontend/tests/visual/shared-components.spec.js`](file:///d:/Projects/FinStat/frontend/tests/visual/shared-components.spec.js) will:
1. Load fixtures for Table, Form, Modal, ConfirmModal, SummaryRow, AnalysisCard, and ComponentTable across both contexts.
2. Programmatically query `window.getComputedStyle(element)` to assert:
   - Header background resolves to `--fs-surface-sunken` (not `#009879`).
   - Zebra row resolves to `--fs-surface-sunken` (not `#f3f3f3`).
   - Modal background resolves to `--fs-surface` (not `#ffffff`).
   - Modal border-radius resolves to `8px` / `var(--fs-radius-lg)` (not `12px`).
   - Modal overlay resolves to `--fs-scrim` (not `rgba(0, 0, 0, 0.6)`).
   - ConfirmModal `backdrop-filter` resolves to `none` (not `blur(2px)`).
   - Form input border resolves to `var(--fs-border-control)` (not `#ccc`).
   - Submit button background resolves to `var(--fs-action-bg)` (not `#009879`).
3. Capture screenshot evidence for both legacy and dark themed states of each component and save to `frontend/tests/visual/output/phase-2d/`.

In addition, DataLoader colour inheritance is verified through two mechanisms (W2):
1. **Jest Unit Test** in [`frontend/src/components/__tests__/DataLoader.test.js`](file:///d:/Projects/FinStat/frontend/src/components/__tests__/DataLoader.test.js) asserting that `<DataLoader />` renders circular progress SVG circle with `stroke="currentColor"` and bouncing dots with `backgroundColor: 'currentColor'`.
2. **Grep Assertion** proving no `#3b82f6` remains: `git grep -n "#3b82f6" frontend/src/components/DataLoader.js` (exit code 1, 0 matches).

---

## 5. Step-by-Step Execution Plan

### Step 1 — Branch Creation
- Verify `main` is clean.
- Create git branch `phase-ui-2d-shared-components`.

### Step 2 — Table Overrides in `theme-components.css`
- Author `.fs-page .styled-table` and related table selectors in [`frontend/src/styles/theme-components.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css) using plain expanded CSS.
- Validate syntax using `npx stylelint "src/styles/theme-components.css"`.

### Step 3 — Form Overrides in `theme-components.css`
- Author `.fs-page .paycheck-form-container`, `.form-group`, universal input/select/textarea, focus rings, disabled, and error rules using plain expanded CSS.
- Validate syntax using `npx stylelint "src/styles/theme-components.css"`.

### Step 4 — Modal & ConfirmModal Overrides in `theme-components.css`
- Author `.modal-overlay`, `.modal-content`, `.confirm-modal-overlay`, `.confirm-modal-content`, buttons, and header rules under `.fs-page` and `html[data-fs-theme]`.
- Use `--fs-danger-hover` (`#c36066`) for destructive button hover.
- Ensure radius is capped to `var(--fs-radius-lg)` (8px ceiling).
- Ensure `backdrop-filter: none;` eliminates legacy blurs.
- Validate syntax using `npx stylelint "src/styles/theme-components.css"`.

### Step 5 — Banners, Pagination, Summary, Cards, ComponentTable, AppLauncher Overrides
- Author `.view-only-banner`, `.protected-action-wrapper`, `.pagination-container`, `.summary-row`, `.analysis-card`, `.component-table-wrapper`, and `.launcher-*` rules.
- Replace all gradients and blurs with solid surfaces and tokens.
- Validate syntax using `npx stylelint "src/styles/theme-components.css"`.

### Step 6 — `DataLoader.js` Colour Inheritance (B5)
- In [`frontend/src/components/DataLoader.js`](file:///d:/Projects/FinStat/frontend/src/components/DataLoader.js), update the SVG circle stroke to `currentColor` and bouncing dots background to `currentColor`.

### Step 7 — Configure Playwright `shared` Project & Author Verification Test (B4)
- Add `shared` project to `frontend/playwright.config.js`.
- Author [`frontend/tests/visual/shared-components.spec.js`](file:///d:/Projects/FinStat/frontend/tests/visual/shared-components.spec.js) to assert computed styles and capture screenshot evidence.
- Execute the test: `npx playwright test --project=shared`.

### Step 8 — Lint, Token & Token Sync Checks (B6)
- Check `--fs-danger-hover` in tokens.css: `git grep "fs-danger-hover" frontend/src/styles/tokens.css` (Expected: `--fs-danger-hover: #c36066;`).
- Check token drift: `node frontend/scripts/tokens.js --check` (0 drift).
- Check `--fs-danger-hover` usage in theme-components.css: `git grep "fs-danger-hover" frontend/src/styles/theme-components.css` (Expected: token referenced, no hardcoded hex).
- Run tone scoping and undefined token check: `node frontend/scripts/lint-tones.js` (0 violations).
- Run stylelint ratchet: `node frontend/scripts/lint-ratchet.js` (0 regressions).
- Run stylelint on updated CSS: `npx stylelint "src/styles/theme-components.css" "src/styles/theme.css"`.

### Step 9 — Full Verification Suite (Exit Gate 2D)
Execute the complete verification suite in order:
1. Tokens check: `node frontend/scripts/tokens.js --check` (0 drift)
2. Tone lint check: `node frontend/scripts/lint-tones.js` (0 violations)
3. Ratchet check: `node frontend/scripts/lint-ratchet.js` (0 regressions)
4. Stylelint: `npx stylelint "src/styles/theme-components.css" "src/styles/theme.css"` (0 errors)
5. Shared component computed styles: `npx playwright test --project=shared` (all pass)
6. Reference frames suite: `npx playwright test --project=reference` (3/3 pass, 0 diff)
7. Shell visual suite: `npx playwright test --project=shell` (7/7 pass, 0 diff)
8. Full visual regression suite: `npx playwright test --project=visual` (326/326 pass, 0 diff)
9. Baseline manifest verification: `node frontend/scripts/verify-baseline-manifest.js` (334/334 pass)
10. Jest unit test suite: `npm test -- --watchAll=false` (49 suites, 314 tests pass)

### Step 10 — Documentation, Walkthrough Artifact & Mirror
- Prepare `phase_2d_walkthrough.md` with:
  - Exact command outputs from all verification tools.
  - Computed style inspection tables proving that `.fs-page` overrides defeat legacy rules.
  - Visual screenshots comparing legacy vs dark themed shared components.
- Mirror walkthrough artifact to `docs/ui-plans/phase_2d_walkthrough.md`.
- Update `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.1, §6.6, and §10 progress log.

---

## 6. Verification Plan & Exit Gate 2D Checklist

| Verification Item | Command / Check | Expected Result |
| :--- | :--- | :--- |
| **Constraint E1 Compliance** | `git diff --name-only main` | Only `theme-components.css`, `DataLoader.js`, `playwright.config.js`, and test specs modified; zero legacy shared files touched |
| **Tokens Drift** | `node frontend/scripts/tokens.js --check` | 0 drift |
| **`--fs-danger-hover` in tokens.css** | `git grep "fs-danger-hover" frontend/src/styles/tokens.css` | `--fs-danger-hover: #c36066;` present |
| **`--fs-danger-hover` in theme-components** | `git grep "fs-danger-hover" frontend/src/styles/theme-components.css` | Token referenced, no raw hex |
| **Tone Linting** | `node frontend/scripts/lint-tones.js` | 0 violations, 0 undefined tokens |
| **Stylelint Ratchet** | `node frontend/scripts/lint-ratchet.js` | 0 regressions against merge-base |
| **Stylelint Syntax** | `npx stylelint "src/styles/theme-components.css"` | 0 errors |
| **Shared Computed Styles** | `npx playwright test --project=shared` | All assertions pass (overrides win in browser) |
| **Reference Frames** | `npx playwright test --project=reference` | 3/3 pass, 0 diff |
| **Shell Visual** | `npx playwright test --project=shell` | 7/7 pass, 0 diff |
| **Full Visual Regression** | `npx playwright test --project=visual` | 326/326 pass, 0 diff (**Invariant I13**) |
| **Manifest Integrity** | `node frontend/scripts/verify-baseline-manifest.js` | 334/334 valid entries, 0 missing |
| **Jest Unit Tests** | `npm test -- --watchAll=false` | 49 suites, 314 tests pass |
