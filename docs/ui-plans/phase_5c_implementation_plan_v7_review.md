# Review — Implementation Plan UI Phase 5C v7 (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_implementation_plan.md` (v7, 568 lines)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §4, §5.10, §6.4, §6.9, §6.16, §7.1, §7.2, §9.2, §12), `docs/ui-plans/phase_5a_implementation_plan.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5b_implementation_plan.md`, `docs/ui-plans/phase_5b_walkthrough.md`, `docs/ui-plans/phase_4b_walkthrough.md`, `docs/ui-plans/phase_2f_walkthrough.md`, `docs/ui-plans/walkthrough-template.md`, `AGENTS.md`
- **Companion reviews**: `docs/ui-plans/phase_5c_implementation_plan_review.md` (v1), `docs/ui-plans/phase_5c_implementation_plan_v2_review.md` (v2), `docs/ui-plans/phase_5c_implementation_plan_v3_review.md` (v3), `docs/ui-plans/phase_5c_implementation_plan_v4_review.md` (v4), `docs/ui-plans/phase_5c_implementation_plan_v5_review.md` (v5), `docs/ui-plans/phase_5c_implementation_plan_v6_review.md` (v6)
- **Verdict**: Still **not implementation-ready**. v7 genuinely resolves v6’s B10 and B11 and syncs most governance items, but it introduces a new hard lint blocker, leaves one numeric-typography claim unimplemented, and its Gate 13 greps cannot pass as written.

---

## 1. Verified fixes from v6

| Prior issue | v7 status | Verification |
| :--- | :--- | :--- |
| **B10 — `DISBURSEMENT_TYPES` hex ban** | **Resolved** | Amendment 6 is now recorded in `UI-UX-PLAN.md:1693`. Current ESLint inventory is 173 errors: 78 hex literals, 94 inline colour-bearing props, 1 functional template literal. The 9 hexes in `DISBURSEMENT_TYPES:167–175` are exactly the remaining constant-source errors; Step 3 removes them and all 77 inline styles, so Gate 3 can reach 0 errors. `dt.color` is used only in presentation JSX at lines 716, 718, 725, 726, 735. |
| **B11 — `.paycheck-preview-val` undefined** | **Mostly resolved** | Scoped rules now exist at `phase_5c_implementation_plan.md:365–377`, and the legacy block is required to contain the class at line 299. |
| **Amendment sync** | **Mostly resolved** | Current `UI-UX-PLAN.md:1687–1693` lists all six amendments; §6.16:1982 records the Phase 5D purge; stale 5D tasks at old lines 1697/1701 are gone. |
| **Build/visual ordering** | **Resolved** | Gate 10 build precedes Gate 11 visual regression. |
| **B9 numeric typography** | **Partially resolved** | `.paycheck-calc-readonly` is correct; preview values still miss `text-align: right` — see B13. |
| **9-type mapping** | **Resolved** | v7 now includes base geometry at lines 170–201 plus full selected/unselected colour/state mapping for all nine types. |
| Preconditions | **Confirmed** | 77 inline styles, 9 constant hexes, 334/334 manifest, 12 allowlisted routes, one `/salary/paychecks` allowlist match, all five new/edit baselines, calculations 11/11, tokens 0 drift, lint-tones baseline clean, working tree clean on `37f6c4a`. |

---

## 2. New blockers

### B12 — Undefined token: `var(--fs-weight-bold)`

v7 line 375 specifies:

```css
.fs-page .paycheck-preview-val.highlight-color {
  font-size: var(--fs-text-xl);
  font-weight: var(--fs-weight-bold);
  color: var(--fs-text);
}
```

But `frontend/src/styles/tokens.json:126–127` defines only:

```json
"--fs-weight-medium": "500",
"--fs-weight-semibold": "600"
```

A repo-wide check found no `--fs-weight-bold` outside this plan line. `lint-tones.js` checks all CSS against `tokens.json` (`frontend/scripts/lint-tones.js:19, 69, 105, 128–140`), so Gate 4’s “all exit 0” expectation would fail as soon as this CSS exists.

**Fix:** use `var(--fs-weight-semibold)`, consistent with D15 / §4.5 “three weights, no 700”. Do not add a new token unless a separate master-plan amendment is recorded.

---

### B13 — Preview values claim `text-align: right`, but the rule does not define it

v7 line 15 says both `.paycheck-calc-readonly` and `.paycheck-preview-val` are explicitly defined with:

```text
font-family: var(--fs-font-sans);
font-variant-numeric: tabular-nums;
text-align: right;
```

