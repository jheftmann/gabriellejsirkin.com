#!/usr/bin/env node
'use strict';

// Migrates all project markdown files:
// 1. Sets cat → "Visual Direction" (default; Gabrielle recategorizes via CMS)
// 2. Converts photographer/director/bts/destination → credits_list entries
// 3. Removes now-replaced individual credit fields + explicit filter field

const fs   = require('fs');
const path = require('path');

const dir = 'content/projects';
const slugs = fs.readdirSync(dir)
  .filter(d => !d.startsWith('_') && fs.statSync(path.join(dir, d)).isDirectory())
  .filter(d => fs.existsSync(path.join(dir, d, 'index.md')));

function extractValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  if (!m) return '';
  let val = m[1].trim();
  if ((val.startsWith("'") && val.endsWith("'")) ||
      (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
  return val;
}

function removeLine(fm, key) {
  return fm.replace(new RegExp(`^${key}:.*\\n`, 'm'), '');
}

let updated = 0;
for (const slug of slugs) {
  const mdPath = path.join(dir, slug, 'index.md');
  const text   = fs.readFileSync(mdPath, 'utf8');
  const match  = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) { console.log(`⚠ skipped (no frontmatter): ${slug}`); continue; }

  let fm   = match[1];
  const body = match[2];

  // Extract credit values before removing fields
  const photographer = extractValue(fm, 'photographer');
  const director     = extractValue(fm, 'director');
  const bts          = extractValue(fm, 'bts');
  const destination  = extractValue(fm, 'destination');

  // Build credits_list entries from non-empty values
  const entries = [];
  if (photographer) entries.push({ label: 'Photographer', value: photographer });
  if (director)     entries.push({ label: 'Director',     value: director     });
  if (bts)          entries.push({ label: 'BTS',          value: bts          });
  if (destination)  entries.push({ label: 'Destination',  value: destination  });

  // Update cat to default
  fm = fm.replace(/^cat:.*$/m, 'cat: Visual Direction');

  // Remove replaced fields and explicit filter key (now derived from cat)
  fm = removeLine(fm, 'photographer');
  fm = removeLine(fm, 'director');
  fm = removeLine(fm, 'bts');
  fm = removeLine(fm, 'destination');
  fm = removeLine(fm, 'filter');

  // Inject credits_list before the skills field (or at end of frontmatter)
  if (entries.length > 0) {
    const yaml = 'credits_list:\n' +
      entries.map(e => `  - label: "${e.label}"\n    value: "${e.value}"`).join('\n');
    if (/^skills:/m.test(fm)) {
      fm = fm.replace(/^(skills:)/m, yaml + '\n$1');
    } else {
      fm = fm.trimEnd() + '\n' + yaml;
    }
  }

  fs.writeFileSync(mdPath, `---\n${fm}\n---\n${body}`);
  console.log(`✓ ${slug}${entries.length ? ` (${entries.length} credit entries)` : ''}`);
  updated++;
}

console.log(`\nDone — updated ${updated} / ${slugs.length} projects.`);
