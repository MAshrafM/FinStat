#!/usr/bin/env node
/**
 * Design Tokens CLI & Contrast Verification Tool
 * FinStat UI/UX Overhaul — Governed by UI-UX-PLAN.md §4.9
 *
 * Usage:
 *   node frontend/scripts/tokens.js --check --tables
 *   node frontend/scripts/tokens.js --write
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const TOKENS_PATH = path.join(ROOT_DIR, 'frontend/src/styles/tokens.json');
const PLAN_PATH = path.join(ROOT_DIR, 'docs/UI-UX_Plan/UI-UX-PLAN.md');

// --- WCAG 2.1 Relative Luminance & Contrast Math (Gamma 2.4, threshold 0.04045) ---

function srgb(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

function calculateContrast(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return ((max + 0.05) / (min + 0.05)).toFixed(2);
}

// --- Token Resolution ---

function resolveHex(tokenOrHex, tokens) {
  if (!tokenOrHex) return null;
  if (tokenOrHex.startsWith('#')) return tokenOrHex;
  if (tokenOrHex.startsWith('var(')) {
    const match = tokenOrHex.match(/var\(([^)]+)\)/);
    if (match) return resolveHex(match[1], tokens);
  }

  // Look in token sections
  const sections = ['surfaces', 'borders', 'text', 'tones', 'actions', 'focus'];
  for (const s of sections) {
    if (tokens[s] && tokens[s][tokenOrHex]) {
      const val = tokens[s][tokenOrHex];
      if (val.startsWith('#')) return val;
      if (val.startsWith('var(')) return resolveHex(val, tokens);
    }
  }
  return null;
}

// --- Table Generation matching §4.9 verbatim ---

function generateMarkdownTables(tokens) {
  const surfaceHex = tokens.surfaces['--fs-surface'];
  const bgHex = tokens.surfaces['--fs-bg'];
  const raisedHex = tokens.surfaces['--fs-surface-raised'];

  // 1. Text Pairs (§4.9.1)
  const textRows = [];
  textRows.push('| Pair | Surface | bg | Raised | Target | Status |');
  textRows.push('| :--- | ---: | ---: | ---: | ---: | :--- |');

  for (const item of tokens.tables.textPairs) {
    let surfaceVal = '—';
    let bgVal = '—';
    let raisedVal = '—';

    const fgHex = resolveHex(item.foreground, tokens);
    const bgOverride = item.background ? resolveHex(item.background, tokens) : null;

    if (bgOverride) {
      surfaceVal = calculateContrast(fgHex, bgOverride);
    } else if (fgHex) {
      surfaceVal = calculateContrast(fgHex, surfaceHex);
      bgVal = calculateContrast(fgHex, bgHex);
      raisedVal = calculateContrast(fgHex, raisedHex);
    }

    // Exact bold formatting per §4.9.1
    if (item.pair.includes('--fs-text-4')) {
      surfaceVal = `**${surfaceVal}**`;
    }

    textRows.push(`| ${item.pair} | ${surfaceVal} | ${bgVal} | ${raisedVal} | ${item.target} | ${item.status} |`);
  }

  // 2. Non-Text Pairs (§4.9.2)
  const nonTextRows = [];
  nonTextRows.push('| Pair | Surface | bg | Raised | Status |');
  nonTextRows.push('| :--- | ---: | ---: | ---: | :--- |');

  for (const item of tokens.tables.nonTextPairs) {
    let surfaceVal = '—';
    let bgVal = '—';
    let raisedVal = '—';

    if (item.column === 'bg') {
      const fg = resolveHex(item.foreground, tokens);
      bgVal = calculateContrast(fg, bgHex);
    } else if (item.token) {
      const hex = resolveHex(item.token, tokens);
      surfaceVal = calculateContrast(hex, surfaceHex);
      bgVal = calculateContrast(hex, bgHex);
      raisedVal = calculateContrast(hex, raisedHex);
      if (item.pair.includes('--fs-border-control')) {
        raisedVal = `**${raisedVal}**`;
      }
    } else if (item.foreground && item.background) {
      const fg = resolveHex(item.foreground, tokens);
      const bg = resolveHex(item.background, tokens);
      const ratio = calculateContrast(fg, bg);
      if (item.pair.includes('--fs-focus-ring` on `--fs-action-bg')) {
        surfaceVal = `**${ratio}**`;
      } else {
        surfaceVal = ratio;
      }
    } else if (item.foreground) {
      const fg = resolveHex(item.foreground, tokens);
      if (item.pair.startsWith('Chart grey')) {
        surfaceVal = calculateContrast(fg, surfaceHex);
        raisedVal = calculateContrast(fg, raisedHex);
        if (item.pair.startsWith('Chart grey 3')) {
          raisedVal = `**${raisedVal}**`;
        }
      }
    }

    nonTextRows.push(`| ${item.pair} | ${surfaceVal} | ${bgVal} | ${raisedVal} | ${item.status} |`);
  }

  return (
    `#### 4.9.1 Text pairs\n\n` +
    textRows.join('\n') +
    `\n\n` +
    `#### 4.9.2 Non-text pairs (WCAG 1.4.11, 3:1)\n\n` +
    nonTextRows.join('\n')
  );
}

// --- Main Execution Modes ---

function main() {
  const args = process.argv.slice(2);
  const isCheckTables = args.includes('--check') && args.includes('--tables');
  const isWrite = args.includes('--write');

  if (!isCheckTables && !isWrite) {
    console.log('Usage:');
    console.log('  node frontend/scripts/tokens.js --check --tables');
    console.log('  node frontend/scripts/tokens.js --write');
    process.exit(1);
  }

  if (!fs.existsSync(TOKENS_PATH)) {
    console.error(`Error: tokens.json not found at ${TOKENS_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(PLAN_PATH)) {
    console.error(`Error: UI-UX-PLAN.md not found at ${PLAN_PATH}`);
    process.exit(1);
  }

  const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
  const generatedMarkdown = generateMarkdownTables(tokens);

  const planContent = fs.readFileSync(PLAN_PATH, 'utf8').replace(/\r\n/g, '\n');

  const startMarker = '#### 4.9.1 Text pairs';
  const endMarker = '**Rules derived from the table:**';

  const startIndex = planContent.indexOf(startMarker);
  const endIndex = planContent.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error(`Error: Could not locate §4.9 table markers in ${PLAN_PATH}`);
    process.exit(1);
  }

  const currentTablesBlock = planContent.substring(startIndex, endIndex).trim();
  const expectedTablesBlock = generatedMarkdown.trim();

  if (isCheckTables) {
    if (currentTablesBlock === expectedTablesBlock) {
      console.log('✓ All §4.9 contrast tables match tokens.json exactly! (0 drift)');
      process.exit(0);
    } else {
      console.error('✗ Contrast tables drift detected in §4.9:');
      console.error('--- Current in UI-UX-PLAN.md ---');
      console.error(currentTablesBlock);
      console.error('--- Expected from tokens.json ---');
      console.error(expectedTablesBlock);
      process.exit(1);
    }
  }

  if (isWrite) {
    const updatedPlan =
      planContent.substring(0, startIndex) +
      generatedMarkdown +
      '\n\n' +
      planContent.substring(endIndex);
    fs.writeFileSync(PLAN_PATH, updatedPlan, 'utf8');
    console.log('✓ Successfully wrote §4.9 contrast tables to UI-UX-PLAN.md');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  relativeLuminance,
  calculateContrast,
  generateMarkdownTables,
  resolveHex,
};
