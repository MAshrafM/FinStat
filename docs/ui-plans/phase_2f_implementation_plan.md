# Implementation Plan — UI Phase 2F: Universal Loading Pattern (D23, `<Loading>` Primitive) (v4 — Finalized)

> **Governing Spec:** `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.6 (Phase 2F), §8.4 (Primitive #8: `Loading`), and Plan Amendment v10.3 (D23)  
> **Status:** Finalized Plan — Approved for Execution  
> **Branch:** `phase-ui-2f-loading` (to be branched from `main` at `fa7e44a`)

---

## 1. Goal & Architectural Overview

Sub-phase 2F establishes a unified, predictable, and fully accessible loading pattern across the FinStat application:

> **Design Principle (D23):** Loading consistency is not per-page — it is app-wide. Every route that shows a loading indicator uses the same mechanism:
> - `<Loading variant="route" />` for route-level Suspense fallbacks.
> - `<Loading variant="table" />`, `<Loading variant="card" />`, and `<Loading variant="form-field" />` for shaped skeleton placeholders.
> - `<Loading variant="inline" />` for button and inline status indicators.
> 
> No page keeps its own ad-hoc loading UI after its migration phase.

### Scope Governance & Phased Migration Strategy:
1. **Core Primitive Extraction**: Extract Primitive #8 (`Loading`) into `frontend/src/components/ui/Loading.js` with 5 variants, accessible ARIA roles, TypeScript-grade JSDoc typing, defensive runtime fallbacks, and barrel re-export in `frontend/src/components/ui/index.js`.
2. **Unthemed & Themed CSS Engine**: Add `.fs-skeleton`, `.fs-skeleton--row`, `.fs-skeleton--card`, `.fs-skeleton--form-field`, `.fs-loading`, `.fs-loading--route`, `.fs-loading--table`, `.fs-loading--card`, `.fs-loading--form-field`, `.fs-loading--inline`, `.fs-loading-spinner`, `.fs-visually-hidden`, and `@keyframes fs-pulse` to `frontend/src/styles/theme.css`. Every token reference provides a legacy fallback so indicators render legibly on unthemed pages.
3. **Application Routing Fallbacks (Category B)**: Standardize global Suspense boundaries in `frontend/src/App.js` and `frontend/src/components/ProtectedRoute.js` to `<Loading variant="route" text="..." />`.
4. **Representative Integration Proof (5 Pages)**: Migrate 5 representative pages covering all 5 variants to prove live end-to-end integration without expanding the blast radius before domain phases:
   - `variant="inline"`: `frontend/src/pages/LandingPage.js` (auth submit & 2FA verification spinner)
   - `variant="card"`: `frontend/src/pages/admin/AdminDashboard.js` (metrics overview card loader)
   - `variant="table"`: `frontend/src/pages/certificates/CertificateLogPage.js` (tabular data rows skeleton)
   - `variant="form-field"`: `frontend/src/pages/certificates/EditCertificatePage.js` (record fetch placeholder)
   - `variant="route"`: `frontend/src/pages/portfolio/PortfolioDashboard.js` (full route view loader)
5. **Button `isLoading` Consistency (N1 Alignment)**: `Button.js` (from Phase 2E) currently renders `<span className="loading-spinner" aria-hidden="true" />`. In Phase 2F, `Button.js` remains untouched on `.loading-spinner` to keep 2F's blast radius tightly isolated. Migrating `Button.js` to internal `<Loading variant="inline" />` is scheduled for Phase 3A (Dashboard conversion) where Button and Loading are integrated together.
6. **Disposition of Remaining Pages**: The remaining 38 Category A pages and Category C silent pages are cataloged in an explicit Phase Migration Schedule mapped directly to their respective domain phases (Phases 3 through 11).
7. **Invariants & Safety**:
   - **Constraint E1**: Zero modifications to legacy shared CSS files (`Table.css`, `Form.css`, `Modal.css`, etc.).
   - **Invariant I5**: All existing `data-testid` attributes and `aria-label`s preserved (guarded by `testid-guard.js`).
   - **Invariant I12**: Zero new runtime dependencies (`Loading.js` uses TypeScript JSDoc + defensive prop validation, without new npm packages).
   - **Invariant I13**: 326 visual route regression tests pass with 0 diff (loading elements masked and detached prior to snapshot capture).

---

## 2. Component & Token Specification

### 2.1 Unthemed Legacy Fallbacks (Dual-Mode Support & Documented Exception)

Because `--fs-border`, `--fs-text`, `--fs-surface-raised`, and `--fs-text-3` are scoped under `:root[data-fs-theme="dark"]`, unthemed pages (and global lazy boundaries prior to route theming) require CSS fallback values. Using `var(--token, fallback)` allows indicators to render using the legacy light palette on unthemed pages, and seamlessly adopt dark graphite tokens on themed pages:

| Selector | Property | Themed Value | Unthemed Fallback | Rationale & Sunset |
| :--- | :--- | :--- | :--- | :--- |
| `.fs-skeleton` | `background` | `var(--fs-surface-raised)` (`#22252a`) | `#e9ecef` (legacy border/card) | Prevents transparent skeleton on unthemed pages; retired in Phase 12 |
| `.fs-skeleton` | `border-radius` | `var(--fs-radius-sm)` (`4px`) | `4px` | Prevents 0px sharp corners on unthemed pages; retired in Phase 12 |
| `.fs-loading-spinner` | `border` | `2px solid var(--fs-border)` (`#34383f`) | `2px solid #ddd` (legacy form border) | Prevents invisible spinner boundary on unthemed pages; retired in Phase 12 |
| `.fs-loading-spinner` | `border-top-color` | `var(--fs-text)` (`#f2f3f5`) | `#2c3e50` (legacy dark slate body) | Ensures high-contrast spinner tick on white backgrounds; retired in Phase 12 |
| `.fs-loading-spinner` | `border-radius` | `var(--fs-radius-pill)` (`999px`) | `999px` | Prevents square spinner on unthemed pages; retired in Phase 12 |
| `.fs-loading-text` | `color` | `var(--fs-text-3)` (`#a2a8b0`) | `#6c757d` (legacy muted text) | Ensures readable status text on unthemed pages; retired in Phase 12 |

