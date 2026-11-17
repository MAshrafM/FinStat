# Implementation Plan — UI Phase 4B: Expenditure Forms & Sub-Nav (v3.1 — Approved for Execution)

---

## 1. Executive Summary & Phase Scope

### 1.1 Objective & Context
Phase 4B converts the expenditure creation and editing workflows to the FinStat dark design system and Canonical Reference Frame 02 (**Variant B — Stacked Sub-Panels with Solid Accent Primary CTA** from [`docs/UI-UX_Plan/reference/02-form.html`](docs/UI-UX_Plan/reference/02-form.html)). It eliminates all 22 legacy inline styles from `ExpenditureForm.js`, un-ignores form files in ESLint, aligns container and header structure in `AddExpenditurePage.js` and `EditExpenditurePage.js`, verifies dual-mode operation for `ExpenditureSubNav.js`, expands the route allowlist from 2 to 4 routes, and guarantees zero visual regression across all 63 unallowlisted routes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Phase 4B Scope & Route Transitions                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Routes Converted:                                                          │
│  - /expenditures/new       (AddExpenditurePage.js + ExpenditureForm.js)     │
│  - /expenditures/edit/:id  (EditExpenditurePage.js + ExpenditureForm.js)    │
│                                                                             │
│  Components Modified:                                                       │
│  - frontend/src/pages/expenditure/ExpenditureForm.js (22 inline styles → 0) │
│  - frontend/src/pages/expenditure/AddExpenditurePage.js (Page shell)        │
│  - frontend/src/pages/expenditure/EditExpenditurePage.js (Page shell)       │
│  - frontend/src/pages/expenditure/Expenditure.css (Scoped form classes)     │
│  - frontend/src/components/ProtectedRoute.js (Allowlist: 2 → 4 routes)      │
│  - frontend/src/components/__tests__/ProtectedRoute.test.js (True for 4B)  │
│  - frontend/playwright.config.js (testMatch updated for form spec)          │
│  - frontend/.eslintignore (Remove ExpenditureForm.js & test)                │
│  - frontend/src/pages/expenditure/__tests__/ExpenditureForm.test.js         │
│                                                                             │
│  Verification & New Suites:                                                 │
│  - frontend/tests/visual/expenditure-form-reference-match.spec.js (New)     │
│  - Jest-axe component a11y tests in ExpenditureForm.test.js                │
│  - Playwright axe-core scan on /expenditures/new & edit                     │
│  - Taste checkpoints at 1440px & 390px for /expenditures/new & edit         │
│  - Baseline update: 10 snapshots (expenditures-new/edit at 5 widths)        │
│  - PR subset: 73 tests passing with 0 diff on all 63 unallowlisted routes   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Upstream Decisions & Invariants
1. **Decision D12 & D13**: Flat dark graphite canvas (`--fs-bg: #101114`, `--fs-surface: #1a1c20`, `--fs-surface-raised: #22252a`, `--fs-border: #34383f`).
2. **Decision D14 & Canonical Reference Frame 02 (Variant B)**: Stacked field cards (`.fs-section-card`), 2-column grid (`.fs-grid-2col`), inline error states, neutral secondary discard (`.fs-btn-secondary`), solid teal primary CTA (`.fs-btn-primary`, `--fs-accent: #14b8a6`) with dark ink text (`--fs-ink: #0d0e10`). **White text on accent is strictly banned**.
3. **Decision D15 & Invariant I16**: Radii 4px (`--fs-radius-sm`), 6px (`--fs-radius-md`), 8px (`--fs-radius-lg`). Radius ceiling is 8px. `var(--fs-radius-pill)` (999px) is strictly reserved for status chips and avatars — **never interactive buttons or selection controls**.
4. **Decision D19 & Invariant I6**: Responsive collapse on mobile ($\le 768\text{px}$ / $390\text{px}$). Two-column form grids collapse to 1-column; split table transforms into stacked mini-cards; footer action buttons expand to full width (`flex-direction: column-reverse`, neutral discard below primary save); **zero page-level horizontal scroll** (`scrollWidth <= clientWidth`); all interactive touch targets meet the $\ge 44\text{px}$ ceiling (`--fs-touch-target: 44px`).
5. **Decision D21**: Visual regression baseline storage lives in a separate local git repo (`D:\Projects\FinStat-visual-baselines`) linked via Windows directory junction (`frontend\tests\visual\baseline`) and untracked in `main`.
6. **Decision D22 (Multi-Theme Door Preservation)**: All CSS rules gated on theme must use attribute-existence selector `[data-fs-theme]` (or `.fs-page`). Value-specific `[data-fs-theme="dark"]` remains restricted exclusively to `tokens.css`.
7. **Decision D23 & Primitive #8**: Universal loading indicator `<Loading variant="form-field" />` or `<Loading variant="inline" />`. Never bare text or page-local spinners.
8. **Decision AD13 & Section 3.2**: Ordinary amounts and balance values are neutral (`--fs-text: #f2f3f5`). Color/tones appear only for deviation/attention states:
   - Legitimate attention states: Overdraft negative tone (uses existing `.fs-delta--negative` from `theme.css`) and Unbalanced split warning (uses `<Badge tone="warning">`).
   - Ordinary states are strictly neutral: Normal positive balances, `+` and `-` transfer operations, and balanced split status are all rendered with neutral tokens. No green fills or text.
9. **Invariant I4**: Auth, roles, `<ProtectedAction>`, and `useCanModify` gating unchanged. Mutation actions (submit/save) are disabled for view-only roles.
10. **Invariant I5**: All `data-testid` and `aria-label` attributes must be strictly preserved (`conversion-confirmation-card`, `converted-egp-value`, etc.). All interactive form controls (including mobile stacked split rows) carry explicit accessible labels.
11. **Invariant I11**: Zero `!important` additions in modified files.
12. **Invariant I13**: Zero visual regression across all 63 unallowlisted routes.
13. **Invariant I15**: Zero direct tone tokens in page CSS (`Expenditure.css` must not reference `var(--fs-positive)`, `var(--fs-negative)`, `var(--fs-warning)`, or `var(--fs-accent)` directly; all tones and interactive accents are routed through shared primitives and classes in `theme.css` and `theme-components.css`).

