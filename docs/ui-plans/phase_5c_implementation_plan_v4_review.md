# Review — Implementation Plan UI Phase 5C v4 (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_implementation_plan.md` (v4, 423 lines)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §4, §5.10, §6.4, §6.9, §7.1, §9.2, §12), `docs/ui-plans/phase_5a_implementation_plan.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5b_implementation_plan.md`, `docs/ui-plans/phase_5b_walkthrough.md`, `docs/ui-plans/phase_4b_walkthrough.md`, `docs/ui-plans/phase_2f_walkthrough.md`, `docs/ui-plans/walkthrough-template.md`, `AGENTS.md`
- **Companion reviews**: `docs/ui-plans/phase_5c_implementation_plan_review.md` (v1), `docs/ui-plans/phase_5c_implementation_plan_v2_review.md` (v2), `docs/ui-plans/phase_5c_implementation_plan_v3_review.md` (v3)
- **Verdict**: Not implementation-ready as written. v4 closes v3’s two decision points at the document level — the ratchet mechanism and the dormant-style harness — but several mechanical contradictions remain.

---

## 1. Verified facts supporting the plan

| Claim | Current reality |
| :--- | :--- |
| 77 inline `style={{` blocks in `PaycheckFormPage.js` | Confirmed |
| 173 ESLint errors + 20 a11y label warnings | Confirmed: 173 × `no-restricted-syntax`, 20 × `jsx-a11y/label-has-associated-control` |
| `PaycheckFormPage.css` has 86 stylelint violations | Confirmed: 62 × `color-no-hex`, 17 × `declaration-property-value-allowed-list`, 6 × `function-disallowed-list`, 1 × `color-named` |
| `.eslintignore` line 74 + test lines 76–78 | Confirmed |
| 334 baselines; new/edit baselines at all 5 QA widths | Confirmed |
| 12 allowlisted routes; no new/edit allowlist | Confirmed |
| All 22 `var(--fs-*)` tokens used by v4 exist in `tokens.json` | Confirmed |
| No `#14b8a6` in salary page/component dirs | Confirmed |

The verbatim I1–I16 matrix, corrected 65-route PR-subset breakdown, computed-token assertions, 2px selected-state cue, and harness injection are genuine improvements over v1–v3. The `.eslintignore` amendment is recorded, and the v2 factual errors remain fixed.

---

## 2. Blocking issues

### B1 — PC-7 is mechanically false

v4 PC-7 (lines 95–100) expects:

```powershell
git grep -n "color: '#" frontend/src/pages/salary/PaycheckFormPage.js | Measure-Object -Line
```

to return **9** matches in `DISBURSEMENT_TYPES`. It currently returns **58**, because inline styles also use `color: '#…'`. The precondition fails before implementation starts.

**Fix:** scope the check to lines 166–176 (the `DISBURSEMENT_TYPES` literal) or parse that constant explicitly.

### B2 — The compatibility block’s disable list is incomplete, and the mechanism needs a recorded exemption

v4 line 161 disables:

```css
color-no-hex, function-disallowed-list, declaration-property-value-allowed-list
```

But the legacy save-button gradient is governed by `declaration-property-value-disallowed-list` in `frontend/.stylelintrc.json:15–45`; it is not covered. Any named colour would also need `color-named`.

More importantly, the compatibility block **adds new CSS** containing a gradient, glow shadow, >8px radii, and hex colours. That conflicts with I14 (`UI-UX-PLAN.md:202`) and I16, and with §7.1’s anti-slop gate. `lint-ratchet.js` suppression is a count mechanism, not an invariant waiver. The 2F walkthrough set the precedent: its temporary `stylelint-disable` block was explicitly recorded, bounded, and given a Phase 12 sunset (`UI-UX-PLAN.md:1968`).

**Fix:** record the dual-mode legacy block and its sunset in §6.9, §10, and the Phase 12 cleanup list; enumerate the complete disable set; or choose a different 0-diff mechanism. Do not rely on “ratchet passed” as I14/I16 evidence.

