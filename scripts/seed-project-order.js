#!/usr/bin/env node
/**
 * seed-project-order.js
 *
 * One-time script: creates the projectOrder singleton document from the
 * current orderRank ordering. Run once after deploying the Studio schema
 * change. Safe to re-run — will overwrite if the document already exists.
 *
 * Usage:
 *   SANITY_API_TOKEN=<token> node scripts/seed-project-order.js [--dry-run]
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
    const req = https.request(
      {
        hostname: `${PROJECT_ID}.api.sanity.io`,
        path,
        method,
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            if (res.statusCode >= 400) reject(new Error(`${res.statusCode}: ${JSON.stringify(json).slice(0, 300)}`));
            else resolve(json);
          } catch { reject(new Error(`Bad JSON: ${raw.slice(0, 200)}`)); }
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  if (DRY_RUN) console.log('--- DRY RUN ---\n');

  // Fetch all projects ordered by orderRank
  const encoded = encodeURIComponent('*[_type == "project"] | order(orderRank) { _id, title }');
  const { result: projects } = await request(
    'GET',
    `/v${API_VER}/data/query/${DATASET}?query=${encoded}&perspective=raw`,
  );

  console.log(`Found ${projects.length} projects:\n`);
  projects.forEach((p, i) => console.log(`  ${i + 1}. ${p.title} (${p._id})`));
  console.log('');

  const doc = {
    _id: 'projectOrder',
    _type: 'projectOrder',
    projects: projects.map((p) => ({
      _type: 'reference',
      _ref: p._id,
      _key: p._id,
    })),
  };

  if (DRY_RUN) {
    console.log('Would create/replace projectOrder document with the above order.');
    return;
  }

  const result = await request('POST', `/v${API_VER}/data/mutate/${DATASET}?returnIds=true`, {
    mutations: [{ createOrReplace: doc }],
  });

  console.log('✅ projectOrder document created:', result.results?.[0]?.id || result);
}

main().catch((err) => { console.error(err); process.exit(1); });
