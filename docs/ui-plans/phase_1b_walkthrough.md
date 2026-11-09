# Phase 1B Walkthrough — Design Direction Finalization & Plan Amendment (v2 Reconciled)

## Executive Summary
- **Sub-phase**: Phase 1B — Design Direction (Human-Owned Overhaul Gate)
- **Branch**: `phase-ui-1b-direction`
- **Owner**: Human Developer (Decision D12)
- **Status**: **Direction Approved, Finalized & Reconciled**
- **Outcome**: The developer has visually reviewed the candidate directions in low brightness and approved the design direction. All amendments to `UI-UX-PLAN.md` and `tokens.json` have been executed strictly within the mandated scope, the three reference frames are finalized as canonical Variant B artefacts, contrast tables match with zero drift, and all review corrections (stale action-bg rows removed, chrome contrast corrected to 1.03:1, 10-screenshot package captured) are complete.

---

## 1. Developer Decisions & Verbatim Rationales

The developer has approved the design direction after in-browser review:

| Decision Area | Approved Choice | Approved Contract |
| :--- | :--- | :--- |
| **Accent hue** | `#14b8a6` (Teal) | Interactive affordances only; text is `--fs-ink` `#0d0e10` (7.76:1) |
| **Accent scope** | All interactive elements | Buttons, links, active nav, checked state; focus rings remain neutral |
| **Primary button** | Solid accent block | `--fs-action-bg: var(--fs-accent)`, `--fs-action-text: var(--fs-ink)` |
| **Chrome plane** | Option B (`#0c0d0f`) | Recessed shell (1.03:1 darker than page `#101114`) with 1px load-bearing border |
| **Mobile table** | Compact-expand cards | ≤ 768px viewports; 3 visible key fields + expander drawer; break-word overflow |
| **Discard action** | Neutral secondary | `--fs-surface` + `--fs-border-control` + `--fs-text`; "Cancel, safe exit" |
| **Frame 1 variant**| Variant B (Group-by) | Canonical ledger format; neutral category chips |
| **Frame 2 variant**| Variant B (Stacked cards)| Canonical form format; sub-panel cards |
| **Frame 3 variant**| Variant B (Darker chrome)| Canonical dashboard format; recessed shell |

### Developer Rationales (Recorded Verbatim)
> **Accent Selection**:
> *"Chose #14b8a6 because it keeps the app's teal heritage on the darker canvas; the three candidates were #14b8a6, #0d9488, #0891b2 — #14b8a6 reads as the app's colour, not as a generic tech-teal."*

> **Mobile Cards Pattern**:
> *"Chose compact-expand because 85% of usage is mobile and horizontal scroll is hostile at 390 px; the compact card with expander keeps the list scannable while preserving full names via break-word."*

> **Discard Button Semantics**:
> *"Chose neutral secondary because Discard means 'cancel and leave' — the draft is recoverable; it is not a permanent deletion and does not merit a confirmation modal or danger styling."*

---

## 2. Enumeration of Amended Plan Sections (`UI-UX-PLAN.md`)

All amendments were made strictly according to Part 1 instructions across the **27 amended sections (23 primary + 4 supporting)**:

