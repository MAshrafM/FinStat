# Review — Phase 5C Walkthrough (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_walkthrough.md` (head `4e1ec4f` as recorded; branch `phase-ui-5c-paycheck-form-a`)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §4.5, §6.4, §6.9, §6.16, §7.1, §7.2, §10), `docs/ui-plans/phase_5b_walkthrough.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5c_implementation_plan.md` (v8), `docs/ui-plans/phase_5c_implementation_plan_v8_review.md`, `AGENTS.md`
- **Verdict**: **Not ready for sign-off.** The implementation is sound and the quality gates largely check out, but the walkthrough document contains evidence-integrity defects — most seriously a "verbatim" invariants table that is not verbatim, and a Gate 8 command that cannot produce the claimed result. Six documentation nits flagged in the v8 plan review were also not cleaned up as recommended.

---

## 1. Blocking — fix before approval

### 1.1 §4 "Verbatim from UI-UX-PLAN.md §2" is not verbatim (6 of 16 rows substituted)

5B's §4 and 5A's §9 reproduce §2 correctly; 5C replaced I8, I10–I15 with a different rule set (apparently imported from `AGENTS.md` / an older design contract):

| # | Actual `UI-UX-PLAN.md §2` invariant | What 5C §4 claims |
| :--- | :--- | :--- |
| I8 | line cap **+ all 10 RTL dashboard tests green** | paraphrased; test clause dropped |
| I10 | touched suites **and** app route suite pass | "Zero accessibility regressions…" |
| I11 | no new `!important`; ratchet may only fall | "Zero new CSS outside design tokens…" |
| I12 | no new dependency | "Every interactive element must use accent…" |
| I13 | non-allowlisted routes pixel-identical to baseline | "Text on accent must use `--fs-ink`…" |
| I14 | full banned-effects list | simplified paraphrase |
| I15 | neutral by default; no direct tone tokens | **"Numerical values must use monospace numbers"** |
| I16 | radii ceiling | simplified (substantively OK) |

Consequences:

- Real I12 (no new dependency) has **no gate at all** in the walkthrough.
- I10, I11, and I13 evidence exists in §6 but is filed under the wrong rule rows.
- 5C's I15 **contradicts** plan §4.5 / §6.4:1297 (proportional IBM Plex Sans with `tabular-nums`; mono only for identifiers) and contradicts the walkthrough's own B11 and Gate 9 evidence (`font-family: var(--fs-font-sans); font-variant-numeric: tabular-nums; text-align: right`).
- 5C's I13 gives `--fs-ink` as `#101114`; the plan (§4.2) says `#0d0e10`, which matches the walkthrough's own computed `rgb(13, 14, 16)` in Gate 13. `#101114` is `--fs-bg`, not `--fs-ink`.

**Fix**: replace the §4 table rows verbatim from `UI-UX-PLAN.md §2:183–206`, using 5B §4:94–109 as the proven template, and re-map the existing gate evidence to the correct invariant numbers.

### 1.2 Gate 8's recorded command cannot produce the claimed 40/40

The documented command uses `src/pages/dashboard/__tests__/DashboardSummary*.test.js`, which matches only `DashboardSummary.test.js` (**6 tests**) plus `App.test.js` (**9 tests**) = **15 tests**. The implementation plan's Gate 8 names four dashboard suites (6 + 5 + 8 + 12 = **31**) plus 9 = **40**. Either the recorded command or the recorded result is wrong.

**Fix**: record the exact command that was run (all four dashboard suites + `App.test.js`), re-run it if necessary, and paste the real output. Also align the I8 evidence with the plan's current wording (31 tests across 4 suites, not "10 RTL tests").

### 1.3 Preconditions (§2) are miscounted, renumbered, and mislabeled

The section claims "All 8 preconditions from Implementation Plan §2.5 were verified", but v8 has **10 preconditions in §4**. Four are missing: shared theme primitives (PC-2), Loading variants (PC-3), clean git status (PC-8), and loading-state structure (PC-10). PC-1 shows **post-state** output (line 74 already gone) under a "pre-state" heading, and the `§2.5` reference is stale 5B copy-paste (5B correctly cites 10 preconditions from §2.5).

**Fix**: rewrite §2 as the ten §4 preconditions with matching numbering and correct pre-/post-state labels.

### 1.4 SHA / working-tree state does not match the header

