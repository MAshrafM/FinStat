# Phase 1B Walkthrough — Design Direction (Human-Owned)

## Sub-Phase Overview
- **Sub-phase**: Phase 1B — Design Direction
- **Branch**: `phase-ui-1b-direction`
- **Owner**: Human Developer (governed by Decision D12)
- **Status**: Ready for Interactive In-Browser Review & Direction Confirmation
- **Scope**: Token freeze verification, font asset procurement ($\le 90\text{ KB}$), authoring 3 canonical reference frames with the mobile card pattern (rejection of mobile horizontal scroll), teal accent exploration, darker chrome plane, and automated boundary verification.

---

## Deliverables & Artefacts

### 1. Three Canonical Reference Frames
Authored as standalone, self-contained HTML + CSS documents under [`docs/UI-UX_Plan/reference/`](file:///d:/Projects/FinStat/docs/UI-UX_Plan/reference/):

| Frame | File | Key Features & Explorations | Stress Cases Demonstrated |
| :--- | :--- | :--- | :--- |
| **01 Dense Table** | [`01-dense-table.html`](file:///d:/Projects/FinStat/docs/UI-UX_Plan/reference/01-dense-table.html) | **Desktop**: Variant A (Prefix `.fs-cat`) vs Variant B (Group-by)<br>**Mobile (390px)**: **Cards pattern (No horizontal scroll)**<br>- **Mobile-1**: Full card (every field visible)<br>- **Mobile-2**: Compact card + expander drawer<br>- **Overflow**: Card 1 (Ellipsis + tap-to-reveal) vs Card 2 (Direct break-word) | 1. 47-char payee name<br>2. 9-digit negative (`-$123,456,789.00`)<br>3. Mobile card vertical rhythm (no page horizontal scroll)<br>4. Empty state (`.fs-empty`)<br>5. Network error state banner |
| **02 Two-Column Form** | [`02-form.html`](file:///d:/Projects/FinStat/docs/UI-UX_Plan/reference/02-form.html) | **Variant B Stacked Sub-Panels (Approved)**<br>**Teal Accent Candidates on Save Button**: `--fs-ink` text (7.4:1 contrast)<br>- **Accent A**: `#14b8a6` (Brighter teal-cyan)<br>- **Accent B**: `#0d9488` (Darker brand teal)<br>- **Accent C**: `#0891b2` (Cyan-blue finance teal)<br>**Discard Button Options**: Discard-1 (Neutral) vs Discard-2 (Subtle danger)<br>**Legibility Check**: 20px heading and 13px label in active teal on dark | 1. 47-char legal name<br>2. 9-digit negative liability allocation<br>3. Inline validation error (`--fs-negative`)<br>4. Disabled control (`--fs-text-4`, opacity 0.45)<br>5. Dedicated empty state banner (`.fs-empty`)<br>6. Mobile 390px collapse |
| **03 Dashboard** | [`03-dashboard.html`](file:///d:/Projects/FinStat/docs/UI-UX_Plan/reference/03-dashboard.html) | **Darker Chrome Plane #0c0d0f (Approved)**<br>**Teal Accent on Actions & Active Nav**: Primary button (`--fs-accent` + `--fs-ink`), active nav (teal left rule + teal text)<br>**Mobile Fixes**: KPI grid collapses to 1fr at $\le 768\text{px}$, hero full-width, no fixed sidebar, **recent activity table $\to$ vertical cards** (zero page horizontal scroll)<br>**Legibility Check**: 20px heading and 13px label samples<br>**Chart**: Accessible SVG pattern with collapsible data table | 1. 47-char KPI account title with 2-line clamp<br>2. 9-digit negative balance (`-$123,456,789.00`)<br>3. Mobile vertical activity cards (no page scroll)<br>4. Chart empty state<br>5. Chart telemetry error state |

> [!TIP]
> **How to Open Locally in Browser**:
> You can open the files directly from disk in your browser to evaluate them interactively:
> - `d:\Projects\FinStat\docs\UI-UX_Plan\reference\01-dense-table.html`
> - `d:\Projects\FinStat\docs\UI-UX_Plan\reference\02-form.html`
> - `d:\Projects\FinStat\docs\UI-UX_Plan\reference\03-dashboard.html`
>
> Each frame includes built-in toggle buttons at the top to switch between viewports (1440, 1024, 390px), test candidate accents, switch discard button variants, and test stress/empty/error states.

---

### 2. Procured Font Assets (`frontend/src/assets/fonts/`)
Procured self-hosted woff2 Latin subsets and SIL Open Font License v1.1:

| Font Asset | File Name | Size | Purpose |
| :--- | :--- | ---: | :--- |
| **IBM Plex Sans Regular** | [`IBMPlexSans-Regular.woff2`](file:///d:/Projects/FinStat/frontend/src/assets/fonts/IBMPlexSans-Regular.woff2) | 18.71 KB | Body text (Weight 400) |
| **IBM Plex Sans Medium** | [`IBMPlexSans-Medium.woff2`](file:///d:/Projects/FinStat/frontend/src/assets/fonts/IBMPlexSans-Medium.woff2) | 19.59 KB | Labels, table headers (Weight 500) |
| **IBM Plex Sans SemiBold** | [`IBMPlexSans-SemiBold.woff2`](file:///d:/Projects/FinStat/frontend/src/assets/fonts/IBMPlexSans-SemiBold.woff2) | 19.88 KB | Headings, page titles (Weight 600) |
| **IBM Plex Mono Regular** | [`IBMPlexMono-Regular.woff2`](file:///d:/Projects/FinStat/frontend/src/assets/fonts/IBMPlexMono-Regular.woff2) | 14.46 KB | Identifiers, tx codes, routing (Weight 400) |
| **License** | [`OFL.txt`](file:///d:/Projects/FinStat/frontend/src/assets/fonts/OFL.txt) | 4.35 KB | SIL Open Font License v1.1 |
| **Documentation** | [`README.md`](file:///d:/Projects/FinStat/frontend/src/assets/fonts/README.md) | 1.92 KB | `fonttools` `pyftsubset` reproducible invocation |
| **Total woff2 Size** | | **72.64 KB** | Strictly satisfies $\le 90\text{ KB}$ budget (17.36 KB headroom) |

> [!NOTE]
> Per the design contract, `@font-face` declarations are **not** added in Phase 1B (verified 0 occurrences in `src/`); they are formally introduced in Phase 2A (`frontend/src/styles/theme.css`).

---

### 3. Verification Evidence & Automated Checks

All required automated checks have been executed and verified clean:

### 1. Banned-Pattern Grep Verification
```bash
$ grep -rnE "linear-gradient|radial-gradient|conic-gradient|backdrop-filter|filter:\s*(blur|drop-shadow)|text-shadow|border-radius:\s*([1-9][0-9]|[1-9][0-9]{2,})px" docs/UI-UX_Plan/reference/
# Output: (empty — 0 violations)
✓ Banned-pattern check PASSED: 0 violations found in reference frames.
```

### 2. Accent Candidate Scope Check (Frames vs Production)
```bash
# Grep for fs-accent in reference frames:
02-form.html: found 19 occurrences of fs-accent
03-dashboard.html: found 22 occurrences of fs-accent
Total fs-accent occurrences in reference frames: 41 (Candidate tokens present for developer testing)

# Grep for fs-accent in frontend/src/ and tokens.json:
✓ Zero fs-accent in frontend/src/ (Clean — not leaked to production or tokens.json)
```

### 3. Font Bundle Budget Verification
```bash
$ node frontend/scripts/tokens.js --check --fonts
✓ All 4 IBM Plex woff2 files present. Total: 72.64 KB (<= 90 KB budget). OFL verified.
```

### 4. Trackability & Gitignore Verification
```bash
$ git check-ignore -v docs/UI-UX_Plan/reference/01-dense-table.html
# Exit code 1 (no output — negative control PASSED: reference frames are trackable)

$ git check-ignore -v docs/ui-snapshots/test.png
.gitignore:25:docs/*	docs/ui-snapshots/test.png
# Exit code 0 (positive control PASSED: snapshots remain strictly untracked)
```

### 5. Deferred Font Declaration Verification
```bash
# Verify no @font-face declarations in src/
✓ Zero @font-face declarations in frontend/src (*.css). (Deferred to 2A)
```

### 6. Strict Production UI Freeze Check
```bash
$ git status --porcelain frontend/src/pages/ frontend/src/components/
# Output: (empty — 0 production UI files touched)

$ git status --porcelain frontend/src/
 M frontend/src/styles/tokens.json
?? frontend/src/assets/
```

---

## Human-Owned Decision Form (D12–D18)

Please review the three reference frames interactively in your browser across viewports and low brightness, and mark your choices:

```
+----------------------------------------------------------------------------------------------------+
|                                    PHASE 1B DECISION FORM                                           |
+------------------------------------+------------------------------------+--------------------------+
| Area                               | Options / Scope                    | Developer Decision       |
+------------------------------------+------------------------------------+--------------------------+
| 1. Mobile Pattern (390px)          | Card pattern (horizontal scroll    | [ ] Pending review:      |
|    (Reviewed in 01-dense-table)    | rejected). Choose card style:      | ( ) Mobile-1 (Full card) |
|                                    | - Mobile-1 (Full card)             | ( ) Mobile-2 (Compact +  |
|                                    | - Mobile-2 (Compact + expander)    |     expander)            |
|                                    | Choose overflow treatment:         | ( ) Overflow: Ellipsis   |
|                                    | - Ellipsis tap-to-reveal           | ( ) Overflow: Break-word |
|                                    | - Break-word                       |                          |
+------------------------------------+------------------------------------+--------------------------+
| 2. Teal Accent Candidate           | Choose primary action accent:      | [ ] Pending review:      |
|    (Reviewed in 02-form and        | - Accent A: #14b8a6 (Teal-Cyan)    | ( ) Accent A (#14b8a6)   |
|     03-dashboard)                  | - Accent B: #0d9488 (Brand Teal)   | ( ) Accent B (#0d9488)   |
|                                    | - Accent C: #0891b2 (Finance Cyan) | ( ) Accent C (#0891b2)   |
+------------------------------------+------------------------------------+--------------------------+
| 3. Discard Button Style            | Choose form discard styling:       | [ ] Pending review:      |
|    (Reviewed in 02-form.html)      | - Discard-1: Neutral secondary     | ( ) Discard-1 (Neutral)  |
|                                    | - Discard-2: Subtle danger warning | ( ) Discard-2 (Danger)   |
+------------------------------------+------------------------------------+--------------------------+
| 4. Desktop Category Cue (G3)       | Choose transaction log cue:        | [ ] Pending review:      |
|    (Reviewed in 01-dense-table)    | - Variant A: Text prefix .fs-cat   | ( ) Variant A (Prefix)   |
|                                    | - Variant B: Group-by control/chips| ( ) Variant B (Group-by) |
+------------------------------------+------------------------------------+--------------------------+
| 5. Chrome Plane (F5)               | Confirmed Option B (Darker chrome  | [x] Confirmed Option B   |
|    (Reviewed in 03-dashboard)      | #0c0d0f approved)                  |     (#0c0d0f)            |
+------------------------------------+------------------------------------+--------------------------+
```

---

## Developer Sign-off Block

When ready, provide your selections and sign off with:
```
Reviewed at [YYYY-MM-DD] on [Display model / low brightness], chose:
- Mobile Card Style: [Mobile-1 Full / Mobile-2 Compact]
- Mobile Overflow Treatment: [Ellipsis tap-to-reveal / Direct break-word]
- Teal Accent: [Accent A #14b8a6 / Accent B #0d9488 / Accent C #0891b2]
- Discard Button: [Discard-1 Neutral / Discard-2 Subtle Danger]
- Desktop Category Cue: [Variant A Prefix / Variant B Group-by]
```