> **Documented §9.2 Ratchet Exception Rationale:**
> Per §9.2, `theme.css` targets zero stylelint violations. The scoped `/* stylelint-disable declaration-property-value-allowed-list, color-no-hex */` block below is an explicit, temporary design-system bridge strictly limited to the `.fs-skeleton` and `.fs-loading-spinner` fallback definitions. It prevents invisible loading states across the 65 routes during progressive migration. When Phase 12 enables the theme globally across all routes, these fallback values will be eliminated.

### 2.2 Shimmer & Animation Design (AGENTS.md Anti-Slop Compliance)

Per `AGENTS.md` Rule 3:
> "Gradients: `background: linear-gradient(...)`, `background-image: linear-gradient(...)` ... are mechanically blocked by linters (`.stylelintrc.json`, `lint-tones.js`, `.eslintrc.json`, and `lint-ratchet.js`)."

Traditional skeleton loaders rely on linear-gradient shimmer passes (`linear-gradient(90deg, ...)`). In FinStat, gradient shimmers are strictly prohibited. Instead, the design system utilizes an **opacity pulse animation** transitioning smoothly between `1.0` and `0.4` over a 1.5s ease-in-out cycle.

```css
@keyframes fs-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
```

### 2.3 Additions to `frontend/src/styles/theme.css`

