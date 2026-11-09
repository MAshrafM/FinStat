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

// Exempt files (relative to frontend/src or basename)
const EXEMPT_BASENAMES = new Set([
  'tokens.css',
  'theme.css',
  'theme-components.css',
]);

const FORBIDDEN_PATTERN = /var\(--fs-(?:positive|negative|warning|accent(?:-hover|-active|-text)?)\)/g;

function findCssFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findCssFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      if (!EXEMPT_BASENAMES.has(entry.name)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function lintTones() {
  const cssFiles = findCssFiles(FRONTEND_SRC);
  const violations = [];

  for (const filePath of cssFiles) {
    const relPath = path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      let match;
      // Reset lastIndex for global regex
      FORBIDDEN_PATTERN.lastIndex = 0;
      while ((match = FORBIDDEN_PATTERN.exec(line)) !== null) {
        violations.push({
          file: relPath,
          line: index + 1,
          token: match[0],
          snippet: line.trim(),
        });
      }
    });
  }

  if (violations.length > 0) {
    console.error(`\n❌ [lint-tones] Found ${violations.length} forbidden tone/accent token reference(s):`);
    for (const v of violations) {
      console.error(`   ${v.file}:${v.line} -> ${v.token}`);
      console.error(`      ${v.snippet}`);
    }
    console.error('\nFix: Use semantic utility classes from theme.css / theme-components.css, or neutral tokens.\n');
    process.exit(1);
  }

  console.log(`✓ [lint-tones] Scanned ${cssFiles.length} CSS files: 0 forbidden tone or accent references.`);
  process.exit(0);
}

lintTones();