### Primary Amendments (23 Sections)
1. **§2 (Invariant I6)**: Rewritten from horizontal scroll preservation to compact-expand cards at $\le 768\text{px}$ (D19), preserving horizontal scroll only for $\ge 12$-column audit tables; 390px visual check updated.
2. **§4.1 (Surfaces & Chrome)**: Updated `--fs-surface-sunken` to `#0c0d0f` (1.03:1 darker than `--fs-bg`, corrected from initial 1.044:1 estimate to match tool calculation), establishing chrome as a recessed shell.
3. **§4.3.2 (Interactive Accent — New Subsection)**: Defined `--fs-accent: #14b8a6`, `--fs-accent-hover: #22c4b3`, `--fs-accent-active: #0fa192`, `--fs-accent-text: #0d0e10`. Recorded the 6 governing rules (accent is interactivity, never white-on-teal, focus rings remain neutral, one primary per section, focus rings excluded, chart series never accent).
4. **§4.4 (Actions)**: Re-aliased `--fs-action-bg` to `var(--fs-accent)` and `--fs-action-text` to `var(--fs-accent-text)`; updated hierarchy text and AD1 row in §6.6.
5. **§4.6 (Focus Rings)**: Added rationale sentence confirming focus rings do not use accent; neutral `#f2f3f5` ring sits on `--fs-bg` (17.00:1 / 13.85:1) via `outline-offset: 2px` because drawn directly on accent it would be 2.24:1 (failing the 3:1 threshold).
6. **§4.9 (Contrast Baseline)**: Regenerated §4.9.1 (14 rows, stale action-bg pairs removed) and §4.9.2 (15 rows, `--fs-focus-ring on --fs-accent` at 2.24:1 fail-offset) via `tokens.js --write`; added rule 8 to "Rules derived from the table" and updated rule 6 to 1.03:1.
7. **§4.13 (Decisions)**: Revised D2 and D14 status to approved in 1B; added decisions D19 (Mobile table card pattern) and D20 (Recessed darker chrome `#0c0d0f`).
8. **§4.13.1 (Options Considered and Rejected — New Subsection)**: Documented rejected vs chosen options and developer rationales across Palette, Accent, Action affordance, Typeface, Radii, Mobile table, and Chrome plane.
9. **§4.15 (Legacy Mapping)**: Updated legacy teal `#009879`/`#007a63` row to map to `--fs-accent #14b8a6`.
10. **§6.1 (Phase Board)**: Marked Phase 1B status and exit gate complete (`☑`).
11. **§6.1.1 (Taste Checkpoints)**: Updated all checkpoint comparison targets to Variant B.
12. **§6.4 (UX Patterns)**: Updated `Table on mobile` to compact-expand cards, added `Accent in tables`, updated `Buttons` contract.
13. **§6.5 (Phase 1 — Audit, direction and tooling)**: Added task confirmations (accent scope, discard semantics, mobile pattern, finalized reference frames, tokens.js zero drift).
14. **§6.7 (Phase 3 — Dashboard)**: Updated AD1 row in the accepted diff register from solid action-bg block to solid accent block (`--fs-accent`).
15. **§6.8 (Phase 4 — Expenditure Tasks)**: Updated 4A `/expenditures` table task to compact-expand cards at $\le 768\text{px}$ with neutral category chips and split/bulk action check.
16. **§6.9 (Phase 5 — Payroll & Salary Tasks)**: Updated 5B `/salary/paychecks` table task to compact-expand cards at $\le 768\text{px}$ with $\ge 44\text{px}$ touch targets.
17. **§6.10 (Phase 6 — Portfolio Tasks)**: Added 6A `/portfolio` holdings table task to render as compact-expand cards at $\le 768\text{px}$ per §6.4 and D19 with no page-level horizontal scroll.
18. **§6.11 (Phase 7 — Investments Tasks)**: Updated 7A `/trades` log table task to compact-expand cards at $\le 768\text{px}$ with `--fs-accent` active sort indicator.
19. **§6.12 (Phase 8 — Assets Tasks)**: Updated 8B certificate log and 8C currency/real-estate log table tasks to compact-expand cards at $\le 768\text{px}$.
20. **§6.13 (Phase 9 — Credit Cards, Debt & Lending Tasks)**: Updated 9A credit card and lending ledger tables to compact-expand cards at $\le 768\text{px}$, preserving `.fs-progress--*` utilization semantics.
21. **§6.14 (Phase 10 — Account, Security, Admin Tasks)**: Updated 10A recycle-bin and audit tables to compact-expand cards at $\le 768\text{px}$, explicitly preserving horizontal scroll for $\ge 12$-column audit logs per I6.
22. **§6.16 (Phase 12 — Cleanup Tasks)**: Added searches for raw hex `#14b8a6` (permitted only in `tokens.json` and `theme.css`) and `overflow-x: scroll` (only permitted on $\ge 12$-column audit logs).
23. **§9.2 (Phase 1C Tooling Inventory)**: Added `node frontend/scripts/tokens.js --check --fonts` to the Phase 1C tooling table. Reasoned addition beyond the Part 1 instruction list: §9.2 is the plan's authoritative tooling inventory, and `--check --fonts` is a tool the plan now requires (per §6.5 1B exit gate). Registering it in 1C's plan would leave the tool untracked for the remainder of 1B.

*(Note on unamended sections: §6.15 Phase 11 Landing contains no tables; deliberately unmodified as it carries no table scroll tasks).*

### Supporting Amendments (4 Sections)
24. **§7.1 (Per-PR Definition of Done)**: Added automated PR checks for raw hex `#14b8a6` outside tokens/theme and unapproved `overflow-x`.
25. **§7.2 (Per-Phase Manual Definition of Done)**: Added manual check for compact-expand cards at 390px with no page-level horizontal scroll.
26. **§10 (Progress Log)**: Appended completed entry and sub-phase note for Phase 1B with merge SHA `46f75aa`.
27. **§13 (Deferred / Out of Scope)**: Updated deferred table by removing the "Mobile card-list tables" deferred row (now formally adopted as D19).

---

## 3. Tokens Diff Summary (`tokens.json`)