```css
/* ==========================================================================
   Loading & Skeletons (Phase 2F, D23)
   Governed by UI-UX-PLAN.md §6.6, §8.4, and AGENTS.md anti-slop rules
   ========================================================================== */

@keyframes fs-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* stylelint-disable declaration-property-value-allowed-list, color-no-hex --
   Temporary dual-mode fallback block (Phase 2F exception):
   Enables visible loading indicators on unthemed pages prior to Phase 12.
   Values mirror legacy palette (#ddd, #2c3e50, #6c757d, #e9ecef, 999px). */
.fs-skeleton {
  background: var(--fs-surface-raised, #e9ecef);
  border-radius: var(--fs-radius-sm, 4px);
  animation: fs-pulse 1.5s ease-in-out infinite;
}

.fs-skeleton--row {
  height: 2.25rem;
  margin-bottom: 0.5rem;
  width: 100%;
}

.fs-skeleton--card {
  height: 140px;
  width: 100%;
  border-radius: var(--fs-radius-lg, 8px);
}

.fs-skeleton--form-field {
  height: 2.5rem;
  width: 100%;
  border-radius: var(--fs-radius-md, 6px);
  margin-bottom: 1rem;
}

.fs-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--fs-text-3, #6c757d);
  font-family: var(--fs-font-sans, inherit);
  font-size: var(--fs-text-sm, 0.875rem);
}

.fs-loading--route {
  flex-direction: column;
  min-height: 240px;
  padding: 3rem 1.5rem;
  text-align: center;
  width: 100%;
}

.fs-loading--table,
.fs-loading--card,
.fs-loading--form-field {
  flex-direction: column;
  width: 100%;
  align-items: flex-start;
}

.fs-skeleton-rows {
  width: 100%;
}

.fs-loading--inline {
  display: inline-flex;
}

.fs-loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--fs-border, #ddd);
  border-top-color: var(--fs-text, #2c3e50);
  border-radius: var(--fs-radius-pill, 999px);
  animation: spin 1s linear infinite;
}

.fs-loading-spinner--sm {
  width: 16px;
  height: 16px;
  border-width: 1.5px;
}

.fs-loading-text {
  margin: 0;
  color: var(--fs-text-3, #6c757d);
  font-size: var(--fs-text-sm, 0.875rem);
}
/* stylelint-enable declaration-property-value-allowed-list, color-no-hex */

.fs-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fs-skeleton {
    animation: none;
  }
  .fs-loading-spinner {
    animation: none;
  }
}
```

---

## 3. Primitive #8: `Loading` Specification

### 3.1 Screen-Reader Architecture & Double-Announcement Mitigation

Per 2E's accessibility patterns:
1. **Visible Text (`route` and `inline`)**:
   - The container has `role="status"` with **no parent `aria-label`**.
   - The visible `<p className="fs-loading-text">{text || 'Loading...'}</p>` acts as the single announcement source.
   - The spinner has `aria-hidden="true"`.
   - In `inline` without visible text, a `<span className="fs-visually-hidden">{ariaLabel || 'Loading...'}</span>` is rendered instead of a parent `aria-label`, avoiding AT traversal duplication.
2. **Shaped Skeletons (`table`, `card`, `form-field`)**:
   - Skeletons represent layout structure rather than readable prose.
   - The container has `role="status"` and `aria-label={ariaLabel || text || 'Loading...'}`.
   - All inner placeholder elements are explicitly marked `aria-hidden="true"` so screen readers make a single polite announcement rather than repeating "Loading" per row.

### 3.2 Implementation (`frontend/src/components/ui/Loading.js`)