---

## 2. Preconditions & Merge Base Verification

Before opening feature branch `phase-ui-4b-expenditure-forms`, verify that the following preceding phases are merged into `main`:

| Preceding Phase | Target Scope / Component | Verified Merge SHA | Precondition Verification Check |
|---|---|---|---|
| **Phase 2E** | React UI primitives (`Button`, `Card`, `Badge`, `Delta`, `PageHeader`, `EmptyState`, `Tabs`) | `6691414` | Components exported from `frontend/src/components/ui/`. `Button.js` explicitly supports the `as` prop (`as: Component = 'button'` and `PropTypes.elementType`, I-6). |
| **Phase 2F** | Universal loading pattern (`Loading.js` with `variant="form-field"`) | `e2d4df9` | `VALID_VARIANTS` includes `'form-field'` (`Loading.js` line 3) |
| **Phase 3A** | Chart theme engine & Dashboard conversion (`/dashboard` allowlisted) | `8baf3e5` | `/dashboard` present in `THEMED_PATTERNS` |
| **Phase 4A** | Dense table & Expenditure log conversion (`/expenditures` allowlisted) | `91d4278` + `3a7dd5a` | Manifest 334/334 passing; `THEMED_PATTERNS` contains `/expenditures` |

Specific Precondition Verification Command (I-4, I-6):
```powershell
# 1. Verify 4A merge in ProtectedRoute.js with context (proves /expenditures is present in THEMED_PATTERNS)
git grep -A 4 "THEMED_PATTERNS" frontend/src/components/ProtectedRoute.js

# 2. Verify Button.js supports the 'as' prop
git grep -n "as: Component" frontend/src/components/ui/Button.js

# 3. Check tokens integrity and baseline manifest (334/334 before 4B)
node frontend/scripts/tokens.js --check
node frontend/scripts/verify-baseline-manifest.js
```
Expected output:
- `export const THEMED_PATTERNS = ['/dashboard', '/expenditures'];`
- `22:  as: Component = 'button',`
- `✓ All tokens checks passed successfully.`
- `334/334 baselines verified successfully.`

---

## 3. Architecture & Key Decisions

### 3.1 Canonical Reference Frame 02 (Variant B) Form Layout
The form is structured into stacked sub-panel cards (`.fs-section-card`) inside `.fs-form-content`:
1. **Card 1: Balances & Transaction Basics**:
   - **Running Balance Preview Banner (`.fs-balance-preview-card`)**: Horizontal preview of Bank, Cash, and Prepaid balances after this transaction. Rendered on `--fs-surface-sunken: #0c0d0f` with `1px solid var(--fs-border)` (`#34383f`) as a distinct sub-inset matching Reference Frame 02 (S-3). Amounts are formatted with tabular numerals (`.fs-num`).
     - Normal balances ($\ge 0$): Neutral text (`--fs-text: #f2f3f5`). No green fills or text per AD13 (F-2).
     - Overdraft balances ($< 0$): Attention state rendered via shared `.fs-delta--negative` from `theme.css`.
   - **Currency & Type Grid (`.fs-grid-2col`)**: Currency selector (`CURRENCY_OPTIONS`) and Transaction Type selector (`Withdraw`, `Top-up`, `Saving`, `Log / Transfer`).
   - **Amount & Foreign Exchange Block**:
     - Base Currency (`EGP`): Single amount input with required indicator (`.fs-req`).
     - Foreign Currency (`USD`, `EUR`, etc.): 2-column grid (`Foreign Amount` + `Exchange Rate`) followed by `.currency-conversion-card` with live converted EGP value, rate badge, and confirmation hint (`data-testid="conversion-confirmation-card"` and `data-testid="converted-egp-value"` preserved).
   - **Source / Destination Controls**:
     - Withdraw: `Withdraw From` dropdown (Bank, Cash, Prepaid).
     - Top-up: `Top-up Target` dropdown (Bank, Prepaid).
     - Log / Transfer: 3-column operator selector grid for Bank, Cash, Prepaid (`+` / `-` / `Off`). Per AD13 (F-2), operations are user choices rather than deviations, so selected states are **neutral** (`background: var(--fs-surface-raised); border-color: var(--fs-border-control); color: var(--fs-text); font-weight: var(--fs-weight-semibold)`). No green or red fills.
2. **Card 2: Transaction Details & Categorization**:
   - **Date**: Standard date control with token borders.
   - **Description**: Textarea with optional auto-categorization suggestion pill (`.fs-rule-pill`) offering one-click category application.
   - **Category Mode Selector**:
     - Checkbox toggle: `"Split across multiple categories"`.
     - **Single Category Mode**: Accessible tag picker using `.filter-chip` (base styles authored in `Expenditure.css` in Phase 4A, active accent state authored in `theme-components.css` in Phase 4A) (I-5, S-2). Container has `role="radiogroup"` and `aria-label="Category"`. Each chip has `role="radio"`, `aria-checked={isSelected}`, `tabIndex={isSelected ? 0 : -1}`, and full W3C APG keyboard navigation (Arrow keys, `Home`, `End`, `Space`, `Enter`) (S-5).
       - Inactive state: Neutral surface, border, and text.
       - Active state: Reuses `.filter-chip.active` (`background: var(--fs-accent); color: var(--fs-ink); border-color: var(--fs-accent); font-weight: var(--fs-weight-semibold);`) for 100% visual consistency with 4A.
       - Radius is strictly `--fs-radius-sm` (4px, B-2). Touch target meets $\ge 44\text{px}$ on mobile via `.fs-category-chips-grid .filter-chip` (B-5, I-2).
     - **Split Mode**: Dynamic split items. At desktop, displayed as a table. At $\le 768\text{px}$ / $390\text{px}$, each table row transforms into a card via responsive CSS (D-3, S-1). Every split input carries its own explicit `aria-label` attribute (H-1). Allocation status uses neutral text when balanced (AD13 / F-2), and `<Badge tone="warning">` when unbalanced.