The single source of truth `frontend/src/styles/tokens.json` was updated:
- `"meta"`: `"version": "1.2.0"`, `"phase": "1B-amended"`
- `"surfaces"`: `"--fs-surface-sunken"`: `"#0c0d0f"` (was `"#15161a"`)
- `"accents"` (new section):
  - `"--fs-accent"`: `"#14b8a6"`
  - `"--fs-accent-hover"`: `"#22c4b3"`
  - `"--fs-accent-active"`: `"#0fa192"`
  - `"--fs-accent-text"`: `"#0d0e10"`
- `"actions"`:
  - `"--fs-action-bg"`: `"var(--fs-accent)"`
  - `"--fs-action-text"`: `"var(--fs-accent-text)"`
  - `"--fs-action-hover"`: `"var(--fs-accent-hover)"`
  - `"--fs-action-active"`: `"var(--fs-accent-active)"`
- `"tables.textPairs"`: Pruned stale `#e8eaed` duplicates. Retains 14 authoritative rows including `--fs-accent` (6.85:1), `--fs-ink on --fs-accent` (7.76:1 Pass), and `White on --fs-accent` (2.49:1 Fail).
- `"tables.nonTextPairs"`: Replaced stale focus-ring-on-action-bg row with `--fs-focus-ring on --fs-accent` (2.24:1 Fail on control — offset required) and `--fs-surface-sunken #0c0d0f vs --fs-bg` (1.03:1) (total: 15 rows).

---

## 4. Regenerated §4.9 Contrast Tables

Emitted directly by `frontend/scripts/tokens.js --write` from `frontend/src/styles/tokens.json`:

#### 4.9.1 Text pairs (14 rows)
| Pair | Surface | bg | Raised | Target | Status |
| :--- | ---: | ---: | ---: | ---: | :--- |
| `--fs-text` | 15.37 | 17.00 | 13.85 | 4.5 | Pass |
| `--fs-text-2` | 10.69 | 11.83 | 9.63 | 4.5 | Pass |
| `--fs-text-3` | 7.12 | 7.88 | 6.42 | 4.5 | Pass |
| `--fs-text-4` | **3.67** | 4.06 | 3.31 | 4.5 | **Disabled only** |
| `--fs-placeholder` (= text-3) | 7.12 | 7.88 | 6.42 | 4.5 | Pass |
| `--fs-positive` | 5.87 | 6.50 | 5.29 | 4.5 | Pass |
| `--fs-negative` | 5.30 | 5.87 | 4.78 | 4.5 | Pass |
| `--fs-warning` | 7.26 | 8.03 | 6.54 | 4.5 | Pass |
| `--fs-ink` on `--fs-danger` `#d97076` | 6.00 | — | — | 4.5 | Pass |
| `--fs-ink` on `--fs-positive` `#4fa87c` | 6.64 | — | — | 4.5 | Pass |
| `--fs-ink` on `--fs-warning` `#cfa24f` | 8.22 | — | — | 4.5 | Pass |
| `--fs-accent` | 6.85 | 7.58 | 6.18 | 4.5 | Pass |
| `--fs-ink` on `--fs-accent` #14b8a6 | 7.76 | — | — | 4.5 | Pass |
| White on `--fs-accent` | 2.49 | — | — | 4.5 | **Fail — use `--fs-ink`** |

#### 4.9.2 Non-text pairs (15 rows)
| Pair | Surface | bg | Raised | Status |
| :--- | ---: | ---: | ---: | :--- |
| `--fs-border` `#34383f` | 1.45 | 1.60 | 1.31 | **Fail — dividers only; the chrome edge is the exception** |
| `--fs-border-strong` `#4a4f57` | 2.07 | 2.29 | 1.86 | **Fail — never alone** |
| `--fs-border-control` `#6a6f77` | 3.37 | 3.73 | **3.04** | Pass — no headroom for a wider ramp |
| `--fs-focus-ring` `#f2f3f5` | 15.37 | 17.00 | 13.85 | Pass |
| `--fs-focus-ring` on `--fs-accent` | **2.24** | — | — | **Fail on the control — offset required** |
| Step `--fs-bg` → `--fs-surface` | 1.11 | — | — | Grouping only, never a boundary |
| Step `--fs-surface` → `--fs-surface-raised` | 1.11 | — | — | Grouping only, never a boundary |
| Action hover `#f5f6f8` | — | 17.46 | — | Pass |
| Action active `#d5d8dd` | — | 13.21 | — | Pass |
| Chart grey 1 `#8b929b` | 5.43 | — | 4.89 | Pass |
| Chart grey 2 `#b8bec6` | 9.11 | — | 8.21 | Pass |
| Chart grey 3 `#6a7078` | 3.41 | — | **3.08** | Pass — no headroom for a wider ramp |
| Chart grey 4 `#d5d9dd` | 12.02 | — | 10.83 | Pass |
| `--fs-accent` #14b8a6 | 6.85 | 7.58 | 6.18 | Pass — no headroom concerns |
| `--fs-surface-sunken` #0c0d0f vs `--fs-bg` | 1.03 | — | — | **Invisible — the 1 px chrome border is mandatory** |

