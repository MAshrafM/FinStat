# UI Sub-Phase Walkthrough Template

> **Sub-phase**: UI Phase [X] — [Name]  
> **Target Routes**: [List routes]  
> **Date**: [YYYY-MM-DD]  
> **Status**: Ready for Review / Merged  

---

## 1. Executive Summary & Progress Log Entry (§10)

```
Sub-phase:   UI Phase [X] — [Name]
Status:      DONE
Done:        [Detailed summary of accomplishments, inline styles removed, files unignored, primitives used]
Next:        UI Phase [Next Sub-phase]
Blocked by:  None
Allowlist:   THEMED_PATTERNS expanded to [N] routes (+[K]: [list routes])
Visual diff: 0 diff across [N] unallowlisted routes; exactly [M] accepted diffs ([K] snapshots regenerated)
Fixtures:    calculations.spec.js passing 100% (byte-identical)
Screenshots: Captured across 5 viewports (1440, 1024, 768, 480, 390)
Branch:      phase-ui-[x]-[slug]
Merge SHA:   [commit SHA upon merge to main]
```

---

## 2. Invariant Compliance Checklist (Action Plan §2 Verbatim)

The following table is copied verbatim from `docs/UI-UX_Plan/UI-UX-PLAN.md` §2. Every sub-phase walkthrough must state compliance against these exact rules.

| # | Rule (Verbatim from Action Plan §2) | Verification Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :---: | :--- |
| **I1** | Production routes and URLs unchanged — 75 entries (74 protected + `*`), 10 redirects. | `App.test.js` route-resolution test; `ui-coverage.js` diff | PASS | [Evidence] |
| **I2** | No API call, payload shape, or service file changed. | PR diff review; blocked path list in CI | PASS | [Evidence] |
| **I3** | No calculation changed on **any** page: payroll, installment schedules, debt payoff, trade P&L, certificate maturity/interest, FX conversion, budget thresholds, real-estate yield. | Characterization fixtures (§9.6) | PASS | [Evidence] |
| **I4** | Auth, roles, `ProtectedAction`, and `useCanModify` gating unchanged. | Viewer-role checklist per phase | PASS | [Evidence] |
| **I5** | Test IDs, `data-*` attributes, and accessible labels preserved — 37 `data-testid`, 39 `aria-label`. | test-ID guard script (§9.2) | PASS | [Evidence] |
| **I6** | Tables render as compact-expand cards at ≤ 768px (D19). Horizontal scroll preserved only for tables with ≥ 12 columns (audit logs) where the card pattern is impractical. No page-level horizontal scroll at 390px. | 390 px visual check: card layout renders, no page-level horizontal scroll, all fields reachable via expander. | PASS | [Evidence] |
| **I7** | No page loses functionality mid-migration. | Pattern added only in the converting PR (§6.3) | PASS | [Evidence] |
| **I8** | Dashboard coordinator line cap preserved — `DashboardSummary.js` must remain $\le 120$ lines (post-audit architecture decomposition invariant). All 10 RTL dashboard tests must remain green. | Line count assertion + `npm test` in 3A | PASS / N/A | [Evidence] |
| **I9** | Production build passes with zero errors and no new warnings. | CI (authoritative); local proxy via `npm start` + ESLint/stylelint (§15) | PASS | [Evidence] |
| **I10** | `npm test -- --watchAll=false` passes for touched modules **and** the app route suite. | CI (frontend test job added in 1C); local proxy: touched suites via `npx jest --runInBand` (§15) | PASS | [Evidence] |
| **I11** | No new `!important`; a file's count in the 1C lint ratchet may only fall. | stylelint + `lint-ratchet.js` (§9.2) | PASS | [Evidence] |
| **I12** | No new dependency except the Phase 1C tooling list (§9.2). | `package.json` review | PASS | [Evidence] |
| **I13** | Every non-allowlisted route is pixel-identical to its 1B baseline. | Walkthrough-evidenced per §7.1: developer-run Playwright diff report attached to each phase walkthrough, with zero unexplained diffs. | PASS | [Evidence] |
| **I14** | No `backdrop-filter`, gradient, gradient text, glow, `filter: blur()` / `drop-shadow()`, `text-shadow`, `mask`, `-webkit-mask`, `-webkit-mask-image`, `mask-image`, `border-image`, or `border-image-source` anywhere in app CSS or JS; only the reference frames illustrate them. | stylelint (§9.2) | PASS | [Evidence] |
| **I15** | Neutral by default: a tone encodes **deviation from expectation or attention**, never the sign of an ordinary amount. Expense amounts, income, and balances are neutral (§4.3). A page never references a tone token directly; it uses `Delta`, `Badge`, or a `.fs-progress--*` modifier. | stylelint + `lint-tones.js` + §4.3 domain table + §7.2 | PASS | [Evidence] |
| **I16** | No radius above 8 px except `var(--fs-radius-pill)` on status chips and avatars. | stylelint (§9.2) | PASS | [Evidence] |

