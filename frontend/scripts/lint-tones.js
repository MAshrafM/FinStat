#!/usr/bin/env node
/**
 * frontend/scripts/lint-tones.js
 *
 * Enforces Invariant I15 and §4.3.2 rule 1:
 * - Tone tokens (positive, negative, warning) and interactive accent tokens
 *   (accent, accent-hover, accent-active, accent-text) cannot be directly
 *   referenced in page CSS files.
 * - Allowed exclusively in:
 *   - frontend/src/styles/theme.css
 *   - frontend/src/styles/theme-components.css
 *   - frontend/src/styles/tokens.css (generated, exempt)
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = path.resolve(__dirname, '../src');
const TOKENS_JSON_PATH = path.resolve(__dirname, '../src/styles/tokens.json');

// Extract all valid tokens defined in tokens.json
function loadValidTokens() {
  if (!fs.existsSync(TOKENS_JSON_PATH)) return new Set();
  const tokensData = JSON.parse(fs.readFileSync(TOKENS_JSON_PATH, 'utf8'));
  const validSet = new Set();
  function traverse(obj) {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('--fs-')) {
        validSet.add(key);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverse(obj[key]);
      }
    }
  }
  traverse(tokensData);
  return validSet;
}

// Exempt files for tone/accent ban (they define or host shared theme rules)
const EXEMPT_BASENAMES = new Set([
  'tokens.css',
  'theme.css',
  'theme-components.css',
]);

const FORBIDDEN_PATTERN = /var\(--fs-(?:positive|negative|warning|accent(?:-hover|-active|-text)?)\)/g;
const TOKEN_VAR_PATTERN = /var\((--fs-[a-zA-Z0-9_-]+)/g;

function findAllCssFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findAllCssFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function lintTones() {
  const allCssFiles = findAllCssFiles(FRONTEND_SRC);
  const unexemptCssFiles = allCssFiles.filter(f => !EXEMPT_BASENAMES.has(path.basename(f)));
  const validTokens = loadValidTokens();

  const toneViolations = [];
  const undefinedViolations = [];

  // Check 1: Forbidden tone/accent tokens in unexempt page CSS files
  for (const filePath of unexemptCssFiles) {
    const relPath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      let match;
      FORBIDDEN_PATTERN.lastIndex = 0;
      while ((match = FORBIDDEN_PATTERN.exec(line)) !== null) {
        toneViolations.push({
          file: relPath,
          line: index + 1,
          token: match[0],
          snippet: line.trim(),
        });
      }
    });
  }

  // Check 2: Undefined tokens across ALL CSS files (including theme and theme-components)
  for (const filePath of allCssFiles) {
    // tokens.css is the token generator output; skip definitions
    if (path.basename(filePath) === 'tokens.css') continue;
    const relPath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      let match;
      TOKEN_VAR_PATTERN.lastIndex = 0;
      while ((match = TOKEN_VAR_PATTERN.exec(line)) !== null) {
        const tokenName = match[1];
        if (!validTokens.has(tokenName)) {
          undefinedViolations.push({
            file: relPath,
            line: index + 1,
            token: tokenName,
            snippet: line.trim(),
          });
        }
      }
    });
  }

  let hasError = false;

  if (toneViolations.length > 0) {
    hasError = true;
    console.error(`\n❌ [lint-tones] Found ${toneViolations.length} forbidden tone/accent token reference(s):`);
    for (const v of toneViolations) {
      console.error(`   ${v.file}:${v.line} -> ${v.token}`);
      console.error(`      ${v.snippet}`);
    }
    console.error('\nFix: Use semantic utility classes from theme.css / theme-components.css, or neutral tokens.\n');
  }

  if (undefinedViolations.length > 0) {
    hasError = true;
    console.error(`\n❌ [lint-tones] Found ${undefinedViolations.length} undefined design token reference(s):`);
    for (const v of undefinedViolations) {
      console.error(`   ${v.file}:${v.line} -> ${v.token}`);
      console.error(`      ${v.snippet}`);
    }
    console.error('\nFix: Use valid tokens defined in tokens.json, or propose a token addition in design tokens.\n');
  }

  if (hasError) {
    process.exit(1);
  }

  console.log(`✓ [lint-tones] Scanned ${unexemptCssFiles.length} page CSS files for tone scoping: 0 violations.`);
  console.log(`✓ [lint-tones] Scanned ${allCssFiles.length} total CSS files against tokens.json: 0 undefined tokens.`);
  process.exit(0);
}

lintTones();

