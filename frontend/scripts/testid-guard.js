#!/usr/bin/env node
/**
 * frontend/scripts/testid-guard.js
 *
 * Enforces Invariant I5:
 * Diffs occurrences of data-testid and aria-label across all .js/.jsx files
 * between HEAD and the merge base.
 *
 * No data-testid or aria-label may be removed without replacement.
 */

const { execSync } = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const ATTR_PATTERN = /(data-testid|aria-label)\s*=\s*(?:["']([^"']+)["']|\{\s*["']([^"']+)["']\s*\})/g;

function getMergeBase(customBase) {
  if (customBase) return customBase.trim();

  const candidates = ['origin/main', 'main', 'HEAD~1'];
  for (const ref of candidates) {
    try {
      const base = execSync(`git merge-base HEAD ${ref}`, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
      if (base) return base;
    } catch {
      // try next
    }
  }
  return 'HEAD';
}

function extractIdentifiers(text) {
  const ids = [];
  let match;
  ATTR_PATTERN.lastIndex = 0;
  while ((match = ATTR_PATTERN.exec(text)) !== null) {
    const attr = match[1];
    const val = match[2] || match[3];
    if (val) {
      ids.push(`${attr}="${val}"`);
    }
  }
  return ids;
}

function runTestIdGuard() {
  const args = process.argv.slice(2);
  let customBase = null;
  const baseIdx = args.indexOf('--base');
  if (baseIdx !== -1 && args[baseIdx + 1]) {
    customBase = args[baseIdx + 1];
  }

  const baseCommit = getMergeBase(customBase);
  console.log(`[testid-guard] Checking data-testid & aria-label preservation against merge-base: ${baseCommit}`);

  let diffText = '';
  try {
    diffText = execSync(
      `git diff -U0 ${baseCommit} -- "frontend/src/**/*.js" "frontend/src/**/*.jsx"`,
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (err) {
    console.error('[testid-guard] Error running git diff:', err.message);
    process.exit(1);
  }

  if (!diffText.trim()) {
    console.log(`✓ [testid-guard] Clean diff against ${baseCommit}: 0 data-testid/aria-label modifications.`);
    process.exit(0);
  }

  // Parse diff per file
  const fileDiffs = diffText.split(/^diff --git /m).filter(Boolean);
  const deletedWithoutReplacement = [];

  for (const fileDiff of fileDiffs) {
    const lines = fileDiff.split(/\r?\n/);
    const headerLine = lines[0] || '';
    const fileMatch = headerLine.match(/b\/(frontend\/src\/[^\s]+)/);
    const fileName = fileMatch ? fileMatch[1] : headerLine;

    const removedAttrs = [];
    const addedAttrs = [];

    for (const line of lines) {
      if (line.startsWith('---') || line.startsWith('+++')) continue;
      if (line.startsWith('-')) {
        const ids = extractIdentifiers(line.slice(1));
        removedAttrs.push(...ids);
      } else if (line.startsWith('+')) {
        const ids = extractIdentifiers(line.slice(1));
        addedAttrs.push(...ids);
      }
    }

    const addedSet = new Set(addedAttrs);
    for (const removed of removedAttrs) {
      if (!addedSet.has(removed)) {
        deletedWithoutReplacement.push({ file: fileName, identifier: removed });
      }
    }
  }

  if (deletedWithoutReplacement.length > 0) {
    console.error(`\n❌ [testid-guard] Detected ${deletedWithoutReplacement.length} removed data-testid/aria-label attributes without replacement (Invariant I5):`);
    for (const item of deletedWithoutReplacement) {
      console.error(`   - ${item.file}: removed ${item.identifier}`);
    }
    console.error('\nFix: Existing data-testid and aria-label identifiers must be preserved during UI refactoring.\n');
    process.exit(1);
  }

  console.log(`✓ [testid-guard] Checked diff against ${baseCommit}: all data-testid and aria-label attributes preserved.`);
  process.exit(0);
}

runTestIdGuard();

