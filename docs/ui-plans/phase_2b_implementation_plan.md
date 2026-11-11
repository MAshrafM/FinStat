# Phase 2B Implementation Plan — Gated Shell and Global Surfaces (v2 — Revised)

> **Governing Standards:**  
> - `docs/UI-UX_Plan/UI-UX-PLAN.md` §4.6 (Z-Index Scale), §4.8 (Geometry & 8px Radius Ceiling), §4.9 (Contrast Baseline), §4.16 (Gating Matrix & Dual-Mode Components), §6.3 (Route Allowlist Design), and §6.6 (Phase 2B Scope & Exit Gate).  
> - `AGENTS.md` & Plan Amendment v10.2 (D22 Multi-Theme Door Preservation, A5-Local Baseline Architecture, Anti-Slop Tooling).

---

## Executive Summary & Goal Description

**Goal:** Establish the gated dark shell, persistent navigation, global overlays, and the route allowlisting mechanism for FinStat. After Phase 2B, all shell components (`Navbar`, `Sidebar`, `AccountSwitcher`, `Toast`, `UndoToast`, `ErrorBoundary`) support the dark design system when gated under `html[data-fs-theme]`, while unmigrated routes remain visually 100% untouched (**Invariant I13**).

**Phase 2B Scope Deliverables:**
1. **Route Gating & Functional Skip Link (`ProtectedRoute.js`)**:
   - Introduce `THEMED_PATTERNS = []` (strictly empty in 2B per §6.3 rule).
   - Implement `isThemedRoute(pathname)` via `matchPath({ path, end: true })`.
   - Add `useLayoutEffect` to conditionally set `document.documentElement.dataset.fsTheme = 'dark'` and clean up on unmount or navigation to legacy routes.
   - Inject the accessible skip-to-content link (`.fs-skip-link`) at `--fs-z-skip` (1500) as the very first focusable element in tab order, linking to `<main id="main-content">`.
   - Add `tabIndex={-1}` to `<main id="main-content">` and `#main-content:focus { outline: none; }` in `theme.css` to ensure keyboard focus shifts into main content on activation (**WCAG 2.4.1 compliance**).
2. **Gated Navbar (`Navbar.css`)**:
   - Scope all dark shell styles under `html[data-fs-theme] .navbar`.
   - Flat `--fs-surface-sunken` (`#0c0d0f`), 1 px bottom border (`--fs-border` `#34383f`), 64 px height, sticky positioning, `z-index: var(--fs-z-nav)` (950, stacking above sidebar 900).
   - Primary action button `.nav-button`: flat solid `--fs-action-bg` (`#14b8a6`), `--fs-action-text` (`#0d0e10` / `--fs-ink`), `--fs-radius-sm` (4px), zero gradients, zero shadows. Subdued hover state using `--fs-surface-raised` border or `--fs-action-hover`.
   - Viewer badge: neutral surface chip with `--fs-warning` accent (`#cfa24f`) and `var(--fs-radius-pill)` (status chip allowance per §4.8).
3. **Gated Sidebar (`Sidebar.css` & `Sidebar.js`)**:
   - **Step 4a (Verbatim Extraction)**: Move the inline `<style>` block (lines 182–263) from `Sidebar.js` to `Sidebar.css` **verbatim** — keeping the exact same selectors, exact same declarations in the exact same order, including existing legacy hex values (`#6c7ce7`, `#f87171`, `rgba(239, 68, 68, 0.1)`). No hex is replaced or themed at this step, guaranteeing byte-identical legacy rendering (Invariant I13).
   - **Step 4b (Gated Themed Overrides)**: Scope all dark shell styles under `html[data-fs-theme] .sidebar`.
   - Flat `--fs-surface-sunken` (`#0c0d0f`), 1 px right border (`--fs-border`), 70 px collapsed / 280 px expanded widths, zero linear gradients or box shadows.
   - Active navigation item: `background: var(--fs-surface-raised)` (`#22252a`) plus a 2 px left rule in `var(--fs-text)` (`#f2f3f5`) — strictly no accent hue or wash.
   - Inactive item hover: `background: var(--fs-surface-raised)`, `color: var(--fs-text)`, no translation (`transform: none`).
   - Hub group headers and icons: clean neutral typography (`--fs-text-3`).
   - Dedicated logout button: flat `--fs-surface-sunken`, 1 px `--fs-border`, text `--fs-negative` (`#d97076`).
