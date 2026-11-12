# Walkthrough — UI Phase 2C: `App.css` `!important` Removal (Complete Evidence)

Phase 2C safely de-escalates all 11 `!important` declarations from [`frontend/src/App.css`](file:///d:/Projects/FinStat/frontend/src/App.css) across four staged groups, authors `.fs-page`-scoped button and spinner rules in [`frontend/src/styles/theme-components.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme-components.css), adds universal `@keyframes spin` and merges reduced-motion styling in [`frontend/src/styles/theme.css`](file:///d:/Projects/FinStat/frontend/src/styles/theme.css), and proves **0 visual regression diff** across all 326 route tests (**Invariant I13**) at every intermediate step and in the final composite state.

---

## 1. Pre-Removal Specificity Audit (Raw Commands & Classifications)

A comprehensive pre-removal audit across all 6 required categories was executed to prove that removing `!important` from `App.css` will not cause any unexpected contextual override to alter styling on any route:

### 1.1 `.btn-primary` Color Overrides
```powershell
$ git grep -n "\.btn-primary" frontend/src
frontend/src/App.css:156:.btn-primary {
frontend/src/App.css:163:.btn-primary:hover:not(:disabled) {
frontend/src/App.css:170:.btn-primary:active:not(:disabled) {
frontend/src/pages/admin/TaxConfigPage.css:68:.btn-primary-add {
frontend/src/pages/admin/TaxConfigPage.css:84:.btn-primary-add:hover {
frontend/src/pages/admin/TaxConfigPage.css:90:.btn-primary-add:active {
frontend/src/pages/expenditure/RulesPage.css:37:.btn-primary {
frontend/src/pages/expenditure/RulesPage.css:52:.btn-primary:hover {
frontend/src/pages/expenditure/RulesPage.css:381:  .rules-header-actions .btn-primary,
frontend/src/pages/real-estate/RealEstate.css:66:.btn-primary-add {
frontend/src/pages/real-estate/RealEstate.css:83:.btn-primary-add:hover {
frontend/src/pages/salary/SalaryProfilePage.css:307:.btn-primary {
frontend/src/pages/salary/SalaryProfilePage.css:318:.btn-primary:disabled {
frontend/src/pages/trades/CorporateActionWizard.css:271:.wizard-page .btn-primary {
frontend/src/pages/trades/CorporateActionWizard.css:278:.wizard-page .btn-primary:hover:not(:disabled) {
frontend/src/pages/trades/CorporateActionWizard.css:285:.wizard-page .btn-primary:active:not(:disabled) {
frontend/src/pages/trades/Trades.css:205:.btn-primary {
frontend/src/pages/trades/Trades.css:212:.btn-primary:hover:not(:disabled) {
frontend/src/pages/trades/Trades.css:219:.btn-primary:active:not(:disabled) {
```
**Classification**: No visible change.
- `RulesPage.css:37` and `SalaryProfilePage.css:307` set `color: white;` (matches `App.css`).
- `CorporateActionWizard.css:271` sets `.wizard-page .btn-primary { color: #ffffff !important; }` (explicit white text scoped to wizard).
- `Trades.css:205` sets `.btn-primary { color: #ffffff !important; }` (explicit white text).
- `TaxConfigPage.css` and `RealEstate.css` use `.btn-primary-add` (different class).
- Zero rules in any page CSS specify non-white text for `.btn-primary`.

---

### 1.2 `.btn-secondary` Color Overrides
```powershell
$ git grep -n "\.btn-secondary" frontend/src
frontend/src/App.css:174:.btn-secondary {
frontend/src/App.css:181:.btn-secondary:hover:not(:disabled) {
frontend/src/App.css:188:.btn-secondary:active:not(:disabled) {
frontend/src/pages/expenditure/RulesPage.css:58:.btn-secondary {
frontend/src/pages/expenditure/RulesPage.css:72:.btn-secondary:hover {
frontend/src/pages/expenditure/RulesPage.css:382:  .rules-header-actions .btn-secondary {
frontend/src/pages/salary/SalaryProfilePage.css:297:.btn-secondary {
frontend/src/pages/trades/CorporateActionWizard.css:290:.wizard-page .btn-secondary {
frontend/src/pages/trades/CorporateActionWizard.css:297:.wizard-page .btn-secondary:hover:not(:disabled) {
frontend/src/pages/trades/CorporateActionWizard.css:305:.wizard-page .btn-secondary:active:not(:disabled) {
frontend/src/pages/trades/Trades.css:223:.btn-secondary {
frontend/src/pages/trades/Trades.css:230:.btn-secondary:hover:not(:disabled) {
frontend/src/pages/trades/Trades.css:237:.btn-secondary:active:not(:disabled) {
```
**Classification**: No visible change.
- Standard contexts (`RulesPage.css:58`, `SalaryProfilePage.css:297`, `Trades.css:223`) define `color: #374151;`, identical to `App.css:176`.
- Wizard contexts (`CorporateActionWizard.css:290`) define `color: #1e293b !important;` scoped under `.wizard-page`, which wins in wizard context by specificity and retains intended dark slate text.
- Hover states retain `#111827` (`App.css:184`).

---

### 1.3 `.btn-danger` Color Overrides
```powershell
$ git grep -n "\.btn-danger" frontend/src
frontend/src/App.css:192:.btn-danger {
frontend/src/App.css:199:.btn-danger:hover:not(:disabled) {
frontend/src/App.css:206:.btn-danger:active:not(:disabled) {
```
**Classification**: No visible change.
- `.btn-danger` is defined **exclusively** in `App.css`.
- Zero page CSS files define `.btn-danger` (`CorporateActionsList.css` defines `.ca-btn-danger`, not `.btn-danger`).
- Removing `!important` from lines 194 and 203 cannot cause any contextual rule to win or alter button text color.

---

### 1.4 `.btn` Base Text-Decoration Overrides
```powershell
$ git grep -n "text-decoration" frontend/src
frontend/src/App.css:42:  text-decoration: none;
frontend/src/App.css:133:  text-decoration: none;
frontend/src/App.css:146:  text-decoration: none;
frontend/src/components/Navbar.css:27:  text-decoration: none;
frontend/src/components/Navbar.css:63:  text-decoration: none;
frontend/src/components/Sidebar.css:54:    text-decoration: none;
frontend/src/components/creditCards/CreditCardSubNav.css:39:  text-decoration: none;
frontend/src/components/dashboard/AppLauncher.css:248:  text-decoration: none;
frontend/src/pages/Dashboard.css:138:  text-decoration: none;
frontend/src/pages/Dashboard.css:248:  text-decoration: none;
frontend/src/pages/Dashboard.css:552:  text-decoration: none;
frontend/src/pages/Dashboard.css:578:  text-decoration: none;
frontend/src/pages/Dashboard.css:794:  text-decoration: none;
frontend/src/pages/Dashboard.css:1000:  text-decoration: none;
frontend/src/pages/Dashboard.css:1020:  text-decoration: none;
frontend/src/pages/Dashboard.css:1108:  text-decoration: none;
frontend/src/pages/Dashboard.css:1197:  text-decoration: none;
frontend/src/pages/Dashboard.css:1217:  text-decoration: none;
frontend/src/pages/admin/AdminDashboard.css:364:  text-decoration: none;
frontend/src/pages/expenditure/ExpenditureSubNav.css:40:  text-decoration: none;
frontend/src/pages/expenditure/RulesPage.css:94:  text-decoration: none;
frontend/src/pages/portfolio/Portfolio.css:77:  text-decoration: none;
frontend/src/pages/portfolio/Portfolio.css:883:  text-decoration: none;
frontend/src/pages/real-estate/RealEstate.css:75:  text-decoration: none;
frontend/src/pages/salary/SalaryProfile.css:23:  text-decoration: none;
frontend/src/pages/salary/SalaryProfile.css:187:  text-decoration: none;
frontend/src/pages/taxes/TaxesPage.css:23:  text-decoration: none;
frontend/src/pages/trades/CorporateActionWizard.css:252:  text-decoration: none !important;
frontend/src/pages/trades/CorporateActionsList.css:56:  text-decoration: none !important;
frontend/src/pages/trades/Trades.css:182:  text-decoration: none !important;
frontend/src/pages/trades/Trades.css:195:  text-decoration: none !important;
frontend/src/pages/trades/Trades.css:266:  text-decoration: none;
frontend/src/styles/theme-components.css:497:  text-decoration: none;
frontend/src/styles/theme.css:110:  text-decoration: none;
frontend/src/styles/theme.css:291:  text-decoration: none;
```
**Classification**: No visible change.
- No stylesheet in the entire codebase defines `text-decoration: underline` on buttons or anchors.
- Where buttons are styled as links (`Trades.css:182, 195`), `text-decoration: none !important;` was already specified locally.
- In `App.css`, `text-decoration: none;` remains the base rule on `.btn` and `a.btn`.

---

### 1.5 `.btn:disabled` State-Based Overrides (`transform` & `box-shadow`)
```powershell
$ git grep -n "\.btn:disabled" frontend/src
frontend/src/App.css:149:.btn:disabled {
frontend/src/pages/salary/SalaryProfilePage.css:318:.btn-primary:disabled {
frontend/src/pages/trades/CorporateActionWizard.css:264:.wizard-page .btn:disabled {
frontend/src/pages/trades/Trades.css:198:.btn:disabled {
```
Inspecting the exact declarations in `CorporateActionWizard.css:264-269` and `Trades.css:198-203`:
```css
/* CorporateActionWizard.css:264-269 */
.wizard-page .btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Trades.css:198-203 */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
```
**Classification**: No visible change.
- Both page CSS definitions explicitly declare `transform: none !important;` and `box-shadow: none !important;`.
- No page CSS file defines hover transforms or shadows that activate when `:disabled` is set.
- In `App.css`, `transform: none;` and `box-shadow: none;` remain in effect for `.btn:disabled`.

---

### 1.6 `.table-container` Overflow-X Overrides
```powershell
$ git grep -n -E "\.table-container|\.table-responsive|\.paycheck-table-container|\.admin-table-container|\.card-table-wrapper|\.lending-table-card" frontend/src
frontend/src/App.css:231:.table-container,
frontend/src/App.css:232:.table-responsive,
frontend/src/App.css:233:.paycheck-table-container,
frontend/src/App.css:234:.admin-table-container,
frontend/src/App.css:235:.card-table-wrapper,
frontend/src/App.css:236:.lending-table-card {
frontend/src/components/Table.css:2:.table-container {
frontend/src/components/salary/ComponentTable.css:81:.table-responsive-container {
frontend/src/pages/admin/TaxConfigPage.css:255:.card-table-wrapper {
frontend/src/pages/admin/TaxConfigPage.css:642:.admin-table-container {
frontend/src/pages/lending/Lending.css:218:.lending-table-card {
frontend/src/pages/portfolio/Portfolio.css:766:.table-responsive {
frontend/src/pages/salary/PaycheckListPage.css:94:.paycheck-table-container {
```
**Classification**: No visible change.
- `components/Table.css:2`: `.table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }`
- `TaxConfigPage.css:255`: `.card-table-wrapper { overflow-x: auto; }`
- `TaxConfigPage.css:642`: `.admin-table-container { overflow-x: auto; }`
- `PaycheckListPage.css:94`: `.paycheck-table-container { overflow-x: auto; }`
- `Lending.css:218`: `.lending-table-card { overflow-x: auto !important; }` (retains local `!important` until Phase 9C).
- Every table wrapper defines its own `overflow-x: auto;`. Removing `!important` from `App.css` introduces zero clipping or scroll regressions.

---

## 2. Staged Stylelint De-escalation & Raw Command Outputs

### 2.1 Baseline State (Before Group 1)
```powershell
$ cd frontend; npx stylelint "src/App.css"
src/App.css
   40:21  ×  Disallowed hex color "#009879"                                                          color-no-hex
   41:10  ×  Disallowed named color "white"                                                          color-named
   43:18  ×  Disallowed value "5px" for property "border-radius"                                     declaration-property-value-allowed-list
   53:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   54:18  ×  Disallowed value "6px" for property "border-radius"                                     declaration-property-value-allowed-list
   55:15  ×  Disallowed value "0 2px 4px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
   55:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
   62:10  ×  Disallowed hex color "#6c757d"                                                          color-no-hex
   68:10  ×  Disallowed hex color "#343a40"                                                          color-no-hex
   73:21  ×  Disallowed hex color "#e9f5ff"                                                          color-no-hex
   78:10  ×  Disallowed hex color "#0056b3"                                                          color-no-hex
   83:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   84:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
   85:15  ×  Disallowed value "0 4px 10px rgba(0, 0, 0, 0.1)" for property "box-shadow"              declaration-property-value-allowed-list
   85:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  131:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
  133:25  ×  Disallowed !important                                                                   declaration-no-important
  146:25  ×  Disallowed !important                                                                   declaration-no-important
  152:19  ×  Disallowed !important                                                                   declaration-no-important
  153:20  ×  Disallowed !important                                                                   declaration-no-important
  157:15  ×  Disallowed value "linear-gradient(135deg, #2563eb, #1d4ed8)" for property "background"  declaration-property-value-disallowed-list
  157:39  ×  Disallowed hex color "#2563eb"                                                          color-no-hex
  157:48  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  158:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  158:18  ×  Disallowed !important                                                                   declaration-no-important
  159:17  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  160:15  ×  Disallowed value "0 2px 6px rgba(37, 99, 235, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  160:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  164:15  ×  Disallowed value "linear-gradient(135deg, #1d4ed8, #1e40af)" for property "background"  declaration-property-value-disallowed-list
  164:39  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  164:48  ×  Disallowed hex color "#1e40af"                                                          color-no-hex
  165:15  ×  Disallowed value "0 4px 12px rgba(37, 99, 235, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  165:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  167:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  167:18  ×  Disallowed !important                                                                   declaration-no-important
  175:15  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  176:10  ×  Disallowed hex color "#374151"                                                          color-no-hex
  176:18  ×  Disallowed !important                                                                   declaration-no-important
  177:21  ×  Disallowed hex color "#d1d5db"                                                          color-no-hex
  178:15  ×  Disallowed value "0 1px 3px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
  178:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  182:15  ×  Disallowed hex color "#f9fafb"                                                          color-no-hex
  183:17  ×  Disallowed hex color "#9ca3af"                                                          color-no-hex
  184:10  ×  Disallowed hex color "#111827"                                                          color-no-hex
  184:18  ×  Disallowed !important                                                                   declaration-no-important
  193:15  ×  Disallowed value "linear-gradient(135deg, #ef4444, #dc2626)" for property "background"  declaration-property-value-disallowed-list
  193:39  ×  Disallowed hex color "#ef4444"                                                          color-no-hex
  193:48  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  194:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  194:18  ×  Disallowed !important                                                                   declaration-no-important
  195:17  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  196:15  ×  Disallowed value "0 2px 6px rgba(220, 38, 38, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  196:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  200:15  ×  Disallowed value "linear-gradient(135deg, #dc2626, #b91c1c)" for property "background"  declaration-property-value-disallowed-list
  200:39  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  200:48  ×  Disallowed hex color "#b91c1c"                                                          color-no-hex
  201:15  ×  Disallowed value "0 4px 12px rgba(220, 38, 38, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  201:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  203:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  203:18  ×  Disallowed !important                                                                   declaration-no-important
  237:20  ×  Disallowed !important                                                                   declaration-no-important

× 61 problems (61 errors, 0 warnings)
```

---

### 2.2 After Group 1 (Links: lines 133 & 146)
De-escalated `text-decoration: none !important;` to `text-decoration: none;` on `.btn` and `a.btn`.
```powershell
$ cd frontend; npx stylelint "src/App.css"
src/App.css
   40:21  ×  Disallowed hex color "#009879"                                                          color-no-hex
   41:10  ×  Disallowed named color "white"                                                          color-named
   43:18  ×  Disallowed value "5px" for property "border-radius"                                     declaration-property-value-allowed-list
   53:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   54:18  ×  Disallowed value "6px" for property "border-radius"                                     declaration-property-value-allowed-list
   55:15  ×  Disallowed value "0 2px 4px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
   55:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
   62:10  ×  Disallowed hex color "#6c757d"                                                          color-no-hex
   68:10  ×  Disallowed hex color "#343a40"                                                          color-no-hex
   73:21  ×  Disallowed hex color "#e9f5ff"                                                          color-no-hex
   78:10  ×  Disallowed hex color "#0056b3"                                                          color-no-hex
   83:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   84:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
   85:15  ×  Disallowed value "0 4px 10px rgba(0, 0, 0, 0.1)" for property "box-shadow"              declaration-property-value-allowed-list
   85:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  131:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
  152:19  ×  Disallowed !important                                                                   declaration-no-important
  153:20  ×  Disallowed !important                                                                   declaration-no-important
  157:15  ×  Disallowed value "linear-gradient(135deg, #2563eb, #1d4ed8)" for property "background"  declaration-property-value-disallowed-list
  157:39  ×  Disallowed hex color "#2563eb"                                                          color-no-hex
  157:48  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  158:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  158:18  ×  Disallowed !important                                                                   declaration-no-important
  159:17  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  160:15  ×  Disallowed value "0 2px 6px rgba(37, 99, 235, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  160:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  164:15  ×  Disallowed value "linear-gradient(135deg, #1d4ed8, #1e40af)" for property "background"  declaration-property-value-disallowed-list
  164:39  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  164:48  ×  Disallowed hex color "#1e40af"                                                          color-no-hex
  165:15  ×  Disallowed value "0 4px 12px rgba(37, 99, 235, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  165:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  167:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  167:18  ×  Disallowed !important                                                                   declaration-no-important
  175:15  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  176:10  ×  Disallowed hex color "#374151"                                                          color-no-hex
  176:18  ×  Disallowed !important                                                                   declaration-no-important
  177:21  ×  Disallowed hex color "#d1d5db"                                                          color-no-hex
  178:15  ×  Disallowed value "0 1px 3px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
  178:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  182:15  ×  Disallowed hex color "#f9fafb"                                                          color-no-hex
  183:17  ×  Disallowed hex color "#9ca3af"                                                          color-no-hex
  184:10  ×  Disallowed hex color "#111827"                                                          color-no-hex
  184:18  ×  Disallowed !important                                                                   declaration-no-important
  193:15  ×  Disallowed value "linear-gradient(135deg, #ef4444, #dc2626)" for property "background"  declaration-property-value-disallowed-list
  193:39  ×  Disallowed hex color "#ef4444"                                                          color-no-hex
  193:48  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  194:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  194:18  ×  Disallowed !important                                                                   declaration-no-important
  195:17  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  196:15  ×  Disallowed value "0 2px 6px rgba(220, 38, 38, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  196:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  200:15  ×  Disallowed value "linear-gradient(135deg, #dc2626, #b91c1c)" for property "background"  declaration-property-value-disallowed-list
  200:39  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  200:48  ×  Disallowed hex color "#b91c1c"                                                          color-no-hex
  201:15  ×  Disallowed value "0 4px 12px rgba(220, 38, 38, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  201:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  203:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  203:18  ×  Disallowed !important                                                                   declaration-no-important
  237:20  ×  Disallowed !important                                                                   declaration-no-important

× 59 problems (59 errors, 0 warnings)
```
**Result**: Exactly **9 `declaration-no-important` errors** remain (lines 152, 153, 158, 167, 176, 184, 194, 203, 237).

---

### 2.3 After Group 2 (Disabled: lines 152 & 153)
De-escalated `transform: none !important; box-shadow: none !important;` to `transform: none; box-shadow: none;` on `.btn:disabled`.
```powershell
$ cd frontend; npx stylelint "src/App.css"
src/App.css
   40:21  ×  Disallowed hex color "#009879"                                                          color-no-hex
   41:10  ×  Disallowed named color "white"                                                          color-named
   43:18  ×  Disallowed value "5px" for property "border-radius"                                     declaration-property-value-allowed-list
   53:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   54:18  ×  Disallowed value "6px" for property "border-radius"                                     declaration-property-value-allowed-list
   55:15  ×  Disallowed value "0 2px 4px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
   55:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
   62:10  ×  Disallowed hex color "#6c757d"                                                          color-no-hex
   68:10  ×  Disallowed hex color "#343a40"                                                          color-no-hex
   73:21  ×  Disallowed hex color "#e9f5ff"                                                          color-no-hex
   78:10  ×  Disallowed hex color "#0056b3"                                                          color-no-hex
   83:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   84:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
   85:15  ×  Disallowed value "0 4px 10px rgba(0, 0, 0, 0.1)" for property "box-shadow"              declaration-property-value-allowed-list
   85:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  131:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
  157:15  ×  Disallowed value "linear-gradient(135deg, #2563eb, #1d4ed8)" for property "background"  declaration-property-value-disallowed-list
  157:39  ×  Disallowed hex color "#2563eb"                                                          color-no-hex
  157:48  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  158:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  158:18  ×  Disallowed !important                                                                   declaration-no-important
  159:17  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  160:15  ×  Disallowed value "0 2px 6px rgba(37, 99, 235, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  160:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  164:15  ×  Disallowed value "linear-gradient(135deg, #1d4ed8, #1e40af)" for property "background"  declaration-property-value-disallowed-list
  164:39  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  164:48  ×  Disallowed hex color "#1e40af"                                                          color-no-hex
  165:15  ×  Disallowed value "0 4px 12px rgba(37, 99, 235, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  165:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  167:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  167:18  ×  Disallowed !important                                                                   declaration-no-important
  175:15  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  176:10  ×  Disallowed hex color "#374151"                                                          color-no-hex
  176:18  ×  Disallowed !important                                                                   declaration-no-important
  177:21  ×  Disallowed hex color "#d1d5db"                                                          color-no-hex
  178:15  ×  Disallowed value "0 1px 3px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
  178:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  182:15  ×  Disallowed hex color "#f9fafb"                                                          color-no-hex
  183:17  ×  Disallowed hex color "#9ca3af"                                                          color-no-hex
  184:10  ×  Disallowed hex color "#111827"                                                          color-no-hex
  184:18  ×  Disallowed !important                                                                   declaration-no-important
  193:15  ×  Disallowed value "linear-gradient(135deg, #ef4444, #dc2626)" for property "background"  declaration-property-value-disallowed-list
  193:39  ×  Disallowed hex color "#ef4444"                                                          color-no-hex
  193:48  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  194:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  194:18  ×  Disallowed !important                                                                   declaration-no-important
  195:17  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  196:15  ×  Disallowed value "0 2px 6px rgba(220, 38, 38, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  196:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  200:15  ×  Disallowed value "linear-gradient(135deg, #dc2626, #b91c1c)" for property "background"  declaration-property-value-disallowed-list
  200:39  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  200:48  ×  Disallowed hex color "#b91c1c"                                                          color-no-hex
  201:15  ×  Disallowed value "0 4px 12px rgba(220, 38, 38, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  201:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  203:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  203:18  ×  Disallowed !important                                                                   declaration-no-important
  237:20  ×  Disallowed !important                                                                   declaration-no-important

× 57 problems (57 errors, 0 warnings)
```
**Result**: Exactly **7 `declaration-no-important` errors** remain (lines 158, 167, 176, 184, 194, 203, 237).

---

### 2.4 After Group 3 (Colours: lines 158, 167, 176, 184, 194, 203)
De-escalated `color: ... !important;` to `color: ...;` on `.btn-primary`, `.btn-secondary`, and `.btn-danger`.
```powershell
$ cd frontend; npx stylelint "src/App.css"
src/App.css
   40:21  ×  Disallowed hex color "#009879"                                                          color-no-hex
   41:10  ×  Disallowed named color "white"                                                          color-named
   43:18  ×  Disallowed value "5px" for property "border-radius"                                     declaration-property-value-allowed-list
   53:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   54:18  ×  Disallowed value "6px" for property "border-radius"                                     declaration-property-value-allowed-list
   55:15  ×  Disallowed value "0 2px 4px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
   55:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
   62:10  ×  Disallowed hex color "#6c757d"                                                          color-no-hex
   68:10  ×  Disallowed hex color "#343a40"                                                          color-no-hex
   73:21  ×  Disallowed hex color "#e9f5ff"                                                          color-no-hex
   78:10  ×  Disallowed hex color "#0056b3"                                                          color-no-hex
   83:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   84:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
   85:15  ×  Disallowed value "0 4px 10px rgba(0, 0, 0, 0.1)" for property "box-shadow"              declaration-property-value-allowed-list
   85:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  131:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
  157:15  ×  Disallowed value "linear-gradient(135deg, #2563eb, #1d4ed8)" for property "background"  declaration-property-value-disallowed-list
  157:39  ×  Disallowed hex color "#2563eb"                                                          color-no-hex
  157:48  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  158:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  159:17  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  160:15  ×  Disallowed value "0 2px 6px rgba(37, 99, 235, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  160:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  164:15  ×  Disallowed value "linear-gradient(135deg, #1d4ed8, #1e40af)" for property "background"  declaration-property-value-disallowed-list
  164:39  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  164:48  ×  Disallowed hex color "#1e40af"                                                          color-no-hex
  165:15  ×  Disallowed value "0 4px 12px rgba(37, 99, 235, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  165:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  167:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  175:15  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  176:10  ×  Disallowed hex color "#374151"                                                          color-no-hex
  177:21  ×  Disallowed hex color "#d1d5db"                                                          color-no-hex
  178:15  ×  Disallowed value "0 1px 3px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
  178:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  182:15  ×  Disallowed hex color "#f9fafb"                                                          color-no-hex
  183:17  ×  Disallowed hex color "#9ca3af"                                                          color-no-hex
  184:10  ×  Disallowed hex color "#111827"                                                          color-no-hex
  193:15  ×  Disallowed value "linear-gradient(135deg, #ef4444, #dc2626)" for property "background"  declaration-property-value-disallowed-list
  193:39  ×  Disallowed hex color "#ef4444"                                                          color-no-hex
  193:48  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  194:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  195:17  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  196:15  ×  Disallowed value "0 2px 6px rgba(220, 38, 38, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  196:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  200:15  ×  Disallowed value "linear-gradient(135deg, #dc2626, #b91c1c)" for property "background"  declaration-property-value-disallowed-list
  200:39  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  200:48  ×  Disallowed hex color "#b91c1c"                                                          color-no-hex
  201:15  ×  Disallowed value "0 4px 12px rgba(220, 38, 38, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  201:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  203:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  237:20  ×  Disallowed !important                                                                   declaration-no-important

× 51 problems (51 errors, 0 warnings)
```
**Result**: Exactly **1 `declaration-no-important` error** remains (line 237 on table containers).

---

### 2.5 After Group 4 (Overflow-x: line 237)
De-escalated `overflow-x: auto !important;` to `overflow-x: auto;` on table containers.
```powershell
$ cd frontend; npx stylelint "src/App.css"
src/App.css
   40:21  ×  Disallowed hex color "#009879"                                                          color-no-hex
   41:10  ×  Disallowed named color "white"                                                          color-named
   43:18  ×  Disallowed value "5px" for property "border-radius"                                     declaration-property-value-allowed-list
   53:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   54:18  ×  Disallowed value "6px" for property "border-radius"                                     declaration-property-value-allowed-list
   55:15  ×  Disallowed value "0 2px 4px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
   55:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
   62:10  ×  Disallowed hex color "#6c757d"                                                          color-no-hex
   68:10  ×  Disallowed hex color "#343a40"                                                          color-no-hex
   73:21  ×  Disallowed hex color "#e9f5ff"                                                          color-no-hex
   78:10  ×  Disallowed hex color "#0056b3"                                                          color-no-hex
   83:21  ×  Disallowed hex color "#fff"                                                             color-no-hex
   84:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
   85:15  ×  Disallowed value "0 4px 10px rgba(0, 0, 0, 0.1)" for property "box-shadow"              declaration-property-value-allowed-list
   85:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  131:18  ×  Disallowed value "8px" for property "border-radius"                                     declaration-property-value-allowed-list
  157:15  ×  Disallowed value "linear-gradient(135deg, #2563eb, #1d4ed8)" for property "background"  declaration-property-value-disallowed-list
  157:39  ×  Disallowed hex color "#2563eb"                                                          color-no-hex
  157:48  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  158:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  159:17  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  160:15  ×  Disallowed value "0 2px 6px rgba(37, 99, 235, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  160:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  164:15  ×  Disallowed value "linear-gradient(135deg, #1d4ed8, #1e40af)" for property "background"  declaration-property-value-disallowed-list
  164:39  ×  Disallowed hex color "#1d4ed8"                                                          color-no-hex
  164:48  ×  Disallowed hex color "#1e40af"                                                          color-no-hex
  165:15  ×  Disallowed value "0 4px 12px rgba(37, 99, 235, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  165:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  167:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  175:15  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  176:10  ×  Disallowed hex color "#374151"                                                          color-no-hex
  177:21  ×  Disallowed hex color "#d1d5db"                                                          color-no-hex
  178:15  ×  Disallowed value "0 1px 3px rgba(0, 0, 0, 0.05)" for property "box-shadow"              declaration-property-value-allowed-list
  178:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  182:15  ×  Disallowed hex color "#f9fafb"                                                          color-no-hex
  183:17  ×  Disallowed hex color "#9ca3af"                                                          color-no-hex
  184:10  ×  Disallowed hex color "#111827"                                                          color-no-hex
  193:15  ×  Disallowed value "linear-gradient(135deg, #ef4444, #dc2626)" for property "background"  declaration-property-value-disallowed-list
  193:39  ×  Disallowed hex color "#ef4444"                                                          color-no-hex
  193:48  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  194:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex
  195:17  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  196:15  ×  Disallowed value "0 2px 6px rgba(220, 38, 38, 0.25)" for property "box-shadow"          declaration-property-value-allowed-list
  196:25  ×  Disallowed function "rgba"                                                              function-disallowed-list
  200:15  ×  Disallowed value "linear-gradient(135deg, #dc2626, #b91c1c)" for property "background"  declaration-property-value-disallowed-list
  200:39  ×  Disallowed hex color "#dc2626"                                                          color-no-hex
  200:48  ×  Disallowed hex color "#b91c1c"                                                          color-no-hex
  201:15  ×  Disallowed value "0 4px 12px rgba(220, 38, 38, 0.35)" for property "box-shadow"         declaration-property-value-allowed-list
  201:26  ×  Disallowed function "rgba"                                                              function-disallowed-list
  203:10  ×  Disallowed hex color "#ffffff"                                                          color-no-hex

× 50 problems (50 errors, 0 warnings)
```
**Result**: Exactly **0 `declaration-no-important` errors** remain in `App.css`! Exactly 50 pre-existing violations remain for Phase 10 cleanup.

---

## 3. Component 3 CSS Evidence

### 3.1 `border-radius: var(--fs-radius-pill)` in `theme-components.css`
```powershell
$ sed -n '509,517p' frontend/src/styles/theme-components.css
.fs-page .loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--fs-border);
  border-top-color: var(--fs-text);
  border-radius: var(--fs-radius-pill);
  animation: spin 1s linear infinite;
}
```

### 3.2 Universal `@keyframes spin` in `theme.css`
```powershell
$ sed -n '612,616p' frontend/src/styles/theme.css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### 3.3 Merged Reduced-Motion Block in `theme.css`
```powershell
$ sed -n '632,647p' frontend/src/styles/theme.css
@media (prefers-reduced-motion: reduce) {
  .fs-skeleton {
    animation: none;
    background: var(--fs-surface-raised);
  }

  .fs-page .loading-spinner {
    animation: none;
  }

  .fs-btn,
  .fs-input,
  .fs-progress-bar {
    transition: none;
  }
}
```

---

## 4. Visual Regression Suite Verification & Timing Clarification

### 4.1 Staged Group Visual Verification
Each group was compiled and verified against the full 326-test Playwright visual regression suite:
- **Group 1 Run**: 326 passed (0 diff) in 20.0m wall-clock (`visual.spec.js` 19.7m)
- **Group 2 Run**: 326 passed (0 diff) in 19.2m wall-clock (`visual.spec.js` 18.9m)
- **Group 3 Run**: 326 passed (0 diff) in 19.0m wall-clock (`visual.spec.js` 18.7m)
- **Group 4 Run**: 326 passed (0 diff) in 19.6m wall-clock (`visual.spec.js` 19.2m)

### 4.2 Disambiguation: Group 4 vs. Final Composite Visual Runs
The Group 4 run and the Final Composite run were **two distinct, independent Playwright executions**:

1. **Group 4 Execution (`task-17322`)**:
   - **Timestamp**: Launched at `12:38:48Z`, completed at `12:58:28Z`.
   - **Target code**: Exactly Group 1 + 2 + 3 + 4 in `App.css` (Component 3 had not been added yet).
   - **Log snippet**:
     ```
     ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (12ms)
     ok 2 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1440px (8.0s)
     ...
     Slow test file: [visual] › visual.spec.js (19.2m)
     326 passed (19.6m)
     ```

2. **Final Composite Execution (`task-17396`)**:
   - **Timestamp**: Launched at `14:21:52Z`, completed at `14:41:02Z` (after Component 3 was added and rebuilt).
   - **Target code**: Full composite state (Groups 1–4 + Component 3).
   - **Log snippet**:
     ```
     ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (14ms)
     ok 2 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1440px (7.3s)
     ...
     Slow test file: [visual] › visual.spec.js (18.8m)
     326 passed (19.1m)
     ```
   *(Note: The previous summary inadvertently transcribed `19.1m` into both rows; the true durations are 19.6m for Group 4 and 19.1m for Final Composite).*

---

## 5. Exit Gate 2C Full Verification Suite (Raw Terminal Outputs)

### 5.1 Tokens Check
```powershell
$ node frontend/scripts/tokens.js --check
✓ All §4.9 contrast tables match tokens.json (0 drift).
✓ tokens.css matches tokens.json verbatim (0 drift).
✓ All tokens checks passed successfully.
```

### 5.2 Stylelint Ratchet Check
```powershell
$ node frontend/scripts/lint-ratchet.js
[lint-ratchet] Evaluating stylelint ratchet against merge-base: 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507
✓ [lint-ratchet] Checked 59 CSS files against 4bcb8a927bd9bd34ed21d7bc9a8ac8a7a723a507: 0 regressions.
```

### 5.3 Theme Files Stylelint Check
```powershell
$ cd frontend; npx stylelint "src/styles/theme-components.css" "src/styles/theme.css"
(0 errors, exit code 0)
```

### 5.4 Lint-Tones Check
```powershell
$ node frontend/scripts/lint-tones.js
✓ [lint-tones] Scanned 57 page CSS files for tone scoping: 0 violations.
✓ [lint-tones] Scanned 60 total CSS files against tokens.json: 0 undefined tokens.
```

### 5.5 Reference Frames Suite
```powershell
$ cd frontend; $env:CI="true"; npx playwright test --project=reference
Running 3 tests using 1 worker

  ok 1 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 01-dense-table @ 1440px (2.9s)
  ok 2 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 02-form @ 1440px (2.3s)
  ok 3 [reference] › reference-frames.spec.js:35:5 › Reference Frames Visual Suite › 03-dashboard @ 1440px (2.2s)

  3 passed (23.2s)
```

### 5.6 Shell Tests Suite
```powershell
$ cd frontend; $env:CI="true"; npx playwright test --project=shell
Running 7 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (13ms)
  ok 2 [shell] › shell.spec.js:51:3 › Shell Visual Suite (Option A) › shell-legacy-desktop (8.9s)
  ok 3 [shell] › shell.spec.js:56:3 › Shell Visual Suite (Option A) › shell-legacy-mobile (2.4s)
  ok 4 [shell] › shell.spec.js:61:3 › Shell Visual Suite (Option A) › shell-dark-desktop-collapsed (3.3s)
  ok 5 [shell] › shell.spec.js:73:3 › Shell Visual Suite (Option A) › shell-dark-desktop-expanded (2.8s)
  ok 6 [shell] › shell.spec.js:92:3 › Shell Visual Suite (Option A) › shell-dark-mobile-drawer (2.9s)
  ok 7 [shell] › shell.spec.js:105:3 › Shell Visual Suite (Option A) › shell-dark-account-dropdown (6.1s)

  Slow test file: [shell] › shell.spec.js (26.5s)
  Consider splitting slow test files to speed up parallel execution
  7 passed (41.6s)
```

### 5.7 Final Composite Visual Regression Suite
```powershell
$ cd frontend; $env:CI="true"; npx playwright test --project=visual
Running 326 tests using 1 worker

  ok 1 [setup] › fixtures\auth.setup.js:8:1 › authenticate visual test session (14ms)
  ok 2 [visual] › visual.spec.js:39:7 › Visual Regression Suite › not-found @ 1440px (7.3s)
  ...
  ok 326 [visual] › visual.spec.js:39:7 › Visual Regression Suite › lending-loan-detail @ 390px (2.2s)

  Slow test file: [visual] › visual.spec.js (18.8m)
  Consider splitting slow test files to speed up parallel execution
  326 passed (19.1m)
```

### 5.8 Baseline Manifest Verification
```powershell
$ node frontend/scripts/verify-baseline-manifest.js
334/334 baselines verified successfully.
```

### 5.9 CRA Unit Test Suite
```powershell
$ cd frontend; $env:CI="true"; npm test -- --watchAll=false --runInBand
Test Suites: 49 passed, 49 total
Tests:       314 passed, 314 total
Snapshots:   0 total
Time:        38.988 s
Ran all test suites.
```

---

## 6. Accepted-Diff Register (§6.6 / §10)

```
Accepted diffs in Phase 2C: None (0 route changes; 100% pixel fidelity preserved across all 326 unmigrated routes).
```

---

## 7. Git Diff Stat

```powershell
$ git diff --stat HEAD~1 HEAD -- frontend/src/App.css frontend/src/styles/theme-components.css frontend/src/styles/theme.css
 frontend/src/App.css                     | 22 +++++++++---------
 frontend/src/styles/theme-components.css | 39 ++++++++++++++++++++++++++++++++
 frontend/src/styles/theme.css            | 10 ++++++++
 3 files changed, 60 insertions(+), 11 deletions(-)
```

---

## 8. Conclusion

All 11 `!important` declarations are removed from `App.css`, with 0 regressions, complete stylelint compliance on all theme additions, and verifiable 100% fidelity across all visual tests. Ready for merge to `main`.
