# Review — Implementation Plan UI Phase 5C v8 (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_implementation_plan.md` (v8, 592 lines)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §4, §6.4, §6.9, §6.16, §7.1, §7.2, §9.2, §10, §12), `AGENTS.md`, `docs/ui-plans/walkthrough-template.md`, `docs/ui-plans/phase_2f_walkthrough.md`, `docs/ui-plans/phase_4b_walkthrough.md`, `docs/ui-plans/phase_5a_implementation_plan.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5b_implementation_plan.md`, `docs/ui-plans/phase_5b_walkthrough.md`
- **Companion reviews**: `docs/ui-plans/phase_5c_implementation_plan_review.md` (v1), `docs/ui-plans/phase_5c_implementation_plan_v2_review.md`, `docs/ui-plans/phase_5c_implementation_plan_v3_review.md`, `docs/ui-plans/phase_5c_implementation_plan_v4_review.md`, `docs/ui-plans/phase_5c_implementation_plan_v5_review.md`, `docs/ui-plans/phase_5c_implementation_plan_v6_review.md`, `docs/ui-plans/phase_5c_implementation_plan_v7_review.md`
- **Verdict**: **Implementation-ready.** v8 resolves all three v7 blockers (B12–B14) and every governance/gate gap from the v7 review. Only non-blocking documentation debt remains.

---

## 1. Verified resolution of v7 blockers

| Prior issue | v8 status | Mechanical verification |
| :--- | :--- | :--- |
| **B12 — undefined `--fs-weight-bold`** | **Resolved** | v8 lines 383/388 use `var(--fs-weight-semibold)`. Repo-wide `git grep fs-weight-bold` returns nothing. `tokens.json:125–127` defines only regular/medium/semibold — all tokens used in the scoped block (`--fs-action-bg`, `--fs-action-text`, `--fs-surface-raised`, `--fs-border-strong`, `--fs-duration-fast`, `--fs-ease-standard`, `--fs-focus-ring`, `--fs-focus-offset`, text/radius/weight tokens) exist. `lint-tones.js` Check 2 (`scripts/lint-tones.js:91–114`) will pass. |
| **B13 — preview `text-align: right`** | **Resolved** | `.paycheck-preview-val` (line 381) and `.highlight-color` (line 389) both define `text-align: right`; the I15 matrix (line 570) and Gate 9 (line 510) now assert it. Matches §6.4:1297. |
| **B14a — `#14b8a6` grep** | **Resolved** | Gate 13 command `git grep -n '#14b8a6' -- 'src/**/*.css'` returns exactly `src/styles/tokens.css:36`; `git grep -rn ... src/pages/salary/ src/components/salary/` returns nothing. Expectation now matches architecture (generated `tokens.css` allowed, page CSS zero). |
| **B14b — `overflow-x` exception** | **Resolved** | Gate 13 now names the single pre-existing `TaxSimulator.css:277` and scopes the zero requirement to `PaycheckFormPage.css`; verified output matches exactly. |
| **B14c — Loading deferral gating** | **Resolved** | Gate 13 runs the grep and records the known Amendment 5 exception. (Pattern is weak — see §3.) |
| SHA attribution | **Resolved** | v8 lines 17/39 credit `f3232f6`, which is the commit that actually recorded the six amendments. |
| Precedent citation | **Resolved** | Line 62 cites §6.16:1982 and §10:2509 — both verified (Phase 5D purge item; 2F trail row). |
| I8 line cap | **Resolved** | Gate 8 adds a direct `DashboardSummary.js ≤ 120` assertion; the command executes cleanly (reports 97, exit 0). |
| Axe expectations | **Resolved** | Step 5 and Gate 7 both say "0 serious or critical", matching §7.1:2058–2059. |
| Walkthrough artifact | **Resolved** | §9 item 4 adds the `.eslintignore` post-conversion grep from `walkthrough-template.md:121–127`. |
| Dormant CSS evidence | **Resolved** | Explicit `:focus-visible` rules at lines 236–239 and 363–367; `min-height: 44px` plus Gate 9 assertions at lines 435–437. |