4. **Gated Account Switcher (`AccountSwitcher.css` & `AccountSwitcher.js`)**:
   - Scope all dark shell rules under `html[data-fs-theme]`.
   - Account switcher trigger pill: `--fs-surface`, 1 px `--fs-border`, text `--fs-text`, hover `--fs-surface-raised`.
   - Avatar: neutral `--fs-surface-raised`, 1 px `--fs-border`, text `--fs-text`, `--fs-radius-pill` (pill permitted for avatars). Remove purple/blue gradient.
   - Dropdown menu: `--fs-surface`, 1 px `--fs-border`, radius `--fs-radius-md` (6px), shadow `--fs-shadow`, `z-index: var(--fs-z-dropdown)` (1200).
   - Delegation banner: `--fs-surface` with `--fs-warning` border and `--fs-warning` text; switchback button uses neutral secondary styling.
   - Family Rollup Modal:
     - Backdrop: `--fs-scrim` (`rgba(8, 9, 11, 0.72)` per §4.1), `backdrop-filter: none`, `z-index: var(--fs-z-modal)` (1100).
     - Modal content: `--fs-surface`, 1 px `--fs-border`, radius `--fs-radius-lg` (8px maximum ceiling), shadow `--fs-shadow`.
     - Metrics cards and list items: `--fs-surface-raised`, `--fs-border`, `--fs-text`, with `--fs-num` for numeric values.
5. **Gated Toast Overlays (`Toast.css` & `UndoToast.css`)**:
   - Container: `z-index: var(--fs-z-toast)` (1300).
   - Toasts: flat `--fs-surface`, 1 px `--fs-border`, radius `--fs-radius-md` (6px), shadow `--fs-shadow`, `backdrop-filter: none`.
   - Variants: semantic tones indicated via 3 px solid left border and matching icon color; text always `--fs-text`.
   - UndoToast: `--fs-surface`, 1 px `--fs-border`, radius `--fs-radius-md`, `z-index: var(--fs-z-toast)`.
6. **Gated Error Boundary (`ErrorBoundary.css`)**:
   - Scope all styles under `html[data-fs-theme]`.
   - Card: `--fs-surface`, 1 px `--fs-border`, radius `--fs-radius-lg` (8px), shadow `--fs-shadow`, `backdrop-filter: none`.
   - Debug pre block: `--fs-surface-sunken`, 1 px `--fs-border`, `--fs-font-mono`, `--fs-negative` text (`#d97076`).
   - Action buttons: primary uses solid action block (`--fs-action-bg`), secondary uses raised surface (`--fs-surface-raised`).
7. **Skip-To-Content CSS (`theme.css`)**:
   - Implement `.fs-skip-link`: off-screen until focused (`top: -9999px; :focus { top: 16px; left: 16px; }`), `z-index: var(--fs-z-skip)` (1500), outline `var(--fs-focus-ring)`.
   - Add `#main-content:focus { outline: none; }` to prevent entire viewport focus outline.
8. **Option A Shell Visual Baselines (`shell.spec.js`)**:
   - Add `shell` project to `playwright.config.js`.
   - Capture 6 persistent shell baseline images ($N = 6$): legacy desktop, legacy mobile, dark desktop collapsed, dark desktop expanded, dark mobile drawer, dark account dropdown.
   - Update `verify-baseline-manifest.js` manifest count: $328 \to 334$.

---

## Architectural Guardrails & D22 Multi-Theme Constraints

> [!IMPORTANT]
> ### 1. Strict Attribute-Existence Selectors (D22 Constraint 2)
> Every gated selector in Phase 2B MUST use `html[data-fs-theme]` (attribute-existence), NOT `html[data-fs-theme="dark"]`.  
> - **Permitted**: `html[data-fs-theme] .navbar { ... }`, `html[data-fs-theme] .sidebar { ... }`  
> - **Forbidden**: `html[data-fs-theme="dark"] .navbar`  
> - **Rule**: The value-specific form `[data-fs-theme="dark"]` is reserved **only** for `:root[data-fs-theme="dark"]` inside `tokens.css`. Any occurrence elsewhere violates D22 and will be caught by automated verification.

> [!IMPORTANT]
> ### 2. Empty Allowlist in Phase 2B (§6.3 Overriding Rule)
> *"A pattern is added to the array in the same PR that converts that route. Never in an earlier PR."*  
> In Phase 2B, `THEMED_PATTERNS = []` remains an **empty array**.  
> - `/dashboard` is added in Phase 3A along with its page migration.  
> - Because `THEMED_PATTERNS` is empty, `isThemedRoute(pathname)` returns `false` for all routes in production during Phase 2B.  
> - This guarantees that **0 out of 325 routes** have `data-fs-theme` set during normal execution, ensuring **zero visual diff on all 325 route baselines** (**Invariant I13**).

