# Review — Implementation Plan UI Phase 5C v3 (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_implementation_plan.md` (v3, 419 lines, untracked draft)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §4, §5.10, §6.4, §6.9, §7.1), `docs/ui-plans/phase_5a_implementation_plan.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5b_implementation_plan.md`, `docs/ui-plans/phase_5b_walkthrough.md`, `docs/ui-plans/phase_4c_walkthrough.md`, `docs/ui-plans/walkthrough-template.md`, `AGENTS.md`
- **Companion reviews**: `docs/ui-plans/phase_5c_implementation_plan_review.md` (v1), `docs/ui-plans/phase_5c_implementation_plan_v2_review.md` (v2)
- **Verdict**: v3 resolved all six v2 blockers at the document level and corrected every factual error from the v2 review. One blocking issue and one harness decision remain, plus minor inconsistencies.

---

## 1. Confirmed fixed from v2

| v2 issue | v3 resolution | Verified |
| :--- | :--- | :--- |
| B1 stylelint vs byte-identical CSS | Compatibility Contract (lines 11–13, 29–30): unscoped block governed by `lint-ratchet.js` (≤86); direct stylelint deferred to 5D; gate 4 drops the direct call | Current CSS = **86 violations**; `lint-ratchet.js` exits 0 — yes |
| B2 inline-style 0-diff impossibility | Unscoped per-type classes (`.paycheck-type-btn.type-regular.selected`, `.paycheck-submit-btn-legacy`) preserve legacy colors | Approach feasible; count problem in §2.1 |
| B3 Frame 02 spec undiscoverable | Tooling Amendment 2 extends `testMatch` at `frontend/playwright.config.js:37` | Verified line 37 is the exact regex — yes |
| B4 PR-subset command/viewport | `CI=true PR_SUBSET=true … --project=pr-subset`; 1440-only claim corrected | Playwright `--list` → **71 tests**, new/edit at 1440 only — yes |
| B5 no selected cue | Distinct cue added: `border-left: 3px solid var(--fs-text-2)`, sunken surface (lines 181–182) — yes (3px vs G5's 2px is minor) | Yes |
| B6 axe not real | `jest-axe ^11.0.0` installed; new `PaycheckFormPageAxe.test.js` + Playwright `a11y` project with `-g` filter | jest-axe present; slugs match test titles — yes |
| F1–F6 factual errors | 31 dashboard tests (6+5+8+12 verified), scoped `#14b8a6` grep (0 hits), I4 corrected, PC-3 full variant list, PC-7 hex scan, banner glyph/label preserved, 9 `DISBURSEMENT_TYPES` colors | All verified |

---

## 2. Remaining issues

### 2.1 BLOCKING — The ratchet cannot stay at 86 after adding the unscoped color rules

- Lines 12, 30, 162 and 320 repeatedly assert "violations ≤ 86 (ratchet preserved)".
- `frontend/scripts/lint-ratchet.js` rule: *"violation count may only fall or remain equal"* against the merge base (currently 86 for `PaycheckFormPage.css`, verified by stylelint JSON output: 62 × `color-no-hex`, 17 × `declaration-property-value-allowed-list`, 6 × `function-disallowed-list`, 1 × `color-named`).
- The compatibility contract requires **adding** unscoped rules carrying the legacy inline-style colors (`#009879`, `#6366f1`, `#fffbeb`, `#166534`, `#4f46e5`, etc.). Each is a new `color-no-hex` / `function-disallowed-list` violation, so the count necessarily rises **above 86** → ratchet regression → gate 4 fails.

This is the v2 B1/B2 conflict in a new form: the ratchet was chosen to resolve the stylelint contradiction, but the chosen 0-diff mechanism breaks the ratchet. Needs one explicit mechanism, e.g.:

- scoped `stylelint-disable` comments on the added legacy block with count-neutralising effect, or
- an amendment setting a new per-file ceiling, or
- restructuring so the added classes reuse the existing 86 violations rather than adding new ones.

**Must be resolved before implementation.**

### 2.2 Needs a harness decision — Frame 02 spec tests dormant styles on an unthemed route

Gate 9 (lines 352–366) asserts the Save CTA has `rgb(20, 184, 166)` accent, exactly one accent CTA, `.fs-page` card surfaces, etc. But 5C deliberately keeps the route unthemed and all `.fs-page` rules dormant (lines 8, 163, 279). On the live route the Save button renders with the unscoped legacy gradient (`.paycheck-submit-btn-legacy`, line 255) — **the assertions will fail**.

The 4B precedent (`frontend/tests/visual/expenditure-form-reference-match.spec.js`) navigates to an **allowlisted, themed** route, which 5C does not have. v3 fixed discovery of the spec but not its feasibility. Needs either:

- a test-only harness that injects the `fs-page` class (via `addInitScript` / `page.evaluate`) so dormant rules can be asserted, or
- deferral of this gate to 5D with a 5C structural substitute.

### 2.3 Minor inconsistencies

- **Line 112 vs 239:** PC-10 says the unthemed loading render "must not be modified," while line 239 extracts its inline styles into classes and claims "DOM preserved byte-identically" — replacing `style={{…}}` with `className` is not byte-identical DOM. Pick one wording.
- **Line 373:** "(66 routes at 1440px + 5 smoke routes at 390px)" — authoritative `npx playwright test --project=pr-subset --list` shows **65** at 1440 + 5 at 390; the 71 total is correct but the parenthetical breakdown is off by one.
- **Line 182:** G5 in §6.4 specifies a **2 px** left rule; v3 uses 3 px — minor deviation from the reference frame.
- Hardcoded `rgb(...)` values in gate 9 assertions duplicate token values rather than reading `getComputedStyle` of the tokens — brittle against token changes, though it matches the 4B precedent.

---

## 3. Bottom line

v3 is the strongest version yet: governance, invariants, gate plumbing and all prior factual claims are now correct. The two remaining decision points are (1) how the added unscoped color rules coexist with the 86-violation ratchet ceiling, and (2) how the Frame 02 spec exercises themed styles when the route stays unthemed. Resolve those and 5C is ready for a walkthrough at the 5A/5B standard.
