#!/usr/bin/env node
/**
 * fix-thumbnails-og.js
 *
 * 1. Clears broken thumbnail references (asset doesn't resolve — "Invalid file value")
 * 2. Backfills og_image from thumbnail for projects that have no og_image set
 *
 * The thumbnail fallback in sanity-build.js is already: thumbnail → first media item,
 * so clearing a broken thumbnail is safe.
 *
 * Usage:
 *   SANITY_API_TOKEN=<token> node scripts/fix-thumbnails-og.js [--dry-run]
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
    console.log('[dry-run] would apply', mutations.length, 'mutation(s)');
    mutations.forEach(m => {
      const id = m.patch?.id || m.createOrReplace?._id || '?';
      const ops = Object.keys(m.patch || {}).filter(k => k !== 'id').join(', ');
      console.log(`  ${id}: ${ops}`);
    });
    return Promise.resolve({});
  }
  return request('POST', `/v${API_VER}/data/mutate/${DATASET}?returnIds=true`, { mutations });
}

async function main() {
  if (DRY_RUN) console.log('--- DRY RUN ---\n');
  console.log(`Project: ${PROJECT_ID} / ${DATASET}\n`);

  // Fetch all projects with thumbnail and og_image status
  const projects = await groqFetch(`
    *[_type == "project"] | order(orderRank) {
      _id,
      title,
      "thumbnailRef": thumbnail.asset._ref,
      "thumbnailType": thumbnail._type,
      "thumbnailResolved": thumbnail.asset->_id,
      "ogImageRef": og_image.asset._ref,
      "firstMediaRef": media[0].file.asset._ref,
      "firstMediaResolved": media[0].file.asset->_id
    }
  `);

  console.log(`Fetched ${projects.length} projects\n`);

  const fixThumbnailType = [];  // _type:'image' stored in a file field → patch to 'file'
  const clearThumbnail   = [];  // broken ref (asset doesn't resolve) → unset thumbnail
  const backfillOg       = [];  // has valid thumbnail, no og_image → set og_image

  for (const p of projects) {
    const hasThumbnailRef  = !!p.thumbnailRef;
    const thumbnailBroken  = hasThumbnailRef && !p.thumbnailResolved;
    const thumbnailValid   = hasThumbnailRef && !!p.thumbnailResolved;
    const thumbnailWrongType = hasThumbnailRef && p.thumbnailType === 'image';
    const ogMissing        = !p.ogImageRef;

    if (thumbnailWrongType) {
      fixThumbnailType.push(p);
      console.log(`🔧 ${p.title} — thumbnail._type is 'image', should be 'file'`);
    } else if (thumbnailBroken) {
      clearThumbnail.push(p);
      console.log(`⚠  ${p.title} — broken thumbnail ref, will clear`);
    }

    if (thumbnailValid && ogMissing) {
      backfillOg.push(p);
      console.log(`→  ${p.title} — will set og_image from thumbnail`);
    }
  }

  console.log('');

  // 1. Fix _type mismatch (image stored in file field)
  if (fixThumbnailType.length > 0) {
    console.log(`Fixing thumbnail _type for ${fixThumbnailType.length} project(s)…`);
    const mutations = fixThumbnailType.map(p => ({
      patch: {
        id: p._id,
        set: { 'thumbnail._type': 'file' },
      },
    }));
    await mutate(mutations);
    console.log('  ✓ Done\n');
  } else {
    console.log('No thumbnail type mismatches found.\n');
  }

  // 2. Clear broken thumbnails
  if (clearThumbnail.length > 0) {
    console.log(`Clearing ${clearThumbnail.length} broken thumbnail ref(s)…`);
    const mutations = clearThumbnail.map(p => ({
      patch: { id: p._id, unset: ['thumbnail'] },
    }));
    await mutate(mutations);
    console.log('  ✓ Done\n');
  } else {
    console.log('No broken thumbnail refs found.\n');
  }

  // 3. Backfill og_image from thumbnail asset
  if (backfillOg.length > 0) {
    console.log(`Backfilling og_image for ${backfillOg.length} project(s)…`);
    const mutations = backfillOg.map(p => ({
      patch: {
        id: p._id,
        set: {
          og_image: {
            _type: 'image',
            asset: { _type: 'reference', _ref: p.thumbnailRef },
          },
        },
      },
    }));
    await mutate(mutations);
    console.log('  ✓ Done\n');
  } else {
    console.log('No og_image backfill needed.\n');
  }

  console.log('✅ All done!');
  if (DRY_RUN) console.log('(dry run — no changes written)');
}

main().catch(err => { console.error(err); process.exit(1); });