> [!IMPORTANT]
> ### 3. 8px Radius Ceiling & Anti-Slop Rules (`AGENTS.md`)
> - Allowed radii: `0`, `var(--fs-radius-sm)` (4px), `var(--fs-radius-md)` (6px), `var(--fs-radius-lg)` (8px), `var(--fs-radius-pill)` (999px — for avatars/chips only).
> - All 10px, 12px, 16px, 20px radii in legacy components must be clamped to `var(--fs-radius-md)` (6px) or `var(--fs-radius-lg)` (8px).
> - Zero gradients (`linear-gradient`, `radial-gradient`), zero blurs (`backdrop-filter: blur`), zero arbitrary box-shadow glows.

> [!NOTE]
> ### 4. Interim States in Phase 2B & 3A
> - **M1 (2B Themed Shell State)**: In Phase 2B shell tests with injected `data-fs-theme="dark"`, the navbar and sidebar render in the new dark theme, while page content below remains in legacy light mode (`.fs-page` is not applied because `THEMED_PATTERNS` is empty). This partial state is intentional and expected for 2B verification; Phase 3A activates `.fs-page` when `/dashboard` is allowlisted.
> - **M2 (ViewOnlyBanner Interim State)**: `ViewOnlyBanner` renders on every route for view-only users. Per §4.16, it is shadowed in `theme-components.css` (Phase 2D deliverable). Between Phase 3A and 2C, view-only users visiting `/dashboard` will see a dark shell, dark `.fs-page`, and a light `ViewOnlyBanner`. This is an accepted interim state recorded in §10.

---

## Proposed Changes & File Modifications

### Component 1: `ProtectedRoute.js` & Functional Skip Link
**Path:** `frontend/src/components/ProtectedRoute.js`

- Import `useLayoutEffect` from `react` and `matchPath` from `react-router-dom`.
- Define:
  ```javascript
  // Route allowlist for dark design system migration (§6.3)
  // Each sub-phase adds only its own block when converting that route.
  const THEMED_PATTERNS = [
    // 3A — dashboard (added in Phase 3A)
  ];

  export const isThemedRoute = (pathname) =>
    THEMED_PATTERNS.some((pattern) => matchPath({ path: pattern, end: true }, pathname));
  ```
- Inside `ProtectedRoute`:
  ```javascript
  const themed = isThemedRoute(location.pathname);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (themed) {
      root.dataset.fsTheme = 'dark';
    } else {
      delete root.dataset.fsTheme;
    }
    return () => {
      delete root.dataset.fsTheme;
    };
  }, [themed]);
  ```
- In JSX (incorporating `tabIndex={-1}` for WCAG 2.4.1 focus management):
  ```jsx
  return (
    <div className="App">
      <a href="#main-content" className="fs-skip-link">
        Skip to main content
      </a>
      <Navbar onSidebarToggle={handleSidebarToggle} />
      <Sidebar />
      <main
        id="main-content"
        tabIndex={-1}
        className={`main-content ${themed ? 'fs-page' : ''} ${sidebarOpen ? 'sidebar-open' : ''} ${
          isFullBleedPage ? 'full-bleed' : ''
        }`}
      >
        <ViewOnlyBanner />
        ...
      </main>
    </div>
  );
  ```

---

### Component 2: `Navbar.css` (Gated Dark Shell)
**Path:** `frontend/src/components/Navbar.css`

Keep all existing legacy `.navbar` rules intact. Append scoped block under `html[data-fs-theme]`:
```css
/* ==========================================================================
   Gated Themed Shell — Navbar (Phase 2B / D22 Attribute-Existence)
   ========================================================================== */
html[data-fs-theme] .navbar {
  background: var(--fs-surface-sunken);
  border-bottom: 1px solid var(--fs-border);
  color: var(--fs-text);
  box-shadow: none;
  z-index: var(--fs-z-nav); /* 950: stacks above sidebar 900 */
}

html[data-fs-theme] .navbar-brand a {
  color: var(--fs-text);
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .navbar-brand a:hover {
  color: var(--fs-text);
}

html[data-fs-theme] .role-badge-viewer {
  background: var(--fs-surface-raised);
  border: 1px solid var(--fs-border);
  color: var(--fs-warning);
  border-radius: var(--fs-radius-pill); /* Status chip allowance per §4.8 */
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .navbar-links .nav-button {
  background: var(--fs-action-bg);
  color: var(--fs-action-text); /* #0d0e10 (--fs-ink), 7.76:1 contrast */
  border-radius: var(--fs-radius-sm);
  border: 1px solid transparent;
  box-shadow: none;
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .navbar-links .nav-button:hover {
  background: var(--fs-surface-raised);
  color: var(--fs-text);
  border: 1px solid var(--fs-border-control);
  transform: none;
  box-shadow: none;
}
```

