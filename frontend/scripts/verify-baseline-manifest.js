#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASELINE_DIR = process.argv[3] || path.join(__dirname, '..', 'tests', 'visual', 'baseline');
const MANIFEST_PATH = path.join(BASELINE_DIR, 'manifest.json');
const isGenerate = process.argv.includes('--generate');

if (isGenerate) {
  const files = fs.readdirSync(BASELINE_DIR).filter(f => f.endsWith('.png'));
  if (files.length !== 325) {
    console.error(`Expected 325 PNG files, found ${files.length}`);
    process.exit(1);
  }
  const manifest = {};
  for (const file of files) {
    const full = path.join(BASELINE_DIR, file);
    const buf = fs.readFileSync(full);
    if (buf.length < 1000) {
      console.error(`STUB DETECTED: ${file} is ${buf.length} bytes (< 1000)`);
      process.exit(1);
    }
    // Verify PNG header and dimensions (> 1x1)
    if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504E47) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      if (width <= 1 || height <= 1) {
        console.error(`1x1 STUB DETECTED: ${file} has dimensions ${width}x${height}`);
        process.exit(1);
      }
    }
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    manifest[file] = { bytes: buf.length, sha256: hash };
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Manifest generated for 325 baselines at ${MANIFEST_PATH}`);
  process.exit(0);
}

// Verify mode
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`Manifest not found at ${MANIFEST_PATH}`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const keys = Object.keys(manifest);
if (keys.length !== 325) {
  console.error(`Expected 325 entries in manifest, found ${keys.length}`);
  process.exit(1);
}
let passed = 0;
for (const [file, meta] of Object.entries(manifest)) {
  const full = path.join(BASELINE_DIR, file);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: ${file}`);
    process.exit(1);
  }
  const buf = fs.readFileSync(full);
  if (buf.length < 1000) {
    console.error(`STUB: ${file} is ${buf.length} bytes`);
    process.exit(1);
  }
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  if (hash !== meta.sha256) {
    console.error(`HASH MISMATCH: ${file} expected ${meta.sha256} got ${hash}`);
    process.exit(1);
  }
  passed++;
}
console.log(`${passed}/325 baselines verified successfully.`);
process.exit(0);

