/**
 * sanity-build.js
 *
 * Fetches content from Sanity and returns it in the same shape that build.js
 * expects from the markdown loaders. Drop-in replacement for loadSettings(),
 * loadPageContent(), and loadProjects() when SANITY_PROJECT_ID is set.
 *
 * Env vars:
 *   SANITY_PROJECT_ID  — required
 *   SANITY_DATASET     — optional, default: production
 *   SANITY_API_TOKEN   — optional; needed to read drafts
 *   SANITY_API_PERSPECTIVE — 'publishedOnly' (default) | 'previewDrafts'
 */

'use strict';

const { marked } = require('marked');

const PROJECT_ID  = process.env.SANITY_PROJECT_ID || 't4atn37a';
const DATASET     = process.env.SANITY_DATASET || 'production';
const TOKEN       = process.env.SANITY_API_TOKEN || '';
const PERSPECTIVE = process.env.SANITY_API_PERSPECTIVE || 'published';
const API_VER     = '2024-01-01';

// ─── GROQ client (no extra deps) ─────────────────────────────────────────────

const https = require('https');

function groqFetch(query, params = {}) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const paramStr = Object.entries(params)
      .map(([k, v]) => `&$${k}=${encodeURIComponent(JSON.stringify(v))}`)
      .join('');
    const url = new URL(
      `https://${PROJECT_ID}.api.sanity.io/v${API_VER}/data/query/${DATASET}?query=${encoded}${paramStr}&perspective=${PERSPECTIVE}`
    );
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (res.statusCode >= 400) {
            reject(new Error(`Sanity GROQ ${res.statusCode}: ${json.error?.description || raw.slice(0, 300)}`));
          } else {
            resolve(json.result);
          }
        } catch {
          reject(new Error(`Bad JSON from Sanity: ${raw.slice(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ─── Sanity CDN image URL helper ─────────────────────────────────────────────
// Appends Sanity's own image transform params to a CDN URL.

function sanityImgUrl(url, { w, h, q = 85, fit = 'max', fm = 'webp' } = {}) {
  if (!url) return '';
  const params = [`auto=format`, `fm=${fm}`, `q=${q}`];
  if (w) params.push(`w=${w}`);
  if (h) params.push(`h=${h}`);
  if (fit !== 'max') params.push(`fit=${fit}`);
  return `${url}?${params.join('&')}`;
}

// ─── Slugify (matches build.js) ───────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Load everything from Sanity ──────────────────────────────────────────────

async function loadAllFromSanity() {
  console.log(`[sanity] fetching from project ${PROJECT_ID} / ${DATASET} (${PERSPECTIVE})…`);

  const [settingsDoc, homeDoc, aboutDoc, servicesDoc, projectDocs, landingPageDocs, projectOrderDoc] = await Promise.all([
    groqFetch(`*[_type == "siteSettings"][0] {
      site_title, site_description, site_url, contact_email,
      contact_instagram, contact_linkedin, nav, og_title_base,
      sharecard_url, ga_tracking_id, categories
    }`),
    groqFetch(`*[_type == "homePage"][0] {
      hero_main, hero_accent, color_theme, og_title, og_description,
      "og_image": og_image.asset->url
    }`),
    groqFetch(`*[_type == "aboutPage"][0] {
      headline_1, headline_2, lead,
      "sidebar_photo": sidebar_photo.asset->url,
      skills_list, services_text, bio, color_theme,
      og_title, og_description, "og_image": og_image.asset->url
    }`),
    groqFetch(`*[_type == "servicesPage"][0] {
      headline_1, headline_2, sidebar_label, availability,
      "sidebar_photo": sidebar_photo.asset->url,
      approach, services, clients,
      city_guides_label, city_guides_intro, cities,
      color_theme, og_title, og_description,
      "og_image": og_image.asset->url
    }`),
    groqFetch(`*[_type == "project"] | order(orderRank) {
      _id, title,
      "id": slug.current,
      coming_soon, cat, client, date, description, credits,
      credits_list, skills, color_theme, card_ratio,
      "thumbnail": thumbnail.asset->url,
      "thumbnailFilename": thumbnail.asset->originalFilename,
      "media": media[] {
        "file": file.asset->url,
        "filename": file.asset->originalFilename,
        caption, bts
      },
      og_title, og_description,
      "og_image": og_image.asset->url
    }`),
    groqFetch(`*[_type == "landingPage"] {
      title,
      "slug": slug.current,
      "projectIds": projects[]._ref
    }`),
    groqFetch(`*[_type == "projectOrder"][0]{ "projectIds": projects[]._ref }`),
  ]);

  // ── Transform settings ────────────────────────────────────────────────────

  const nav = Array.isArray(settingsDoc?.nav)
    ? settingsDoc.nav.map(n => `${n.label}|${n.href}`)
    : [];

  const settings = {
    ...(settingsDoc || {}),
    nav,
    categories: settingsDoc?.categories || [],
    footer_year: new Date().getFullYear().toString(),
  };

  // ── Transform home page ───────────────────────────────────────────────────

  const homeContent = { ...(homeDoc || {}) };

  // ── Transform about page ──────────────────────────────────────────────────

  const aboutContent = { ...(aboutDoc || {}) };

  // ── Transform services page ───────────────────────────────────────────────

  const servicesRaw = servicesDoc || {};
  const cities = Array.isArray(servicesRaw.cities)
    ? servicesRaw.cities.map(c => {
        if (!c?.name) return '';
        return c.url ? `<a href="${c.url}" target="_blank" rel="noopener">${c.name}</a>` : c.name;
      })
    : [];
  const services = Array.isArray(servicesRaw.services) ? servicesRaw.services : [];
  const clients  = Array.isArray(servicesRaw.clients) ? servicesRaw.clients : [];

  const servicesContent = { ...servicesRaw, cities, services, clients };

  const pageContents = {
    home:    homeContent,
    about:   aboutContent,
    travel:  servicesContent,  // build.js uses 'travel' key for services page
  };

  // ── Build per-category position map from landing pages ───────────────────
  // { categorySlug: { projectId: 1-based position } }
  const categoryPositions = {};
  for (const lp of (landingPageDocs || [])) {
    const slug = lp.slug;
    if (!slug) continue;
    categoryPositions[slug] = {};
    (lp.projectIds || []).forEach((id, i) => {
      categoryPositions[slug][id] = i + 1;
    });
  }

  // ── Sort projects by projectOrder doc (falls back to orderRank GROQ order) ─

  const projectOrderIds = projectOrderDoc?.projectIds || [];
  const orderMap = Object.fromEntries(projectOrderIds.map((id, i) => [id, i]));
  const sortedProjectDocs = [...(projectDocs || [])].sort((a, b) => {
    const posA = orderMap[a._id] ?? Infinity;
    const posB = orderMap[b._id] ?? Infinity;
    return posA - posB;
  });

  // ── Transform projects ────────────────────────────────────────────────────

  const projects = sortedProjectDocs.map((doc, orderIdx) => {
    const slug = doc.id || doc._id.replace('project-', '');

    // cat is now a plain [string] array
    const cats = (Array.isArray(doc.cat) ? doc.cat : [])
      .map(c => (typeof c === 'string' ? c : c?.name))
      .filter(Boolean)
      .filter(n => n.toLowerCase() !== 'all');

    const orderAll = orderIdx + 1;

    // Media: transform Sanity asset URLs → { src, caption, bts }
    const resolvedImages = Array.isArray(doc.media)
      ? doc.media.filter(m => m?.file).map(m => ({
          src:     m.file,
          caption: m.caption || '',
          bts:     !!m.bts,
        }))
      : [];

    // Thumbnail / card image
    const cardSrc = doc.thumbnail || (resolvedImages[0]?.src) || '';

    // Build contentHtml
    let imgsHtml = null;
    if (resolvedImages.length > 0) {
      imgsHtml = resolvedImages
        .map(({ src, caption, bts }) => {
          const btsAttr = bts ? ' data-bts="true"' : '';
          const isVideo = /\.mp4(\?|$)/i.test(src);
          const el = isVideo
            ? `<video src="${src}" autoplay loop muted playsinline${btsAttr}></video>`
            : sanityMediaImg(src, btsAttr);
          return caption
            ? `<figure${btsAttr}>${el}<figcaption>${marked.parseInline(caption)}</figcaption></figure>`
            : el;
        })
        .join('\n');
    }

    const descHtml = doc.description
      ? marked.parse(doc.description)
      : null;

    // Per-category positions from landing page documents
    const catOrders = cats.reduce((m, name) => {
      const catSlug = slugify(name);
      const pos = categoryPositions[catSlug]?.[doc._id];
      if (pos != null) m[catSlug] = pos;
      return m;
    }, {});

    return {
      id:          slug,
      title:       doc.title || slug,
      client:      doc.client || '',
      cat:         cats.join(', '),
      filters:     cats.map(slugify),
      filter:      slugify(cats[0] || ''),
      catOrders,
      orderAll,
      date:        doc.date || '',
      description: descHtml || '',
      credits:     doc.credits || '',
      creditsList: Array.isArray(doc.credits_list) ? doc.credits_list : [],
      skills:      Array.isArray(doc.skills) ? doc.skills : [],
      cardImage:   { src: cardSrc, placeholder: '' },
      cardRatio:   doc.card_ratio || '',
      colorTheme:  doc.color_theme || 'default',
      comingSoon:  !!doc.coming_soon,
      contentHtml: imgsHtml || descHtml ? { desc: descHtml, images: imgsHtml } : null,
    };
  });

  return { settings, pageContents, projects };
}

// Generates a responsive <img> for a Sanity CDN image URL.
function sanityMediaImg(url, extraAttr = '') {
  const widths = [600, 900, 1200, 1800];
  const srcset = widths.map(w => `${sanityImgUrl(url, { w, fm: 'webp' })} ${w}w`).join(', ');
  const src    = sanityImgUrl(url, { w: 1200, fm: 'webp' });
  return `<img src="${src}" srcset="${srcset}" sizes="(max-width: 1100px) 50vw, 33vw" alt=""${extraAttr}>`;
}

module.exports = { loadAllFromSanity, sanityImgUrl };