---

### Component 3: `Sidebar.css` & `Sidebar.js` Refactor
**Paths:** `frontend/src/components/Sidebar.css`, `frontend/src/components/Sidebar.js`

#### Step 4a: Verbatim Extraction (I13 Preservation)
Move the inline `<style>` block (lines 182–263) from `Sidebar.js` into `Sidebar.css` **verbatim**:
- Keep exact same class names: `.logo-text`, `.sidebar-content`, `.sidebar.collapsed ...`, `.sidebar-logout-btn`, `.sidebar-hub-group`, `.sidebar-hub-header`, etc.
- Keep exact legacy colors (`#6c7ce7`, `#f87171`, `rgba(239, 68, 68, 0.1)`, `rgba(255, 255, 255, 0.04)`).
- Replace dynamic inline opacities with pure CSS `.sidebar.collapsed` / `.sidebar.expanded` selectors (which already exist in `Sidebar.css`).
- Zero hex or rgba is replaced or themed in this step.

#### Step 4b: Gated Themed Rules (Phase 2B)
Append gated styles under `html[data-fs-theme]`:
```css
/* ==========================================================================
   Gated Themed Shell — Sidebar (Phase 2B / D22 Attribute-Existence)
   ========================================================================== */
html[data-fs-theme] .sidebar {
  background: var(--fs-surface-sunken);
  border-right: 1px solid var(--fs-border);
  color: var(--fs-text);
  box-shadow: none;
  z-index: var(--fs-z-sidebar); /* 900 */
}

html[data-fs-theme] .sidebar-header {
  border-bottom: 1px solid var(--fs-border);
}

html[data-fs-theme] .logo-text {
  color: var(--fs-text);
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .menu-icon {
  color: var(--fs-text-3);
}

html[data-fs-theme] .sidebar-hub-header {
  background: transparent;
  color: var(--fs-text-3);
  border-radius: var(--fs-radius-sm);
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .sidebar-hub-header:hover {
  background: var(--fs-surface-raised);
  color: var(--fs-text);
}

html[data-fs-theme] .sidebar-hub-chevron {
  color: var(--fs-text-3);
}

html[data-fs-theme] .sidebar-item {
  color: var(--fs-text-2);
  border-radius: var(--fs-radius-md);
  transition: background 0.15s ease, color 0.15s ease;
}

html[data-fs-theme] .sidebar-item:hover {
  background: var(--fs-surface-raised);
  color: var(--fs-text);
  transform: none;
}

html[data-fs-theme] .sidebar-item:hover .sidebar-icon {
  color: var(--fs-text);
  transform: none;
}

/* Active navigation item: surface-raised + 2px left rule in fs-text (strictly no accent hue) */
html[data-fs-theme] .sidebar-item.active {
  background: var(--fs-surface-raised);
  color: var(--fs-text);
  border-left: 2px solid var(--fs-text);
  border-radius: 0 var(--fs-radius-md) var(--fs-radius-md) 0;
}

html[data-fs-theme] .sidebar-title {
  color: var(--fs-text);
  font-family: var(--fs-font-sans);
  font-weight: 500;
}

html[data-fs-theme] .sidebar-description {
  color: var(--fs-text-3);
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .sidebar-logout-btn {
  background: transparent;
  border: 1px solid var(--fs-border);
  color: var(--fs-negative); /* #d97076 */
  border-radius: var(--fs-radius-md);
}

html[data-fs-theme] .sidebar-logout-btn:hover {
  background: var(--fs-surface-raised);
  color: var(--fs-negative);
  border-color: var(--fs-border-control);
}

html[data-fs-theme] .mobile-toggle {
  background: var(--fs-surface-raised);
  color: var(--fs-text);
  border: 1px solid var(--fs-border);
  border-radius: var(--fs-radius-md);
  z-index: var(--fs-z-toast);
}

html[data-fs-theme] .sidebar-backdrop {
  background: var(--fs-scrim);
  z-index: var(--fs-z-modal);
}

@media (max-width: 768px) {
  html[data-fs-theme] .sidebar {
    z-index: var(--fs-z-dropdown);
  }
}
```

---

### Component 4: `AccountSwitcher.css` (Gated Dark Shell & Modals)
**Path:** `frontend/src/components/layout/AccountSwitcher.css`

Scope themed rules under `html[data-fs-theme]`:
- **Delegation Banner**:
  - `background: var(--fs-surface-raised); border: 1px solid var(--fs-warning); color: var(--fs-warning); border-radius: var(--fs-radius-md);`
  - Badge: `background: var(--fs-warning); color: var(--fs-ink); border-radius: var(--fs-radius-sm);`
  - Switchback button: `background: var(--fs-surface); border: 1px solid var(--fs-border); color: var(--fs-text); border-radius: var(--fs-radius-sm);`