```jsx
import React from 'react';

const VALID_VARIANTS = ['route', 'card', 'table', 'form-field', 'inline'];

/**
 * Loading primitive (§8.4 Primitive #8).
 * Universal loading indicator for FinStat (D23).
 *
 * Variants:
 * - 'route': Centered spinner with text for route-level Suspense fallbacks.
 * - 'card': Skeleton block representing a card/widget loading.
 * - 'table': Skeleton rows representing tabular data loading.
 * - 'form-field': Skeleton input representing form field loading.
 * - 'inline': Compact inline spinner for buttons or inline status elements.
 *
 * @param {Object} props
 * @param {'route' | 'card' | 'table' | 'form-field' | 'inline'} [props.variant='route']
 * @param {string} [props.text] - Accessible loading message (e.g. "Loading...")
 * @param {number} [props.rows=3] - Number of skeleton rows when variant='table'
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
const Loading = ({
  variant = 'route',
  text,
  rows = 3,
  className = '',
  ariaLabel,
  ...rest
}) => {
  const safeVariant = VALID_VARIANTS.includes(variant) ? variant : 'route';
  const accessibleName = ariaLabel || text || 'Loading...';

  if (safeVariant === 'inline') {
    return (
      <span
        className={['fs-loading', 'fs-loading--inline', className].filter(Boolean).join(' ')}
        role="status"
        {...rest}
      >
        <span className="fs-loading-spinner fs-loading-spinner--sm" aria-hidden="true" />
        {text ? (
          <span className="fs-loading-text">{text}</span>
        ) : (
          <span className="fs-visually-hidden">{accessibleName}</span>
        )}
      </span>
    );
  }

  if (safeVariant === 'table') {
    const rowCount = Math.max(1, Math.min(rows, 20));
    return (
      <div
        className={['fs-loading', 'fs-loading--table', className].filter(Boolean).join(' ')}
        role="status"
        aria-label={accessibleName}
        {...rest}
      >
        {text && <p className="fs-loading-text">{text}</p>}
        <div className="fs-skeleton-rows" aria-hidden="true">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="fs-skeleton fs-skeleton--row" />
          ))}
        </div>
      </div>
    );
  }

  if (safeVariant === 'card') {
    return (
      <div
        className={['fs-loading', 'fs-loading--card', className].filter(Boolean).join(' ')}
        role="status"
        aria-label={accessibleName}
        {...rest}
      >
        {text && <p className="fs-loading-text">{text}</p>}
        <div className="fs-skeleton fs-skeleton--card" aria-hidden="true" />
      </div>
    );
  }

  if (safeVariant === 'form-field') {
    return (
      <div
        className={['fs-loading', 'fs-loading--form-field', className].filter(Boolean).join(' ')}
        role="status"
        aria-label={accessibleName}
        {...rest}
      >
        {text && <p className="fs-loading-text">{text}</p>}
        <div className="fs-skeleton fs-skeleton--form-field" aria-hidden="true" />
      </div>
    );
  }

  // Default: safeVariant === 'route'
  return (
    <div
      className={['fs-loading', 'fs-loading--route', className].filter(Boolean).join(' ')}
      role="status"
      {...rest}
    >
      <div className="fs-loading-spinner" aria-hidden="true" />
      <p className="fs-loading-text">{text || 'Loading...'}</p>
    </div>
  );
};

export default Loading;
```

### 3.3 Barrel Export (`frontend/src/components/ui/index.js`)

```javascript
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Badge } from './Badge';
export { default as Delta } from './Delta';
export { default as PageHeader } from './PageHeader';
export { default as EmptyState } from './EmptyState';
export { default as Tabs } from './Tabs';
export { default as Loading } from './Loading';
```

---

## 4. Phase 2F Migration Scope & Representative Integration Proof

### 4.1 Global Route Fallbacks (Category B)
| File | Current Implementation | Phase 2F Implementation |
| :--- | :--- | :--- |
| `frontend/src/App.js` (line 116) | `<div className="loading-spinner">Loading...</div>` | `<Loading variant="route" text="Loading application..." />` |
| `frontend/src/components/ProtectedRoute.js` (line 146) | `<div>Loading...</div>` | `<Loading variant="route" text="Loading session..." />` |

### 4.2 Representative Integration Proof Pages (5 Variants)
| Variant | Target Page | Current Ad-Hoc Implementation | Phase 2F Replacement |
| :---: | :--- | :--- | :--- |
| `inline` | `pages/LandingPage.js` | `<div className="loading-spinner"></div>` inside auth submit & 2FA verify buttons | `<Loading variant="inline" />` |
| `card` | `pages/admin/AdminDashboard.js` | `<div className="loading-spinner" style={{ margin: '40px auto' }}>` | `<Loading variant="card" text="Loading dashboard metrics..." />` |
| `table` | `pages/certificates/CertificateLogPage.js` | `<p className="page-container">Loading Certificates...</p>` | `<Loading variant="table" text="Loading Certificates..." />` |
| `form-field` | `pages/certificates/EditCertificatePage.js` | `if (!certificate) return <p>Loading...</p>;` | `<Loading variant="form-field" text="Loading certificate..." />` |
| `route` | `pages/portfolio/PortfolioDashboard.js` | `<div className="spinner" style={{ margin: '0 auto 20px' }}></div><h2>Loading Unified Investment Portfolio...</h2>` | `<Loading variant="route" text="Loading Unified Investment Portfolio..." />` |

