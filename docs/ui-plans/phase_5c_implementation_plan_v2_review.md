# Review — Implementation Plan UI Phase 5C v2 (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_implementation_plan.md` (v2, 388 lines, untracked draft)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §4, §5.10, §6.4, §6.9, §7.1), `docs/ui-plans/phase_5a_implementation_plan.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5b_implementation_plan.md`, `docs/ui-plans/phase_5b_walkthrough.md`, `docs/ui-plans/phase_4c_walkthrough.md`, `docs/ui-plans/walkthrough-template.md`, `AGENTS.md`
- **Companion review**: `docs/ui-plans/phase_5c_implementation_plan_review.md` (review of v1)
- **Verdict**: v2 resolved all seven v1 blockers at the document level, but is **still not implementation-ready**. The fixes are asserted rather than reconciled with the actual linting and visual-gate mechanics. Six new blocking issues and six factual errors remain.

---

## 1. Confirmed fixed from v1

| v1 blocker | v2 resolution | Verified |
| :--- | :--- | :--- |
| Wrong `§6.10` citation | Corrected to `§6.9` everywhere (lines 7, 8, 9, 19, 23, 34, 46) | Yes |
| Seven undefined tokens | All 21 `var(--fs-*)` references in v2 validate against `frontend/src/styles/tokens.json` | Yes |
| Direct accent/tone tokens in page CSS | Only remaining mention is explanatory at line 170; CSS spec uses neutral tokens and theme primitives | Yes |
| `.eslintignore` removal assigned to wrong sub-phase | Recorded amendment in §3 (lines 34–43) with tracking updates; three test files remain ignored | Yes |
| Wrong invariant set | Replaced with verbatim §2 I1–I16 matrix (§8, lines 367–388) | Yes |
| Dual-mode scoping asserted, not specified | Explicit in line 11, §6 Component 1.1, and line 266; `fs-page` not added in 5C | Yes |
| No visual-regression gate / 325 count | 334 count, 13 gates incl. testid-guard, Frame 02 spec, four-part report | Yes (but see B3/B4) |

Also added: 10 preconditions (PC-1…PC-10), `DISBURSEMENT_TYPES` presentation-data justification (§6 Component 2.3), a deferred-scope list (§3), and hex-isolation intent.

---

## 2. New blocking issues

### B1 — Stylelint exit-0 gate contradicts byte-identical legacy CSS

- Gate 4 (lines 301–308) requires `npx stylelint src/pages/salary/PaycheckFormPage.css` to exit 0 with "no banned hex literals, no unlisted radii, no banned gradients or blurs."
- Line 151 requires retaining unscoped legacy CSS **byte-identically** — that CSS contains `#ffffff`, `#e9ecef`, `rgba(...)`, literal `8px`, and glow `box-shadow`. Verified: the current file exits **2** with roughly 50 violations; `frontend/.stylelintrc.json` ignores only `src/styles/tokens.css`.
- Gate 14 (line 386) then says "Legacy gradient button and glow shadows eliminated" — the opposite of byte-identical retention.
- `scripts/lint-ratchet.js` tolerates pre-existing violations on unmigrated files ("violation count may only fall or remain equal"), but the **direct** stylelint call does not. Gate 4 cannot pass as written.

**Needs:** an explicit decision — either a documented stylelint exemption for the dormant unscoped block (and drop the exit-0 expectation for this file), or acknowledge that 0-diff and stylelint-0 are mutually exclusive and escalate a plan amendment.

### B2 — Removing 77 inline styles cannot preserve 0-diff unthemed appearance

The ten legacy hex colors live in **inline styles and `DISBURSEMENT_TYPES` data**, not in the stylesheet. Line 151 promises "baseline unscoped rules that match the current unthemed visual presentation" — but reproducing `#009879`, `#6366f1`, `#fffbeb`, `#166534`, etc. requires banned hex literals, and no dark-theme token renders those colors.

Concrete example: the default `disbursementType: 'Regular'` (source ~line 294) renders the selected button in `#009879`. v2 removes `dt.color` (line 259) and defines `.selected` only under dormant `.fs-page` with neutral tokens (lines 167–170). **The unthemed selected button loses its green — a guaranteed diff on both baselines.** The same problem applies to the calculated-gross inputs, error banner, YTD banner, and save-button gradient.

Related contradiction: PC-10 (line 106) says the unthemed loading render "must not be modified," while line 226 extracts its inline styles into new classes.

