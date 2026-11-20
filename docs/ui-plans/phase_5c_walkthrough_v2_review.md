# Review — Phase 5C Walkthrough v2 (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_walkthrough.md` (v2; header records code commit `42fc45b`, head `ab4ce52`, actual branch HEAD `94ad9cd`)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §6.4, §6.9, §6.16, §7.1, §10), `docs/ui-plans/phase_5b_walkthrough.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5c_implementation_plan.md` (v8), `docs/ui-plans/phase_5c_implementation_plan_v8_review.md`, `docs/ui-plans/phase_5c_walkthrough_review.md` (v1 review)
- **Verdict**: **Substantially ready.** v2 resolves all five blocking findings from the v1 review and most non-blocking drift. Two items merit attention before sign-off — one substantive (a11y gate scope), one bookkeeping (header SHA) — plus four minor traceability nits.

---

## 1. Resolved since v1

| v1 finding | v2 status |
| :--- | :--- |
| §4 invariants not verbatim | **Fixed** — I8–I16 now match §2:183–206 exactly; I15 restored to neutral-by-default; I13's incorrect `--fs-ink` hex removed |
| Gate 8 command could not yield 40/40 | **Fixed** — §6 Gate 8 names all four dashboard suites + `App.test.js` with exact per-suite split (6 + 5 + 8 + 12 + 9 = 40), matching independent test-count verification |
| Preconditions miscounted/renumbered | **Fixed** — §2 covers all 10 §4 preconditions with correct pre-/post-state labels and the correct `§4` reference |
| SHA / dirty working tree | **Fixed** — `42fc45b` committed the `a11y.spec.js` cleanup; tree is clean; both code and doc commits listed (see §2.2) |
| Missing B14 | **Fixed** — §1 now lists B1–B14 |
| Master plan §6.9 checkboxes inverted | **Fixed** — 5B `[x]`, 5C `[ ]`, amendments `[x]`; scope line 1686 now names both routes |
| v8-review documentation nits | **Fixed** — §7.1:2068 and §6.16:1988 now say `tokens.css`; §7.1:2069 includes the TaxSimulator exception; §10:2516 credits `6ae6136`; plan line 504 says 97 lines; §10 row 2517 marked IN PROGRESS |
| No deviations section | **Fixed** — §8 documents build tuning, a11y harness injection, and Gate 8 clarification |

---

## 2. Remaining — address before sign-off

### 2.1 Playwright axe gate now tests the dormant harness, not the production route (substantive)

`frontend/tests/visual/a11y.spec.js:30–39` injects `data-fs-theme="dark"` and adds `.fs-page` to `<main>` for `salary-paychecks-new` and `salary-paychecks-edit`. Walkthrough §8 deviation 2 documents this transparently, and it is defensible for a styles-only phase.

However, §7.1's "Playwright axe: 0 serious/critical on touched routes" is no longer tested against what users actually see. §8 itself concedes the unthemed CSS has "pre-existing contrast deficiencies" (`#009879`, `#6c757d` on light backgrounds). Neither the 5D task list (`UI-UX-PLAN.md §6.9:1699–1706`) nor the Phase 5 exit gate explicitly requires re-running the axe spec **without** harness injection after allowlisting.

**Recommendation**: record "re-run `a11y.spec.js` un-injected on both paycheck-form routes immediately upon Phase 5D allowlisting" as a named 5D exit-gate item with an owner, so the deferred gap is not lost at the phase boundary.

### 2.2 Header SHA is still self-referential

Header records "Head commit: `ab4ce52`; code commit: `42fc45b`", but actual branch HEAD is `94ad9cd` — the documentation commit that wrote that line. `ab4ce52` is the prior walkthrough-fix commit. Use the 5B format: "Code commit: `42fc45b` / Walkthrough commit: `94ad9cd`".

### 2.3 Minor traceability nits

1. §1 B1/B2 says "Recorded Amendment 1" for the stylelint-disabled legacy block — that is **Amendment 4** (Amendment 1 is the `.eslintignore` de-ignore). B3 says "Recorded Amendment 2" — Amendment 2 is the `playwright.config.js` `testMatch` extension; the semantic-class separation has no amendment number.
2. §8 deviation 3 misquotes the plan: "Plan Specification: `DashboardSummary*.test.js`" — the v8 plan's Gate 8 (line 501) already names all four dashboard suites; the glob appeared in the **v1 walkthrough**. Correct the attribution instead of presenting it as a plan deviation.
3. Gate 13's Loading check remains weak: implementation plan line 540 still uses `git grep -n "Loading"` instead of §7.1:2070's exact pattern, and the walkthrough's §6 Gate 13 omits the grep entirely while documenting the exception.
4. Implementation plan §4 preconditions still declare no working directory (the last unfixed v8-review nit).

---

## 3. Still verified correct

- Scope boundary: no allowlist change (12 routes); both form routes unthemed; dual-block CSS with scoped `stylelint-disable` and Phase 5D sunset (Amendment 4).
- Mixed-file rule: no `style={{` in `PaycheckFormPage.js`; zero global `.fs-*` primitives in JSX; 20 `htmlFor` pairings; `DISBURSEMENT_TYPES` stripped of presentation hex; diff contains no calculation/handler changes.
- Tooling: `playwright.config.js:37` reference `testMatch` extended; `paycheck-form-reference-match.spec.js` present; `.eslintignore` retains only the three test suites.
- Evidence artifacts: five phase-5c screenshots tracked; `CHANGELOG.md:393` UI Phase 5C entry present; four-part diff report present; gates 1–7 and 9–13 match the implementation plan.
- v8 blockers B12, B13, B14 resolved; all 13 quality gates reported passing.

---

## 4. Recommended sequence

1. Add the un-injected axe re-run to the Phase 5D exit gate in `UI-UX-PLAN.md §6.9`/exit criteria.
2. Correct the header to code commit `42fc45b` / walkthrough commit `94ad9cd`.
3. Fix the four minor traceability nits in §2.3.
4. Re-review, then approve and merge per §3.1 (developer merges; CI on `main` is authoritative).
