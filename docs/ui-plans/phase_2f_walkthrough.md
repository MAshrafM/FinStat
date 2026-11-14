# Walkthrough — UI Phase 2F: Universal Loading Pattern (D23, `<Loading>` Primitive)

## 1. Executive Summary

Phase 2F implements **Universal Loading Uniformity (Decision D23)** across the FinStat application and delivers **Primitive #8 (`Loading.js`)**, concluding the entire **Phase 2 (Core Theme & Shared UI)** milestone.

Prior to Phase 2F, asynchronous data fetching across FinStat relied on fractured, ad-hoc loading mechanisms: raw `<p>Loading...</p>` tags, bare unstyled text, un-themed animated spinner `div`s, and custom inline classes. Phase 2F unifies all loading visual semantics under a single accessible component (`Loading.js`) with five specialized variants (`route`, `card`, `table`, `form-field`, `inline`), standardized Suspense boundaries, and non-blocking pulse placeholders.

Crucially, Phase 2F equips all CSS loading rules in `theme.css` with **unthemed legacy fallbacks** (`#ddd`, `#2c3e50`, `#6c757d`, `#e9ecef`, `999px`), ensuring spinners and pulse blocks render visibly and correctly across all 60+ unmigrated routes without waiting for per-page conversion phases.

---

## 2. Blocking Issue 1 Evidence: Automated & Live Browser Verification of Unthemed Fallbacks

