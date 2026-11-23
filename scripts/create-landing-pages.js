#!/usr/bin/env node
/**
 * create-landing-pages.js
 *
 * One-shot migration:
 *  1. Reads existing project cat[]{name, position} data from Sanity
 *  2. Creates landingPage documents (one per category) with projects in position order
 *  3. Patches each project's cat field to plain [string] (name only)
 *
 * Usage:
 *   SANITY_API_TOKEN=<token> node scripts/create-landing-pages.js [--dry-run]
 */

'use strict';

const https = require('https');

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 't4atn37a';
const DATASET    = process.env.SANITY_DATASET    || 'production';
const TOKEN      = process.env.SANITY_API_TOKEN  || '';
const API_VER    = '2024-01-01';
const DRY_RUN    = process.argv.includes('--dry-run');

if (!TOKEN) { console.error('SANITY_API_TOKEN required'); process.exit(1); }

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (res.statusCode >= 400) reject(new Error(`${res.statusCode}: ${JSON.stringify(json).slice(0, 300)}`));
          else resolve(json);
        } catch { reject(new Error(`Bad JSON: ${raw.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function groqFetch(query) {
  const encoded = encodeURIComponent(query);
  return request('GET', `/v${API_VER}/data/query/${DATASET}?query=${encoded}&perspective=raw`)
    .then(r => r.result);
}

function mutate(mutations) {
  if (DRY_RUN) {
    console.log('[dry-run] mutations:', JSON.stringify(mutations, null, 2).slice(0, 500));
    return Promise.resolve({});
  }
  return request('POST', `/v${API_VER}/data/mutate/${DATASET}?returnIds=true`, {mutations});
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function nanoid(n = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < n; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

async function main() {
  if (DRY_RUN) console.log('--- DRY RUN ---');
  console.log(`Project: ${PROJECT_ID} / ${DATASET}\n`);

  // 1. Fetch all projects with their cat data
  const projects = await groqFetch(
    `*[_type == "project"] | order(orderRank) { _id, title, cat }`
  );
  console.log(`Fetched ${projects.length} projects`);

  // 2. Build category → [{projectId, position}] map from existing cat objects
  const categoryMap = {}; // { 'Brand Work': [{id, pos}] }

  for (const p of projects) {
    if (!Array.isArray(p.cat)) continue;
    for (const c of p.cat) {
      const name = typeof c === 'string' ? c : c?.name;
      if (!name) continue;
      const pos = typeof c === 'object' ? (c.position ?? 999) : 999;
      if (!categoryMap[name]) categoryMap[name] = [];
      categoryMap[name].push({ id: p._id, pos });
    }
  }

  const categories = Object.keys(categoryMap).sort();
  console.log(`\nCategories found: ${categories.join(', ')}\n`);

  // 3. Create landingPage documents
  const createMutations = categories.map(name => {
    const ordered = categoryMap[name].slice().sort((a, b) => a.pos - b.pos);
    const slug = slugify(name);
    const docId = `landingPage-${slug}`;
    return {
      createOrReplace: {
        _id: docId,
        _type: 'landingPage',
        title: name,
        slug: { _type: 'slug', current: slug },
        projects: ordered.map(({ id }) => ({
          _key: nanoid(),
          _type: 'reference',
          _ref: id,
        })),
      },
    };
  });

  console.log('Creating landing page documents…');
  for (const m of createMutations) {
    const { createOrReplace: doc } = m;
    console.log(`  ✓ ${doc.title} (${doc.projects.length} projects)`);
  }
  await mutate(createMutations);

  // 4. Patch each project's cat to plain [string]
  console.log('\nPatching project cat fields to plain strings…');
  const patchMutations = projects
    .filter(p => Array.isArray(p.cat) && p.cat.length > 0)
    .map(p => {
      const names = p.cat
        .map(c => (typeof c === 'string' ? c : c?.name))
        .filter(Boolean);
      return {
        patch: {
          id: p._id,
          set: { cat: names },
        },
      };
    });

  await mutate(patchMutations);
  console.log(`  ✓ Patched ${patchMutations.length} projects`);

  console.log('\n✅ Done!');
  if (DRY_RUN) console.log('(dry run — no changes written)');
}

main().catch(err => { console.error(err); process.exit(1); });
