#!/usr/bin/env node
/**
 * migrate-to-sanity.js
 *
 * Reads all markdown content from content/ and uploads it to Sanity.
 *
 * Requirements:
 *   SANITY_PROJECT_ID  — your Sanity project ID (from sanity.io/manage)
 *   SANITY_DATASET     — dataset name (default: production)
 *   SANITY_API_TOKEN   — a token with write access (Editor role)
 *
 * Usage:
 *   SANITY_PROJECT_ID=xxx SANITY_API_TOKEN=yyy node scripts/migrate-to-sanity.js
 *
 * Flags:
 *   --dry-run       Print what would be uploaded without actually doing it
 *   --skip-assets   Skip uploading media files (useful for re-runs of metadata only)
 *   --project SLUG  Migrate only a single project by slug
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 't4atn37a';
const DATASET    = process.env.SANITY_DATASET || 'production';
const TOKEN      = process.env.SANITY_API_TOKEN;
const API_VER    = '2024-01-01';

const DRY_RUN     = process.argv.includes('--dry-run');
const SKIP_ASSETS = process.argv.includes('--skip-assets');
const ONLY_SLUG   = (() => {
  const i = process.argv.indexOf('--project');
  return i !== -1 ? process.argv[i + 1] : null;
})();

if (!PROJECT_ID || !TOKEN) {
  console.error('Missing SANITY_PROJECT_ID or SANITY_API_TOKEN environment variables.');
  process.exit(1);
}

// ─── Sanity API client (no npm dependency needed here) ───────────────────────

function sanityRequest(method, endpoint, body, isMultipart) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://${PROJECT_ID}.api.sanity.io/v${API_VER}/${endpoint}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    };

    if (body && !isMultipart) {
      const data = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (res.statusCode >= 400) {
            reject(new Error(`Sanity API ${res.statusCode}: ${json.message || raw}`));
          } else {
            resolve(json);
          }
        } catch {
          reject(new Error(`Bad JSON: ${raw.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);

    if (body && !isMultipart) {
      req.write(JSON.stringify(body));
    } else if (body && isMultipart) {
      req.write(body);
    }

    req.end();
  });
}

async function uploadAsset(filePath, filename) {
  if (DRY_RUN) {
    console.log(`  [dry] upload asset: ${filename}`);
    return { _id: `dry-run-${filename}`, url: `https://cdn.sanity.io/dry/${filename}` };
  }

  const ext = path.extname(filename).toLowerCase();
  const isVideo = ext === '.mp4';
  const mimeMap = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
  };
  const mimeType = mimeMap[ext] || 'application/octet-stream';
  const assetType = isVideo ? 'file' : 'image';

  const buffer = fs.readFileSync(filePath);

  return new Promise((resolve, reject) => {
    const url = new URL(
      `https://${PROJECT_ID}.api.sanity.io/v${API_VER}/assets/${assetType}s/${DATASET}?filename=${encodeURIComponent(filename)}`
    );
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (res.statusCode >= 400) {
            reject(new Error(`Upload failed ${res.statusCode}: ${json.message || raw}`));
          } else {
            resolve(json.document || json);
          }
        } catch {
          reject(new Error(`Bad JSON: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

async function createOrReplace(doc) {
  if (DRY_RUN) {
    console.log(`  [dry] createOrReplace: ${doc._id} (${doc._type})`);
    return;
  }
  const mutations = [{ createOrReplace: doc }];
  await sanityRequest('POST', `data/mutate/${DATASET}`, { mutations }, false);
}

// ─── Frontmatter parser (matches build.js) ───────────────────────────────────

function coerceScalar(raw, wasQuoted) {
  if (wasQuoted) return raw;
  if (raw === 'true')  return true;
  if (raw === 'false') return false;
  if (raw === 'null' || raw === '~') return null;
  if (raw === '[]')    return [];
  return raw;
}

function parseFrontmatter(text) {
  const fm = {};
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm, body: text };

  const lines = m[1].split('\n');
  let arrayKey = null;
  let arrayItemObj = null;
  let blockKey = null;
  let blockLines = [];

  function flushArrayItem() {
    if (arrayItemObj !== null) {
      const keys = Object.keys(arrayItemObj);
      fm[arrayKey].push(keys.length === 1 ? arrayItemObj[keys[0]] : arrayItemObj);
      arrayItemObj = null;
    }
  }

  function unquote(s) {
    if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
      return [s.slice(1, -1), true];
    }
    return [s, false];
  }

  for (const line of lines) {
    if (blockKey !== null) {
      if (line.match(/^\s+/) || line === '') {
        blockLines.push(line === '' ? '' : line.trimStart());
        continue;
      }
      fm[blockKey] = blockLines.join('\n').replace(/\n+$/, '');
      blockKey = null; blockLines = [];
    }
    if (arrayKey !== null) {
      const item = line.match(/^\s+-\s+(.*)/);
      if (item) {
        flushArrayItem();
        const v = item[1].trim();
        const kv2 = v.match(/^(\w+):\s*(.*)$/);
        if (kv2) {
          const [val, wasQuoted] = unquote(kv2[2].trim());
          arrayItemObj = { [kv2[1]]: coerceScalar(val, wasQuoted) };
        } else {
          const [val, wasQuoted] = unquote(v);
          fm[arrayKey].push(coerceScalar(val, wasQuoted));
        }
        continue;
      }
      if (arrayItemObj !== null) {
        const cont = line.match(/^\s+(\w+):\s*(.*)$/);
        if (cont) {
          const [val, wasQuoted] = unquote(cont[2].trim());
          arrayItemObj[cont[1]] = coerceScalar(val, wasQuoted);
          continue;
        }
      }
      flushArrayItem();
      arrayKey = null;
    }
    const kb = line.match(/^(\w+):\s*\|[-+]?\s*$/);
    if (kb) { blockKey = kb[1]; blockLines = []; continue; }
    const ka = line.match(/^(\w+):\s*$/);
    if (ka) { arrayKey = ka[1]; fm[arrayKey] = []; arrayItemObj = null; continue; }
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      const [val, wasQuoted] = unquote(kv[2].trim());
      fm[kv[1].trim()] = coerceScalar(val, wasQuoted);
    }
  }
  if (blockKey !== null) fm[blockKey] = blockLines.join('\n').replace(/\n+$/, '');
  if (arrayKey !== null) flushArrayItem();

  return { fm, body: m[2] };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nanoid() {
  return Math.random().toString(36).slice(2, 11);
}

// Convert "order_all" index to a simple lexicographic rank string.
// Produces "a", "b", ... "z", "za", "zb", ... for sequential ordering.
function indexToOrderRank(n) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  if (n < 26) return alphabet[n];
  const prefix = 'z'.repeat(Math.floor(n / 26));
  return prefix + alphabet[n % 26];
}

// Parse "<a href="URL">Name</a>" city HTML into {name, url}
function parseCityHtml(html) {
  const href = html.match(/href="([^"]+)"/);
  const text = html.replace(/<[^>]+>/g, '').trim();
  return { name: text, url: href ? href[1] : null };
}

// ─── Asset cache (avoid re-uploading the same file) ──────────────────────────

const assetCache = {};

async function getOrUploadAsset(filePath, filename) {
  if (assetCache[filePath]) return assetCache[filePath];
  if (!fs.existsSync(filePath)) {
    console.warn(`    ⚠ File not found, skipping: ${filePath}`);
    return null;
  }
  if (SKIP_ASSETS) {
    console.log(`    [skip-assets] ${filename}`);
    return { _id: `skipped-${filename}` };
  }
  console.log(`    ↑ Uploading: ${filename}`);
  const asset = await uploadAsset(filePath, filename);
  assetCache[filePath] = asset;
  return asset;
}

// ─── Migrate projects ─────────────────────────────────────────────────────────

async function migrateProjects() {
  const dir = 'content/projects';
  const slugs = fs.readdirSync(dir)
    .filter(d => !d.startsWith('_') && fs.statSync(path.join(dir, d)).isDirectory())
    .filter(d => fs.existsSync(path.join(dir, d, 'index.md')));

  if (ONLY_SLUG) {
    const filtered = slugs.filter(s => s === ONLY_SLUG);
    if (!filtered.length) {
      console.error(`No project found with slug: ${ONLY_SLUG}`);
      process.exit(1);
    }
    return migrateProjectList(filtered, dir);
  }

  return migrateProjectList(slugs, dir);
}

async function migrateProjectList(slugs, dir) {
  // Sort by order_all to preserve existing ordering for orderRank assignment
  const projects = slugs.map(slug => {
    const { fm } = parseFrontmatter(fs.readFileSync(path.join(dir, slug, 'index.md'), 'utf8'));
    return { slug, fm };
  });
  projects.sort((a, b) => {
    const oa = parseInt(a.fm.order_all, 10) || 999;
    const ob = parseInt(b.fm.order_all, 10) || 999;
    return oa - ob;
  });

  for (let i = 0; i < projects.length; i++) {
    const { slug, fm } = projects[i];
    console.log(`\n[${i + 1}/${projects.length}] ${slug}`);
    await migrateProject(slug, fm, dir, i);
  }
}

async function migrateProject(slug, fm, dir, orderIndex) {
  const projectDir = path.join(dir, slug);

  // ── Media uploads ──────────────────────────────────────────────────────────

  let thumbnailRef = null;
  if (fm.thumbnail && !SKIP_ASSETS) {
    const thumbPath = path.join(projectDir, fm.thumbnail);
    const asset = await getOrUploadAsset(thumbPath, fm.thumbnail);
    if (asset) {
      const assetType = fm.thumbnail.match(/\.mp4$/i) ? 'sanity.fileAsset' : 'sanity.imageAsset';
      thumbnailRef = { _type: 'file', asset: { _type: 'reference', _ref: asset._id } };
    }
  }

  const mediaItems = [];
  const rawMedia = Array.isArray(fm.media) ? fm.media : [];
  for (const item of rawMedia) {
    const filename = typeof item === 'string' ? item : (item.file || '');
    if (!filename) continue;
    const caption = typeof item === 'object' ? (item.caption || '') : '';
    const bts     = typeof item === 'object' ? (item.bts || false) : false;

    const filePath = path.join(projectDir, filename);
    const asset = await getOrUploadAsset(filePath, filename);
    if (!asset) continue;

    mediaItems.push({
      _type: 'object',
      _key: nanoid(),
      file: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
      caption: caption || '',
      bts: !!bts,
    });
  }

  // ── Normalize categories ───────────────────────────────────────────────────

  let cats = [];
  if (Array.isArray(fm.cat)) {
    cats = fm.cat.map(c => {
      if (typeof c === 'object' && c.name) return { _key: nanoid(), name: c.name, position: c.position || null };
      if (typeof c === 'string') return { _key: nanoid(), name: c, position: null };
      return null;
    }).filter(Boolean);
  } else if (typeof fm.cat === 'string' && fm.cat) {
    cats = fm.cat.split(',').map(s => ({ _key: nanoid(), name: s.trim(), position: null }));
  }

  // ── Build document ────────────────────────────────────────────────────────

  const doc = {
    _type: 'project',
    _id: `project-${slug}`,
    orderRank: indexToOrderRank(orderIndex),
    title: fm.title || slug,
    slug: { _type: 'slug', current: slug },
    coming_soon: !!fm.coming_soon,
    cat: cats,
    client: fm.client || '',
    date: fm.date || '',
    description: fm.description || '',
    credits: fm.credits || '',
    credits_list: Array.isArray(fm.credits_list)
      ? fm.credits_list.map(c => ({ _key: nanoid(), label: c.label || '', value: c.value || '' }))
      : [],
    skills: Array.isArray(fm.skills) ? fm.skills : [],
    color_theme: fm.color_theme || 'default',
    card_ratio: fm.card_ratio || '',
    media: mediaItems,
  };

  if (thumbnailRef) doc.thumbnail = thumbnailRef;
  if (fm.og_title) doc.og_title = fm.og_title;
  if (fm.og_description) doc.og_description = fm.og_description;

  await createOrReplace(doc);
  console.log(`  ✓ ${fm.title || slug}`);
}

// ─── Migrate pages ────────────────────────────────────────────────────────────

async function migrateHomePage() {
  console.log('\n[Page] Home');
  const { fm } = parseFrontmatter(fs.readFileSync('content/pages/home.md', 'utf8'));

  const doc = {
    _type: 'homePage',
    _id: 'homePage',
    hero_main: fm.hero_main || '',
    hero_accent: fm.hero_accent || '',
    color_theme: fm.color_theme || 'default',
    og_title: fm.og_title || '',
    og_description: fm.og_description || '',
  };

  await createOrReplace(doc);
  console.log('  ✓ Home');
}

async function migrateAboutPage() {
  console.log('\n[Page] About');
  const { fm } = parseFrontmatter(fs.readFileSync('content/pages/about.md', 'utf8'));

  let sidebarPhotoRef = null;
  if (fm.sidebar_photo && !SKIP_ASSETS) {
    const photoPath = fm.sidebar_photo.replace(/^\//, '');
    const asset = await getOrUploadAsset(photoPath, path.basename(photoPath));
    if (asset) {
      sidebarPhotoRef = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    }
  }

  const doc = {
    _type: 'aboutPage',
    _id: 'aboutPage',
    headline_1: fm.headline_1 || '',
    headline_2: fm.headline_2 || '',
    lead: fm.lead || '',
    skills_list: Array.isArray(fm.skills_list)
      ? fm.skills_list.map(s => ({ _key: nanoid(), name: s.name || '', description: s.description || '' }))
      : [],
    services_text: fm.services_text || '',
    bio: fm.bio || '',
    color_theme: fm.color_theme || 'about',
    og_title: fm.og_title || '',
    og_description: fm.og_description || '',
  };

  if (sidebarPhotoRef) doc.sidebar_photo = sidebarPhotoRef;

  await createOrReplace(doc);
  console.log('  ✓ About');
}

async function migrateServicesPage() {
  console.log('\n[Page] Services');
  const { fm } = parseFrontmatter(fs.readFileSync('content/pages/travel.md', 'utf8'));

  let sidebarPhotoRef = null;
  if (fm.sidebar_photo && !SKIP_ASSETS) {
    const photoPath = fm.sidebar_photo.replace(/^\//, '');
    const asset = await getOrUploadAsset(photoPath, path.basename(photoPath));
    if (asset) {
      sidebarPhotoRef = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    }
  }

  // Parse cities from HTML strings to {name, url} objects
  const rawCities = Array.isArray(fm.cities) ? fm.cities : [];
  const cities = rawCities.map(c => {
    const str = typeof c === 'string' ? c : (c.item || String(c));
    const parsed = parseCityHtml(str);
    return { _key: nanoid(), name: parsed.name, url: parsed.url || '' };
  });

  const doc = {
    _type: 'servicesPage',
    _id: 'servicesPage',
    headline_1: fm.headline_1 || '',
    headline_2: fm.headline_2 || '',
    sidebar_label: fm.sidebar_label || 'Start a project',
    availability: fm.availability || '',
    approach: fm.approach || '',
    services: Array.isArray(fm.services)
      ? fm.services.map(s => typeof s === 'string' ? s : (s.item || String(s)))
      : [],
    clients: Array.isArray(fm.clients)
      ? fm.clients.map(c => typeof c === 'string' ? c : (c.item || String(c)))
      : [],
    city_guides_label: fm.city_guides_label || 'Travel Guides',
    city_guides_intro: fm.city_guides_intro || '',
    cities,
    color_theme: fm.color_theme || 'services',
    og_title: fm.og_title || '',
    og_description: fm.og_description || '',
  };

  if (sidebarPhotoRef) doc.sidebar_photo = sidebarPhotoRef;

  await createOrReplace(doc);
  console.log('  ✓ Services');
}

async function migrateSettings() {
  console.log('\n[Settings]');
  const { fm } = parseFrontmatter(fs.readFileSync('content/settings.md', 'utf8'));

  // Normalize nav from "Label|/path" strings to {label, href} objects
  const rawNav = Array.isArray(fm.nav) ? fm.nav : [];
  const nav = rawNav.map(item => {
    const str = typeof item === 'string' ? item : (item.item || String(item));
    const parts = str.split('|');
    return { _key: nanoid(), label: parts[0] || '', href: parts[1] || '' };
  });

  const doc = {
    _type: 'siteSettings',
    _id: 'siteSettings',
    site_title: fm.site_title || '',
    site_description: fm.site_description || '',
    site_url: fm.site_url || '',
    contact_email: fm.contact_email || '',
    contact_instagram: fm.contact_instagram || '',
    contact_linkedin: fm.contact_linkedin || '',
    nav,
    og_title_base: fm.og_title_base || '',
    sharecard_url: fm.sharecard_url || '',
    ga_tracking_id: fm.ga_tracking_id || '',
    categories: Array.isArray(fm.categories) ? fm.categories : [],
  };

  await createOrReplace(doc);
  console.log('  ✓ Site Settings');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Migrating to Sanity project: ${PROJECT_ID} / dataset: ${DATASET}`);
  if (DRY_RUN) console.log('DRY RUN — no changes will be made');
  if (SKIP_ASSETS) console.log('SKIP ASSETS — media files will not be uploaded');
  if (ONLY_SLUG) console.log(`Single project: ${ONLY_SLUG}`);

  try {
    if (!ONLY_SLUG) {
      await migrateSettings();
      await migrateHomePage();
      await migrateAboutPage();
      await migrateServicesPage();
    }
    await migrateProjects();
    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
}

main();
