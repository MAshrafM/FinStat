# Phase 1C Implementation Plan — Tooling, Deterministic Harness, and Characterization Fixtures (v5 Reconciled)

## 1. Overview & Context

- **Sub-phase**: **1C** (`phase-ui-1c-tooling`)
- **Plan Reference**: `docs/UI-UX_Plan/UI-UX-PLAN.md` §6.5 (Phase 1C), §9.1–§9.6, §7.1, §15.
- **Objective**: Establish the deterministic verification, anti-slop enforcement, calculation characterization, and visual regression harness so that every subsequent phase (2A through 14A) is mechanically protected against regression, drift, slop, and calculation deviation.
- **Production UI Boundary**: **Zero changes** to production UI components (`frontend/src/pages/`, `frontend/src/components/`).

---

## 2. Core Deliverables & Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Phase 1C Gates                 │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌───────────────────┬─────────────┴───────┬────────────────────┐
         ▼                   ▼                     ▼                    ▼
   Anti-Slop Lint      Lint Ratchet &       Calculation         Visual & A11y
   & ESLint Rules      Tones Enforcement    Fixtures            Harness (Playwright)
 ─────────────────   ───────────────────   ───────────────     ──────────────────────
 • stylelint config  • lint-ratchet.js     • 8 snapshots       • routes.js fixture
 • anti-slop regex   • lint-tones.js       • byte-identical    • clock.js (fixed)
 • inline style ban    (+ --fs-accent ban)   assertion         • auth.setup.js
 • #14b8a6 JS ban    • testid-guard.js     • calc runner       • visual.spec.js (5 QA widths)
 • AGENTS.md         • ui-coverage         • diff is failure   • 325 baselines committed
                       --assert-allowlist                      • jest-axe helper
