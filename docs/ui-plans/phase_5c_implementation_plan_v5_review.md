# Review — Implementation Plan UI Phase 5C v5 (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_implementation_plan.md` (v5, 479 lines)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §4, §5.10, §6.4, §6.9, §7.1, §7.2, §9.2, §12), `docs/ui-plans/phase_5a_implementation_plan.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5b_implementation_plan.md`, `docs/ui-plans/phase_5b_walkthrough.md`, `docs/ui-plans/phase_4b_walkthrough.md`, `docs/ui-plans/phase_2f_walkthrough.md`, `docs/ui-plans/walkthrough-template.md`, `AGENTS.md`
- **Companion reviews**: `docs/ui-plans/phase_5c_implementation_plan_review.md` (v1), `docs/ui-plans/phase_5c_implementation_plan_v2_review.md` (v2), `docs/ui-plans/phase_5c_implementation_plan_v3_review.md` (v3), `docs/ui-plans/phase_5c_implementation_plan_v4_review.md` (v4)
- **Verdict**: Still not implementation-ready. v5 materially improves on v4 and resolves several blockers, but it introduces one hard gate failure and leaves a few governance/mechanics gaps.

---

## 1. Verified fixes from v4

| v4 issue | v5 status | Verification |
| :--- | :--- | :--- |
| B1 — PC-7 false | **Resolved** | I ran both v5 commands: `77` inline styles and `9` `DISBURSEMENT_TYPES` colors. |
| B3 — global primitive bleed | **Mostly resolved** | Step 3 explicitly forbids `.fs-btn*`/`.fs-num` and uses page-local classes. One contradiction remains below. |
| B4 — input specificity conflict | **Resolved** | Assertions now expect `--fs-surface` / `--fs-radius-sm` (4px), matching `theme-components.css:783–799`. |
| PC-8 false | **Resolved** | `git status` is clean on `main...origin/main [ahead 1]`. |
| D23 / a11y deferral | **Resolved at document level** | Amendments 5 and 6 record explicit Phase 5D deferrals. |
| Gate coverage / screenshots / CHANGELOG | **Largely resolved** | Gates 3, 10, 13 and §9 now cover the v4 gaps. |

---

## 2. Blocking issues

### B6 — Undefined token will fail Gate 4

v5 line 183 uses:

```css
var(--fs-text-muted)
```

But `frontend/src/styles/tokens.json` has `--fs-text-2` and `--fs-text-3`, not `--fs-text-muted`. `lint-tones.js` checks undefined tokens across all CSS files and exits 1 (`frontend/scripts/lint-tones.js:91–105, 128–140`).

So Gate 4’s expected “all exit 0” is false.

**Fix:** replace `--fs-text-muted` with an existing token, likely `--fs-text-2` or `--fs-text-3`.

---

### B7 — I14/I16 still depend on an unapproved invariant waiver

v5 lines 217–228 intentionally add legacy gradients, glow shadows, hex colours, and >8px radii under `stylelint-disable`. The disable list is now complete, but that does not change the invariant:

- `UI-UX-PLAN.md:202` — I14 bans gradients, glows, blur, masks, etc. anywhere in app CSS or JS.
- `UI-UX-PLAN.md:204` — I16 caps radii at 8px.
- `UI-UX-PLAN.md:2045` — §7.1 requires anti-slop lint to pass.
- `lint-ratchet.js` suppression is only a count mechanism, not an invariant exemption.

Amendment 4 (`phase_5c_implementation_plan.md:65–69`) records the workaround only inside the implementation plan, with a Phase 5D sunset. It does **not** record the breach in `UI-UX-PLAN.md §6.9`, `§10`, or the Phase 12 cleanup list with developer sign-off. The I14/I16 matrix at lines 458–460 still claims PASS solely because of the amendment.

**Fix:** either record the invariant breach/waiver in the master plan with owner, date, SHA and developer approval, or choose a zero-diff mechanism that does not introduce banned CSS. Also add an explicit anti-slop grep to the gates.

---

### B8 — Visual gate runs before the production build under `CI=true`

Gate 10 (`phase_5c_implementation_plan.md:410`) runs:

```powershell
$env:CI="true"; $env:PR_SUBSET="true"; npx playwright test --project=pr-subset
```

But `frontend/playwright.config.js:70–72` makes the web server run:

```text
npx serve -s build -l 3000
```

when `CI=true`. The production build is currently Gate 13 (line 433), after the visual gate. If `build/` is absent or stale, Gate 10 is not reproducible.

The 5B implementation plan put the build gate before the visual gate (`phase_5b_implementation_plan.md:610–627`).

**Fix:** move Gate 13 before Gate 10.

---

### B9 — Numeric typography contradicts §6.4 and the plan’s own B3 resolution

There are three conflicting statements:

- Step 2 line 290 styles calculated inputs with `font-family: var(--fs-font-mono)`.
- I15 matrix line 459 says “Preview amounts use neutral `.fs-num`.”
- Step 3 line 305 forbids `.fs-num` in 5C because it is a global primitive.

Master plan §6.4 line 1297 says numeric data uses proportional font with `tabular-nums`; mono is for identifiers only (D16).

**Fix:** use page-local styling such as:

```css
font-family: var(--fs-font-sans);
font-variant-numeric: tabular-nums;
text-align: right;
```

and correct the I15 matrix row.

---

## 3. Residual issues

### B5 is only partially resolved

The nine-type table (`phase_5c_implementation_plan.md:169–202`) lists legacy colours and selected border/background/shadow, but it does not enumerate all selected-state legacy properties in the source:

- `PaycheckFormPage.js:724–730` — icon wrapper uses `${dt.color}15` background and `dt.color` text regardless of selection.
- `PaycheckFormPage.js:735` — selected title uses `dt.color`; unselected title uses `#1e293b`.

The unselected section covers icon colour and description, but the selected section does not say those icon/title rules persist in unscoped legacy mode.

**Fix:** add the full selected-state mapping for all nine `type-*` classes, including icon wrapper, icon colour, and title colour.

---

### `DISBURSEMENT_TYPES` mutation is outside the strict mixed-file diff rule

Step 3 line 299 says:

```text
Remove presentation-only `color` property from `DISBURSEMENT_TYPES` items.
Add semantic `typeClass: 'type-regular'`, etc.
```

That edits a JS object literal, not `className`, `style`, or JSX presentation structure. Master plan §6.4 line 1302 says the mixed-file diff may change **only** `className`, `style`, and JSX presentation structure.

This is presentation metadata, but it still needs an amendment or a mapping approach that avoids changing the constant.

---

### §7.1 gate fidelity is still incomplete

- Gate 12 only greps `src/pages/salary/` and `src/components/salary/` for `#14b8a6`. §7.1 line 2058 requires the CSS-wide check; line 2059 requires the `overflow-x` check.
- D23 deferral explains the ad-hoc `RefreshCw` spinner, but §7.1 line 2060’s loading-consistency grep is not run or waived in the gate list.
- Gates 1, 2, 7 and 8 omit `--runInBand` despite §7.1 line 2043 and the 5B precedent.
- Gate 4 runs `tokens.js --check`, but §9.2 line 2243 specifies `--check --fonts`.

---

## 4. Recommendation

Fix B6–B9 first; they are concrete and gate-blocking. Then close the residual mapping, mixed-file amendment, and §7.1 gate-fidelity gaps.

With those changes, v5 would be much closer to the 5A/5B evidence standard. As written, it should not be implemented.