- **Trigger Pill**:
  - `background: var(--fs-surface); border: 1px solid var(--fs-border); color: var(--fs-text); border-radius: var(--fs-radius-md);`
  - Hover: `background: var(--fs-surface-raised); border-color: var(--fs-border-control);`
  - Avatar: `background: var(--fs-surface-raised); border: 1px solid var(--fs-border); color: var(--fs-text); border-radius: var(--fs-radius-pill);`
- **Dropdown Menu**:
  - `background: var(--fs-surface); border: 1px solid var(--fs-border); border-radius: var(--fs-radius-md); box-shadow: var(--fs-shadow); z-index: var(--fs-z-dropdown);`
  - Section title: `color: var(--fs-text-3); font-family: var(--fs-font-sans);`
  - Row hover: `background: var(--fs-surface-raised); color: var(--fs-text);`
  - Active row: `background: var(--fs-surface-raised); border: 1px solid var(--fs-border-control);`
  - Role badges (`admin`, `manager`, `viewer`): `background: var(--fs-surface-raised); border: 1px solid var(--fs-border); color: var(--fs-text-2); border-radius: var(--fs-radius-sm);`
- **Family Rollup Modal**:
  - Backdrop: `background: var(--fs-scrim); backdrop-filter: none; -webkit-backdrop-filter: none; z-index: var(--fs-z-modal);` (`rgba(8, 9, 11, 0.72)` per §4.1).
  - Content: `background: var(--fs-surface); border: 1px solid var(--fs-border); border-radius: var(--fs-radius-lg); box-shadow: var(--fs-shadow);`
  - Header: `border-bottom: 1px solid var(--fs-border); color: var(--fs-text);`
  - Close button: `color: var(--fs-text-3);` hover `color: var(--fs-text);`
  - Metrics cards: `background: var(--fs-surface-raised); border: 1px solid var(--fs-border); border-radius: var(--fs-radius-md);`
  - Metric values: `color: var(--fs-text); font-family: var(--fs-font-sans); font-variant-numeric: tabular-nums;` (debts use `--fs-negative` `#d97076`, net worth uses `--fs-text`).

---

### Component 5: `Toast.css` & `UndoToast.css`
**Paths:** `frontend/src/components/common/Toast.css`, `frontend/src/components/common/UndoToast.css`

Scope themed rules under `html[data-fs-theme]`:
```css
/* ==========================================================================
   Gated Themed Shell — Toasts (Phase 2B / D22 Attribute-Existence)
   ========================================================================== */
html[data-fs-theme] .toast-container {
  z-index: var(--fs-z-toast);
}

html[data-fs-theme] .toast-item {
  background: var(--fs-surface);
  border: 1px solid var(--fs-border);
  border-radius: var(--fs-radius-md);
  box-shadow: var(--fs-shadow);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  color: var(--fs-text);
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .toast-error {
  border-left: 3px solid var(--fs-negative);
  background: var(--fs-surface);
  color: var(--fs-text);
}
html[data-fs-theme] .toast-icon-error {
  color: var(--fs-negative);
}

html[data-fs-theme] .toast-success {
  border-left: 3px solid var(--fs-positive);
  background: var(--fs-surface);
  color: var(--fs-text);
}
html[data-fs-theme] .toast-icon-success {
  color: var(--fs-positive);
}

html[data-fs-theme] .toast-warning {
  border-left: 3px solid var(--fs-warning);
  background: var(--fs-surface);
  color: var(--fs-text);
}
html[data-fs-theme] .toast-icon-warning {
  color: var(--fs-warning);
}

html[data-fs-theme] .toast-info {
  border-left: 3px solid var(--fs-border-control);
  background: var(--fs-surface);
  color: var(--fs-text);
}

html[data-fs-theme] .toast-close-btn:hover {
  background: var(--fs-surface-raised);
  color: var(--fs-text);
}

/* Undo Toast */
html[data-fs-theme] .undo-toast-wrapper {
  background: var(--fs-surface);
  border: 1px solid var(--fs-border);
  border-radius: var(--fs-radius-md);
  box-shadow: var(--fs-shadow);
  color: var(--fs-text);
  z-index: var(--fs-z-toast);
}
```

---

### Component 6: `ErrorBoundary.css`
**Path:** `frontend/src/components/common/ErrorBoundary.css`