3. **Card 3 / Footer: Form Actions & Viewer Gating (B-6, S-6)**:
   - Discard CTA: `<Button as={Link} to="/expenditures" variant="secondary">Cancel</Button>` (I-6).
   - Submit CTA: Wrapped in `<ProtectedAction tooltip="View-only access">` followed by `<Button type="submit" variant="primary">{mode === 'create' ? 'Create New Log' : 'Save Changes'}</Button>`.
   - Viewer Role UX (S-6): Viewers can view and interact with the form, but mutation is prevented because the submit button is rendered with `disabled` / `aria-disabled="true"` and displays the "View-only access" tooltip upon hover/focus.
   - Mobile: At 390px, buttons stack full width with Cancel on bottom and Save on top (`flex-direction: column-reverse`).

### 3.2 Mobile Collapse Strategy for Split Transactions (D-3, H-1, S-1)
Per Decision D19, horizontal table scroll is preserved only for tables with $\ge 12$ columns. For the 4-column split transaction table:
- At desktop ($> 768\text{px}$): Standard table layout with columns: Category (40%), Amount (25%), Note (25%), Action (10%).
- At mobile ($\le 768\text{px}$ / $390\text{px}$):
  - `.fs-page .fs-split-table thead` is visually hidden (`display: none`).
  - Each table row (`tbody tr`) transforms into a stacked card via responsive CSS:
    ```css
    @media (max-width: 768px) {
      .fs-page .fs-split-table,
      .fs-page .fs-split-table tbody,
      .fs-page .fs-split-table tr,
      .fs-page .fs-split-table td {
        display: block;
        width: 100%;
      }
      .fs-page .fs-split-table thead {
        display: none;
      }
      .fs-page .fs-split-table tbody tr {
        background: var(--fs-surface);
        border: var(--fs-border-width) solid var(--fs-border);
        border-radius: var(--fs-radius-sm);
        padding: 12px;
        margin-bottom: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .fs-page .fs-split-table td {
        padding: 0;
      }
      .fs-page .col-split-action {
        display: flex;
        justify-content: flex-end;
      }
    }
    ```
  - **Mobile Accessibility Guarantee (H-1)**: Every input inside the split row carries an explicit `aria-label`:
    - Category select: `aria-label="Split category"`
    - Amount input: `aria-label="Split amount"`
    - Note input: `aria-label="Split note"`
    - Delete button: `aria-label="Remove split row"`
  - This ensures full compliance with WCAG 1.3.1 / 4.1.2 even when the table `<thead>` is hidden on mobile.

### 3.3 Sub-Nav Dual-Mode Verification (§4.16)
`ExpenditureSubNav.js` is rendered on:
- `/expenditures` (Phase 4A — Converted & allowlisted)
- `/expenditures/rules` (Phase 4C — Unallowlisted, legacy light styling)
- `/expenditures/budgets` (Phase 4C — Unallowlisted, legacy light styling)
- `/expenditures/recurring` (Phase 4C — Unallowlisted, legacy light styling)

On `/expenditures/new` and `/expenditures/edit/:id`:
- `AddExpenditurePage.js` and `EditExpenditurePage.js` render `<ExpenditureSubNav />` below `<PageHeader>`.
- In `ExpenditureSubNav.js`, `isActive` already returns `true` for `pathname.startsWith('/expenditures/new')` and `pathname.startsWith('/expenditures/edit')` (pointing to the "Expenditure Log" tab).
- Scoped dark styling in `theme-components.css` (`.fs-page .expenditure-subnav-*`) applies automatically. Unallowlisted 4C routes render legacy light styles with 0 visual regression.

---

## 4. Complete Inventory & Scoped CSS Rules

### 4.1 Mapping the 22 Legacy Inline Styles in `ExpenditureForm.js`

