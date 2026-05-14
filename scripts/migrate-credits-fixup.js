#!/usr/bin/env node
'use strict';

// Fix-up migration for issue #72:
// Pre-populates credits_list from old fixed-label fields (photographer,
// director, bts, destination) where the data still lives in the file but
// never made it into the new list format.
//
// Safe behavior:
//   - Only touches a project if credits_list is missing/empty
//   - Only adds entries for old fields that have non-empty values
//   - Removes the old field lines + the legacy `filter` key
//   - Does NOT modify `cat` or any other unrelated field

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

function hasNonEmptyCreditsList(fm) {
  const m = fm.match(/^credits_list:\s*\n([\s\S]*?)(?=^\S|$(?![\r\n]))/m);
  if (!m) return false;
  return /^\s+-\s/m.test(m[1]);
}

let updated = 0, skipped = 0;
for (const slug of slugs) {
  const mdPath = path.join(dir, slug, 'index.md');
  const text   = fs.readFileSync(mdPath, 'utf8');
  const match  = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) { console.log(`⚠ skipped (no frontmatter): ${slug}`); continue; }

  let fm   = match[1];
  const body = match[2];

  if (hasNonEmptyCreditsList(fm)) {
    skipped++;
    continue;
  }

  const photographer = extractValue(fm, 'photographer');
  const director     = extractValue(fm, 'director');
  const bts          = extractValue(fm, 'bts');
  const destination  = extractValue(fm, 'destination');

  const entries = [];
  if (photographer) entries.push({ label: 'Photographer', value: photographer });
  if (director)     entries.push({ label: 'Director',     value: director     });
  if (bts)          entries.push({ label: 'BTS',          value: bts          });
  if (destination)  entries.push({ label: 'Destination',  value: destination  });

  fm = removeLine(fm, 'photographer');
  fm = removeLine(fm, 'director');
  fm = removeLine(fm, 'bts');
  fm = removeLine(fm, 'destination');
  fm = removeLine(fm, 'filter');
  fm = fm.replace(/^credits_list:\s*\n?/m, '');

  if (entries.length > 0) {
    const yaml = 'credits_list:\n' +
      entries.map(e => `  - label: "${e.label}"\n    value: "${e.value.replace(/"/g, '\\"')}"`).join('\n');
    if (/^skills:/m.test(fm)) {
      fm = fm.replace(/^(skills:)/m, yaml + '\n$1');
    } else {
      fm = fm.trimEnd() + '\n' + yaml;
    }
  }

  fs.writeFileSync(mdPath, `---\n${fm}\n---\n${body}`);
  console.log(`✓ ${slug}${entries.length ? ` (${entries.length} entries)` : ' (no old field values)'}`);
  updated++;
}

console.log(`\nDone — updated ${updated}, skipped ${skipped} (already had credits_list), total ${slugs.length}.`);