Scope themed rules under `html[data-fs-theme]`:
```css
/* ==========================================================================
   Gated Themed Shell — ErrorBoundary (Phase 2B / D22 Attribute-Existence)
   ========================================================================== */
html[data-fs-theme] .error-boundary-card {
  background: var(--fs-surface);
  border: 1px solid var(--fs-border);
  border-radius: var(--fs-radius-lg);
  box-shadow: var(--fs-shadow);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

html[data-fs-theme] .error-boundary-icon-badge {
  background: var(--fs-surface-raised);
  border: 1px solid var(--fs-border);
}

html[data-fs-theme] .error-boundary-icon {
  color: var(--fs-negative);
}

html[data-fs-theme] .error-boundary-title {
  color: var(--fs-text);
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .error-boundary-desc {
  color: var(--fs-text-2);
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .error-boundary-debug {
  background: var(--fs-surface-sunken);
  border: 1px solid var(--fs-border);
  color: var(--fs-negative); /* #d97076 */
  border-radius: var(--fs-radius-sm);
  font-family: var(--fs-font-mono);
}

html[data-fs-theme] .error-boundary-btn-primary {
  background: var(--fs-action-bg);
  color: var(--fs-action-text);
  border-radius: var(--fs-radius-sm);
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .error-boundary-btn-primary:hover {
  background: var(--fs-action-hover);
  color: var(--fs-action-text);
  transform: none;
}

html[data-fs-theme] .error-boundary-btn-secondary {
  background: var(--fs-surface-raised);
  border: 1px solid var(--fs-border);
  color: var(--fs-text);
  border-radius: var(--fs-radius-sm);
  font-family: var(--fs-font-sans);
}

html[data-fs-theme] .error-boundary-btn-secondary:hover {
  background: var(--fs-surface);
  border-color: var(--fs-border-control);
  color: var(--fs-text);
}
```

---

### Component 7: `theme.css` Additions (Skip Link & Outline Suppression)
**Path:** `frontend/src/styles/theme.css`

Add `.fs-skip-link` and `#main-content:focus` styles:
```css
/* ==========================================================================
   Skip to Main Content Link (§4.6 / WCAG 2.4.1)
   ========================================================================== */
.fs-skip-link {
  position: fixed;
  top: -9999px;
  left: 16px;
  background: var(--fs-action-bg);
  color: var(--fs-action-text);
  padding: 8px 16px;
  font-family: var(--fs-font-sans);
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--fs-radius-sm);
  text-decoration: none;
  z-index: var(--fs-z-skip);
  outline: var(--fs-focus-ring);
  outline-offset: var(--fs-focus-offset);
  transition: top 0.15s ease-out;
}

.fs-skip-link:focus,
.fs-skip-link:focus-visible {
  top: 16px;
}

/* Suppress content area focus ring when focus moves programmatically to <main> */
#main-content:focus {
  outline: none;
}
```

---

### Component 8: Playwright Shell Project & Baselines (Option A)
**Paths:** `frontend/playwright.config.js`, `frontend/tests/visual/shell.spec.js`, `D:\Projects\FinStat-visual-baselines\manifest.json`

1. **`playwright.config.js`**: Add dedicated `shell` project:
   ```javascript
   {
     name: 'shell',
     dependencies: ['setup'],
     testMatch: /shell\.spec\.js/,
   },
   ```
2. **`shell.spec.js` Architecture & Route Selection (C3, C6)**:
   - Uses `/portfolio` as the stable test route (C6), keeping shell visual baselines decoupled from Phase 3A's `/dashboard` conversion.
   - **Theme Injection Mechanism (C3)**: Injects theme cleanly via `page.addInitScript(() => { document.documentElement.setAttribute('data-fs-theme', 'dark'); });` before calling `page.goto()`. For legacy captures, no script is injected (attribute remains absent).
   - Defines 6 persistent shell baseline tests ($N = 6$):
     - `shell-legacy-desktop`: Desktop at 1440 with legacy shell on `/portfolio`.
     - `shell-legacy-mobile`: Mobile at 390 with legacy shell on `/portfolio`.
     - `shell-dark-desktop-collapsed`: Desktop at 1440 with `data-fs-theme="dark"` injected (collapsed 70px sidebar, dark navbar).
     - `shell-dark-desktop-expanded`: Desktop at 1440 with `data-fs-theme="dark"` (expanded 280px sidebar, active item 2px rule, account switcher).
     - `shell-dark-mobile-drawer`: Mobile at 390 with `data-fs-theme="dark"` (open drawer menu with scrim backdrop).
     - `shell-dark-account-dropdown`: Account switcher dropdown popover open on dark shell.
   - Computed style assertions on themed state:
     - `.navbar` background: `rgb(12, 13, 15)` (`#0c0d0f`)
     - `.sidebar` background: `rgb(12, 13, 15)` (`#0c0d0f`)
     - `.sidebar-item.active` background: `rgb(34, 37, 42)` (`#22252a`)
     - `.sidebar-item.active` border-left: `2px solid rgb(242, 243, 245)` (`--fs-text`)
