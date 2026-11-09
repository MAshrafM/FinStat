#!/usr/bin/env node
/**
 * frontend/scripts/lint-ratchet.js
 *
 * Enforces the Stylelint Ratchet per UI-UX-PLAN.md §9.2 and §6.5 (Phase 1C):
 * 1. The merge base is the baseline: runs stylelint over the working tree and over git merge-base HEAD origin/main.
 * 2. Violation count per file may only decrease or stay the same (F2, S1).
 * 3. Any new file absent from merge base must report 0 violations.
 * 4. Converted / allowlisted files (theme.css, theme-components.css) must report 0 violations.
 * 5. Generated tokens.css is exempt.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const FRONTEND_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(FRONTEND_DIR, '..');
const CONFIG_FILE = path.join(FRONTEND_DIR, '.stylelintrc.json');
const STYLELINT_PATH = path.join(FRONTEND_DIR, 'node_modules/stylelint/lib/index.mjs');

// Converted files that must always be at 0 violations
const STRICT_ZERO_FILES = new Set([
  'src/styles/theme.css',
  'src/styles/theme-components.css',
]);

// Exempt files
const EXEMPT_FILES = new Set([
  'src/styles/tokens.css',
]);

function getMergeBase(customBase) {
  if (customBase) return customBase.trim();

  const candidates = [
    'origin/main',
    'main',
    'HEAD~1',
  ];

  for (const ref of candidates) {
    try {
      const base = execSync(`git merge-base HEAD ${ref}`, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      if (base) return base;
    } catch {
      // try next
    }
  }

  // Fallback to HEAD if no upstream/merge base
  return 'HEAD';
}

function getBaseFiles(baseCommit) {
  try {
    const output = execSync(`git ls-tree -r --name-only ${baseCommit} frontend/src/`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    return output
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.endsWith('.css'));
  } catch (err) {
    console.warn(`[lint-ratchet] Warning: could not list base files from ${baseCommit}:`, err.message);
    return [];
  }
}

function getFileContentAtCommit(commit, gitRelPath) {
  try {
    return execSync(`git show ${commit}:${gitRelPath}`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

async function runRatchet() {
  const args = process.argv.slice(2);
  let customBase = null;
  const baseIdx = args.indexOf('--base');
  if (baseIdx !== -1 && args[baseIdx + 1]) {
    customBase = args[baseIdx + 1];
  }

  const stylelintUrl = pathToFileURL(STYLELINT_PATH).href;
  const { default: stylelint } = await import(stylelintUrl);

  const baseCommit = getMergeBase(customBase);
  console.log(`[lint-ratchet] Evaluating stylelint ratchet against merge-base: ${baseCommit}`);

  // 1. Lint base commit CSS files
  const baseFiles = getBaseFiles(baseCommit);
  const baseViolations = new Map();

  for (const gitPath of baseFiles) {
    // gitPath is e.g. "frontend/src/App.css"
    const relToFrontend = path.relative('frontend', gitPath).replace(/\\/g, '/');
    if (EXEMPT_FILES.has(relToFrontend)) continue;

    const content = getFileContentAtCommit(baseCommit, gitPath);
    if (content === null) continue;

    const res = await stylelint.lint({
      code: content,
      codeFilename: path.join(FRONTEND_DIR, relToFrontend),
      configFile: CONFIG_FILE,
    });

    const count = (res.results[0] && res.results[0].warnings) ? res.results[0].warnings.length : 0;
    baseViolations.set(relToFrontend, count);
  }

  // 2. Lint current working tree
  const headRes = await stylelint.lint({
    files: 'src/**/*.css',
    cwd: FRONTEND_DIR,
    configFile: CONFIG_FILE,
  });

  const headViolations = new Map();
  for (const r of headRes.results) {
    const relToFrontend = path.relative(FRONTEND_DIR, r.source).replace(/\\/g, '/');
    if (EXEMPT_FILES.has(relToFrontend)) continue;
    headViolations.set(relToFrontend, (r.warnings ? r.warnings.length : 0));
  }

  // 3. Compare ratchet
  const regressions = [];
  const strictFailures = [];

  for (const [file, headCount] of headViolations.entries()) {
    // Check strict zero requirement
    if (STRICT_ZERO_FILES.has(file) && headCount > 0) {
      strictFailures.push({ file, headCount });
      continue;
    }

    if (baseViolations.has(file)) {
      const baseCount = baseViolations.get(file);
      if (headCount > baseCount) {
        regressions.push({
          file,
          baseCount,
          headCount,
          delta: headCount - baseCount,
        });
      }
    } else {
      // New file absent from merge-base
      if (headCount > 0) {
        regressions.push({
          file,
          baseCount: 0,
          headCount,
          delta: headCount,
          isNew: true,
        });
      }
    }
  }

  // 4. Output results
  if (regressions.length > 0 || strictFailures.length > 0) {
    console.error('\n❌ [lint-ratchet] Ratchet violations detected:');
    for (const r of regressions) {
      if (r.isNew) {
        console.error(`   - ${r.file}: NEW file has ${r.headCount} violation(s). New files must report 0 violations.`);
      } else {
        console.error(`   - ${r.file}: violation count increased from ${r.baseCount} to ${r.headCount} (+${r.delta}). Counts may only decrease or stay the same.`);
      }
    }
    for (const s of strictFailures) {
      console.error(`   - ${s.file}: converted/theme file has ${s.headCount} violation(s). Must report 0.`);
    }
    console.error('\nRatchet rule: Pre-existing violations on unmigrated files are tolerated; violation count may only fall or remain equal.\n');
    process.exit(1);
  }

  console.log(`✓ [lint-ratchet] Checked ${headViolations.size} CSS files against ${baseCommit}: 0 regressions.`);
  process.exit(0);
}

runRatchet().catch((err) => {
  console.error('[lint-ratchet] Unhandled error:', err);
  process.exit(1);
});
