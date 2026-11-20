# Review — Implementation Plan UI Phase 5C v6 (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_implementation_plan.md` (v6, 502 lines)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §4, §5.10, §6.4, §6.9, §6.16, §7.1, §7.2, §9.2, §12), `docs/ui-plans/phase_5a_implementation_plan.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5b_implementation_plan.md`, `docs/ui-plans/phase_5b_walkthrough.md`, `docs/ui-plans/phase_4b_walkthrough.md`, `docs/ui-plans/phase_2f_walkthrough.md`, `docs/ui-plans/walkthrough-template.md`, `AGENTS.md`
- **Companion reviews**: `docs/ui-plans/phase_5c_implementation_plan_review.md` (v1), `docs/ui-plans/phase_5c_implementation_plan_v2_review.md` (v2), `docs/ui-plans/phase_5c_implementation_plan_v3_review.md` (v3), `docs/ui-plans/phase_5c_implementation_plan_v4_review.md` (v4), `docs/ui-plans/phase_5c_implementation_plan_v5_review.md` (v5)
- **Verdict**: Closer, but still not implementation-ready. v6 resolves the v5 gate blockers cleanly, but it introduces a new hard ESLint contradiction and leaves a few documentation/gate fidelity gaps.

---

## 1. Verified fixes from v5

| v5 issue | v6 status | Verification |
| :--- | :--- | :--- |
| B6 — undefined `--fs-text-muted` | **Resolved** | Plan token scan: 21 tokens used, 0 invalid. Gate 4 now uses `--check --fonts`. |
| B7 — unrecorded I14/I16 waiver | **Resolved** | `UI-UX-PLAN.md:1687–1691` records the waiver with owner/date/developer approval; `§6.16:1978` records the Phase 5D purge check. |
| B8 — build after visual gate | **Resolved** | Gate 10 is now build; Gate 11 is PR-subset visual. |
| B9 — mono/`.fs-num` contradiction | **Resolved** | `.paycheck-calc-readonly` now uses sans + `tabular-nums` + right alignment; I15 matrix corrected. |
| B5 — incomplete 9-type mapping | **Resolved** | Table now includes selected/unselected icon, title and desc for all nine types. |
| Mixed-file `DISBURSEMENT_TYPES` mutation | **Document-level fixed** | v6 keeps the constant unchanged and derives `typeClass` in JSX. |
| PC-8 | **Still true** | Working tree clean at `662bfea` (`463f485` or later). |

---

## 2. New blocking issue

### B10 — Preserving `DISBURSEMENT_TYPES` conflicts with the ESLint hex ban

v6 line 318 says:

```text
Do NOT modify `DISBURSEMENT_TYPES` data constant
```

But the constant contains nine raw hex literals at `PaycheckFormPage.js:167–175`, and `frontend/.eslintrc.json:14–15` bans hex literals:

```json
"Literal[value=/^#(?:[0-9a-fA-F]{3,4}){1,2}$/]"
```

A current `--no-ignore` ESLint run reports **78 hex-literal errors**; 69 come from inline styles that 5C will remove, leaving **9 errors from `DISBURSEMENT_TYPES`**. After the file is de-ignored, both Gate 3 and the CI production build will fail.

v6 cannot simultaneously require:

1. byte-for-byte preservation of `DISBURSEMENT_TYPES`,
2. removal from `.eslintignore`,
3. clean ESLint with `--max-warnings=0`.

**Fix one of these:**

- remove/replace the nine `color` values and record the mixed-file amendment; or
- add a narrowly scoped, developer-approved ESLint waiver for the constant and record it with SHA in §10; or
- move the presentation colours into tokenized CSS and keep only semantic IDs in the constant.

---

## 3. Residual blocker

### B11 — `.paycheck-preview-val` is claimed but never defined

v6 lines 14 and 482 say preview values use `.paycheck-preview-val` with neutral, tabular, right-aligned styling. But Step 2 only defines `.paycheck-calc-readonly`; there is no `.fs-page .paycheck-preview-val` rule anywhere in the plan.

So the I15 matrix overstates the evidence, and the dormant Frame 02 harness will not verify the claimed preview typography.

**Fix:** add both unscoped legacy and scoped `.fs-page` rules for `.paycheck-preview-val`, or remove it from the matrix and apply `.paycheck-calc-readonly` to those values.

---

## 4. Remaining governance/gate gaps

- **Master plan amendments are only partially synced.** `§6.9:1687–1691` lists four amendments, omitting the Playwright `testMatch` amendment; `§10:2512` mentions all five. `§6.9` is therefore internally incomplete.
- **Stale 5D tasks remain.** `UI-UX-PLAN.md:1697` still says “Finish remaining inline styles” and line 1701 still says remove `PaycheckFormPage.js` from `.eslintignore`, both of which v6 moves to 5C.
- **Waiver SHA missing.** The §10 progress-log row uses `—` for SHA, while §2 line 206 requires invariant-breach decisions recorded in §10 with SHAs.
- **Gate 13 is still narrower than §7.1.** It greps `#14b8a6` only in salary directories, not CSS-wide; it greps only `overflow-x: scroll`, not all `overflow-x`; and the loading-consistency grep is noted as deferred rather than run or explicitly waived in the gate list.
- **“Complete” 9-type table omits geometry.** It enumerates all colour/state properties, but not the legacy `10px` button radius, `8px` icon radius, padding, or icon offsets. These may be covered by the generic compatibility block, but the “complete” label is overstated.

---

## 5. Recommendation

Fix **B10** and **B11**, then synchronize the stale §6.9/§10 entries and tighten Gate 13. With those changes, v6 would be implementation-ready; as written, the ESLint failure alone blocks it.
