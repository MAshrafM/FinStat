# Review — Implementation Plan UI Phase 5C (Paycheck Form, Part 1: Styles Only)

- **Reviewed document**: `docs/ui-plans/phase_5c_implementation_plan.md` (untracked draft, 273 lines)
- **Review date**: 2026-11-20
- **Baseline documents**: `docs/UI-UX_Plan/UI-UX-PLAN.md` (v10.3, §2, §4, §5.10, §6.4, §6.9, §7.1), `docs/ui-plans/phase_5a_implementation_plan.md`, `docs/ui-plans/phase_5a_walkthrough.md`, `docs/ui-plans/phase_5b_implementation_plan.md`, `docs/ui-plans/phase_5b_walkthrough.md`, `docs/ui-plans/phase_4c_walkthrough.md`, `docs/ui-plans/walkthrough-template.md`, `AGENTS.md`
- **Verdict**: Directionally correct, but **not ready to implement**. Seven blocking defects would fail the master plan's own gates; a further set of verification gates present in 5A/5B is missing.

---

## 1. What the plan gets right

Verified against the working tree:

| Claim | Verification | Status |
| :--- | :--- | :--- |
| 77 inline styles in `PaycheckFormPage.js` | `style={{` occurrence count in source = 77 | Accurate |
| 173 ESLint errors + 20 a11y label warnings | `npx eslint src/pages/salary/PaycheckFormPage.js --no-ignore` → 173 × `no-restricted-syntax`, 20 × `jsx-a11y/label-has-associated-control` | Accurate |
| 16 unit tests in 3 suites | 9 + 3 + 4 tests in `PaycheckFormPage.test.js`, `PaycheckFormPageTax.test.js`, `PaycheckFormPageTimezone.test.js` | Accurate |
| `<Loading variant="route" text="...">` is a valid API | `Loading.js` supports `text` and `VALID_VARIANTS` includes `route` | Accurate |
| 12 allowlisted routes after 5C | §5.10: 5C adds 0 patterns; cumulative = 12 | Accurate |
| `PaycheckFormPage.js` is in `.eslintignore` | line 74; the 3 test files are lines 76–78 | Accurate |

The core scope decisions — no route allowlisting, no calculation/handler/state-machine changes, inline-style elimination, graphitic `.fs-page` styling — are consistent with §6.9.

---

## 2. Blocking defects

### 2.1 Wrong master-plan citation (4 occurrences)

Lines 7, 9, 19 and 34 cite `UI-UX-PLAN.md §6.10`. In the master plan **§6.10 is Phase 6 — Portfolio** (line 1721); **Phase 5 is §6.9** (line 1656) and 5C occupies lines 1680–1687. The mixed-file rule is correctly cited as §6.4 line 1302. Fix all four references to §6.9.

### 2.2 Seven undefined tokens in the CSS specification

The plan references `var(--fs-space-2)`, `--fs-space-3`, `--fs-space-4`, `--fs-space-5`, `--fs-card-bg`, `--fs-border-hover`, and `--fs-surface-hover`. None exists in `frontend/src/styles/tokens.json`. `lint-tones.js` Check 2 scans every CSS file against `tokens.json` and fails on undefined tokens, so the verification step "no phantom tokens" cannot pass.

The 5B implementation plan hit the same gap and recorded: *"no spacing tokens exist in tokens.json"* — it used raw rem values. Either follow that precedent (map spacing to raw rem/px, `--fs-card-bg` → `--fs-surface`, `--fs-surface-hover` → `--fs-surface-raised`, `--fs-border-hover` → `--fs-border-strong`/`--fs-border`) or add tokens through a recorded §4 amendment plus `tokens.js --write` regeneration. Tokens are frozen at 1B otherwise.

Related stale values: the plan's parenthetical hex values (`#16181d`, `#23272f`, `--fs-ink #101114`) come from `AGENTS.md` and disagree with `tokens.json` / §4.1–4.2 (`--fs-surface #1a1c20`, `--fs-border #34383f`, `--fs-ink #0d0e10`). Author against token names, not literal values.