```

---

### Component 1: Anti-Slop Stylelint, Ratchet & Tone Enforcement

#### 1.1 Stylelint Anti-Slop Configuration (`frontend/.stylelintrc.json`)
Exempts only generated `src/styles/tokens.css`. Enforces strict graphite constraints per §9.2:
```json
{
  "ignoreFiles": ["src/styles/tokens.css"],
  "rules": {
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": ["rgb", "rgba", "hsl", "hsla"],
    "declaration-no-important": true,
    "declaration-property-value-disallowed-list": {
      "backdrop-filter": ["/./"],
      "-webkit-backdrop-filter": ["/./"],
      "background": ["/gradient\\(/"],
      "background-image": ["/gradient\\(/"],
      "mask": ["/gradient\\(/"],
      "mask-image": ["/gradient\\(/"],
      "-webkit-mask": ["/gradient\\(/"],
      "-webkit-mask-image": ["/gradient\\(/"],
      "border-image": ["/gradient\\(/"],
      "border-image-source": ["/gradient\\(/"],
      "background-clip": ["text"],
      "-webkit-background-clip": ["text"],
      "filter": ["/blur\\(|drop-shadow\\(/"],
      "-webkit-filter": ["/blur\\(|drop-shadow\\(/"],
      "border-top-left-radius": ["/./"],
      "border-top-right-radius": ["/./"],
      "border-bottom-left-radius": ["/./"],
      "border-bottom-right-radius": ["/./"],
      "border-start-start-radius": ["/./"],
      "border-start-end-radius": ["/./"],
      "border-end-start-radius": ["/./"],
      "border-end-end-radius": ["/./"]
    },
    "declaration-property-value-allowed-list": {
      "border-radius": ["/^(0|var\\(--fs-radius-(sm|md|lg|pill)\\))( (0|var\\(--fs-radius-(sm|md|lg|pill)\\))){0,3}$/"],
      "box-shadow": ["none", "/^var\\(--fs-shadow\\)$/"],
      "text-shadow": ["none"]
    }
  }
}
```

#### 1.2 Lint Ratchet Script (`frontend/scripts/lint-ratchet.js`)
- Runs stylelint over the working tree and over `git merge-base HEAD origin/main` (using git archive to a temp directory).
- Compares per-file violation counts: violation count per file may only decrease or stay the same (F2, S1).
- A PR fails if any file's count rises above its merge-base count.
- Any new file absent from merge base must report **0 violations**.
- Converted/allowlisted files (`theme.css`, `theme-components.css`, allowlisted page CSS) must report **0 violations**.
- Generated `tokens.css` is exempt. Pre-existing violations on unmigrated files are left untouched until their phase.

#### 1.3 Extended Tone & Accent Linter (`frontend/scripts/lint-tones.js`)
**Architectural mandate**: Mechanically enforces Invariant I15 and §4.3.2 rule 1 ("Accent is for interactivity only; it is not a brand wash").
- **Tokens banned in page CSS**:
  - Semantic tones: `var(--fs-positive)`, `var(--fs-negative)`, `var(--fs-warning)`
  - **Interactive accent**: `var(--fs-accent)`, `var(--fs-accent-hover)`, `var(--fs-accent-active)`, `var(--fs-accent-text)`
- **Permitted locations**: Only hand-written theme files (`src/styles/theme.css`, `src/styles/theme-components.css`) and generated `src/styles/tokens.css` may declare or reference these tokens.
- **Rule for page CSS**: Page CSS must name a designated semantic class (e.g. `.fs-link`, `.fs-btn--primary`, `.fs-checkbox`) or a shared primitive (from Phase 2E), **never the accent token directly**.
- **Implementation**:
  - Scans all `.css` files under `frontend/src/` (excluding `tokens.css`, `theme.css`, `theme-components.css`).
  - Matches: `/var\(--fs-(?:positive|negative|warning|accent(?:-hover|-active|-text)?)\)/g`.
  - Exits non-zero with exact file and line locations if any violation is found.

---

### Component 2: ESLint JS AST Guard Rules & Hex Literal Ban

Configured in two layers per §7.1 ("changed files") and §9.2:

- **Layer 1 — `.eslintrc.json` (CRA build proxy)**: All anti-slop AST rules below are configured with severity `"warn"`. CRA's `react-scripts build` runs `eslint-webpack-plugin` across all files in `src/`. Under CI=true, ESLint errors immediately terminate the build. Setting Layer 1 to `"warn"` ensures pre-existing violations across unmigrated legacy files appear as advisory warnings in the build log without blocking compilation, strictly maintaining the **"Zero changes to production UI"** boundary in 1C.
- **Layer 2 — CI Changed-Files Gate**: Every PR runs the authoritative gate in `.github/workflows/ci.yml`:
  ```bash
  npx eslint $(git diff --name-only origin/main -- 'src/**/*.js' 'src/**/*.jsx') --max-warnings=0
  ```
  New code and PR-touched files must report **zero warnings and zero errors**. Any newly introduced inline color style, hex literal, or gradient immediately fails CI. (All rules will upgrade globally from `"warn"` to `"error"` in Phase 12 cleanup).

#### Configuration (`frontend/.eslintrc.json`):

```json
{
  "rules": {
    "no-restricted-syntax": [
      "warn",
      {
        "selector": "JSXAttribute[name.name='style'] ObjectExpression > Property[key.name=/^(color|background|backgroundImage|backgroundColor|border|borderTop|borderRight|borderBottom|borderLeft|borderBlock|borderInline|borderColor|borderTopColor|borderRightColor|borderBottomColor|borderLeftColor|borderBlockColor|borderInlineColor|borderRadius|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius|borderImage|borderImageSource|boxShadow|textShadow|filter|WebkitFilter|backdropFilter|WebkitBackdropFilter|accentColor|fill|stroke|outline|outlineColor|caretColor|textDecorationColor)$/]",
        "message": "Colour-bearing inline styles are banned. Use a token class, or pass a CSS custom property such as style={{ '--fs-progress': pct }}."
      },
      {
        "selector": "Literal[value=/^#(?:[0-9a-fA-F]{3,4}){1,2}$/]",
        "message": "Hex colours are banned outside chartTheme.js and categories.js. Use a token."
      },
      {
        "selector": "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}/]",
        "message": "Hex colours are banned in template literals."
      },
      {
        "selector": "Literal[value=/^(?:rgb|rgba|hsl|hsla)\\(/i]",
        "message": "Functional colour values are banned. Use a token."
      },
      {
        "selector": "TemplateElement[value.raw=/(?:rgb|rgba|hsl|hsla)\\(/i]",
        "message": "Functional colour values are banned in template literals. Use a token."
      },
      {
        "selector": "Literal[value=/^(?:aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/i]",
        "message": "Named colours are banned. Use a token."
      },
      {
        "selector": "CallExpression[callee.property.name=/^create(Linear|Radial|Conic)Gradient$/]",
        "message": "Gradients are banned (I14). Use a solid fill from chartTheme."
      }
    ],
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/no-static-element-interactions": "warn",
    "jsx-a11y/interactive-supports-focus": "warn",
    "jsx-a11y/label-has-associated-control": "warn"
  },
  "overrides": [
    {
      "files": ["src/styles/chartTheme.js", "src/constants/categories.js"],
      "rules": {
        "no-restricted-syntax": [
          "warn",
          {
            "selector": "CallExpression[callee.property.name=/^create(Linear|Radial|Conic)Gradient$/]",
            "message": "Gradients are banned (I14)."
          },
          {
            "selector": "Literal[value=/#14b8a6/i]",
            "message": "Accent hex #14b8a6 is banned in chartTheme.js and categories.js (§4.3.2 rule 6: chart series never use the accent hue)."
          },
          {
            "selector": "TemplateElement[value.raw=/#14b8a6/i]",
            "message": "Accent hex #14b8a6 is banned in template literals."
          }
        ]
      }
    }
  ]
}
```

#### Strict `#14b8a6` Hex Literal Enforcement
- **Universal ban**: `#14b8a6` cannot appear in any `.js` or `.jsx` file across `frontend/src/` (enforced by the global `Literal[value=/^#(?:[0-9a-fA-F]{3,4}){1,2}$/]` rule).
- **Scope discipline (Fix B1 & N6)**: While `chartTheme.js` and `categories.js` have narrow overrides permitting chart palette greys (`#8b929b`, `#b8bec6`, `#6a7078`, `#d5d9dd`), **`#14b8a6` is strictly re-banned** via standard JavaScript regexes with trailing flag:
  `Literal[value=/#14b8a6/i]` and `TemplateElement[value.raw=/#14b8a6/i]`.
