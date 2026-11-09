# IBM Plex Subsets for FinStat

## Overview
Self-hosted Latin woff2 subsets of IBM Plex Sans and IBM Plex Mono for the FinStat UI/UX Overhaul, governed by `docs/UI-UX_Plan/UI-UX-PLAN.md` §4.5, §6.5 (Phase 1B), and Decision D18.

## Font Inventory & Budget

| File | Weight | Format | Size (KB) |
| :--- | :--- | :--- | ---: |
| `IBMPlexSans-Regular.woff2` | 400 | woff2 | 18.71 KB |
| `IBMPlexSans-Medium.woff2` | 500 | woff2 | 19.59 KB |
| `IBMPlexSans-SemiBold.woff2` | 600 | woff2 | 19.88 KB |
| `IBMPlexMono-Regular.woff2` | 400 | woff2 | 14.46 KB |
| **Total** | | | **72.64 KB** |

**Budget**: $\le 90\text{ KB}$ total budget per §4.5. Actual total: **72.64 KB** (17.36 KB headroom).

## License
Licensed under the **SIL Open Font License v1.1** (see `OFL.txt` in this directory).
Per §1 of the license, derivative works and subsets are permitted and retain the IBM Plex name since no Reserved Font Names are declared for IBM Plex.

## Subsetting Specification & Reproducibility
Subsetting targets the Latin glyph range via `fonttools` (`pyftsubset`):

```bash
pyftsubset <upstream-font.ttf> \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --flavor=woff2 \
  --layout-features='*' \
  --output-file=<output.woff2>
```

All 4 font files are committed directly to version control. There is zero network dependency at build time.

## Loading Strategy (Phase 2A Implementation)
These font files are procured and verified in Phase 1B. Per the contract, they are **not declared in Phase 1B**.
The `@font-face` declarations with `font-display: swap` and the size-adjusted fallback stack:
`local('Arial'), local('Liberation Sans'), local('Helvetica')`
are formally introduced in Phase 2A (`frontend/src/styles/theme.css`).
Numeric cells use `--fs-font-sans` with `tabular-nums` (`.fs-num`); Mono is reserved strictly for identifiers.