The I15 matrix at line 548 repeats that preview and calculated amounts use those three declarations. But `.fs-page .paycheck-preview-val` at lines 366–372, and `.highlight-color` at 373–377, omit `text-align: right`.

This conflicts with master plan §6.4 line 1297: numeric data must be proportional with `tabular-nums`, right-aligned.

Gate 9 at line 419 also checks only font family and tabular figures, so it would not catch the omission.

**Fix:** add `text-align: right;` to both preview rules and add a computed-style assertion to Gate 9.

---

### B14 — Gate 13 greps are mechanically wrong

Gate 13 at v7 lines 518–524 cannot pass as written.

#### 14a. `#14b8a6` command/expectation mismatch

The plan runs:

```powershell
git grep -rn '#14b8a6' src/styles/
```

and expects the colour to exist “strictly in `tokens.json` and `theme.css`”. Current output from `frontend/`:

```text
src/styles/chartTheme.js:7
src/styles/tokens.css:36
src/styles/tokens.json:45
src/styles/tokens.json:214
src/styles/tokens.json:300
src/styles/__tests__/chartTheme.test.js:59
src/styles/__tests__/chartTheme.test.js:60
```

`theme.css` has **zero** raw `#14b8a6`; `tokens.css` is generated and expected by D22. The grep also catches comment-only matches. §7.1 line 2068 itself says CSS-wide grep should return only `theme.css`, which is already inconsistent with the generated token layer.

**Fix:** align the command and expected allowlist with the current architecture — e.g. grep CSS only and allow generated `tokens.css`, while keeping page CSS at zero; exclude or explicitly allow chartTheme/test comments. If §7.1 is stale, amend it rather than inventing a broader failing gate.

#### 14b. `overflow-x` finds an undocumented pre-existing exception

The plan runs:

```powershell
git grep -n "overflow-x" src/pages/salary/
```

Current output:

```text
src/pages/salary/TaxSimulator.css:277:  overflow-x: auto;
```

The plan says “zero unapproved `overflow-x` declarations” but does not identify this one. It is a 6-column bracket table / 4-column waterfall table, not a documented ≥12-column audit-log exception under I6 or §7.1:2069.

**Fix:** either document/waive that exception at master-plan level, or scope the gate to 5C-touched CSS and explicitly state that TaxSimulator is a deferred 5E pre-existing item. “Zero unapproved” is not mechanically decidable as written.

#### 14c. Loading consistency is only noted, not gated

Amendment 5 records the D23 deferral, which is acceptable at document level, but Gate 13 still does not run the §7.1:2070 loading-consistency grep or record its expected result. The current grep pattern would not catch `RefreshCw` anyway.

**Fix:** run the §7.1 command and record: “expected known 5C exception: legacy `RefreshCw` retained per Amendment 5; adoption moved to 5D.”

---

## 3. Remaining governance / gate gaps

- **Wrong amendment SHA attribution.** v7 lines 17 and 39 say all six amendments were recorded at `993f1e2`. Git shows the opposite:
  - `993f1e2` recorded only four §6.9 amendments and a v6-style §10 row with no amendment 6 and SHA `—`.
  - `f3232f6` added the tooling amendment, amendment 6, stale-5D-task cleanup, and the §10 v7 row.
  - The current §10 row at `UI-UX-PLAN.md:2516` still credits `993f1e2`.

  Correct the row/plan text to `f3232f6`, or state that `993f1e2` began the work and `f3232f6` completed it.

- **Wrong precedent citation.** v7 line 62 cites “`UI-UX-PLAN.md §12` line 1968”; line 1968 is blank before §6.16. Correct references are §6.16:1982 and the 2F trail in §10:2509.

- **I8 line-cap matrix overstates Gate 8.** The matrix says the line cap is verified, but Gate 8 only runs tests. Add a direct `DashboardSummary.js ≤ 120` assertion (currently 96 lines).

- **Axe expectation mismatch.** Step 5 says zero critical/serious violations; Gate 7 says zero axe violations. Align both to §7.1’s “0 serious/critical”.

- **Walkthrough artifact gap.** §9 omits the `.eslintignore` post-conversion grep required by `walkthrough-template.md:121–127`.

- **Dormant CSS evidence gaps.** The I6/I9 claims about mobile touch targets and focus-visible rings are not backed by explicit scoped rules or a Gate 9 assertion. Page-local buttons do not use `.fs-btn`, so focus styling is not inherited from `theme.css:335–336`.

---

## 4. Recommendation

Fix **B12–B14**, then correct the SHA/citation and small gate-fidelity gaps. With those changes, v7 would be the first version that is genuinely implementation-ready. As written, the undefined token and the failing Gate 13 expectations block it.