The header records head `4e1ec4f`, but actual branch HEAD is `27f4cd5` (the documentation commit that wrote `4e1ec4f` into the walkthrough). In addition, `frontend/tests/visual/a11y.spec.js` has **uncommitted whitespace-only changes**, so Gate 3's ESLint result does not describe committed state.

**Fix**: commit or revert the `a11y.spec.js` change, then record both the code SHA and the walkthrough SHA, as 5B does (`a5f3507` code / `d5c4ff2` walkthrough).

### 1.5 Blocker table omits B14

§1 states "13 blocking items (B1–B13)", but the v8 plan resolved B14 and names Gate 13 "(B14 Resolved)" (`#14b8a6` / `overflow-x` / Loading greps). Add B14 to the table for traceability against `phase_5c_implementation_plan_v8_review.md §1`.

---

## 2. Non-blocking — clean up at sign-off

1. **Master plan §6.9 checkboxes are inverted.** 5B tasks (merged at `6ecef71`) remain `[ ]`; 5C tasks (still unmerged) are `[x]`; the "Recorded Plan Amendments" item at line 1687 is `[ ]` though all six amendments are committed. This violates §0.2–0.3 ("update the Phase Board at the end of every sub-phase"; "partial work is IN PROGRESS, never 'mostly done'").
2. **The v8 review's six documentation nits were not cleaned**, despite the explicit recommendation to do so during the 5C walkthrough (`phase_5c_implementation_plan_v8_review.md §4`):
   - §7.1:2068 and §6.16:1988 still say `#14b8a6` must appear only in `theme.css`; the actual hit is generated `tokens.css:36`.
   - §7.1:2069 still states the `overflow-x` rule without the `TaxSimulator.css:277` exception.
   - §10:2516 credits `f3232f6` for the v8 plan approval; the v8 document was committed as `6ae6136`.
   - Implementation plan line 504 still says `DashboardSummary.js` is "currently 96 lines"; the asserted count is 97.
   - Gate 13's Loading grep (`git grep -n "Loading"`) matches `loadingInitial` and the `<p>Loading profile…` text rather than the retained `RefreshCw` spinner; use §7.1:2070's exact pattern.
   - Implementation plan §4 preconditions declare no working directory, unlike §7.
3. **No "Deviations from Implementation Plan" section** (5B has §7). The production build command differs from the plan (4096 + `GENERATE_SOURCEMAP=false` vs the plan's 8192), and the walkthrough §7 progress-log block differs from the actual §10 row 2517.
4. **Scope wording mismatch.** Master plan §6.9:1686 names only `/salary/paychecks/new`; the walkthrough covers new + edit; 5B §5:149 calls edit an "unmigrated Phase 5D route". Align all three.
5. §10 row 2517 already records 5C as held-on-branch before approval — acceptable only if explicitly framed as IN PROGRESS per §0.3.

---

## 3. Verified correct

- **Scope boundary**: no allowlist change (exactly 12 routes); `/salary/paychecks/new` and `/salary/paychecks/edit/:id` stay unthemed; dual-block CSS with scoped `stylelint-disable` and Phase 5D sunset (Amendment 4) present.
- **Mixed-file rule**: no `style={{` in `PaycheckFormPage.js`; zero global `.fs-*` primitives in JSX; 20 `htmlFor` label pairings; `DISBURSEMENT_TYPES` stripped of presentation hex; diff contains no calculation/handler changes (only `const typeClass = …` presentation addition).
- **Tooling**: `playwright.config.js:37` reference `testMatch` extended; `paycheck-form-reference-match.spec.js` present; `.eslintignore` retains only the three test suites.
- **Evidence artifacts**: five phase-5c screenshots tracked; CHANGELOG.md:393 has the UI Phase 5C entry; four-part diff report present; gates 1–7 and 9–13 match the implementation plan.
- **v8 blockers**: B12 (`--fs-weight-semibold`), B13 (right-aligned preview values), and B14 (grep expectations) all resolved in the implementation plan.

---

## 4. Recommended sequence

1. Replace §4 invariant rows verbatim from `UI-UX-PLAN.md §2` (template: 5B §4) and re-map gate evidence.
2. Reconcile the Gate 8 command with the 40/40 result; paste real output.
3. Rewrite §2 as the ten §4 preconditions with correct labels.
4. Commit/revert the `a11y.spec.js` change; record both code and walkthrough SHAs.
5. Add B14 to §1 and add a Deviations section.
6. Sync §6.9 checkboxes and clean the six v8-review documentation nits.
7. Re-review before merge approval.