To ensure that the unthemed fallback bridge (`#ddd`, `#2c3e50`, `#6c757d`, `#e9ecef`, `999px`) functions in production and prevents invisible spinners on unmigrated routes, an automated Playwright browser test was added to [`frontend/tests/visual/primitives.spec.js`](file:///d:/Projects/FinStat/frontend/tests/visual/primitives.spec.js).

### 2.1 Playwright Test Implementation
The test mounts the unauthenticated LandingPage (`/`) on port 3000 in an isolated browser context without `storageState`, intercepts the `/api/auth/login` endpoint with a delayed response to hold `isLoading: true`, submits login credentials, and verifies the inline spinner's live geometry and computed colors.

### 2.2 Execution Transcript
```powershell
PS D:\Projects\FinStat\frontend> $env:CI="true"; npx playwright test --project=primitives
Running 4 tests using 1 worker

[WebServer] (node:1164) [DEP0066] DeprecationWarning: OutgoingMessage.prototype._headers is deprecated
  ok 1 [primitives] › primitives.spec.js:25:3 › Primitives: computed styles verify design system tokens and anti-slop rules (2.5s)
  ok 2 [primitives] › primitives.spec.js:118:3 › SubNav Dual-Mode: computed styles verify legacy vs .fs-page theme override (1.8s)
  ok 3 [primitives] › primitives.spec.js:164:3 › Tabs Interactive Keyboard Navigation: roving focus trace in both orientations (1.8s)
  ok 4 [primitives] › primitives.spec.js:243:3 › LandingPage: unthemed login spinner renders visible fallback on slow response (2.3s)

  4 passed (21.4s)
```

### 2.3 Computed Style & Geometry Assertions
- `document.documentElement.hasAttribute('data-fs-theme')`: `false` (confirms unthemed page context).
- `spinner.boundingBox().width`: `16px` (`> 0`, visible layout dimensions).
- `spinner.boundingBox().height`: `16px` (`> 0`).
- `window.getComputedStyle(el).borderTopColor`: `rgb(44, 62, 80)` (`#2c3e50`, unthemed legacy text fallback).
- `window.getComputedStyle(el).borderLeftColor`: `rgb(221, 221, 221)` (`#ddd`, unthemed legacy border fallback).
- Live browser screenshot captured: [`landing-unthemed-spinner.png`](file:///d:/Projects/FinStat/frontend/tests/visual/output/phase-2f/landing-unthemed-spinner.png) (artifact copy: [landing-unthemed-spinner.png](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-2f/landing-unthemed-spinner.png)).

---

## 3. Blocking Issue 2 Evidence: Raw `git diff --name-only main` Output

Execution of `git diff --name-only main` confirms that **zero legacy shared CSS files** were modified, strictly upholding **Constraint E1**:

```powershell
PS D:\Projects\FinStat> git diff --name-only main
docs/UI-UX_Plan/UI-UX-PLAN.md
docs/ui-plans/phase_2f_implementation_plan.md
docs/ui-plans/phase_2f_walkthrough.md
frontend/src/App.js
frontend/src/components/ProtectedRoute.js
frontend/src/components/ui/Loading.js
frontend/src/components/ui/Tabs.js
frontend/src/components/ui/__tests__/Loading.test.js
frontend/src/components/ui/index.js
frontend/src/pages/LandingPage.js
frontend/src/pages/admin/AdminDashboard.js
frontend/src/pages/certificates/CertificateLogPage.js
frontend/src/pages/certificates/EditCertificatePage.js
frontend/src/pages/portfolio/PortfolioDashboard.js
frontend/src/styles/theme.css
frontend/tests/visual/fixtures/shared/primitives.html
frontend/tests/visual/primitives.spec.js
frontend/tests/visual/visual.spec.js
```

### Explicit Non-Modifications (Constraint E1 Preserved):
- `frontend/src/styles/theme-components.css` — NOT in diff
- `frontend/src/styles/tokens.css` — NOT in diff
- `frontend/src/components/Table.css` — NOT in diff
- `frontend/src/components/Form.css` — NOT in diff
- `frontend/src/components/Modal.css` — NOT in diff
- `frontend/src/components/common/ConfirmModal.css` — NOT in diff
- `frontend/src/components/common/ViewOnlyBanner.css` — NOT in diff
- `frontend/src/components/common/ProtectedAction.css` — NOT in diff
- `frontend/src/components/PaginationControls.css` — NOT in diff
- `frontend/src/components/SummaryRow.css` — NOT in diff
- `frontend/src/components/AnalysisCard.css` — NOT in diff
- `frontend/src/components/salary/ComponentTable.css` — NOT in diff

---

## 4. Blocking Issue 3 Evidence: Diffs of the Six `.eslintignore` Files

Six files modified in Phase 2F reside on `frontend/.eslintignore` (Phase 1C). Scoped diff inspection confirms each change is strictly the loading state replacement with zero new styles, color literals, or layout changes:

### 4.1 Git Diff Stat
```powershell
PS D:\Projects\FinStat> git diff main --stat -- frontend/src/App.js frontend/src/components/ProtectedRoute.js frontend/src/pages/LandingPage.js frontend/src/pages/admin/AdminDashboard.js frontend/src/pages/certificates/CertificateLogPage.js frontend/src/pages/portfolio/PortfolioDashboard.js
 frontend/src/App.js                                   | 3 ++-
 frontend/src/components/ProtectedRoute.js             | 3 ++-
 frontend/src/pages/LandingPage.js                     | 5 +++--
 frontend/src/pages/admin/AdminDashboard.js            | 5 ++---
 frontend/src/pages/certificates/CertificateLogPage.js | 7 ++++++-
 frontend/src/pages/portfolio/PortfolioDashboard.js    | 7 ++-----
 6 files changed, 17 insertions(+), 13 deletions(-)
```

### 4.2 Verbatim Diffs: Global Suspense Boundaries (`App.js` & `ProtectedRoute.js`)
```diff
diff --git a/frontend/src/App.js b/frontend/src/App.js
index 0103707..ada0ae5 100644
--- a/frontend/src/App.js
+++ b/frontend/src/App.js
@@ -5,6 +5,7 @@ import ProtectedRoute from './components/ProtectedRoute'; // Keep standard impor
 import { ToastProvider } from './context/ToastContext';
 import { AuthProvider } from './context/AuthContext';
 import ErrorBoundary from './components/common/ErrorBoundary';
+import { Loading } from './components/ui';
 import './App.css';
 import './components/Table.css';
 
@@ -113,7 +114,7 @@ function App() {
       <ToastProvider>
         <AuthProvider>
           <Router>
-            <React.Suspense fallback={<div className="loading-spinner">Loading...</div>}>
+            <React.Suspense fallback={<Loading variant="route" text="Loading application..." />}>
             <Routes>
               <Route path="*" element={<LandingPage />} />
               <Route element={<ProtectedRoute />}>
diff --git a/frontend/src/components/ProtectedRoute.js b/frontend/src/components/ProtectedRoute.js
index f6301af..e3bde2c 100644
--- a/frontend/src/components/ProtectedRoute.js
+++ b/frontend/src/components/ProtectedRoute.js
@@ -12,6 +12,7 @@ import { CertProvider } from '../context/CertContext';
 import { CurrProvider } from '../context/CurrContext';
 import { BankProvider } from '../context/BankContext';
 import { CreditProvider } from '../context/CreditContext';
+import { Loading } from './ui';
 
 // Themed routes allowlist (Phase 2B: empty; populated incrementally in subsequent phases)
 // Phase 3A will add: '/dashboard'
@@ -143,7 +144,7 @@ const ProtectedRoute = () => {
         } ${themed ? 'fs-page' : ''}`}
       >
         <ViewOnlyBanner />
-        <React.Suspense fallback={<div>Loading...</div>}>
+        <React.Suspense fallback={<Loading variant="route" text="Loading session..." />}>
           {requiredProviders.length > 0 ? (
             <ProviderWrapper providers={requiredProviders}>
               <Outlet />
```

### 4.3 Verbatim Diffs: Four Representative `.eslintignore` Proof Pages
```diff
diff --git a/frontend/src/pages/LandingPage.js b/frontend/src/pages/LandingPage.js
index 8411c4d..ca518ae 100644
--- a/frontend/src/pages/LandingPage.js
+++ b/frontend/src/pages/LandingPage.js
@@ -3,6 +3,7 @@ import React, { useState, useEffect } from 'react';
 import { ChevronRight, DollarSign, TrendingUp, Shield, Smartphone, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 import { loginUser, login2FA } from '../services/authService';
+import { Loading } from '../components/ui';
 import './LandingPage.css';
 
 const LandingPage = () => {
@@ -218,7 +219,7 @@ const LandingPage = () => {
                       className="login-button"
                     >
                       {isLoading ? (
-                        <div className="loading-spinner"></div>
+                        <Loading variant="inline" />
                       ) : (
                         <>
                           <span>Sign In</span>
@@ -307,7 +308,7 @@ const LandingPage = () => {
                       className="login-button"
                     >
                       {isLoading ? (
-                        <div className="loading-spinner"></div>
+                        <Loading variant="inline" />
                       ) : (
                         <>
                           <span>Verify & Continue</span>
diff --git a/frontend/src/pages/admin/AdminDashboard.js b/frontend/src/pages/admin/AdminDashboard.js
index 00f19f0..e0238d2 100644
--- a/frontend/src/pages/admin/AdminDashboard.js
+++ b/frontend/src/pages/admin/AdminDashboard.js
@@ -27,6 +27,7 @@ import { getUsers, createUser, deleteUser } from '../../services/adminService';
 import { dispatchToast } from '../../services/apiClient';
 import ProtectedAction from '../../components/common/ProtectedAction';
 import { useAuth } from '../../context/AuthContext';
+import { Loading } from '../../components/ui';
 import './AdminDashboard.css';
 
 const AdminDashboard = () => {
@@ -299,9 +300,7 @@ const AdminDashboard = () => {
       {/* Card & Table */}
       <div className="admin-card">
         {loading ? (
-          <div className="loading-spinner" style={{ margin: '40px auto' }}>
-            Loading {isManager ? 'viewers' : 'users'}...
-          </div>
+          <Loading variant="card" text={`Loading ${isManager ? 'viewers' : 'users'}...`} />
         ) : users.length === 0 ? (
           <div className="admin-empty-state">
             <div className="admin-empty-icon">
diff --git a/frontend/src/pages/certificates/CertificateLogPage.js b/frontend/src/pages/certificates/CertificateLogPage.js
index 3ba1991..98dcfe3 100644
--- a/frontend/src/pages/certificates/CertificateLogPage.js
+++ b/frontend/src/pages/certificates/CertificateLogPage.js
@@ -9,6 +9,7 @@ import { FaEdit, FaTrash, FaEye, FaHandHoldingUsd, FaPlus, FaTimes, FaExclamatio
 import ProtectedAction from '../../components/common/ProtectedAction';
 import ConfirmModal from '../../components/common/ConfirmModal';
 import { useCanModify } from '../../context/AuthContext';
+import { Loading } from '../../components/ui';
 import '../trades/Trades.css';
 
 const CertificateLogPage = () => {
@@ -101,7 +102,11 @@ const CertificateLogPage = () => {
     };
 
     if (isLoading) {
-        return <p className="page-container">Loading Certificates...</p>;
+        return (
+            <div className="page-container">
+                <Loading variant="table" text="Loading Certificates..." />
+            </div>
+        );
     }
 
     const safeCertList = Array.isArray(certificates) ? certificates : [];
diff --git a/frontend/src/pages/portfolio/PortfolioDashboard.js b/frontend/src/pages/portfolio/PortfolioDashboard.js
index df337ca..403ad97 100644
--- a/frontend/src/pages/portfolio/PortfolioDashboard.js
+++ b/frontend/src/pages/portfolio/PortfolioDashboard.js
@@ -12,6 +12,7 @@ import SummaryCards from '../../components/portfolio/SummaryCards';
 import AllocationChart from '../../components/portfolio/AllocationChart';
 import HoldingsTable from '../../components/portfolio/HoldingsTable';
 import { FaSyncAlt, FaBalanceScale, FaCheck } from 'react-icons/fa';
+import { Loading } from '../../components/ui';
 import './Portfolio.css';
 
 const PortfolioDashboard = () => {
@@ -106,11 +107,7 @@ const PortfolioDashboard = () => {
     return (
       <div className="portfolio-page-wrapper">
         <div className="portfolio-container">
-          <div className="empty-holdings-box" style={{ paddingTop: '100px' }}>
-            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
-            <h2>Loading Unified Investment Portfolio...</h2>
-            <p>Aggregating market prices, multi-asset valuations, and performance metrics.</p>
-          </div>
+          <Loading variant="route" text="Loading Unified Investment Portfolio..." />
         </div>
       </div>
     );
```

---

## 5. Blocking Issue 4 Evidence: Visual Regression Suite Raw Output

The visual regression suite ran all 326 visual route tests across 5 viewports (1440, 1024, 768, 480, 390px). All tests executed and passed with **0 diff** (Invariant I13 preserved).

### Head & Tail from `visual-2f-log.txt`:
```powershell
PS D:\Projects\FinStat> Get-Content frontend/visual-2f-log.txt | Select-Object -First 15
Running 326 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (13ms)
  ok 2 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1440px (10.5s)
  ok 3 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1024px (6.6s)
  ok 4 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 768px (6.6s)
  ok 5 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 480px (4.3s)
  ok 6 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 390px (4.2s)
  ok 7 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 1440px (3.8s)
  ok 8 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 1024px (3.9s)
  ok 9 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 768px (7.6s)
  ok 10 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 480px (6.2s)
  ok 11 [visual] › visual.spec.js:39:7 › Visual Regression Suite › dashboard @ 390px (4.8s)
  ok 12 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 1440px (3.2s)
  ok 13 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 1024px (3.7s)
  ok 14 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 768px (3.0s)
  ok 15 [visual] › visual.spec.js:39:7 › Visual Regression Suite › portfolio @ 480px (3.0s)
```

```powershell
PS D:\Projects\FinStat> Get-Content frontend/visual-2f-log.txt | Select-Object -Last 15
  ok 315 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending @ 480px (4.5s)
  ok 316 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending @ 390px (4.6s)
  ok 317 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 1440px (4.2s)
  ok 318 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 1024px (3.0s)
  ok 319 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 768px (3.5s)
  ok 320 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 480px (3.5s)
  ok 321 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-person-detail @ 390px (3.6s)
  ok 322 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 1440px (4.1s)
  ok 323 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 1024px (3.4s)
  ok 324 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 768px (4.4s)
  ok 325 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 480px (3.6s)
  ok 326 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 390px (3.1s)

  Slow test file: [visual] › visual.spec.js (18.0m)
  Consider splitting slow test files to speed up parallel execution
  326 passed (18.4m)
```

---

## 6. Blocking Issue 5 Evidence: Stylelint Exception Registration & Count Proof

### 6.1 UI-UX-PLAN.md Section 13 Grep
```powershell
PS D:\Projects\FinStat> Select-String -Path 'docs/UI-UX_Plan/UI-UX-PLAN.md' -Pattern '2F stylelint disable block' -Context 0,2

> docs\UI-UX_Plan\UI-UX-PLAN.md:2698:| **2F stylelint disable block (theme.css)** | Temporary bridge for unthemed 
loading fallbacks (`#e9ecef`, `#ddd`, `#2c3e50`, `#6c757d`, `999px`). Sunset: Phase 12 removes the block and migrates 
values to unconditional `:root` in `tokens.css` | Phase 12 (cleanup) |
```

### 6.2 UI-UX-PLAN.md Section 6.16 (Phase 12 Tasks) Grep
```powershell
PS D:\Projects\FinStat> Select-String -Path 'docs/UI-UX_Plan/UI-UX-PLAN.md' -Pattern 'stylelint-disable declaration-property-value-allowed-list' -Context 0,2

> docs\UI-UX_Plan\UI-UX-PLAN.md:1965:- [ ] Remove the stylelint-disable declaration-property-value-allowed-list, 
color-no-hex block from theme.css and eliminate the loading-fallback hex values.
```

### 6.3 Stylelint Disable Count in `theme.css`
```powershell
PS D:\Projects\FinStat> (Select-String -Path 'frontend/src/styles/theme.css' -Pattern 'stylelint-disable').Count
1
```
*(Verified: Exactly **1** single `stylelint-disable` block exists across `theme.css`, strictly bounded to the temporary loading fallback declarations).*

---

## 7. Complete Mechanical Tooling Gates

| Check | Command | Result |
| :--- | :--- | :--- |
| **Token Drift** | `node frontend/scripts/tokens.js --check` | **0 drift** |
| **Tone & Token Linter** | `node frontend/scripts/lint-tones.js` | **0 violations, 0 undefined tokens** |
| **Ratchet Linter** | `node frontend/scripts/lint-ratchet.js` | **0 regressions** |
| **Stylelint AST** | `cd frontend; npx stylelint "src/styles/*.css"` | **0 errors, 0 warnings** |
| **Test ID Guard** | `node frontend/scripts/testid-guard.js` | **0 test IDs or ARIA labels removed (Invariant I5)** |
| **ESLint Changed Files** | `cd frontend; npx eslint <changed-files> --max-warnings=0` | **Exit 0, 0 warnings** |
| **Full Unit & a11y Suite** | `cd frontend; $env:CI="true"; npm test -- --watchAll=false` | **59 passed, 59 total suites (379 tests passed)** |
| **CRA Production Build** | `cd frontend; $env:CI="true"; npm run build` | **Compiled successfully** |
| **Primitives Dual-Mode** | `npx playwright test --project=primitives` | **4 passed (21.4s)** |
| **Reference Frames** | `npx playwright test --project=reference` | **3 passed (18.8s)** |
| **Shell Verification** | `npx playwright test --project=shell` | **7 passed (39.6s)** |
| **Shared Components** | `npx playwright test --project=shared` | **10 passed (27.8s)** |
| **Route Visual Regression** | `npx playwright test --project=visual` | **326 passed (18.4m, 0 diff, Invariant I13 preserved)** |
| **Baseline Manifest** | `node frontend/scripts/verify-baseline-manifest.js` | **334/334 verified successfully** |

---

## 8. Phase 2 Exit Checklist & Sign-Off

With all 5 blocking issues addressed and fully evidenced:
- [x] **Blocking Issue 1**: Automated Playwright test verifying unthemed LandingPage fallbacks on slow response (width > 0, `#2c3e50`, `#ddd`).
- [x] **Blocking Issue 2**: Raw `git diff --name-only main` output verifying 0 legacy shared CSS files modified (Constraint E1).
- [x] **Blocking Issue 3**: Detailed stat and unified diffs for all 6 `.eslintignore` files showing strictly scoped loading changes.
- [x] **Blocking Issue 4**: Raw head and tail ok lines from `visual-2f-log.txt` proving all 326 visual route tests ran and passed at 0 diff (Invariant I13).
- [x] **Blocking Issue 5**: Greps confirming §13 and §6.16 entries in `UI-UX-PLAN.md` and exactly 1 `stylelint-disable` block in `theme.css`.

Phase 2 is formally signed off and complete. Ready for merge to `main`.