### 2.3 Direct tone/accent tokens in page CSS

`var(--fs-accent)` appears at plan lines 95, 96, 104 and 121; `var(--fs-warning)` at line 124. All are rules for `PaycheckFormPage.css`. `lint-tones.js` Check 1 bans exactly `var(--fs-positive|negative|warning|accent|-hover|-active|-text)` in every CSS file except `tokens.css`, `theme.css`, `theme-components.css`. The 5B walkthrough (Precondition 9) explicitly avoided direct `var(--fs-accent)` for this reason.

Route these through the theme primitives (`.fs-btn-primary`, `.fs-badge--warning`, etc.) or add page classes whose token references live only in the exempt theme files. Note §4.3 rule 6 also forbids page JSX from naming tone tokens directly.

### 2.4 `.eslintignore` removal assigned to the wrong sub-phase

The plan removes `PaycheckFormPage.js` from `frontend/.eslintignore` in 5C (Component 3, verification step 3). Master §6.9 line 1695 assigns that task to **5D**. Practically 5C is right: CI's changed-files ESLint gate warns on ignored modified files, and the 5B walkthrough resolved an identical failure by de-ignoring `ProtectedRoute.js` in-phase. But this needs a **recorded plan amendment** moving the task from 5D to 5C and updating §6.9 and the §10 progress log — not a silent divergence. The plan's choice to leave the three `PaycheckFormPage*.test.js` entries ignored is correct.

### 2.5 The invariant checklist is a different set of invariants

The plan's "Invariant I1–I16" checklist (lines 256–273) does not match master §2:

| Plan's label | Master §2 definition |
| :--- | :--- |
| I1 Dark graphite canvas | I1 Routes/URLs unchanged — 75 entries, 10 redirects |
| I8 Inline styles reduction | I8 Dashboard coordinator ≤ 120 lines, 10 RTL tests green |
| I13 No horizontal scroll | I13 Every non-allowlisted route pixel-identical |
| I16 Git repository integrity | I16 No radius above 8px except pill |

It also omits I2 (no API/payload change), I4 (auth gating), I12 (no new dependency), and pre-checks every item `[x]` before implementation. `walkthrough-template.md` §2 requires a **verbatim** §2 matrix with evidence. Replace the whole section.

### 2.6 Dual-mode scoping is asserted, not specified — the unthemed route will be unstyled

The page root is `className="page-container"` (line 680 of the JSX), and the current `PaycheckFormPage.css` is entirely unscoped legacy CSS (white cards, `#e9ecef` borders, 8px+ radii, glow shadows). Every concrete CSS rule in the 5C plan is `.fs-page`-scoped, and the plan never states whether `fs-page` is added to the wrapper in 5C. It must **not** be — that would theme the route early.

Consequence: replacing the stylesheet with only the proposed `.fs-page` rules strips all styling from `/salary/paychecks/new` and `/salary/paychecks/edit/:id`, guaranteeing a visual diff. "Neutral Base Classes" (Component 1 §1) is named but no rules are given. The plan must state explicitly: **retain the existing unscoped rules byte-identically; add `.fs-page` overrides that stay dormant until 5D**, then prove the 0-diff claim. The 2F progress entry documents the same technique for loading fallbacks.

### 2.7 No visual-regression gate, despite the 0-diff claim

Verification step 6 only runs `verify-baseline-manifest.js`, which checks file sizes and SHA-256 hashes — it does not compare rendered pages. §7.1 requires a developer-run Playwright diff report with four parts: (a) total routes, (b) zero-diff routes, (c) accepted diffs citing an AD item, (d) unexplained diffs = 0. The 5B walkthrough lists `salary-paychecks-new @ 1440px` and `salary-paychecks-edit @ 1440px` among the 0-diff unthemed routes — precisely the routes 5C edits with new classes and a new loading primitive. Add the 71/71 PR-subset run, the four-part report, and an explicit baseline decision (including the `--generate` + baseline-repo commit procedure if any diff is accepted).