---

## 2. Additional mechanical checks performed

- **9 disbursement types**: `DISBURSEMENT_TYPES` ids at `PaycheckFormPage.js:166–176` map exactly to the nine `type-*` classes under `.toLowerCase().replace(/\s+/g, '-')`. ✓
- **Baseline counts**: 77 inline styles, 9 `DISBURSEMENT_TYPES` hexes, 334/334 manifest, 12 allowlisted routes, 56 page CSS files (59 total − 3 exempt), stylelint violations on `PaycheckFormPage.css` = **86** (the ratchet figure is exact). ✓
- **Ratchet mechanics**: `lint-ratchet.js` compares head to merge-base and forbids increases; wrapping the legacy block in the five `stylelint-disable` rules (`:300–302`) suppresses all 86 current violations, so exit-0 is achievable while the scoped block stays clean. The disable list covers every rule that fires (`color-no-hex`, `color-named`, `function-disallowed-list`, `declaration-property-value-allowed-list` for radii/shadows, `declaration-property-value-disallowed-list`). ✓
- **Harness injection**: `<main id="main-content">` exists at `ProtectedRoute.js:151–157` and wraps routed content; `data-fs-theme` is set via `dataset`, preserving the D22 attribute-existence mechanism. ✓
- **D19/I6**: existing `@media (max-width: 768px)` rule at `PaycheckFormPage.css:415` backs the mobile-collapse claim. ✓

---

## 3. Remaining non-blocking gaps

1. **§10 row SHA is still one commit behind the event it describes.** `UI-UX-PLAN.md:2516` labels the entry "plan approved (v8)" but credits `f3232f6` — the commit that recorded the amendments and the **v7** plan. The v8 document itself was committed as `6ae6136`. v8's own text (lines 17/39) is correct because it only attributes the *amendments* to `f3232f6`. Fix at walkthrough sign-off: credit `6ae6136` for the v8 approval, or split the row.

2. **Master plan §7.1:2068 and §12:1988 remain stale.** Both still say `#14b8a6` must appear only in `theme.css`/`tokens.json`; the actual CSS hit is generated `tokens.css:36`. v8's Gate 13 is correct, but the master plan's own check text is not. Similarly §7.1:2069 says `overflow-x` is allowed only for ≥12-column audit-log exceptions, while `TaxSimulator.css:277` is a 6/4-column table deferred to 5E. Amend those lines or add a recorded waiver so future phases don't re-trip.

3. **`DashboardSummary.js` count is 97, not 96.** v8 line 504 says "currently 96 lines", but the plan's own `split('\n')` command reports 97 (96 content lines + trailing newline). The ≤120 assertion still passes; just correct the parenthetical.

4. **Gate 13 Loading grep is weak.** `git grep -n "Loading"` matches `loadingInitial` and the `<p>Loading profile…` text, not `RefreshCw`. The exception is documented, which satisfies the v7 fix request, but it does not mechanically verify the retained spinner. Consider running §7.1:2070's exact pattern instead.

5. **§4 preconditions don't declare a working directory**, unlike §7 ("all commands from `frontend/`"); the PC commands mix `frontend/`-prefixed paths with `cd frontend`. Ambiguous but harmless.

6. **New `PaycheckFormPageAxe.test.js` ESLint compliance is assumed.** Gate 3 lints it explicitly with `--max-warnings=0`, but the plan doesn't spell out the testing-library/jest rules it must satisfy — the exact class of problem 5B had to fix (B3 / 4.5). Worth a note so implementation doesn't stumble.

---

## 4. Recommendation

Proceed to implementation. v8 is the first version with no hard blockers: the undefined token, missing numeric alignment, and failing Gate 13 greps are all resolved and mechanically confirmed. Clean up the six documentation nits in §3 during the Phase 5C walkthrough (master-plan/progress-log sync is already item 3 of §9), but none of them should hold the branch.