### 4.3 Detailed Disposition Matrix for Remaining 38 Pages & Category C

| Phase | Domain | File | Current State | Target Loading Invocation |
| :---: | :--- | :--- | :--- | :--- |
| **Phase 3** | Dashboard | `pages/DashboardSummary.js` | `<div className="dashboard-loading"><span className="dash-loading-spinner" />...</div>` | `<Loading variant="card" text="Building your financial overview…" />` |
| **Phase 3** | Dashboard | `pages/Dashboard.js` | Silent data fetch (Category C) | `<Loading variant="card" />` in widget area |
| **Phase 4** | Expenditure | `pages/expenditure/BudgetsPage.js` | `<div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading budget progress...</div>` | `<Loading variant="card" text="Loading budget progress..." />` |
| **Phase 4** | Expenditure | `pages/expenditure/RecurringBills.js` | `<div className="empty-state">Loading recurring bills...</div>` | `<Loading variant="table" text="Loading recurring bills..." />` |
| **Phase 4** | Expenditure | `pages/expenditure/RecurringSuggestionsPage.js` | `<div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading recurrence data...</div>` | `<Loading variant="card" text="Loading recurrence data..." />` |
| **Phase 4** | Expenditure | `pages/expenditure/RulesPage.js` | `<div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading rules...</div>` | `<Loading variant="table" text="Loading rules..." />` |
| **Phase 4** | Expenditure | `pages/expenditure/AddExpenditurePage.js` | `<div className="page-container">Loading latest record...</div>` | `<Loading variant="form-field" text="Loading latest record..." />` |
| **Phase 4** | Expenditure | `pages/expenditure/EditExpenditurePage.js` | `<div className="page-container">Loading expenditure...</div>` | `<Loading variant="form-field" text="Loading expenditure..." />` |
| **Phase 5** | Payroll | `pages/salary/SalaryProfilePage.js` | `<p>Loading salary profile...</p>` | `<Loading variant="card" text="Loading salary profile..." />` |
| **Phase 5** | Payroll | `pages/salary/SalaryHistory.js` | `if (!profile) return <div className="page-container">Loading...</div>;` | `<Loading variant="table" text="Loading salary history..." />` |
| **Phase 5** | Payroll | `pages/salary/UpdateSalary.js` | `<p style={{ color: '#6c757d' }}>Loading salary profile structure...</p>` | `<Loading variant="form-field" text="Loading salary profile structure..." />` |
| **Phase 5** | Payroll | `pages/salary/PaycheckFormPage.js` | `<p style={{ color: '#6c757d' }}>Loading profile & paycheck details...</p>` | `<Loading variant="form-field" text="Loading profile & paycheck details..." />` |
| **Phase 5** | Payroll | `pages/salary/EditHistoryRecord.js` | `<div className="page-container">Loading record...</div>` | `<Loading variant="form-field" text="Loading record..." />` |
| **Phase 5** | Payroll | `pages/salary/EditProfilePage.js` | Silent data fetch (Category C) | `<Loading variant="form-field" />` |
| **Phase 5** | Payroll | `pages/salary/TaxSimulator.js` | Silent data fetch (Category C) | `<Loading variant="card" />` |
| **Phase 6** | Assets (FX) | `pages/currency/CurrencyLogPage.js` | `<p className="page-container">Loading Foreign Currency...</p>` | `<Loading variant="table" text="Loading Foreign Currency..." />` |
| **Phase 6** | Assets (FX) | `pages/currency/CurrencyDetailPage.js` | `<p>Loading foreign currency details...</p>` | `<Loading variant="card" text="Loading foreign currency details..." />` |
| **Phase 6** | Assets (FX) | `pages/currency/EditCurrencyPage.js` | `if (!currency) return <p>Loading...</p>;` | `<Loading variant="form-field" text="Loading currency..." />` |
| **Phase 7** | Investments | `pages/trades/TradeLogPage.js` | `Loading trades...` bare text | `<Loading variant="table" text="Loading trades..." />` |
| **Phase 7** | Investments | `pages/trades/EditTradePage.js` | `if (!initialData) return <p>Loading trade data...</p>;` | `<Loading variant="form-field" text="Loading trade data..." />` |
| **Phase 7** | Investments | `pages/trades/TradeSummaryPage.js` | `return <p className="page-container">Loading summary data...</p>;` | `<Loading variant="card" text="Loading summary data..." />` |
| **Phase 7** | Investments | `pages/trades/CorporateActionsList.js` | `<div className="ca-loading-state"><div className="ca-loading-spinner" /><span>Loading corporate actions...</span></div>` | `<Loading variant="table" text="Loading corporate actions..." />` |
| **Phase 7** | Investments | `pages/mutual-funds/MutualFundSummaryPage.js` | `<p className="page-container">Loading summary data...</p>` | `<Loading variant="card" text="Loading summary data..." />` |
| **Phase 7** | Investments | `pages/mutual-funds/EditMutualFundPage.js` | `if (!initialData) return <p>Loading transaction data...</p>;` | `<Loading variant="form-field" text="Loading transaction data..." />` |
| **Phase 8** | Real Estate | `pages/real-estate/RealEstateLogPage.js` | `<div className="spinner" style={{ margin: '0 auto 20px' }}></div><h2>Loading Real Estate Portfolio...</h2>` | `<Loading variant="table" text="Loading Real Estate Portfolio..." />` |
| **Phase 8** | Real Estate | `pages/real-estate/EditRealEstatePage.js` | `<div className="spinner" style={{ margin: '0 auto 20px' }}></div><h2>Loading Property Details...</h2>` | `<Loading variant="form-field" text="Loading Property Details..." />` |
| **Phase 8** | Gold | `pages/gold/GoldSummaryPage.js` | `<p className="page-container">Loading gold summary and market prices...</p>` | `<Loading variant="card" text="Loading gold summary and market prices..." />` |
| **Phase 8** | Gold | `pages/gold/EditGoldPage.js` | `if (!log) return <p>Loading...</p>;` | `<Loading variant="form-field" text="Loading gold asset..." />` |
| **Phase 9** | Credit Cards | `pages/credit-cards/CreditCardPage.js` | `{isLoading && <p>Loading card details...</p>}` | `{isLoading && <Loading variant="card" text="Loading card details..." />}` |
| **Phase 9** | Credit Cards | `pages/credit-cards/StatementCyclePage.js` | `{isLoading && <p>Loading statement cycle timeline...</p>}` | `{isLoading && <Loading variant="card" text="Loading statement cycle timeline..." />}` |
| **Phase 9** | Lending | `pages/lending/LendingDashboardPage.js` | `<div className="lending-page" data-testid="lending-loading"><p>Loading Lending Tracker...</p></div>` | `<Loading variant="card" text="Loading Lending Tracker..." data-testid="lending-loading" />` |
| **Phase 9** | Lending | `pages/lending/LoanDetailPage.js` | `<p>Loading Loan Ledger...</p>` | `<Loading variant="table" text="Loading Loan Ledger..." />` |
| **Phase 9** | Lending | `pages/lending/PersonDetailPage.js` | `<p>Loading Person Details...</p>` | `<Loading variant="card" text="Loading Person Details..." />` |
| **Phase 10** | Admin & Security | `pages/admin/InsuranceConfigPage.js` | `<div className="admin-loading-state"><div className="loading-spinner-ring" /><p>...</p></div>` | `<Loading variant="card" text="Loading social insurance configurations..." />` |
| **Phase 10** | Admin & Security | `pages/admin/TaxConfigPage.js` | `<div className="admin-loading-state"><div className="loading-spinner-ring" /><p>...</p></div>` | `<Loading variant="card" text="Loading tax bracket configurations..." />` |
| **Phase 10** | Admin & Security | `pages/security/SecuritySettingsPage.js` | `return <div className="loading-spinner" style={{ margin: '40px auto' }}>Loading...</div>;` | `<Loading variant="card" text="Loading security settings..." />` |
| **Phase 10** | Admin & Security | `pages/admin/BackupPage.js` | Silent data fetch (Category C) | `<Loading variant="card" />` |
| **Phase 10** | Profile & Settings | `pages/profile/ProfilePage.js` | `<p style={{ color: '#6c757d' }}>Loading profile...</p>` | `<Loading variant="card" text="Loading profile..." />` |
| **Phase 10** | Profile & Settings | `pages/profile/SettingsPage.js` | `<p>Loading application settings...</p>` | `<Loading variant="card" text="Loading application settings..." />` |
| **Phase 10** | Profile & Settings | `pages/profile/RecycleBin.js` | `<div className="recycle-bin-empty">Loading soft-deleted records...</div>` | `<Loading variant="table" text="Loading soft-deleted records..." />` |
| **Phase 11** | Analytics | `pages/reports/ComprehensiveReportPage.js` | `<div className="report-loading"><div className="loading-spinner" />Loading financial reports...</div>` | `<Loading variant="route" text="Loading financial reports..." />` |
| **Phase 11** | Analytics | `pages/analytics/PurchasingPowerChart.js` | `<div className="purchasing-power-container" data-testid="loading-state"><p>...</p></div>` | `<Loading variant="card" text="Loading real-time market feeds..." data-testid="loading-state" />` |

