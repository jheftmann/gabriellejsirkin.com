#!/usr/bin/env node
'use strict';

// Migrates each project markdown's `cat` field to the new object-list shape:
//
//   cat:                       cat:
//     - Visual Direction  →      - name: Visual Direction
//     - Production                 position: 5
//                                - name: Production
//   order: 5                       position: 5
//
// The legacy project-level `order` field becomes the `position` for every
// category the project is in (Gabrielle can then refine per-category in the CMS).
// `order_all` is preserved unchanged.

const fs   = require('fs');
const path = require('path');

const dir = 'content/projects';
const slugs = fs.readdirSync(dir)
  .filter(d => !d.startsWith('_') && fs.statSync(path.join(dir, d)).isDirectory())
  .filter(d => fs.existsSync(path.join(dir, d, 'index.md')));

function parseCatField(fmText) {
  // Match `cat: ...` or `cat:` with indented items
  const m = fmText.match(/^cat:[ \t]*(.*)\n((?:[ \t]+-.*\n)*)/m);
  if (!m) return { raw: null, items: [], block: '' };
  const block = m[0];
  const inline = m[1].trim();
  const items = [];
  if (inline) {
    // Inline scalar / comma string
    items.push(...inline.split(',').map(s => s.trim()).filter(Boolean));
  }
  if (m[2]) {
    m[2].split('\n').forEach(line => {
      const li = line.match(/^[ \t]+-[ \t]+(.+)$/);
      if (li) items.push(li[1].trim().replace(/^['"]|['"]$/g, ''));
    });
  }
  return { raw: m[0], items, block };
}

function extractScalar(fmText, key) {
  const m = fmText.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return m ? m[1].trim() : '';
}

function removeLine(fmText, key) {
  return fmText.replace(new RegExp(`^${key}:.*\\n`, 'm'), '');
}

let updated = 0, skipped = 0;
for (const slug of slugs) {
  const mdPath = path.join(dir, slug, 'index.md');
  const text   = fs.readFileSync(mdPath, 'utf8');
  const match  = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) { console.log(`⚠ skipped (no frontmatter): ${slug}`); continue; }

  let fm   = match[1];
  const body = match[2];

  const { raw: catBlock, items } = parseCatField(fm);

  // Detect if it's already migrated (items are objects, indicated by `name:` lines)
  if (catBlock && /\n[ \t]+- name:[ \t]/.test(catBlock)) {
    skipped++;
    continue;
  }

  if (items.length === 0) {
    skipped++;
    continue;
  }

  const orderRaw = extractScalar(fm, 'order');
  const position = orderRaw ? parseInt(orderRaw, 10) : null;

  // Build new cat block
  const newCatBlock = 'cat:\n' + items.map(name => {
    const lines = [`  - name: ${name}`];
    if (position != null && !Number.isNaN(position)) {
      lines.push(`    position: ${position}`);
    }
    return lines.join('\n');
  }).join('\n') + '\n';

  // Replace old cat block (and trailing newline) with new
  if (catBlock) {
    fm = fm.replace(catBlock, newCatBlock);
  } else {
    fm = newCatBlock + fm;
  }

  // Remove the legacy `order` field — position lives inside cat[] now
  fm = removeLine(fm, 'order');

  fs.writeFileSync(mdPath, `---\n${fm}\n---\n${body}`);
  console.log(`✓ ${slug} (${items.length} category${items.length === 1 ? '' : 'ies'}${position != null ? `, position ${position}` : ''})`);
  updated++;
}

console.log(`\nDone — updated ${updated}, skipped ${skipped} (already migrated or empty), total ${slugs.length}.`);
