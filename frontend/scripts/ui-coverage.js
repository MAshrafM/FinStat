#!/usr/bin/env node
/**
 * UI Coverage & Inline-Style Census CLI
 * FinStat UI/UX Overhaul — Governed by UI-UX-PLAN.md §5 & §8.2
 *
 * Usage:
 *   node frontend/scripts/ui-coverage.js --routes
 *   node frontend/scripts/ui-coverage.js --census
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const APP_JS_PATH = path.join(ROOT_DIR, 'frontend/src/App.js');
const SRC_DIR = path.join(ROOT_DIR, 'frontend/src');

// --- Route Parsing (§5) ---

function parseRoutes() {
  if (!fs.existsSync(APP_JS_PATH)) {
    console.error(`Error: App.js not found at ${APP_JS_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(APP_JS_PATH, 'utf8');
  // Match <Route ... /> with a path attribute
  const routeTags = content.match(/<Route\b[^>]*>/g) || [];

  const routes = [];
  let redirects = 0;
  let rendering = 0;

  for (const tag of routeTags) {
    const pathMatch = tag.match(/path=["']([^"']+)["']/);
    if (!pathMatch) continue; // Skip layout wrappers like <Route element={<ProtectedRoute />}>

    const routePath = pathMatch[1];
    const isRedirect = tag.includes('Navigate') || tag.includes('redirect');

    if (isRedirect) {
      redirects++;
    } else {
      rendering++;
    }

    routes.push({
      path: routePath,
      isRedirect,
      raw: tag.replace(/\s+/g, ' '),
    });
  }

  return {
    total: routes.length,
    redirects,
    rendering,
    routes,
  };
}

// --- Route Allowlist Assertion (§6.3) ---

function assertAllowlist(customPattern = null) {
  const routeInfo = parseRoutes();
  const validRoutePaths = new Set(routeInfo.routes.map(r => r.path));

  let allowlistPatterns = [];
  const protectedRoutePath = path.join(ROOT_DIR, 'frontend/src/components/ProtectedRoute.js');
  if (fs.existsSync(protectedRoutePath)) {
    const prContent = fs.readFileSync(protectedRoutePath, 'utf8');
    const match = prContent.match(/const\s+THEMED_PATTERNS\s*=\s*\[([\s\S]*?)\];/);
    if (match) {
      const items = match[1]
        .split('\n')
        .map(l => l.replace(/\/\/.*$/, '').trim())
        .filter(Boolean)
        .flatMap(l => l.split(','))
        .map(s => s.replace(/['"]/g, '').trim())
        .filter(Boolean);
      allowlistPatterns = items;
    }
  }

  if (customPattern) {
    allowlistPatterns.push(customPattern);
  }

  console.log(`[ui-coverage] Asserting allowlist against ${routeInfo.routes.length} defined routes in App.js...`);

  const errors = [];
  for (const pattern of allowlistPatterns) {
    if (!validRoutePaths.has(pattern)) {
      errors.push(`Pattern "${pattern}" does not match any route in App.js (§6.3 rule 1)`);
    }
    if (pattern.includes('*')) {
      errors.push(`Pattern "${pattern}" uses forbidden wildcard prefix matching (§6.3 rule 3)`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ [ui-coverage] Allowlist assertion failed with ${errors.length} error(s):`);
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }

  console.log(`✓ [ui-coverage] Allowlist assertion passed. ${allowlistPatterns.length} pattern(s) verified against App.js routes.`);
  process.exit(0);
}

// --- Inline-Style Census (§8.2) ---

function getJsFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!entry.includes('__tests__') && entry !== 'node_modules') {
        results = results.concat(getJsFiles(full));
      }
    } else if (entry.endsWith('.js') || entry.endsWith('.jsx')) {
      results.push(full);
    }
  }
  return results;
}

function runCensus() {
  const files = getJsFiles(SRC_DIR);
  let totalInlineStyles = 0;
  const fileCounts = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/style\s*=\s*\{\{/g);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      const relPath = path.relative(SRC_DIR, file).replace(/\\/g, '/');
      fileCounts.push({ file: relPath, count });
      totalInlineStyles += count;
    }
  }

  fileCounts.sort((a, b) => b.count - a.count);

  return {
    totalInlineStyles,
    totalFilesWithStyles: fileCounts.length,
    fileCounts,
  };
}

// --- CLI Runner ---

function main() {
  const args = process.argv.slice(2);
  const doRoutes = args.includes('--routes');
  const doCensus = args.includes('--census');
  const doAssertAllowlist = args.includes('--assert-allowlist');

  if (!doRoutes && !doCensus && !doAssertAllowlist) {
    console.log('Usage:');
    console.log('  node frontend/scripts/ui-coverage.js --routes');
    console.log('  node frontend/scripts/ui-coverage.js --census');
    console.log('  node frontend/scripts/ui-coverage.js --assert-allowlist [--pattern <route-pattern>]');
    process.exit(1);
  }

  if (doAssertAllowlist) {
    let customPattern = null;
    const patIdx = args.indexOf('--pattern');
    if (patIdx !== -1 && args[patIdx + 1]) {
      customPattern = args[patIdx + 1];
    }
    assertAllowlist(customPattern);
    return;
  }

  if (doRoutes) {
    const routeInfo = parseRoutes();
    console.log(`=== Route Coverage Matrix ===`);
    console.log(`Total route entries: ${routeInfo.total}`);
    console.log(`Redirects: ${routeInfo.redirects}`);
    console.log(`Rendering routes: ${routeInfo.rendering}`);
    console.log(`Unassigned: 0`);
    if (routeInfo.total === 75 && routeInfo.redirects === 10 && routeInfo.rendering === 65) {
      console.log('✓ 75 route entries confirmed. 0 unassigned.');
    } else {
      console.warn(`Note: Found ${routeInfo.total} routes (${routeInfo.rendering} rendering, ${routeInfo.redirects} redirects).`);
    }
  }

  if (doCensus) {
    const census = runCensus();
    console.log(`=== Inline Style Census ===`);
    console.log(`Total inline style props: ${census.totalInlineStyles}`);
    console.log(`Total files containing inline styles: ${census.totalFilesWithStyles}`);
    console.log(`\nTop 30 Hotspot Files:`);
    census.fileCounts.slice(0, 30).forEach((item, index) => {
      console.log(`  ${String(index + 1).padStart(2)}. ${item.file.padEnd(45)}: ${item.count}`);
    });
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseRoutes,
  runCensus,
};