---

## 5. Testing & Verification Plan

### 5.1 `Loading.test.js` Coverage Matrix
A dedicated test suite in `frontend/src/components/ui/__tests__/Loading.test.js` covers:
1. **Accessibility Compliance**: All 5 variants pass `jest-axe` audit with zero violations (`expectNoA11yViolations`).
2. **`route` Variant**: Renders `role="status"` with visible text `<p className="fs-loading-text">`; confirms no parent `aria-label`; verifies spinner has `aria-hidden="true"`.
3. **`inline` Variant**: Renders `fs-loading--inline` with small spinner; renders visible text or visually hidden fallback.
4. **`table` Variant**: Container has `role="status"` and `aria-label`; renders requested number of skeleton rows (`rows` prop, default 3); child skeleton rows have `aria-hidden="true"`.
5. **`card` Variant**: Container has `role="status"` and `aria-label`; child skeleton card has `aria-hidden="true"`.
6. **`form-field` Variant**: Container has `role="status"` and `aria-label`; child skeleton form-field has `aria-hidden="true"`.
7. **Accessible Name Customization**: `ariaLabel` prop overrides default accessible name in skeleton variants.
8. **Class Name Forwarding**: Custom `className` merges cleanly with base `.fs-loading` classes.
9. **Prop Forwarding**: Rest props (`data-testid`, `id`, `data-*`) forward to container element.
10. **Defensive Variant Fallback**: Invalid variant string safely defaults to `route` variant without throwing.