**Needs:** an explicit compatibility contract — retain color-bearing inline styles until 5D, or add a documented unscoped color-preservation exception, or declare the new/edit baselines as accepted diffs (which breaks I13's intent).

### B3 — Reference Frame 02 spec won't be discovered by Playwright

Gate 9 (lines 334–335) creates `frontend/tests/visual/paycheck-form-reference-match.spec.js`. Verified `frontend/playwright.config.js` `reference` project has a **fixed** `testMatch`:

```js
/(reference-frames|dashboard-reference-match|expenditure-reference-match|expenditure-form-reference-match)\.spec.js/
```

The new filename is excluded, so the spec would never run. Needs the testMatch regex extended (a tooling change requiring its own amendment) or the spec renamed to an existing pattern. The gate also describes assertions but does not author them.

### B4 — PR-subset command is wrong; viewport claim is false

- Gate 10 (line 339) runs `npx playwright test tests/visual/pr-subset.spec.js`. **No such file exists** — verified: `frontend/tests/visual/` contains no `*subset*` spec. The `pr-subset` project's testMatch is `/visual\.spec\.js/`, and 5B used `CI=true PR_SUBSET=true npx playwright test --project=pr-subset`. Without `PR_SUBSET=true`, the subset logic is inert.
- Line 343 claims new/edit are compared at all 5 widths. Verified `frontend/tests/visual/visual.spec.js` runs all routes only at **1440** in subset mode; the extra 390 run is limited to `SMOKE_ROUTE_SLUGS` (`salary-paychecks`, **not** `salary-paychecks-new` / `-edit`). Their 5-viewport PNGs exist on disk but the PR-subset gate will not compare them.

### B5 — Selected disbursement button has no distinct selected cue

Lines 167–170 give base and `.selected` identical styling (`--fs-surface-raised`, `1px solid --fs-border-control`, `box-shadow: none`); only hover changes the border to `--fs-border-strong`. Once `dt.color` is removed, there is no selected indicator beyond the focus ring. §6.4 line 1284 requires "active state plus the 2px left rule (G5)," and Reference Frame 02 shows a distinct selected state. Needs a non-accent cue (left rule, `--fs-border-strong`, or check glyph).

### B6 — Axe gate is not an axe gate

Gate 7 (lines 322–326) is labeled "Jest-Axe & Accessibility Test Verification" but simply runs the existing `src/pages/salary/__tests__/PaycheckFormPage.test.js` — verified **9 tests, 0 axe references**, no jest-axe matcher configured. §7.1 lines 2048–2049 require both jest-axe on touched components and a real-browser Playwright axe scan. The 20 label fixes are currently evidenced only by ESLint.

---

## 3. Factual errors to correct

- **Line 332:** "DashboardSummary 10/10" — the actual file has **6 tests**; prior walkthroughs report 31 across 4 dashboard suites.
- **Lines 355–357:** expected `#14b8a6` only in `tokens.json`, `tokens.css`, `theme.css` — grep also finds it in `src/constants/__tests__/categories.test.js`, `src/pages/reports/ComprehensiveReportPage.js:154`, `src/styles/__tests__/chartTheme.test.js`, and `src/styles/chartTheme.js`. The gate would fail as written.
- **Line 376 (I4):** "Viewer-role ProtectedAction submit gating preserved in `PaycheckFormPage.js`" — grep for `ProtectedAction|useCanModify` in that file returns **nothing**. Cite the real location or drop the claim.
- **Line 73 (PC-3):** expects only `'route', 'card', 'inline'` — actual `Loading.js` `VALID_VARIANTS` is `['route', 'card', 'table', 'form-field', 'inline']`.
- **Line 90 (PC-7):** titled "Hex Code Isolation Pre-Check" but only counts `style={{`. Rename or add a real hex scan.
- **Lines 199/236 (error banner):** current markup has a glyph and `<strong>Statutory Preview Calculation Warning:</strong>` (source lines 1139–1141). v2's neutral restyle should explicitly preserve these non-color cues per §4.3/§6.4.

---

## 4. Recommended path

Before implementation:

1. Resolve B1/B2 with a single written rule for how unthemed color fidelity survives stylelint — this is the core architectural conflict.
2. Fix the gate plumbing: B3 (config `testMatch`), B4 (command + env vars + viewport claim), B6 (real axe assertions).
3. Add a distinct selected-state cue (B5).
4. Correct the six factual errors and the PC-10 / Component 2.2 contradiction.

v2 is close — the governance scaffolding is now right. What remains is making the gates mechanically true rather than aspirational.