3. **Overlay & Error Injection Methods (M3)**:
   - **Toast Test**: Triggered via testing harness invoking `useToast().showToast()` or dispatching a synthetic toast custom event inside the browser context.
   - **ErrorBoundary Test**: Tested via dedicated test harness route (`/test-error-boundary`) or component test throwing an error inside the boundary.
4. **Manifest Count & Dynamic Verifier (C4)**:
   - Regenerate `manifest.json` with `count: 334` and the 6 new shell snapshot entries ($325 \text{ routes} + 3 \text{ reference frames} + 6 \text{ shell baselines}$).
   - `verify-baseline-manifest.js` remains dynamic (reads `manifest.count` and validates matching entry count and SHA-256 hashes).
   - Store generated PNGs in `D:\Projects\FinStat-visual-baselines` local repository and commit with updated `manifest.json`.

---

## Step-by-Step Implementation Sequence

### Step 0: Branch Creation & Origin Alignment
- Verify working tree is clean and aligned with `origin/main`:
  ```bash
  git log --oneline -1 origin/main
  git status
  git checkout -b phase-ui-2b-shell
  ```

### Step 1: `ProtectedRoute.js` & Accessible Skip Link
- Update `frontend/src/components/ProtectedRoute.js`:
  - Add `THEMED_PATTERNS = []` and `isThemedRoute(pathname)`.
  - Add `useLayoutEffect` to toggle `document.documentElement.dataset.fsTheme = 'dark'` and cleanup on unmount/route change.
  - Add `<a href="#main-content" className="fs-skip-link">Skip to main content</a>` first in JSX.
  - Add `id="main-content"` and `tabIndex={-1}` to `<main>`.

### Step 2: Skip Link & Focus CSS in `theme.css`
- Add `.fs-skip-link` and `#main-content:focus { outline: none; }` to `frontend/src/styles/theme.css`.

### Step 3: Gated `Navbar.css`
- Add `html[data-fs-theme] .navbar` rules to `frontend/src/components/Navbar.css` with `z-index: var(--fs-z-nav)` (950).

### Step 4a: Verbatim Extraction of `Sidebar.js` Inline Styles
- Move lines 182–263 from `frontend/src/components/Sidebar.js` into `Sidebar.css` verbatim with existing legacy hexes.

### Step 4b: Gated Themed Rules in `Sidebar.css`
- Add `html[data-fs-theme] .sidebar` rules in `Sidebar.css`. Active item uses `--fs-surface-raised` and 2 px solid left rule in `--fs-text`.

### Step 5: Gated `AccountSwitcher.css`
- Add `html[data-fs-theme]` scoped blocks for trigger pill, avatar, dropdown, and Family Rollup Modal.

### Step 6: Gated `Toast.css` & `UndoToast.css`
- Add `html[data-fs-theme]` scoped blocks for `.toast-container`, `.toast-item`, semantic variants, and `.undo-toast-wrapper`.

### Step 7: Gated `ErrorBoundary.css`
- Add `html[data-fs-theme]` scoped blocks for error card, badge, debug pre block, and buttons.

### Step 8: Unit / Integration Tests
- Create `frontend/src/components/__tests__/ProtectedRoute.test.js`:
  - Assert skip link is first focusable element before `<main>`.
  - Assert `href="#main-content"`.
  - Assert `tabIndex={-1}` on `<main id="main-content">`.
  - Assert `useLayoutEffect` toggles `document.documentElement.dataset.fsTheme`.
- Run CRA test suites:
  ```bash
  cd frontend && npm test -- --watchAll=false
  ```

### Step 9: Playwright Shell Project & Baselines (Option A)
- Add `shell` project to `playwright.config.js`.
- Author `frontend/tests/visual/shell.spec.js` using `page.addInitScript` and `/portfolio` route.
- Generate 6 shell baselines into `D:\Projects\FinStat-visual-baselines` via:
  ```bash
  $env:CI="true"; npx playwright test --project=shell --update-snapshots
  ```
- Regenerate `manifest.json` with `count: 334`.