---

## 3. Visual Regression Diff Report (§7.1)

Per §7.1 of the Action Plan, visual regression testing is walkthrough-evidenced. The local Playwright visual suite compares the application against `D:\Projects\FinStat-visual-baselines`.

### Diff Summary:
- **(a) Total routes compared**: [Total routes tested, e.g. 61 routes × 5 viewports = 305 captures]
- **(b) Routes with zero diff**: [Number of unallowlisted routes passing at 0 diff, e.g. 56 routes × 5 viewports = 280 captures]
- **(c) Routes with accepted diffs**: [Number of newly allowlisted routes, citing AD items, e.g. 5 routes × 5 viewports = 25 captures]
  - `/[route-1]`: Accepted diff per AD-[X] ([Description of intentional overhaul])
  - `/[route-2]`: Accepted diff per AD-[X] ([Description of intentional overhaul])
- **(d) Routes with unexplained diffs**: **0** (strictly required — any unexplained diff blocks merge)

### Manifest Integrity:
- **Baseline Manifest**: `node frontend/scripts/verify-baseline-manifest.js`
- **Result**: [e.g. `All 334 baseline images verified successfully (0 mismatches, 0 missing).`]

---

## 4. Automated Gate Verification Results

### 4.1 Design Tokens Integrity (`tokens.js --check`)
```powershell
node frontend/scripts/tokens.js --check
```
```
[Paste output here]
```

### 4.2 Tone & Accent Scoping (`lint-tones.js`)
```powershell
node frontend/scripts/lint-tones.js
```
```
[Paste output here]
```

### 4.3 Stylelint Ratchet & Radius Ceiling (`lint-ratchet.js`)
```powershell
node frontend/scripts/lint-ratchet.js
```
```
[Paste output here]
```

### 4.4 Test ID & Accessible Label Guard (`testid-guard.js`)
```powershell
node frontend/scripts/testid-guard.js
```
```
[Paste output here]
```

### 4.5 Route Allowlist Assertion (`ui-coverage.js --assert-allowlist`)
```powershell
node frontend/scripts/ui-coverage.js --assert-allowlist
```
```
[Paste output here]
```

### 4.6 ESLint Hygiene on Touched Files
```powershell
npx eslint [touched files] --max-warnings=0
```
```
[Paste output here]
```

### 4.7 `.eslintignore` Post-Conversion Grep
```powershell
git grep -in "[domain]" frontend/.eslintignore
```
```
[Paste output here — Expected: 0 matches]
```

### 4.8 Jest Test Suites (In-Band)
```powershell
npx --prefix frontend jest --runInBand [touched test suites]
```
```
[Paste output here]
```

### 4.9 Calculation Characterization Fixtures (Invariant I3)
```powershell
npx --prefix frontend jest --runInBand tests/calculations.spec.js
```
```
[Paste output here]
```

### 4.10 Production Bundle Build (Invariant I9)
```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm --prefix frontend run build
```
```
[Paste output here]
```

---

## 5. Visual Proof & Screenshots

Attach side-by-side or carousel screenshots comparing converted views at desktop (`1440px`) and mobile (`390px`) against canonical reference frames (01 dense table, 02 form, 03 dashboard).