---

## 5. Three Finalized Reference Frames

All three reference frames in `docs/UI-UX_Plan/reference/` have been finalized to canonical Variant B:
1. **`01-dense-table.html`**:
   - Variant B canonical (group-by control with neutral chips).
   - Mobile: compact-expand cards with full break-word wrapping.
   - Interactive affordances: active sort indicator accent, checked checkbox accent, selected row 2px accent rule.
   - All exploration banners purged.
2. **`02-form.html`**:
   - Variant B canonical (stacked cards sub-panels).
   - Save button: solid teal accent (`--fs-action-bg: var(--fs-accent)`, `--fs-action-text: var(--fs-ink)`).
   - Discard button: neutral secondary (`--fs-surface` + `--fs-border-control` + `--fs-text`).
   - Links: teal accent with neutral hover.
   - Focus rings: neutral `#f2f3f5` with 2px offset.
   - All exploration banners purged.
3. **`03-dashboard.html`**:
   - Variant B canonical (recessed `#0c0d0f` chrome plane with 1px border).
   - Primary CTA: solid teal accent. Active navigation: teal accent left rule + teal text.
   - Neutral grey 3 chart series (`#6a7078`).
   - Mobile: KPI single-column grid, compact-expand cards for recent activity.
   - Non-colour cue verified: positive badge carries `▲` glyph and explicit text.
   - All exploration banners purged.

---

## 6. Verification Summary

| Gate / Command | Expected | Actual | Result |
| :--- | :--- | :--- | :---: |
| `node frontend/scripts/tokens.js --check --tables` | 0 drift across §4.9.1, §4.9.2, §4.9.3 | 0 drift reported | **PASS** |
| `node frontend/scripts/tokens.js --check --fonts` | 4 woff2 files, $\le 90\text{ KB}$, OFL present | 72.64 KB (17.36 KB headroom) | **PASS** |
| `git diff --stat docs/UI-UX_Plan/UI-UX-PLAN.md` | Hunks in authorized sections only | Verified: hunks strictly in 27 authorized sections (23 primary + 4 supporting) | **PASS** |
| `git diff --stat frontend/src/styles/tokens.json` | Token values and schema only | Verified: tokens and tables schema only | **PASS** |
| Banned pattern grep on reference frames | 0 gradient, blur, text-shadow, high radius | 0 occurrences | **PASS** |
| Accent leaked to production CSS grep | 0 occurrences of `#14b8a6` in `src/` | 0 occurrences | **PASS** |
| Production UI freeze check (`pages/`, `components/`) | Empty diff | Empty (0 files touched) | **PASS** |
| `npm test -- --watchAll=false src/App.test.js` | All tests pass | 9/9 passed green | **PASS** |

---

## 7. Non-Blocking Notes & Follow-ups

- **N1 (Deuteranopia Check)**: Distinguishability between `--fs-accent` and `--fs-positive` on low brightness is accompanied by mandatory non-colour cues (`▲` glyph + explicit text) per §4.10. At Phase 12A (QA & Accessibility Audit), an automated run through Chrome DevTools' deuteranopia deficiency emulator will be executed to record simulated CVD visual captures.
- **N2 (Focus Ring on Action Control)**: With `--fs-action-bg` aliased to `var(--fs-accent)`, the focus ring on the control itself measures 2.24:1, confirming the architectural requirement for `outline-offset: 2px` so the ring sits on `--fs-bg` (where contrast is 17.00:1 on page and 13.85:1 on raised surface).

---

## 8. Screenshot Package

The 10 reference screenshots have been captured headlessly using Chrome and are verified on disk:

```
## Screenshots
- 01-dense-table-1440.png
- 01-dense-table-1024.png
- 01-dense-table-390.png
- 02-form-1440.png
- 02-form-1024.png
- 02-form-390.png
- 03-dashboard-1440.png
- 03-dashboard-1024.png
- 03-dashboard-390.png
- 03-dashboard-low-brightness.png
```

Storage locations:
- Workspace path: [`docs/ui-snapshots/phase-1b/`](file:///d:/Projects/FinStat/docs/ui-snapshots/phase-1b/) (git-ignored via `docs/*`)
- Artifact path: [`C:\Users\User\.gemini\antigravity\brain\6a81524b-5770-4a5a-a050-161c44267e14\screenshots\phase-1b\`](file:///C:/Users/User/.gemini/antigravity/brain/6a81524b-5770-4a5a-a050-161c44267e14/screenshots/phase-1b/)