- **Single home (N2)**: `#14b8a6` exists literally only in `frontend/src/styles/tokens.json` (source); will be generated into `frontend/src/styles/tokens.css` in Phase 2A (stylelint-exempt). `theme.css` references it via `var(--fs-accent)` (no hex literal, per §9.2's `color-no-hex` rule).

---

### Component 3: Repository Hygiene, Test-ID Guard, A11y Helper, and `AGENTS.md`

1. **`AGENTS.md`** at repository root:
   - Sets project guardrails for AI agents: graphite ramp, teal interactive accent (`#14b8a6`), recessed `#0c0d0f` chrome, mobile compact-expand cards (D19), IBM Plex Sans/Mono.
   - Pointers to canonical reference frames (`docs/UI-UX_Plan/reference/01-dense-table.html`, `02-form.html`, `03-dashboard.html`).
   - Explicit banned patterns list: gradients, blurs, box-shadow glows, unlisted radii, white text on accent, and direct usage of `var(--fs-accent)` in page CSS.
2. **Test-ID & Aria Label Guard (`frontend/scripts/testid-guard.js`) (N4)**:
   - Diffs occurrences of `data-testid` and `aria-label` across all `.js`/`.jsx` files between HEAD and merge base.
   - Rule: No `data-testid` or `aria-label` may be deleted or altered without a corresponding replacement at the same call site (Invariant I5).
   - Negative test: Deleting a `data-testid` from a test file triggers a non-zero exit.
3. **`ui-coverage.js --assert-allowlist`**:
   - Validates that every route entry in `App.js` matches the allowlist ownership structure from §6.3.
   - Negative test: A deliberately mis-scoped test route pattern fails the assertion.
4. **`jest-axe` Shared Helper (`frontend/tests/a11y/expectNoA11yViolations.js`) (Fix B6)**:
   - Exports async helper:
     ```javascript
     const { axe, toHaveNoViolations } = require('jest-axe');
     expect.extend(toHaveNoViolations);

     async function expectNoA11yViolations(container, options = {}) {
       const results = await axe(container, {
         rules: {
           region: { enabled: false }, // jsdom container override
           ...options.rules,
         },
       });
       expect(results).toHaveNoViolations();
     }

     module.exports = { expectNoA11yViolations };
     ```
   - Verified by test suite `frontend/tests/a11y/expectNoA11yViolations.test.js`:
     - Positive test: Passes on `<button>Click me</button>`.
     - Negative test: Fails on `<button></button>` (empty button missing accessible name).
   - **jsdom Scope & Limitation (C4)**:
     > [!NOTE]
     > The helper verifies DOM structure, roles, and accessibility labels, **not contrast or layout**. jsdom has no rendering or layout engine; color-contrast and layout-dependent rules are skipped by axe inside jsdom. Visual color contrast is measured against the real browser in Playwright via `a11y.spec.js` (Component 5). Test authors must not assume `expectNoA11yViolations` clears contrast defects.

---

### Component 4: Calculation Characterization Fixtures (§9.6, Invariant I3) (Fix B7)

Preserves current numerical calculations with zero deviation:
1. **8 Target Calculation Domains**:
   - **Payroll**: gross $\to$ net, tax brackets, social insurance deductions (`PaycheckFormPage`, `PaycheckTable`, `YearlyTaxTable`).
   - **Credit Cards**: installment schedule amortization, statement cycle, partial payment interest.
   - **Debt Payoff**: payoff projections across Avalanche vs Snowball strategies (`DebtPayoffPage`).
   - **Trades**: trade P&L, fees/charges, corporate-action share adjustments.
   - **Certificates**: CD maturity values, daily/monthly interest accrual schedule.
   - **Currency**: multi-currency conversions, portfolio valuation, historical rate triangulation.
   - **Budgets**: threshold calculation at 0%, 50%, 80%, 100%, 120%.
   - **Real Estate**: rental yield, ROI, maintenance and acquisition cost totals.
2. **Snapshot Persistence**:
   - Each domain captures current calculation output as a committed snapshot in:
     `frontend/tests/fixtures/calculations/<domain>.snapshot.json`
3. **Runner & Failure Contract**:
   - Runner `frontend/tests/calculations.spec.js` executes calculations and asserts byte-identical match against committed JSON snapshots (modulo documented floating-point precision).
   - A diff is a failing PR, never an accepted change.
   - Negative test: Altering a value in any snapshot causes `calculations.spec.js` to fail.

---

### Component 5: Deterministic Playwright Visual Regression Harness (§9.5)

#### 5.1 Directory Layout & Baselines Storage (N3)
Baselines live at `frontend/tests/visual/baseline/` and are tracked by git:
```
frontend/tests/visual/
  fixtures/routes.js        # deterministic mock payloads for 65 routes
  fixtures/clock.js         # fixed timestamp helper (2026-01-15T09:00:00Z)
  fixtures/auth.setup.js    # storageState session (no login round-trip)
  visual.spec.js            # route × 5 mandatory QA widths
  a11y.spec.js              # axe per route in real browser
  baseline/                 # 325 reference screenshots generated in pinned Docker image
```

#### 5.2 Mandatory Viewport Widths (Fix B2)
Per §4.7, visual regressions are tested across the 5 mandatory QA widths:
- `1440px` (Desktop wide)
- `1024px` (Desktop / Tablet landscape)
- `768px` (Tablet portrait / Compact-expand card threshold)
- `480px` (Large phone / Compact-expand card verification)
- `390px` (Standard mobile viewport)

#### 5.3 Deterministic Masking Approach (Fix B5, N1)
- **Zero Production UI Impact in 1C**: 1C makes **zero changes** to production UI components (`pages/`, `components/`).
- **1C Masking Strategy**: The harness applies masks via Playwright locators targeting specific volatile elements without over-masking:
  - `page.locator('time')`
  - `page.locator('[data-testid$="-id"]')` (ends with `-id`; replaces over-broad `*=id` to avoid masking valid stable controls like `grid`, `valid`, or `balance-width`)
  - `page.locator('[data-testid*="timestamp"]')`, `page.locator('[data-testid*="date"]')`
  - Known volatile text patterns (clock, relative dates, generated mock transaction UUIDs).
  - Explicit preference: **Under-masking over over-masking** — a false-positive diff in review is far more valuable than a silently masked regression.
- **Progression**: `data-visual-mask="true"` DOM attributes are introduced progressively from Phase 3A+ as each individual page is converted.

#### 5.4 325 Initial Baselines Generation Task (Fix B3, C3)
- Execute inside the pinned Playwright Docker container (`mcr.microsoft.com/playwright:v1.49.0-jammy` matching `@playwright/test@1.49.0`):
  `65 routes × 5 widths (1440, 1024, 768, 480, 390) = 325 baselines`.
- Commit all 325 png files under `frontend/tests/visual/baseline/`.
- Verify: `npx playwright test --project=visual` reproduces with zero diff against unchanged `main`.

#### 5.5 Playwright Configuration & Environments (N1, C2)
In `frontend/playwright.config.js`:
- Configures `webServer` conditionally for local dev vs CI:
  ```javascript
  webServer: {
    command: process.env.CI
      ? 'npm run build && npx serve -s build -l 3000'
      : 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  ```
- Sets `window.__VISUAL_TEST__ = true` to freeze/disable Chart.js animations and transient effects.
- Local dev execution (§15): Respects single-worker memory constraints.
- CI execution: Uses `baseURL: 'http://localhost:3000'` served from production build.

#### 5.6 CI Integration & PR Subset Scope (N2)
In `.github/workflows/ci.yml`:
- Add frontend test job (`npm test -- --watchAll=false`).
- PR validation triggers for frontend tests, lint ratchet, tone linter, and ESLint.
- PR visual subset run:
  `Touched routes × 5 widths + 5 legacy smoke routes × 2 widths + every legacy route at 1440`.
- Full 325 matrix runs nightly and on merge to `main`.

---

## 3. Verification & Acceptance Criteria (Verbatim §6.5 1C Exit Gate) (Fix B4)

The 1C walkthrough and PR must satisfy and prove every item of the v9 §6.5 exit gate:

1. **Gitignore Hygiene**:
   - `git check-ignore -v docs/UI-UX_Plan/UI-UX-PLAN.md` prints nothing (plan is trackable).
   - `git check-ignore -v docs/ui-snapshots/test.png` prints rule (snapshots ignored).
   - Baselines in `frontend/tests/visual/baseline/` are confirmed tracked.
2. **CI Pipeline Configuration**:
   - CI runs frontend tests, the lint ratchet, ESLint, and the PR visual subset.
3. **Visual Baselines Reproducibility**:
   - 325 baselines exist in `frontend/tests/visual/baseline/` and reproduce with zero diff on unchanged `main` inside the pinned Playwright Docker image.
4. **Calculation Characterization Fixtures**:
   - Characterization snapshots exist in `frontend/tests/fixtures/calculations/<domain>.snapshot.json` for all 8 domains.
   - `frontend/tests/calculations.spec.js` passes 100% green on unchanged code.
   - Negative test: Altering a snapshot value fails the runner.
5. **Coverage Allowlist Guard Negative Test**:
   - `node frontend/scripts/ui-coverage.js --assert-allowlist` passes on real code.
   - Fails on a deliberately mis-scoped test pattern (negative test).
6. **Stylelint 14-Declaration Negative/Positive Test Matrix**:
   - Stylelint **fails** each of the following 14 declarations:
     1. `backdrop-filter: blur(4px)`
     2. `background: linear-gradient(...)`
     3. `box-shadow: 0 0 20px #fff`
     4. `border-top-left-radius: 12px`
     5. `mask: linear-gradient(...)`
     6. `mask-image: linear-gradient(...)`
     7. `-webkit-mask-image: linear-gradient(...)`
     8. `border-image: linear-gradient(...)`
     9. `border-image-source: linear-gradient(...)`
     10. `-webkit-background-clip: text`
     11. `filter: drop-shadow(0 0 12px #fff)`
     12. `color: white`
     13. `background: rgba(0, 0, 0, 0.4)`
     14. `border-radius: 0 0 6px 6px` and `border-radius: var(--fs-radius-md) 40px`
   - Stylelint **passes**:
     - `border-radius: 0 0 var(--fs-radius-md) var(--fs-radius-md)`
     - `border-radius: var(--fs-radius-pill)`
7. **ESLint Two-Layer Enforcement & Negative Test Matrix**:
   - **7a. ESLint Build-Survival Verification**: `npm run build` succeeds on the clean tree with the new rules (Layer 1 as `"warn"`). Pre-existing violations appear in the build log but do not block compilation.
   - **7b. Changed-Files Gate Verification**: `npx eslint src/App.js --max-warnings=0` exits 0 (clean file). Modifying a file to add a banned style exits non-zero (fails PR gate).
   - **7c. 11-Expression Negative Test Matrix**: ESLint catches and flags each of the following 11 expressions:
     1. `ctx.createLinearGradient(`
     2. `chart.ctx.createLinearGradient(`
     3. `canvas.getContext('2d').createRadialGradient(`
     4. `style={{ backgroundImage: 'linear-gradient(...)' }}`
     5. `style={{ filter: 'blur(4px)' }}`
     6. `style={{ textShadow: '0 0 8px #fff' }}`
     7. `style={{ borderRadius: 12 }}`
     8. `style={{ accentColor: '#009879' }}`
     9. `const c = 'white'`
     10. `const c = 'rgba(0, 0, 0, 0.4)'`
     11. `const c = 'hsl(0 0% 0%)'`
     *(plus: `const x = '#14b8a6'` fails in JS components and inside `chartTheme.js` override)*.
8. **Tone & Accent Linter Negative Tests**:
   - `node frontend/scripts/lint-tones.js` exits 0 on clean tree.
   - Fails on `color: var(--fs-negative)` in a page CSS file.
   - Fails on `color: var(--fs-warning)` in a page CSS file.
   - Fails on `color: var(--fs-accent)` in a page CSS file.
   - Passes the same declarations in `theme.css`.
   - `tokens.css` is exempt.
9. **Lint Ratchet 3-Way Negative/Positive Test Matrix**:
   - Fails when a file's violation count rises by +1 above merge base.
   - Fails a genuinely new file with any stylelint violation.
   - Passes when a hotfix leaves pre-existing violations untouched.
10. **Test-ID Guard**:
    - `node frontend/scripts/testid-guard.js` exits 0 on clean diff.
    - Fails if an existing `data-testid` or `aria-label` is deleted without replacement.
11. **`jest-axe` Shared Helper Test**:
    - `expectNoA11yViolations` passes on `<button>Save</button>`.
    - Fails on `<button></button>` (unlabeled button).
12. **`AGENTS.md` Verification**:
    - File exists at repository root.
    - References `docs/UI-UX_Plan/reference/01-dense-table.html`, `02-form.html`, and `03-dashboard.html`.
    - Lists banned patterns (gradients, blur, glows, radius > 8px, white text on accent, `var(--fs-accent)` in page CSS).

### 3.1 Required Walkthrough Approval Evidence

The Phase 1C walkthrough artifact must include actual command executions and captured output for each of the following 15 verification items:

1. **Gitignore Tracking Verification**:
   - `git check-ignore -v docs/UI-UX_Plan/UI-UX-PLAN.md` prints nothing (tracked).
   - `git check-ignore -v docs/ui-snapshots/test.png` prints `docs/*` rule (ignored).
   - `git check-ignore -v frontend/tests/visual/baseline/01-dense-table-1440.png` prints nothing (tracked).
2. **CI Workflow Verification (N3)**:
   - `.github/workflows/ci.yml` capture showing frontend test, lint, tone, ESLint changed-files gate, and PR visual subset jobs.
   - CI log from the branch's initial push (or a targeted test PR) showing each job's green status.
3. **Visual Baselines Reproducibility in Docker**:
   - `ls -la frontend/tests/visual/baseline/ | wc -l` = 325 files (plus `.` and `..`).
   - `npx playwright test --project=visual` on unchanged `main` inside Docker (`mcr.microsoft.com/playwright:v1.49.0-jammy`) — 325 passed, 0 diff.
4. **Calculation Characterization Fixtures**:
   - `ls frontend/tests/fixtures/calculations/*.snapshot.json | wc -l` = 8.
   - `npx jest --runInBand frontend/tests/calculations.spec.js` — 8 passes.
   - Negative test: Modify one snapshot, re-run, capture failure.
5. **Coverage Allowlist Guard**:
   - `node frontend/scripts/ui-coverage.js --assert-allowlist` — passes on real code.
   - Negative test: Deliberately mis-scope a test pattern, re-run, capture failure.
6. **Stylelint 14 Negatives & 2 Positives**:
   - Create one temp CSS file per violation, run stylelint, capture failure for each of the 14 banned declarations.
   - Run stylelint on the two positive declarations (`border-radius: 0 0 var(--fs-radius-md) var(--fs-radius-md)` and `border-radius: var(--fs-radius-pill)`) — must pass.
7. **ESLint 11 Expressions & Chart Accent Ban**:
   - Create one temp JS file per expression, run ESLint, capture failure for each of the 11 banned expressions.
   - Negative test: Add `const x = '#14b8a6'` to `chartTheme.js` — must fail.
8. **Tone Linter 5-Way Matrix**:
   - `node frontend/scripts/lint-tones.js` exits 0 on clean tree.
   - Create page CSS with `var(--fs-negative)`, `var(--fs-warning)`, `var(--fs-accent)`, `var(--fs-accent-text)` — each fails.
   - Add the same declarations to `theme.css` — passes. `tokens.css` remains exempt.
9. **Lint Ratchet 3-Way Matrix**:
   - Bump a violation count +1 in a page CSS → fails.
   - Add a new file with `!important` → fails.
   - Hotfix a file without touching pre-existing violations → passes.
10. **Test-ID Guard**:
    - `node frontend/scripts/testid-guard.js` — passes on clean tree.
    - Negative test: Remove a `data-testid` from a test file → fails.
11. **`jest-axe` Shared Helper Test**:
    - `npx jest --runInBand frontend/tests/a11y/expectNoA11yViolations.test.js` — positive on `<button>Save</button>` passes, negative on `<button></button>` fails.
12. **`AGENTS.md` Guardrail Verification**:
    - `cat AGENTS.md` — grep for the three reference frame paths (`docs/UI-UX_Plan/reference/01-dense-table.html`, `02-form.html`, `03-dashboard.html`) and banned patterns (gradients, blur, glows, radius > 8px, white text on accent, `var(--fs-accent)` in page CSS).
13. **Zero Production UI Touched**:
    - `git status --porcelain frontend/src/pages/ frontend/src/components/` returns completely empty.
14. **Clean Tree Stylelint Verification**:
    - `npx stylelint "src/**/*.css"` runs clean on all files except `tokens.css` (which is exempt). Capture the full file list.
15. **Local Memory Safety (§15)**:
    - `npx jest --runInBand` and `npx playwright test --project=pr-subset` report actual memory peak and confirm neither crashed the workstation.
16. **ESLint Build-Survival Verification**:
    - `npm run build` completes successfully with warnings-only ESLint (Layer 1). Capture full build log.
17. **ESLint Changed-Files Gate**:
    - `npx eslint <touched files> --max-warnings=0` exits 0 on a clean PR; exits non-zero when a banned pattern is added.
18. **`.eslintrc` Rule Severity Documented**:
    - `grep -A5 '"no-restricted-syntax"' frontend/.eslintrc.json` shows the actual severity (`"warn"` for Layer 1 under solution A).
19. **`.github/workflows/ci.yml` Diff**:
    - Shows the new changed-files ESLint job, matching v9 §7.1's "ESLint clean on changed files" language.

---

## 4. Execution Steps

1. Create branch `phase-ui-1c-tooling` from `main`.
2. Install necessary dev dependencies:
   `stylelint`, `stylelint-config-standard`, `jest-axe`, `@playwright/test@1.49.0`.
3. Create `frontend/.stylelintrc.json` with verbatim anti-slop rules from §9.2.
4. Create `frontend/scripts/lint-ratchet.js` and `frontend/scripts/lint-tones.js` (including `--fs-accent` enforcement).
5. Update ESLint configuration in `frontend/`: rules as `"warn"` in `.eslintrc.json` (Layer 1); add the CI changed-files job to `.github/workflows/ci.yml` running `--max-warnings=0` on PR-touched files (Layer 2).
6. Create `frontend/tests/a11y/expectNoA11yViolations.js` and verification test.
7. Create `frontend/scripts/testid-guard.js` and negative test.
8. Extend `frontend/scripts/ui-coverage.js` with `--assert-allowlist` mode and negative test.
9. Author `AGENTS.md` at repo root.
10. Construct calculation fixtures in `frontend/tests/fixtures/calculations/<domain>.snapshot.json` and runner `frontend/tests/calculations.spec.js`.
11. Setup Playwright visual regression harness in `frontend/tests/visual/` with 5 QA widths and selector masking.
12. Generate and commit 325 baselines in `frontend/tests/visual/baseline/` inside the pinned Docker image.
13. Update `.github/workflows/ci.yml` for frontend test/lint jobs and PR visual subset.
14. Run the full verification suite (including all 14 stylelint, 11 ESLint, 3 ratchet, 3 tone, and testid negative tests).
15. Produce walkthrough artifact and submit for developer review.