### B3 — Global primitive classes will change the unthemed baselines

`.fs-btn`, `.fs-btn-primary`, `.fs-btn-secondary`, and `.fs-num` are **unscoped** in `frontend/src/styles/theme.css:196–200, 312–366`. v4 adds them to the Cancel, Save, Recalculate, Sync, and numeric elements in 5C while the route remains unthemed.

Concrete effects:

- `.fs-btn-primary` forces accent background and `--fs-ink` text on Save.
- `.fs-btn-secondary` forces graphite surface/border on Cancel and secondary actions.
- `.fs-num` forces `text-align: right`.

The existing unscoped page rules do not neutralise all of these, and v4 does not specify compensating unscoped overrides. The 0-diff claim at 1440px is therefore unverified.

**Fix:** either add explicit unscoped legacy overrides for every primitive class used in the unthemed mode, or defer all `.fs-*` primitive classes to 5D and use page-local classes in 5C.

### B4 — The Frame 02 input assertions will fail against existing theme-components CSS

v4 gate 9 (lines 353–369) expects form inputs to compute to `--fs-surface-raised` and `--fs-radius-md` (6px). But `frontend/src/styles/theme-components.css:786–800` contains:

```css
.fs-page .form-group input {
  ...
  background: var(--fs-surface);
  border-radius: var(--fs-radius-sm);
}
```

Specificity `0,2,1` beats v4’s planned `.fs-page .form-control` (`0,2,0`). Most inputs are inside `.form-group` (e.g. `PaycheckFormPage.js:760–773`), so the harness will observe surface/4px, not raised/6px. Labels are similarly overridden by `.fs-page .form-group label` at line 775.

**Fix:** raise specificity (e.g. `.fs-page .form-group .form-control`) or align assertions/spec with the shared override explicitly.

### B5 — The 0-diff mechanism for the nine disbursement types is under-specified

The source has nine type colours at `PaycheckFormPage.js:166–176`, used for selected border, icon tint background, icon colour, and selected title colour, including alpha-derived values (`${dt.color}15`, `${dt.color}20`). v4 names `.type-*` classes but does not enumerate the nine rules and two states.

**Fix:** add an explicit CSS mapping table for all nine types and selected/unselected states before claiming 0 diff for both new/edit baselines.

---

## 3. Compliance gaps to close

- **D23 loading consistency:** v4 preserves the legacy `RefreshCw` ad-hoc loading spinner (`PaycheckFormPage.js:654–661`) via `.paycheck-loading-icon`. §6.4 line 1290 and D23 require `<Loading variant="route" />`. Either adopt the primitive in 5C or record a deferral to 5D.
- **Unrecorded master-plan divergences:** v4 pulls all 77 inline styles into 5C, while §6.9 line 1691 leaves “remaining inline styles” for 5D; it also introduces dual-mode CSS for a non-shared page. Record both as amendments, with owner/date per §0 and §10.
- **PC-8 is currently false:** the working tree has four untracked plan/review documents. Commit them or relax the precondition.
- **Gate coverage:** lint the new `PaycheckFormPageAxe.test.js` (it is not in `.eslintignore`); run PR-subset with `CI=true` as in 5B; use the proven 8192 MB build flag; include the full §7.1 `#14b8a6` and `overflow-x` greps.
- **Walkthrough evidence:** add after-screenshots of the dormant `.fs-page` variant at 1440/390 produced by the harness, plus the CHANGELOG entry and §5/§6.1 updates required by §7.2.
- **Deferred form-a11y scope:** state explicitly which `aria-required`, `aria-describedby`, `aria-invalid`, and inline-error items are 5D work, as requested in the v1 review.

---

## 4. Recommendation

Resolve B1–B5 first; they are all concrete and testable. Then add the governance amendments and gate-completeness items. With those changes, v4 would meet the 5A/5B evidence standard.