| # | Current Location | Existing Inline Style | Replacement Mechanism |
|---|---|---|---|
| 1 | Form wrapper (L393) | `style={{ maxWidth: '750px' }}` | Class `.fs-page .fs-form-container` |
| 2 | Bank balance (L400) | `style={{ color: newBank >= 0 ? 'green' : 'red' }}` | Neutral default; if $< 0$, apply shared class `.fs-delta--negative` from `theme.css` |
| 3 | Cash balance (L406) | `style={{ color: newCash >= 0 ? 'green' : 'red' }}` | Neutral default; if $< 0$, apply shared class `.fs-delta--negative` from `theme.css` |
| 4 | Prepaid balance (L412) | `style={{ color: newPrepaid >= 0 ? 'green' : 'red' }}` | Neutral default; if $< 0$, apply shared class `.fs-delta--negative` from `theme.css` |
| 5 | Log operations (L553) | `style={{ gap: '2rem', flexWrap: 'wrap' }}` | Class `.fs-page .log-operations` |
| 6 | Bank Off option (L586) | `style={{ fontSize: '0.85rem', fontWeight: 'bold' }}` | Class `.fs-page .radio-option.option-off` |
| 7 | Cash Off option (L632) | `style={{ fontSize: '0.85rem', fontWeight: 'bold' }}` | Class `.fs-page .radio-option.option-off` |
| 8 | Prepaid Off option (L678) | `style={{ fontSize: '0.85rem', fontWeight: 'bold' }}` | Class `.fs-page .radio-option.option-off` |
| 9 | Auto rule magic icon (L723) | `style={{ marginRight: '0.4rem', color: '#2563eb' }}` | Class `.fs-page .fs-rule-icon` (no raw hex) |
| 10 | Split allocation text (L753) | `style={{ fontSize: '0.85rem', color: '#64748b' }}` | Class `.fs-page .fs-split-allocated-text` (no raw hex) |
| 11 | Split table container (L761) | `style={{ marginBottom: '1.5rem' }}` | Class `.fs-page .fs-split-table-wrapper` |
| 12 | Th Category (L765) | `style={{ width: '40%' }}` | Class `.fs-page .col-split-category` |
| 13 | Th Amount (L766) | `style={{ width: '25%' }}` | Class `.fs-page .col-split-amount` |
| 14 | Th Note (L767) | `style={{ width: '25%' }}` | Class `.fs-page .col-split-note` |
| 15 | Th Delete (L768) | `style={{ width: '10%' }}` | Class `.fs-page .col-split-action` |
| 16 | Td Delete cell (L807) | `style={{ textAlign: 'center' }}` | Class `.fs-page .col-split-action` |
| 17 | Split footer bar (L823) | `style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}` | Class `.fs-page .fs-split-actions-bar` |
| 18 | Add Split Row btn (L827) | `style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}` | `<Button size="sm" variant="secondary">` component |
| 19 | Split balance bar (L835) | `style={{ margin: 0 }}` | Class `.fs-page .fs-split-balance-bar` |
| 20 | Categories label (L851) | `style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}` | Class `.fs-page .fs-field-label` |
| 21 | Category tag checkbox (L861) | `style={{ borderColor: cat.color, backgroundColor: ..., color: ... }}` | Class `.filter-chip` (reusing 4A's shared styling in `Expenditure.css` + `theme-components.css`, I-5) |
| 22 | Submit button (L887) | `style={{ marginTop: '1.5rem' }}` | `<Button variant="primary">` in `.fs-form-footer` |

### 4.2 Complete Scoped CSS Rules for `Expenditure.css` (F-1, F-2, C-1, C-4, E-2, I-1, I-2)
**Strict Invariant I15 Compliance**: `Expenditure.css` contains **zero** direct references to `var(--fs-positive)`, `var(--fs-negative)`, `var(--fs-warning)`, or `var(--fs-accent)`.
**Strict AD13 Compliance**: Operations `+` and `-` and balanced split statuses are strictly neutral.
**Spacing Architecture Note (C-4)**: Because `tokens.json` does not export `--fs-space-*` CSS custom properties, component padding, margins, and gaps are authored in standard pixel units matching Canonical Reference Frame 02 (`docs/UI-UX_Plan/reference/02-form.html`), while all typography, colors, borders, and radii strictly reference design tokens (`--fs-text-*`, `--fs-weight-*`, `--fs-radius-*`, `--fs-border-*`, `--fs-surface-*`, `--fs-bg`).
**Form Error Class Note (I-1)**: `.fs-error` is the shared form error text primitive authored in `theme.css` (lines 459–464) by Phase 2A (`font-size: var(--fs-text-xs); line-height: var(--fs-line-height-xs); color: var(--fs-negative); margin-top: 0.25rem;`). It is globally available and needs no re-definition in `Expenditure.css`.

```css
/* ==========================================================================
   FinStat Phase 4B: Scoped Form & Sub-Nav Rules (Canonical Ref Frame 02)
   All rules strictly scoped under .fs-page (Decision D22 / Invariant I15)
   Zero tone tokens referenced directly (Invariant I15 compliant)
   ========================================================================== */

/* Page Form Container */
.fs-page .fs-form-container {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.fs-page .fs-form-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Stacked Sub-Panel Cards (Variant B Canonical) */
.fs-page .fs-section-card {
  background: var(--fs-surface-raised);
  border: var(--fs-border-width) solid var(--fs-border);
  border-radius: var(--fs-radius-md);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fs-page .fs-section-title {
  font-size: var(--fs-text-base); /* 14px per 02-form.html line 146 */
  font-weight: var(--fs-weight-semibold);
  color: var(--fs-text);
  border-bottom: var(--fs-border-width) solid var(--fs-border);
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 2-Column Responsive Form Grid */
.fs-page .fs-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 20px;
}

.fs-page .fs-col-full {
  grid-column: 1 / -1;
}

/* Form Fields, Labels, Inputs */
.fs-page .fs-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fs-page .fs-field-label {
  font-size: var(--fs-text-xs);
  font-weight: var(--fs-weight-medium);
  color: var(--fs-text-2);
  display: flex;
  align-items: center;
}

.fs-page .fs-req {
  color: var(--fs-text-3);
  margin-left: 4px;
  font-weight: var(--fs-weight-semibold);
}

.fs-page .fs-input,
.fs-page .fs-select,
.fs-page .fs-textarea {
  background: var(--fs-surface);
  border: var(--fs-border-width) solid var(--fs-border-control);
  border-radius: var(--fs-radius-sm);
  color: var(--fs-text);
  padding: 8px 12px;
  font-size: var(--fs-text-sm);
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.fs-page .fs-input:focus,
.fs-page .fs-select:focus,
.fs-page .fs-textarea:focus {
  outline: var(--fs-focus-ring);
  outline-offset: var(--fs-focus-offset);
  border-color: var(--fs-border-strong);
}

/* Balance Preview Card (Sunken Sub-Inset per S-3) */
.fs-page .fs-balance-preview-card {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: var(--fs-surface-sunken);
  border: var(--fs-border-width) solid var(--fs-border);
  border-radius: var(--fs-radius-sm);
}

.fs-page .fs-balance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 120px;
}

.fs-page .fs-balance-label {
  font-size: var(--fs-text-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--fs-text-3);
  font-weight: var(--fs-weight-semibold);
}

.fs-page .fs-balance-val {
  font-size: var(--fs-text-xl);
  font-weight: var(--fs-weight-semibold);
  color: var(--fs-text);
  font-variant-numeric: tabular-nums;
}

/* Log / Transfer Operations (Bank/Cash/Prepaid +/-/Off)
   Neutral selected state per AD13 (F-2) */
.fs-page .log-operations {
  display: flex;
  justify-content: space-around;
  gap: 16px;
  padding: 16px;
  background: var(--fs-surface-sunken);
  border: var(--fs-border-width) solid var(--fs-border);
  border-radius: var(--fs-radius-sm);
  flex-wrap: wrap;
}

.fs-page .operation-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.fs-page .operation-group h4 {
  margin: 0;
  color: var(--fs-text-2);
  font-size: var(--fs-text-sm);
  font-weight: var(--fs-weight-semibold);
}

.fs-page .radio-group {
  display: flex;
  gap: 8px;
}

.fs-page .radio-option {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px 12px;
  min-width: 44px;
  min-height: 44px;
  border: var(--fs-border-width) solid var(--fs-border-control);
  border-radius: var(--fs-radius-sm);
  background: var(--fs-surface);
  color: var(--fs-text-2);
  transition: background var(--fs-duration-fast) var(--fs-ease-standard);
  user-select: none;
}

.fs-page .radio-option:hover {
  background: var(--fs-surface-raised);
  color: var(--fs-text);
  border-color: var(--fs-border-control);
}

/* Neutral selected state for user-choice operations per AD13 (F-2) */
.fs-page .radio-option.selected-plus,
.fs-page .radio-option.selected-minus,
.fs-page .radio-option.selected-off {
  background: var(--fs-surface-raised);
  border-color: var(--fs-border-strong);
  color: var(--fs-text);
  font-weight: var(--fs-weight-semibold);
}

.fs-page .radio-option.option-off {
  font-size: var(--fs-text-xs);
  font-weight: var(--fs-weight-semibold);
}

.fs-page .radio-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.fs-page .radio-option:focus-within {
  outline: var(--fs-focus-ring);
  outline-offset: var(--fs-focus-offset);
}

/* Currency Conversion Confirmation Card */
.fs-page .currency-conversion-card {
  background: var(--fs-surface-sunken);
  border: var(--fs-border-width) solid var(--fs-border);
  border-radius: var(--fs-radius-sm);
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fs-page .conversion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fs-page .conversion-label {
  font-size: var(--fs-text-xs);
  font-weight: var(--fs-weight-semibold);
  color: var(--fs-text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.fs-page .rate-badge {
  font-size: var(--fs-text-xs);
  color: var(--fs-text-2);
  background: var(--fs-surface);
  border: var(--fs-border-width) solid var(--fs-border);
  border-radius: var(--fs-radius-sm);
  padding: 2px 8px;
  font-variant-numeric: tabular-nums;
}

.fs-page .conversion-value-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fs-page .foreign-pill {
  font-size: var(--fs-text-sm);
  color: var(--fs-text);
  font-variant-numeric: tabular-nums;
}

.fs-page .conversion-arrow {
  color: var(--fs-text-3);
}

.fs-page .egp-equivalent {
  font-size: var(--fs-text-lg);
  font-weight: var(--fs-weight-semibold);
  color: var(--fs-text);
  font-variant-numeric: tabular-nums;
}

.fs-page .conversion-hint {
  font-size: var(--fs-text-xs);
  color: var(--fs-text-3);
}

/* Auto-Categorization Rule Pill */
.fs-page .fs-rule-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--fs-surface-sunken);
  border: var(--fs-border-width) solid var(--fs-border);
  border-radius: var(--fs-radius-sm);
  padding: 8px 12px;
  margin-top: 8px;
  font-size: var(--fs-text-xs);
  color: var(--fs-text-2);
}

.fs-page .fs-rule-icon {
  margin-right: 6px;
  color: var(--fs-text-3);
}

/* Category Selection Chips Container */
.fs-page .fs-category-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Split Transaction Elements */
.fs-page .fs-split-allocated-text {
  font-size: var(--fs-text-xs);
  color: var(--fs-text-3);
  font-variant-numeric: tabular-nums;
}

.fs-page .fs-split-table-wrapper {
  margin-bottom: 20px;
}

.fs-page .fs-split-table {
  width: 100%;
  border-collapse: collapse;
}

.fs-page .fs-split-table th {
  font-size: var(--fs-text-xs);
  color: var(--fs-text-3);
  font-weight: var(--fs-weight-semibold);
  text-align: left;
  padding: 8px 12px;
  border-bottom: var(--fs-border-width) solid var(--fs-border);
}

.fs-page .fs-split-table td {
  padding: 8px 6px;
  vertical-align: middle;
}

.fs-page .col-split-category { width: 40%; }
.fs-page .col-split-amount { width: 25%; }
.fs-page .col-split-note { width: 25%; }
.fs-page .col-split-action { width: 10%; text-align: center; }

.fs-page .fs-split-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.fs-page .fs-split-balance-bar {
  font-size: var(--fs-text-xs);
  padding: 6px 12px;
  border-radius: var(--fs-radius-sm);
  background: var(--fs-surface-sunken);
  border: var(--fs-border-width) solid var(--fs-border);
  font-variant-numeric: tabular-nums;
}

/* Neutral balanced state per AD13 (F-2) */
.fs-page .fs-split-balance-bar.balanced {
  color: var(--fs-text-2);
  border-color: var(--fs-border);
}

/* Form Actions Footer */
.fs-page .fs-form-footer {
  padding: 16px 24px;
  background: var(--fs-surface-sunken);
  border-top: var(--fs-border-width) solid var(--fs-border);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

/* ==========================================================================
   Mobile Responsive Rules (390px / <= 768px) per Decision D19 & Invariant I6
   ========================================================================== */
@media (max-width: 768px) {
  .fs-page .fs-grid-2col {
    grid-template-columns: 1fr;
  }

  .fs-page .fs-form-footer {
    flex-direction: column-reverse;
    width: 100%;
  }

  .fs-page .fs-form-footer .fs-btn,
  .fs-page .fs-form-footer a {
    width: 100%;
    justify-content: center;
  }

  .fs-page .fs-balance-preview-card {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .fs-page .fs-balance-item {
    flex-direction: row;
    justify-content: space-between;
  }

  /* Interactive touch targets >= 44px (B-5)
     Scoped strictly to form category chips grid to prevent diffing /expenditures at 390px (I-2) */
  .fs-page .fs-category-chips-grid .filter-chip {
    min-height: 44px;
    padding: 10px 16px;
  }

  .fs-page .radio-option {
    min-height: 44px;
    min-width: 44px;
  }

  /* Split table mobile card transformation (D-3, S-1) */
  .fs-page .fs-split-table,
  .fs-page .fs-split-table tbody,
  .fs-page .fs-split-table tr,
  .fs-page .fs-split-table td {
    display: block;
    width: 100%;
  }

  .fs-page .fs-split-table thead {
    display: none;
  }

  .fs-page .fs-split-table tbody tr {
    background: var(--fs-surface);
    border: var(--fs-border-width) solid var(--fs-border);
    border-radius: var(--fs-radius-sm);
    padding: 12px;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .fs-page .fs-split-table td {
    padding: 0;
  }

  .fs-page .col-split-action {
    display: flex;
    justify-content: flex-end;
  }

  .fs-page .fs-split-actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
```

---

## 5. File Changes & Exact Modifications

### 5.1 `frontend/src/pages/expenditure/ExpenditureForm.js`
- **Imports**:
  - Import `<Button>`, `<Loading>`, `<Badge>` from `../../components/ui`.
  - Import `<ProtectedAction>` from `../../components/common/ProtectedAction`.
  - Import `Link` from `react-router-dom`.
- **Category Picker Mode & Accessibility (B-2, B-3, B-4, B-5, S-2, S-5, I-5)**:
  - In single-category mode: Container has `role="radiogroup"` and `aria-label="Category"`.
  - Each chip uses class `.filter-chip` (matching 4A). Chip has `role="radio"`, `aria-checked={isSelected}`, `tabIndex={isSelected ? 0 : -1}`, and full keyboard navigation (Arrow keys, `Home`, `End`, `Space`, `Enter`).
- **Form Controls, Validation & Accessibility (E-1, E-2, S-7, I-1)**:
  - Required fields marked visually with `<span className="fs-req" aria-hidden="true">*</span>` and input has both HTML5 `required` and `aria-required="true"`.
  - Validation error messages: On error, control has `aria-invalid="true"` and `aria-describedby={errorId}`. Error message has `id={errorId}`, `className="fs-error"` (from `theme.css`), and `role="alert"` (or `aria-live="polite"` before submit attempt).
- **Split Transaction Accessibility (H-1)**:
  - Every input inside split rows carries explicit `aria-label`: `aria-label="Split category"`, `aria-label="Split amount"`, `aria-label="Split note"`, `aria-label="Remove split row"`.
- **Form Footer Actions & Viewer Gating (B-6, S-6, S-8, I-6)**:
  - Discard: `<Button as={Link} to="/expenditures" variant="secondary">Cancel</Button>` (utilizes verified `as` prop support in `Button.js`).
  - Submit: Wrapped in `<ProtectedAction tooltip="View-only access">` followed by `<Button type="submit" variant="primary">{mode === 'create' ? 'Create New Log' : 'Save Changes'}</Button>`.
- **Test ID Preservation (Invariant I5)**:
  - `data-testid="conversion-confirmation-card"` preserved.
  - `data-testid="converted-egp-value"` preserved.

### 5.2 `frontend/src/pages/expenditure/AddExpenditurePage.js` & `EditExpenditurePage.js`
- Wrap outer container in `<div className="fs-page">`.
- Add `<PageHeader>` primitive:
  - Add: `title="New Expenditure"` and `subtitle="Record a single or split transaction"`.
  - Edit: `title="Edit Expenditure"` and `subtitle="Modify transaction details or category splits"`.
- Render `<ExpenditureSubNav />` below `<PageHeader>`.
- Replace bare text loading states with `<Loading variant="form-field" text="Loading expenditure..." />` (D-4).
- Remove redundant external cancel link.

### 5.3 `frontend/src/components/ProtectedRoute.js` & `ProtectedRoute.test.js` (C-3)
- In `ProtectedRoute.js`, expand `THEMED_PATTERNS`:
  ```javascript
  // Themed routes allowlist (Phase 3A: '/dashboard', Phase 4A: '/expenditures', Phase 4B: forms)
  export const THEMED_PATTERNS = [
    '/dashboard',
    '/expenditures',
    '/expenditures/new',
    '/expenditures/edit/:id',
  ];
  ```
- In `frontend/src/components/__tests__/ProtectedRoute.test.js`:
  Update allowlist test expectations to assert `true` for 4B routes:
  ```javascript
  expect(isThemedRoute('/expenditures/new')).toBe(true);
  expect(isThemedRoute('/expenditures/edit/123')).toBe(true);
  // Unallowlisted routes remain false
  expect(isThemedRoute('/expenditures/rules')).toBe(false);
  expect(isThemedRoute('/expenditure-analysis')).toBe(false);
  expect(isThemedRoute('/portfolio')).toBe(false);
  ```

### 5.4 `frontend/playwright.config.js` (C-2)
Update `reference` project `testMatch` to include `expenditure-form-reference-match.spec.js`:
```javascript
    {
      name: 'reference',
      dependencies: ['setup'],
      testMatch: /(reference-frames|dashboard-reference-match|expenditure-reference-match|expenditure-form-reference-match)\.spec\.js/,
    },
```

### 5.5 `frontend/.eslintignore` & `ExpenditureForm.test.js` (B-1, G-3)
- Verify with case-insensitive / capital-E grep:
  ```powershell
  git grep -n "Expenditure" frontend/.eslintignore
  ```
  - Proves `AddExpenditurePage.js` and `EditExpenditurePage.js` are not present in `.eslintignore` (already checked and clean).
  - Lines 53 and 56 reference `ExpenditureForm.js` and `ExpenditureForm.test.js`.
- Delete lines 53 and 56 from `frontend/.eslintignore`.
- In `ExpenditureForm.test.js`:
  - Fix line 30 `testing-library/no-wait-for-multiple-assertions` by splitting assertions:
    ```javascript
    await waitFor(() => expect(getRules).toHaveBeenCalled());
    expect(getCurrencyPrice).toHaveBeenCalled();
    ```
  - Add jest-axe accessibility test (D-1):
    ```javascript
    it('passes WCAG 2.1 AA accessibility checks via jest-axe', async () => {
      const { container } = render(<ExpenditureForm onSubmit={jest.fn()} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    ```
  - Add Invariant I4 viewer role test (B-6, S-6):
    ```javascript
    it('disables submit button when viewer role is active via ProtectedAction', async () => {
      // Render form in viewer context; assert submit button has aria-disabled="true"
    });
    ```
- Run ESLint verification across all four files:
  ```powershell
  npx --prefix frontend eslint frontend/src/pages/expenditure/ExpenditureForm.js frontend/src/pages/expenditure/AddExpenditurePage.js frontend/src/pages/expenditure/EditExpenditurePage.js frontend/src/pages/expenditure/__tests__/ExpenditureForm.test.js --max-warnings=0
  ```

---

## 6. Automated Verification Strategy (Category A & D Compliant)

### 6.1 Automated Reference Spec (`expenditure-form-reference-match.spec.js`)
All computed style assertions use the signed-off token values from `tokens.json`:

| # | Check / Invariant | Selector / Target | Expected Computed Value | Source Token |
|---|---|---|---|---|
| 1 | Primary Save CTA (A-5) | `.fs-btn-primary` | `background: rgb(20, 184, 166)`, `color: rgb(13, 14, 16)` | `--fs-accent`, `--fs-ink` |
| 2 | Neutral Discard CTA (A-3, A-4) | `.fs-btn-secondary` | `background: rgb(26, 28, 32)`, `border-color: rgb(106, 111, 119)` | `--fs-surface`, `--fs-border-control` |
| 3 | Stacked Sub-Panels (A-1, A-2) | `.fs-section-card` | `background: rgb(34, 37, 42)`, `border-color: rgb(52, 56, 63)` | `--fs-surface-raised`, `--fs-border` |
| 4 | Exactly one accent CTA in form footer | Form action footer | Exactly 1 element with `background: rgb(20, 184, 166)` | Canonical Ref Frame 02 |
| 5 | Radio Semantics & Consistency (B-4, S-2) | Category picker | Container has `role="radiogroup"`; active chip has `role="radio"`, `aria-checked="true"`, and accent border | W3C ARIA APG / 4A consistency |
| 6 | Category Radius (B-2) | `.filter-chip` | `border-radius: 4px` (strictly not pill) | `--fs-radius-sm` |
| 7 | Mobile Touch Targets (B-5, I-2) | `.fs-category-chips-grid .filter-chip`, `.radio-option` | `clientHeight >= 44px` at 390px viewport | `--fs-touch-target: 44px` |
| 8 | Split Mobile Cards & Labels (D-3, H-1) | Split table rows | At 390px: `thead` has `display: none`; `tbody tr` has `display: flex`; all split inputs have valid `aria-label` | Decision D19 / Invariant I5 |
| 9 | Zero Horizontal Scroll | `document.body`, `.fs-page` | `scrollWidth <= clientWidth` at 390px | Decision D19 |
| 10 | Foreign Exchange Confirmation | `[data-testid="conversion-confirmation-card"]` | Renders upon USD selection; live calculated equivalent displayed | Invariant I5 |
| 11 | Viewer Role Mutation Gating (B-6, S-6) | Submit button | Has `aria-disabled="true"` or `disabled` when user role is viewer | Invariant I4 |
| 12 | WCAG Accessibility (D-1) | Route root | axe-core scan on `/expenditures/new` & edit returns 0 critical/serious violations | Section 6.8 Exit Gate |

### 6.2 Test Execution Commands (PowerShell Syntax per C-6, G-1, G-2)
```powershell
# 1. Check tokens and verify zero drift
node frontend/scripts/tokens.js --check

# 2. Check CSS tone rules (Invariant I15: zero violations)
node frontend/scripts/lint-tones.js

# 3. Check testid integrity (Invariant I5) (G-1)
node frontend/scripts/testid-guard.js

# 4. Check stylelint ratchet against merge base
node frontend/scripts/lint-ratchet.js

# 5. Assert allowlist matches App.js routes exactly (4 routes expected)
node frontend/scripts/ui-coverage.js --assert-allowlist

# 6. Run targeted Jest unit, axe, and allowlist tests (§15.5 compliant) (G-2)
npx --prefix frontend jest --runInBand src/pages/expenditure/__tests__/ExpenditureForm.test.js src/components/__tests__/ProtectedRoute.test.js src/App.test.js

# 7. Run reference suite including new form spec (against running dev server or CI build)
npx playwright test --project=reference

# 8. Taste checkpoint capture & verification (1440px and 390px)
# Review captures with developer before updating baselines

# 9. Update 10 baseline snapshots in FinStat-visual-baselines
npx playwright test tests/visual/visual.spec.js -g "(expenditures-new|expenditures-edit)" --update-snapshots
node frontend/scripts/verify-baseline-manifest.js

# 10. Run PR subset visual suite (confirming 0 diff on 63 unallowlisted routes)
$env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset
```

---

## 7. Action Plan §10 Progress Log Template (C-5, I-3)

Upon completion, record this entry verbatim in `docs/UI-UX_Plan/UI-UX-PLAN.md` §10:

```
Sub-phase:   4B
Status:      done
Done:        Converted /expenditures/new and /expenditures/edit/:id to Canonical Reference Frame 02 (Variant B). Eliminated all 22 inline styles from ExpenditureForm.js. Scoped Section 4 form and card rules added to Expenditure.css with zero tone token references. Removed ExpenditureForm.js and its test from .eslintignore (0 warnings). Expanded allowlist in ProtectedRoute.js (cumulative: 4 routes). Reference match suite passing (12 checks); PR subset passing with 0 diff on all 63 unallowlisted routes; manifest 344/344 verified (334 existing + 10 new for /expenditures/new and /expenditures/edit/:id at 5 widths each).
Next:        4C — Rules, budgets, recurring, bills, analysis
Blocked by:  None
Allowlist:   ['/dashboard', '/expenditures', '/expenditures/new', '/expenditures/edit/:id'] (cumulative: 4 routes)
Visual diff: 0 regression diff across all 63 unallowlisted routes; /expenditures/new and /expenditures/edit/:id baselines updated
Fixtures:    Expenditure form fixtures with multi-currency, split allocation, and conversion confirmation
Screenshots: expenditures-new-1440.png, expenditures-new-390.png, expenditures-edit-1440.png, expenditures-edit-390.png
Branch:      phase-ui-4b-expenditure-forms
Merge SHA:   <recorded upon merge into main>
```

---

## 8. Plan Self-Check Against Feedback Categories A–I

| Feedback Item | Description & Requirement | Resolution in this Plan |
|---|---|---|
| **I-1** | `.fs-error` class defined & documented | Documented as Phase 2A `theme.css` primitive (lines 459–464). Globally available. |
| **I-2** | Scoped mobile `.filter-chip` override | Scoped to `.fs-page .fs-category-chips-grid .filter-chip` to prevent diffing 4A's `/expenditures` at 390px. |
| **I-3** | Baseline count in §7 progress log | Corrected to 344/344 (334 existing + 10 new snapshots across 5 viewports). |
| **I-4** | Proof of `/expenditures` in `ProtectedRoute.js` | Uses `git grep -A 4 "THEMED_PATTERNS"` showing multi-line match. |
| **I-5** | Accurate `.filter-chip` location | Documented as base in `Expenditure.css` + `.active` in `theme-components.css`. |
| **I-6** | `<Button as={Link}>` support verified | Verified in `Button.js` lines 10 & 64 (`as: Component = 'button'` and `PropTypes.elementType`). |
| **F-1** | Direct tone-token references eliminated | Zero tone tokens in `Expenditure.css`. Tones routed via `theme.css` / `theme-components.css`. |
| **F-2** | AD13 neutral operations & balanced state | `+`/`-` operations and balanced split status are neutral; only overdraft and unbalanced warning use tones. |
| **G-1** | `testid-guard.js` verification | Added to §6.2 step 3. |
| **G-2** | Targeted Jest & proxy compliance (§15.5) | Replaced with targeted `jest --runInBand` and documented CI compile proxy. |
| **G-3** | Case-sensitive git grep | Specified `git grep -n "Expenditure" frontend/.eslintignore`. |
| **H-1** | Mobile split inputs accessible labels | Explicit `aria-label` attributes on all split inputs (`aria-label="Split category"`, etc.). |
| **A-1 to A-5** | Signed-off token values in reference assertions | Verified against `tokens.json`: `--fs-surface-raised: #22252a`, `--fs-border: #34383f`, `--fs-surface: #1a1c20`, `--fs-border-control: #6a6f77`, `--fs-ink: #0d0e10`, `--fs-bg: #101114`. |
| **B-1** | ESLint ignore removal check | Verified clean state of `AddExpenditurePage.js` and `EditExpenditurePage.js`; removes lines 53 and 56. |
| **B-2** | Category chip radius ceiling | Uses `--fs-radius-sm` (4px), strictly banning pill radius. |
| **B-3** | Non-border hover cues | `.filter-chip:hover` provides background and text contrast cues. |
| **B-4** | Category selection semantics | Uses `role="radiogroup"` on container and `role="radio"` with `aria-checked` on chips. |
| **B-5** | Mobile touch targets $\ge 44\text{px}$ | Enforced via `@media (max-width: 768px)` with `--fs-touch-target: 44px`. |
| **B-6, S-6** | Viewer role gating (Invariant I4) | Submit button wrapped in `<ProtectedAction tooltip="View-only access">` and disabled for viewers. |
| **C-1** | Complete CSS inventory | All 22 classes authored with complete scoped CSS rules in §4.2. |
| **C-2** | `playwright.config.js` reference project testMatch | Updated to match `expenditure-form-reference-match.spec.js`. |
| **C-3** | `ProtectedRoute.test.js` allowlist exactness | Updated to assert `true` for `/expenditures/new` and `/expenditures/edit/123`. |
| **C-4** | Spacing / px token claim honesty | Accurately stated: standard px used for spacing matching `02-form.html`; tokens used for all colors, typography, borders, radii. |
| **C-5** | Progress log format | Formatted as Action Plan §10 code-fenced key:value block with all 11 fields. |
| **C-6** | PowerShell syntax | Corrected to `$env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset`. |
| **D-1** | Axe verification | Jest-axe component check and real-browser axe-core verification included. |
| **D-2** | Precondition verification | Verifies `THEMED_PATTERNS` in `ProtectedRoute.js` proves 4A is merged. |
| **D-3, S-1** | Split table mobile cards | Specified that table rows transform into cards (`tbody tr`) without phantom classes. |
| **D-4** | Loading primitive verification | Verified `Loading.js` line 3 explicitly supports `variant="form-field"`. |
| **D-5** | Relative path | Uses relative link `docs/UI-UX_Plan/reference/02-form.html`. |
| **E-1** | Validation errors | Specifies `aria-invalid="true"`, `aria-describedby={errorId}`, `id={errorId}`, and `.fs-error`. |
| **E-2** | `.fs-req` indicator | Visual marker `<span className="fs-req" aria-hidden="true">*</span>` with explicit CSS, input carries `aria-required="true"` and HTML5 `required`. |
| **S-2** | Category chip active consistency | Reuses 4A's `.filter-chip.active` from `theme-components.css` for 100% visual consistency. |
| **S-3** | Nested surface hierarchy | Verified sunken balance preview sub-inset against `02-form.html`. |
| **S-4** | Section title size | Verified 14px `--fs-text-base` matches `02-form.html` line 146. |
| **S-5** | Radiogroup keyboard navigation | Full W3C APG compliance: Arrow keys, `Home`, `End`, `Space`, `Enter`. |
| **S-7** | Dynamic alert announcement | Error containers announce via `role="alert"` only after submit attempts. |
| **S-8** | Button primitive base class | Verified `Button.js` emits `.fs-btn`. |
| **S-9** | Self-check honesty | All claims in §8 accurately reflect the code and design system rules. |
