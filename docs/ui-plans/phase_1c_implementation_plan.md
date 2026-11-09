# Phase 1C Implementation Plan — Tooling, Deterministic Harness, and Characterization Fixtures

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
 • stylelint config  • lint-ratchet.js     • Payroll           • routes.js fixture
 • anti-slop regex   • lint-tones.js       • Cards & Debt      • clock.js (fixed)
 • inline style ban    (+ --fs-accent ban) • Trades & Certs    • auth.setup.js
 • #14b8a6 JS ban    • testid-guard.js     • Currency & Budget • visual.spec.js
 • AGENTS.md         • ui-coverage         • calculations test • jest-axe helper
                       --assert-allowlist
```

---

### Component 1: Anti-Slop Stylelint, Ratchet & Tone Enforcement

#### 1.1 Stylelint Anti-Slop Config (`frontend/.stylelintrc.json`)
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
- Runs stylelint over the working tree and over `git merge-base HEAD origin/main`.
- Compares per-file violation counts: violation count per file may only decrease or stay the same (F2, S1).
- Any new file absent from merge base must report **0 violations**.
- Converted/allowlisted files (`theme.css`, `theme-components.css`, allowlisted page CSS) must report **0 violations**.
- Generated `tokens.css` is exempt.

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
  - Exits with non-zero status and prints file, line, and offending token reference upon violation.

---

### Component 2: ESLint JS AST Guard Rules & Hex Literal Ban

Configured in `frontend/.eslintrc.json` or `package.json` `eslintConfig` per §9.2:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
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
          "error",
          {
            "selector": "CallExpression[callee.property.name=/^create(Linear|Radial|Conic)Gradient$/]",
            "message": "Gradients are banned (I14)."
          },
          {
            "selector": "Literal[value=/(?i)#14b8a6/]",
            "message": "Accent hex #14b8a6 is banned in chartTheme.js and categories.js (§4.3.2 rule 6: chart series never use the accent hue)."
          },
          {
            "selector": "TemplateElement[value.raw=/(?i)#14b8a6/]",
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
- **Scope discipline**: While `chartTheme.js` and `categories.js` are granted a narrow exemption to declare chart palette and category hexes, they **explicitly re-ban `#14b8a6`** via AST selectors `Literal[value=/(?i)#14b8a6/]` and `TemplateElement[value.raw=/(?i)#14b8a6/]`.
- **Single home**: `#14b8a6` exists exclusively in `frontend/src/styles/tokens.json` and `frontend/src/styles/theme.css`.

---

### Component 3: Repository Hygiene, Test-ID Guard, and `AGENTS.md`

1. **`AGENTS.md`** at repository root:
   - Sets project guardrails for AI agents: graphite ramp, teal interactive accent (`#14b8a6`), recessed `#0c0d0f` chrome, mobile compact-expand cards (D19), IBM Plex Sans/Mono.
   - Pointers to canonical reference frames (`docs/UI-UX_Plan/reference/01-dense-table.html`, `02-form.html`, `03-dashboard.html`).
   - Explicit banned patterns list: gradients, blurs, box-shadow glows, unlisted radii, white text on accent, and direct usage of `var(--fs-accent)` in page CSS.
2. **Test-ID & Aria Label Guard (`frontend/scripts/testid-guard.js`)**:
   - Diffs occurrences of `data-testid` and `aria-label` across all `.js`/`.jsx` files between HEAD and the merge base.
   - Prevents accidental deletion or alteration of the 37 `data-testid` and 39 `aria-label` anchors (Invariant I5).
3. **`ui-coverage.js --assert-allowlist`**:
   - Validates that every route entry in `App.js` matches the allowlist ownership structure from §6.3.

---

### Component 4: Calculation Characterization Fixtures (§9.6, Invariant I3)