### 5.2 Automated Quality Gates
```powershell
# 1. Token Check
node frontend/scripts/tokens.js --check
# Expected: 0 drift

# 2. Lint Tones & Scoping
node frontend/scripts/lint-tones.js
# Expected: 0 violations, 0 undefined tokens

# 3. Test-ID & ARIA Guard (Invariant I5)
node frontend/scripts/testid-guard.js
# Expected: 0 removals

# 4. Stylelint Ratchet & Syntax
node frontend/scripts/lint-ratchet.js
cd frontend; npx stylelint "src/styles/*.css"
# Expected: 0 regressions, 0 errors

# 5. ESLint Verification Across Touched Files (N2 Alignment)
# - EditCertificatePage.js is NOT on .eslintignore: must exit 0 at max-warnings=0
cd frontend; npx eslint src/pages/certificates/EditCertificatePage.js --max-warnings=0
# - App.js, ProtectedRoute.js, LandingPage.js, AdminDashboard.js, CertificateLogPage.js, PortfolioDashboard.js
#   reside in frontend/.eslintignore (Phase 1C). Scoped diff review verifies zero new styles or color literals:
git diff main -- frontend/src/App.js frontend/src/components/ProtectedRoute.js frontend/src/pages/LandingPage.js frontend/src/pages/admin/AdminDashboard.js frontend/src/pages/certificates/CertificateLogPage.js frontend/src/pages/portfolio/PortfolioDashboard.js

# 6. CRA Unit & A11y Suite
cd frontend; $env:CI="true"; npm test -- --watchAll=false
# Expected: 59 suites pass clean (58 existing + new Loading.test.js)

# 7. Build Gate
cd frontend; $env:CI="true"; npm run build
# Expected: Compiled successfully

# 8. Primitives Browser Suite (Legacy & Themed Frames)
cd frontend; $env:CI="true"; npx playwright test --project=primitives
# Expected: All primitive computed styles pass

# 9. Visual Route Regression Suite (Invariant I13)
cd frontend; $env:CI="true"; $env:NODE_OPTIONS="--max-old-space-size=4096"; npx playwright test --project=visual 2>&1 | Tee-Object -FilePath visual-2f-log.txt
# Expected: 326 passed, 0 diff (or classified per §5.3 protocol)

# 10. Scoped Diff & Constraint E1 Verification
git diff --name-only main
# Expected: Only touched files from Section 4; ZERO legacy shared CSS files (Table.css, Form.css, Modal.css, etc.)
```