---

## 3. Missing preconditions and verification gates

### 3.1 Preconditions

5B's plan had a 10-precondition section; 5C has none. Add at minimum:

- `.eslintignore` pre-state grep (expect line 74 `PaycheckFormPage.js` and lines 76–78 tests).
- Primitive/class existence check — `.fs-page`, `.fs-btn`, `.fs-btn-primary`, `.fs-btn-secondary`, `.fs-num` exist in `theme.css`/`theme-components.css`; **`.fs-calc-readonly` does not** and must be authored as a new page class.
- `Loading.js` variant/`text` support (verified valid).
- Baseline pre-existence for `salary-paychecks-new` and `salary-paychecks-edit`.
- Manifest pre-check: **334** images, not 325.
- Calculation characterization 11/11 precheck.
- Hex isolation check for the 10 legacy colours listed in the plan.

### 3.2 Gates required by §7.1 / walkthrough template but absent from 5C

- `testid-guard.js` (I5).
- jest-axe on touched components, and real-browser Playwright axe on the touched routes — needed to evidence the 20 label fixes (§7.1 lines 2048–2049).
- `src/App.test.js` route suite (I10) and the 4 dashboard RTL suites (I8), both run in 5A/5B.
- A reference-frame **02** match spec. 4B shipped `expenditure-form-reference-match.spec.js` (13/13) for its form conversion; 5C claims Frame 02 adherence with no equivalent gate.
- `NODE_OPTIONS` memory flag on the production build (prior phases used 4096/8192 MB).
- `grep -rn '#14b8a6'` restricted to `theme.css` and `overflow-x` exception audit (§7.1 lines 2058–2059) — the plan asserts I13 "no horizontal scroll on mobile" without a check.
- Explicit statement of which §6.4 form-a11y items (`aria-required`, `aria-describedby`, `aria-invalid`, inline error placement) are deferred to 5D's validation work.

---

## 4. Smaller inconsistencies

- **`font-weight 700`** at plan lines 87 and 97 violates §4.5 "Three weights, no 700" — use `var(--fs-weight-semibold)` (600).
- **Step-number badge radius** (line 103): "circle within 8px ceiling / 32px pill" is self-contradictory. 32px exceeds I16's 8px ceiling; `var(--fs-radius-pill)` is reserved for chips and avatars.
- **Loading-state swap** to `<Loading variant="route">` changes unthemed DOM. Confirm it is not captured in the baselines, or declare it an accepted diff.
- **`DISBURSEMENT_TYPES` colour removal** (line 184) is outside the strict §6.4 line 1302 "className, style, JSX structure" allowlist. Justify as presentation-only data (current source shows one consumer, the type-button map) or defer to 5D.
- **No statement on the `fs-page` class itself** — see §2.6. It must remain absent from the wrapper in 5C and be added only with the 5D allowlist.
- **Manifest count**: plan line 246 says 325 baselines; the manifest and all recent walkthroughs say **334**. Correct the number.

---

## 5. Recommended path

Before implementation, amend `phase_5c_implementation_plan.md` to:

1. Correct §6.10 → §6.9 and the 325 → 334 baseline count.
2. Replace the seven undefined tokens and the five banned direct tone/accent references.
3. Record the `.eslintignore` task amendment (5D → 5C) and update §6.9 / §10.
4. Replace the invariant checklist with the verbatim §2 matrix plus evidence columns.
5. Add the explicit legacy-CSS-preservation contract: unscoped rules unchanged, `.fs-page` overrides dormant until 5D, `fs-page` class not added in 5C.
6. Add the precondition section and the missing gates from §3 above, including the four-part Playwright diff report.

With those changes, a 5C walkthrough can be evidenced to the same standard as the 5A and 5B walkthroughs.