Preserve current numerical calculations with zero deviation:
1. **Payroll**: gross $\to$ net, tax brackets, social insurance deductions (`PaycheckFormPage`, `PaycheckTable`, `YearlyTaxTable`).
2. **Credit Cards**: installment schedule amortization, statement cycle, partial payment interest.
3. **Debt Payoff**: payoff projections across Avalanche vs Snowball strategies (`DebtPayoffPage`).
4. **Trades**: trade P&L, fees/charges, corporate-action share adjustments.
5. **Certificates**: CD maturity values, daily/monthly interest accrual schedule.
6. **Currency**: multi-currency conversions, portfolio valuation, historical rate triangulation.
7. **Budgets**: threshold calculation at 0%, 50%, 80%, 100%, 120%.
8. **Real Estate**: rental yield, ROI, maintenance and acquisition cost totals.
- Implemented as characterization test suites in `frontend/tests/fixtures/calculations/` executed via single-worker jest/test runner.

---

### Component 5: Deterministic Playwright Visual Regression Harness (§9.5)

1. **Directory layout**:
   - `frontend/tests/visual/fixtures/routes.js`: deterministic mock payloads for all rendering routes.
   - `frontend/tests/visual/fixtures/clock.js`: fixed timestamp helper (`2026-01-15T09:00:00Z`).
   - `frontend/tests/visual/fixtures/auth.setup.js`: pre-baked `storageState` session (no login round-trip).
   - `frontend/tests/visual/visual.spec.js`: route $\times$ 5 viewport widths (1440, 1280, 1024, 768, 390).
   - `frontend/tests/visual/a11y.spec.js`: axe audit per route.
2. **Automated Masking**:
   - `data-visual-mask` applied to clock, volatile timestamps, random IDs.
3. **CI Pipeline Integration (`.github/workflows/ci.yml`)**:
   - Add frontend test job: `npm test -- --watchAll=false`.
   - Add PR trigger for frontend jobs.
   - Add lint ratchet and tones checks.

---

## 3. Verification & Acceptance Criteria (§6.5 Exit Gate 1C)

1. `git check-ignore` confirms `.gitignore` integrity (plan is trackable, snapshots ignored).
2. `node frontend/scripts/lint-tones.js` exits 0 (verifying no tone tokens and no `var(--fs-accent)` in page CSS).
3. `node frontend/scripts/lint-ratchet.js` compares cleanly against merge base without failure.
4. ESLint check passes: zero hex literals in JS components, zero `#14b8a6` in JS files (including `chartTheme.js`).
5. Negative verification tests pass:
   - Temporary file with `var(--fs-accent)` causes `lint-tones.js` to fail.
   - Temporary file with `#14b8a6` in `chartTheme.js` causes ESLint to fail.
6. `node frontend/scripts/testid-guard.js` confirms zero deleted `data-testid` or `aria-label` attributes.
7. `node frontend/scripts/ui-coverage.js --assert-allowlist` exits 0.
8. Calculation characterization test suite passes 100% green against existing code.
9. CI workflow `.github/workflows/ci.yml` validates frontend test, lint, and PR triggers.
10. Local workstation memory constraints (§15) respected: tests executed with `--runInBand` / single worker.

---

## 4. Execution Steps

1. Create branch `phase-ui-1c-tooling` from `main`.
2. Install necessary dev dependencies: `stylelint`, `stylelint-config-standard`, `jest-axe`.
3. Create `frontend/.stylelintrc.json` with verbatim anti-slop rules from §9.2.
4. Create `frontend/scripts/lint-ratchet.js` and `frontend/scripts/lint-tones.js` (including `--fs-accent` enforcement).
5. Update ESLint configuration in `frontend/` with AST selectors from §9.2 and strict `#14b8a6` literal ban.
6. Create `frontend/scripts/testid-guard.js`.
7. Extend `frontend/scripts/ui-coverage.js` with `--assert-allowlist` mode.
8. Author `AGENTS.md` at repo root.
9. Construct calculation fixtures in `frontend/tests/fixtures/calculations/` and runner.
10. Setup Playwright visual regression harness structure in `frontend/tests/visual/`.
11. Update `.github/workflows/ci.yml` to include frontend test & lint jobs on PRs.
12. Run full verification suite (including negative verification tests) and produce walkthrough artifact.