### 5.3 Visual Regression Diff Classification Protocol (N3 Alignment)
If any diffs appear in `--project=visual`:
1. **The 4 Migrated Routes** (`admin-1440.png`, `certificates-1440.png`, `certificates-edit-1440.png`, `portfolio-1440.png`):
   - If a diff appears because the mocked load renders `<Loading>` skeleton placeholders where bare text or old spinner ring existed:
     - Classify as an **accepted render difference** (visual output updated to design system primitive).
     - Record in the walkthrough's Accepted-Diff Register with rationale.
     - Regenerate baseline only for that specific route.
2. **All Other 322 Routes**:
   - Any diff is a **leak** or unintended regression.
   - Investigate and eliminate before merging.
3. **Target Expectation**: Because Playwright fixtures mock data resolution and wait for detachment before capture, 326/326 with 0 diff is the expected baseline.

### 5.4 Manual Verification & Proof of Unthemed Fallbacks
1. **LandingPage Verification (Unthemed Auth Surface)**:
   - Navigate to `/` in Chrome.
   - Throttle network to Slow 3G in DevTools.
   - Enter credentials and click "Sign In".
   - Confirm `<Loading variant="inline" />` renders a visible spinning circle (verifying `#ddd` and `#2c3e50` fallbacks render correctly on unthemed background).
   - Verify 2FA verification spinner renders visibly.
2. **Suspense Fallback Verification**:
   - Hard refresh with cache cleared to observe `<Loading variant="route" text="Loading application..." />` before chunk load.

---

## 6. Exit Gate 2F Checklist

- [ ] Primitive #8 (`Loading`) authored in `frontend/src/components/ui/Loading.js` with 5 variants (`route`, `card`, `table`, `form-field`, `inline`).
- [ ] `frontend/src/components/ui/index.js` re-exports `Loading`.
- [ ] `theme.css` updated with `@keyframes fs-pulse`, `.fs-skeleton--*`, `.fs-loading--*`, and documented unthemed token fallbacks.
- [ ] `App.js` and `ProtectedRoute.js` Suspense boundaries use `<Loading variant="route" />`.
- [ ] Five representative proof pages migrated across all 5 variants (`LandingPage`, `AdminDashboard`, `CertificateLogPage`, `EditCertificatePage`, `PortfolioDashboard`).
- [ ] Disposition matrix established for remaining 38 page migrations across Phases 3–11.
- [ ] `Loading.test.js` covers 10 specifications with `jest-axe` zero violations (59 suites pass).
- [ ] `testid-guard.js` verifies zero attribute removals.
- [ ] 326/326 visual regression tests pass at 0 diff (or classified per protocol, Invariant I13).
- [ ] Zero legacy shared CSS files modified (Constraint E1).
- [ ] Tokens, lint-tones, ratchet, manifest, and build pass clean.