### Step 10: Complete Verification Suite
Execute all verification commands sequentially using `--project=` flags (C1, C2):
1. `node frontend/scripts/tokens.js --check`
2. `cd frontend && npm run lint:style`
3. `node frontend/scripts/lint-tones.js`
4. `node frontend/scripts/lint-ratchet.js`
5. `node frontend/scripts/ui-coverage.js --assert-allowlist` (vacuously passes on empty allowlist)
6. Strict D22 Grep Audit:
   ```powershell
   git grep "data-fs-theme=\"dark\"" frontend/src
   ```
   *Must return ONLY `tokens.css: :root[data-fs-theme="dark"]`.*
7. Visual Regression (325 routes + 1 setup) (C2):
   ```powershell
   $env:CI="true"; npx playwright test --project=visual
   ```
   *Must pass with 0 diff (proving legacy fidelity).*
8. Reference Frames (3 frames) (C1, C2):
   ```powershell
   $env:CI="true"; npx playwright test --project=reference
   ```
   *Must pass with 0 diff.*
9. Shell Baselines (6 snapshots + 1 setup) (C2):
   ```powershell
   $env:CI="true"; npx playwright test --project=shell
   ```
   *Must pass with 0 diff.*
10. Baseline Manifest Integrity:
    ```powershell
    node frontend/scripts/verify-baseline-manifest.js
    ```
    *334/334 files verified.*

---

## Required Walkthrough Evidence (Exit Gate 2B)

The Phase 2B walkthrough must explicitly present the following verifiable evidence:

1. **D22 Multi-Theme Evidence**:
   - `git grep "data-fs-theme=\"dark\"" frontend/src` &rarr; only `tokens.css` matches.
   - `grep -E "html\[data-fs-theme\]" frontend/src/components/Navbar.css frontend/src/components/Sidebar.css frontend/src/components/layout/AccountSwitcher.css` &rarr; all selectors use the attribute-existence form.
   - Zero `html[data-fs-theme="dark"]` outside `tokens.css` across all CSS files.
2. **I13 Legacy Fidelity Evidence**:
   - `npx playwright test --project=visual` &rarr; 326 passed (1 setup + 325 route baselines), 0 diff (zero visual regression).
   - `npx playwright test --project=reference` &rarr; 3 passed, 0 diff.
   - `node frontend/scripts/verify-baseline-manifest.js` &rarr; 334/334 files verified.
3. **Shell Functionality Evidence (Themed & Legacy Modes)**:
   - `npx playwright test --project=shell` &rarr; 6 passed, 0 diff.
   - Computed style assertions from `shell.spec.js`:
     - `.navbar` background = `rgb(12, 13, 15)` (`#0c0d0f`)
     - `.sidebar` background = `rgb(12, 13, 15)` (`#0c0d0f`)
     - `.sidebar-item.active` background = `rgb(34, 37, 42)` (`#22252a`)
     - `.sidebar-item.active` border-left = `2px solid rgb(242, 243, 245)` (`--fs-text`)
   - Account switcher dropdown screenshot in themed mode &rarr; shows dark dropdown on `--fs-surface` with `--fs-shadow`.
4. **Accessible Skip Link Evidence**:
   - `ProtectedRoute.test.js` passes with assertions:
     - Skip link is first focusable element before `<main>`.
     - `href="#main-content"` is present.
     - `tabIndex={-1}` is present on `<main>`.
   - Manual keyboard trace: Tab &rarr; focus on skip link &rarr; Enter &rarr; focus shifts to `<main>` without full-page ring.
5. **Sidebar Extraction Evidence**:
   - `git diff main -- frontend/src/components/Sidebar.js` &rarr; confirms removal of inline `<style>` block only; no JSX structure or business logic modifications.
   - 325-route visual regression passing with 0 diff &rarr; proves verbatim extraction preserved legacy appearance pixel-for-pixel.
6. **Dual-Mode Overlays**:
   - Toast screenshots in legacy mode and themed mode.
   - ErrorBoundary screenshots in legacy mode and themed mode.
7. **Static Guardrails**:
   - `npm test -- --watchAll=false` &rarr; all test suites pass.
   - `npx stylelint "src/styles/*.css"` &rarr; 0 errors.
   - `node frontend/scripts/lint-tones.js` &rarr; 0 violations.
   - `node frontend/scripts/lint-ratchet.js` &rarr; 0 regressions.
   - `node frontend/scripts/ui-coverage.js --assert-allowlist` &rarr; passes on empty allowlist.
   - `$env:CI="true"; npm run build` &rarr; Compiled successfully.

---

## Plan Files & Deliverables
This plan is preserved simultaneously in:
- Artifact Directory: `C:\Users\User\.gemini\antigravity\brain\6a81524b-5770-4a5a-a050-161c44267e14/phase_2b_implementation_plan.md`
- Repository Documentation: `docs/ui-plans/phase_2b_implementation_plan.md`
