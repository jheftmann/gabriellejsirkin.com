#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const { marked } = require('marked');
const sharp = require('sharp');

const WATCH = process.argv.includes('--watch');
const USE_CDN = !!process.env.NETLIFY;

// URL-encode each path segment (handles spaces/special chars in filenames)
function encodeSrc(p) {
  return p.split('/').map(s => encodeURIComponent(s)).join('/');
}

// Netlify Image CDN — only active on Netlify (USE_CDN). Falls back to plain <img> locally.
function cdnImg(src, alt, { widths, sizes, extra = '' } = {}) {
  if (!USE_CDN) return `<img src="${encodeSrc(src)}" alt="${alt}"${extra}>`;
  const url = encodeURIComponent('/' + src);
  const base = `/.netlify/images?url=${url}&fm=webp&q=85`;
  const srcset = widths.map(w => `${base}&w=${w} ${w}w`).join(', ');
  return `<img src="${base}&w=${widths[widths.length - 1]}" srcset="${srcset}" sizes="${sizes}" alt="${alt}"${extra}>`;
}

// ─── Category → filter key ────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Frontmatter parser ──────────────────────────────────────────────────────
// Handles flat key: value pairs and simple YAML arrays (key: / - item)

function parseFrontmatter(text) {
  const fm = {};
  let body = text;
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) {
    const lines = m[1].split('\n');
    let arrayKey = null;
    let arrayItemObj = null; // current multi-key object item being accumulated
    let blockKey = null;
    let blockLines = [];

    function flushArrayItem() {
      if (arrayItemObj !== null) {
        const keys = Object.keys(arrayItemObj);
        // Single-key object → push the value (backward compat); multi-key → push the object
        fm[arrayKey].push(keys.length === 1 ? arrayItemObj[keys[0]] : arrayItemObj);
        arrayItemObj = null;
      }
    }

    for (const line of lines) {
      // Collect indented lines for YAML block scalars (|, |-, |+)
      // Empty lines within a block are preserved as paragraph separators
      if (blockKey !== null) {
        if (line.match(/^\s+/) || line === '') {
          blockLines.push(line === '' ? '' : line.trimStart());
          continue;
        }
        fm[blockKey] = blockLines.join('\n').replace(/\n+$/, '');
        blockKey = null;
        blockLines = [];
      }
      if (arrayKey !== null) {
        // New list item
        const item = line.match(/^\s+-\s+(.*)/);
        if (item) {
          flushArrayItem();
          const v = item[1].trim();
          const kv2 = v.match(/^(\w+):\s*(.*)$/);
          if (kv2) {
            // Object-style item: start accumulating a multi-key object
            let val = kv2[2].trim();
            if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
            arrayItemObj = { [kv2[1]]: val };
          } else {
            fm[arrayKey].push(v); // plain string item
          }
          continue;
        }
        // Continuation line for object item (indented key: value, no dash)
        if (arrayItemObj !== null) {
          const cont = line.match(/^\s+(\w+):\s*(.*)$/);
          if (cont) {
            let val = cont[2].trim();
            if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
            arrayItemObj[cont[1]] = val;
            continue;
          }
        }
        // End of array — fall through to check for new key
        flushArrayItem();
        arrayKey = null;
      }
      // Detect block scalar: key: | or key: |- or key: |+
      const kb = line.match(/^(\w+):\s*\|[-+]?\s*$/);
      if (kb) { blockKey = kb[1]; blockLines = []; continue; }
      const ka = line.match(/^(\w+):\s*$/);
      if (ka) { arrayKey = ka[1]; fm[arrayKey] = []; arrayItemObj = null; continue; }
      const kv = line.match(/^(\w+):\s*(.+)$/);
      if (kv) {
        let val = kv[2].trim();
        if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
          val = val.slice(1, -1);
        }
        fm[kv[1].trim()] = val;
      }
    }
    // Flush any trailing block scalar or array item
    if (blockKey !== null) fm[blockKey] = blockLines.join('\n').replace(/\n+$/, '');
    if (arrayKey !== null) flushArrayItem();
    body = m[2];
  }
  return { fm, body };
}

// ─── Settings ────────────────────────────────────────────────────────────────

function loadSettings() {
  const text = fs.readFileSync('content/settings.md', 'utf8');
  const { fm } = parseFrontmatter(text);
  fm.footer_year = new Date().getFullYear().toString();
  return fm;
}

function loadPageContent(name) {
  const p = `content/pages/${name}.md`;
  if (!fs.existsSync(p)) return {};
  const { fm } = parseFrontmatter(fs.readFileSync(p, 'utf8'));
  return fm;
}

function applySettings(html, settings) {
  return html.replace(/\{\{SETTING:(\w+)\}\}/g, (_, key) => settings[key] !== undefined ? settings[key] : '');
}

// ─── Partials ────────────────────────────────────────────────────────────────

function loadPartials() {
  return {
    '_head.html':          fs.readFileSync('src/partials/_head.html',          'utf8'),
    '_nav.html':           fs.readFileSync('src/partials/_nav.html',           'utf8'),
    '_footer.html':        fs.readFileSync('src/partials/_footer.html',        'utf8'),
    '_sidebar-links.html': fs.readFileSync('src/partials/_sidebar-links.html', 'utf8'),
  };
}

function applyIncludes(html, partials) {
  return html.replace(/<!-- #include (\S+) -->/g, (_, name) => partials[name] || `<!-- missing: ${name} -->`);
}

// ─── Project data ────────────────────────────────────────────────────────────

function loadProjects() {
  const dir = 'content/projects';
  return fs.readdirSync(dir)
    .filter(d => !d.startsWith('_') && fs.statSync(path.join(dir, d)).isDirectory())
    .filter(d => fs.existsSync(path.join(dir, d, 'index.md')) || fs.existsSync(path.join(dir, d, 'meta.json')))
    .map(id => {
      let meta, bodyText = '';

      const mdPath   = path.join(dir, id, 'index.md');
      const jsonPath = path.join(dir, id, 'meta.json');

      if (fs.existsSync(mdPath)) {
        const { fm, body } = parseFrontmatter(fs.readFileSync(mdPath, 'utf8'));
        bodyText = body;
        meta = {
          title:       fm.title    || id,
          client:      fm.client   || '',
          cat:         Array.isArray(fm.cat) ? fm.cat.join(', ') : (fm.cat || ''),
          filters:     Array.isArray(fm.cat)
                         ? fm.cat.map(c => slugify(c)).filter(Boolean)
                         : fm.cat ? [slugify(fm.cat)] : [],
          filter:      slugify(Array.isArray(fm.cat) ? (fm.cat[0] || '') : (fm.cat || '')),
          date:        fm.date     || '',
          order:       fm.order    != null ? parseInt(fm.order,    10) : null,
          orderAll:    fm.order_all != null ? parseInt(fm.order_all, 10) : null,
          description: fm.description || '',
          credits:     fm.credits     || '',
          creditsList: Array.isArray(fm.credits_list) ? fm.credits_list : [],
          skills:      typeof fm.skills === 'string'
                          ? fm.skills.split(',').map(s => s.trim()).filter(Boolean)
                          : (Array.isArray(fm.skills) ? fm.skills : []),
          thumbnail:    fm.thumbnail    || '',
          cardImage:    { placeholder: fm.card_placeholder || '' },
          colorTheme:   fm.color_theme  || 'default',
          comingSoon:   fm.coming_soon === 'true',
          media:        Array.isArray(fm.media) && fm.media.length > 0
                          ? fm.media
                          : (Array.isArray(fm.images) && fm.images.length > 0
                              ? fm.images  // legacy fallback
                              : (fm.placeholder_count
                                  ? Array.from({ length: parseInt(fm.placeholder_count) }, () => ({ r: 'r-4-3' }))
                                  : [])),
        };
      } else {
        meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      }

      const baseUrl = `content/projects/${id}/`;

      // Resolve media list: frontmatter media list > auto-discovered folder files
      // Each item may be a plain string path or a { file, caption } object (new caption format)
      // Placeholder objects like { r: 'r-4-3' } are excluded (no .file key)
      const fmMediaRaw = Array.isArray(meta.media) && meta.media.length > 0
        ? meta.media.filter(x => typeof x === 'string' || (typeof x === 'object' && x !== null && x.file))
        : null;
      const folderMedia = fmMediaRaw ? [] : fs.readdirSync(path.join(dir, id))
        .filter(f => /\.(jpe?g|png|webp|gif|avif|mp4)$/i.test(f))
        .sort();
      // Normalize to { src, caption, bts } objects throughout
      const resolvedImages = fmMediaRaw
        ? fmMediaRaw.map(item => {
            if (typeof item === 'string') {
              return { src: path.isAbsolute(item) ? item.replace(/^\//, '') : `${baseUrl}${item}`, caption: '', bts: false };
            }
            const rawSrc = item.file || '';
            return { src: path.isAbsolute(rawSrc) ? rawSrc.replace(/^\//, '') : `${baseUrl}${rawSrc}`, caption: item.caption || '', bts: !!item.bts };
          })
        : folderMedia.map(f => ({ src: `${baseUrl}${f}`, caption: '', bts: false }));

      // Card thumbnail: explicit thumbnail field > first image
      if (meta.thumbnail) {
        meta.cardImage.src = meta.thumbnail.startsWith('/') ? meta.thumbnail.replace(/^\//, '') : `${baseUrl}${meta.thumbnail}`;
      } else if (resolvedImages.length > 0) {
        meta.cardImage.src = resolvedImages[0].src;
      }
      delete meta.thumbnail;

      // Remove raw media array from meta (replaced by resolvedImages below)
      delete meta.media;
      delete meta.images; // legacy cleanup
      delete meta.videos; // legacy cleanup

      let contentHtml = null;
      if (bodyText.trim() || resolvedImages.length > 0) {
        const lines     = bodyText.split('\n');
        const descLines = [], imgLines = [];
        lines.forEach(l => (/!\[.*\]\(/.test(l) ? imgLines : descLines).push(l));

        const descHtml = descLines.join('\n').trim()
          ? marked.parse(descLines.join('\n').trim())
          : null;

        let imgsHtml;
        if (imgLines.length > 0) {
          // Explicit markdown images take priority
          imgsHtml = marked.parse(imgLines.join('\n')).replace(
            /(<img[^>]+src=")(?!https?:\/\/|\/|data:)/g,
            `$1${baseUrl}`
          );
        } else if (resolvedImages.length > 0) {
          imgsHtml = resolvedImages
            .map(({ src, caption, bts }) => {
              const btsAttr = bts ? ' data-bts="true"' : '';
              const el = /\.mp4$/i.test(src)
                ? `<video src="${encodeSrc(src)}" autoplay loop muted playsinline${btsAttr}></video>`
                : cdnImg(src, '', { widths: [600, 900, 1200, 1800], sizes: '(max-width: 1100px) 50vw, 33vw', extra: btsAttr });
              return caption
                ? `<figure${btsAttr}>${el}<figcaption>${caption}</figcaption></figure>`
                : el;
            })
            .join('\n');
        } else {
          imgsHtml = null;
        }

        contentHtml = { desc: descHtml, images: imgsHtml };
      }

      return { id, ...meta, contentHtml };
    });
}

// ─── Page metadata ───────────────────────────────────────────────────────────

function computePageMeta(page, pageContent, settings, firstProjectSrc) {
  const base    = settings.og_title_base || 'Gabrielle J. Sirkin, Creative Studio for Travel';
  const siteUrl = (settings.site_url || '').replace(/\/$/, '');

  const defaultTitles = {
    index:       base,
    about:       `${base} – Information`,
    services:    `${base} – Services`,
    productions: `${base} – Productions`,
    project:     base,
  };

  const title   = pageContent.page_title || defaultTitles[page] || base;
  const ogTitle = pageContent.og_title   || title;
  const ogDesc  = pageContent.og_description || settings.site_description || '';

  let ogImage = settings.sharecard_url || '';
  if (pageContent.og_image) {
    const raw = pageContent.og_image;
    ogImage = /^https?:\/\//.test(raw) ? raw : `${siteUrl}/${raw.replace(/^\//, '')}`;
  } else if ((page === 'index' || page === 'project') && firstProjectSrc) {
    ogImage = `${siteUrl}/${firstProjectSrc}`;
  }

  const ogUrls = {
    index:       `${siteUrl}/`,
    about:       `${siteUrl}/about.html`,
    services:    `${siteUrl}/services.html`,
    productions: `${siteUrl}/productions.html`,
    project:     `${siteUrl}/project.html`,
  };

  return [
    `<title>${title}</title>`,
    `<link rel="icon" type="image/svg+xml" href="favicon.svg">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">`,
    `<meta name="description" content="${ogDesc}">`,
    `<meta property="og:title" content="${ogTitle}">`,
    `<meta property="og:description" content="${ogDesc}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:url" content="${ogUrls[page] || siteUrl + '/'}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${ogTitle}">`,
    `<meta name="twitter:description" content="${ogDesc}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
  ].join('\n');
}

// ─── Dominant color extraction ───────────────────────────────────────────────

async function getDominantColor(filePath) {
  try {
    if (!fs.existsSync(filePath)) return '';
    const { dominant } = await sharp(filePath).stats();
    return `rgb(${dominant.r},${dominant.g},${dominant.b})`;
  } catch { return ''; }
}

// ─── Card HTML ───────────────────────────────────────────────────────────────

function renderCard(p, bgColor = '') {
  const cs  = p.comingSoon ? '<span class="cs-badge">Coming Soon</span>' : '';
  const ph  = p.cardImage && p.cardImage.placeholder || '';
  const src = p.cardImage && p.cardImage.src;
  const inner = src
    ? (/\.mp4$/i.test(src)
        ? `<video src="${encodeSrc(src)}" autoplay loop muted playsinline aria-hidden="true"></video>`
        : cdnImg(src, p.title, { widths: [400, 800, 1200], sizes: '(max-width: 767px) 100vw, 50vw' }))
    : `<div class="thumb-ph">${ph}</div>`;
  const styleAttr    = bgColor ? ` style="background-color:${bgColor}"` : '';
  const orderAttr    = p.order    != null ? ` data-order="${p.order}"`        : '';
  const orderAllAttr = p.orderAll != null ? ` data-order-all="${p.orderAll}"` : '';
  // Caption: client (black) + title (muted), or just title (black) when no client
  const captionHtml = p.client
    ? `<p class="card-client">${p.client}</p><p class="card-title">${p.title}</p>`
    : `<p class="card-title card-title--solo">${p.title}</p>`;
  return (
    `    <a class="project-card" data-category="${(p.filters && p.filters.length ? p.filters : [p.filter]).join(' ')}"${orderAttr}${orderAllAttr} data-title="${p.title.replace(/"/g, '&quot;')}" href="project.html#?id=${p.id}&filter=${p.filter}">\n` +
    `      <div class="thumb"${styleAttr}>${inner}</div>\n` +
    `      <div class="card-info">${cs}<div class="card-caption">${captionHtml}</div>` +
    `<p class="card-cat">${p.cat}</p></div>\n` +
    `    </a>`
  );
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

function renderFilterBar(projects, settings) {
  const present = new Set(projects.flatMap(p => p.filters && p.filters.length ? p.filters : [p.filter]));
  const cats = Array.isArray(settings.categories) ? settings.categories : [];
  const btns = cats
    .map(cat => ({ filter: slugify(cat), label: cat }))
    .filter(f => present.has(f.filter))
    .map(f => `    <button class="filter-btn" data-filter="${f.filter}">${f.label}</button>`)
    .join('\n');
  return `    <button class="filter-btn active" data-filter="all" data-scheme="all">All</button>\n${btns}`;
}

// ─── Build ───────────────────────────────────────────────────────────────────

async function build() {
  console.log('[build] starting…');
  const settings = loadSettings();
  const partials  = loadPartials();
  const projects  = loadProjects();

  // Pre-render nav partial with items from settings
  const navItems = Array.isArray(settings.nav) ? settings.nav : [];
  partials['_nav.html'] = partials['_nav.html'].replace(
    '<!-- #nav-items -->',
    navItems.map(item => {
      const [title, slug] = item.split('|').map(s => s.trim());
      return `    <li><a href="${slug}">${title}</a></li>`;
    }).join('\n')
  );

  // Apply settings tokens inside partials (so {{SETTING:...}} works in _nav.html etc.)
  Object.keys(partials).forEach(k => { partials[k] = applySettings(partials[k], settings); });

  // Pre-extract dominant colors for all card thumbnails (async, so must happen before forEach)
  const colorMap = {};
  const sortedForColors = projects.slice().sort((a, b) => {
    const av = a.orderAll != null ? a.orderAll : Infinity;
    const bv = b.orderAll != null ? b.orderAll : Infinity;
    return av !== bv ? av - bv : a.title.localeCompare(b.title);
  });
  await Promise.all(sortedForColors.map(async p => {
    const src = p.cardImage && p.cardImage.src;
    if (src && !/^https?:\/\//.test(src) && !/\.mp4$/i.test(src)) {
      colorMap[p.id] = await getDominantColor(src);
    }
  }));

  const pages = ['index', 'about', 'project', 'services', 'productions'];
  pages.forEach(page => {
    let html = fs.readFileSync(`src/${page}.html`, 'utf8');

    // Resolve partials
    html = applyIncludes(html, partials);

    // Merge page-specific content into settings, then apply tokens
    const pageContentMap = { index: 'home', about: 'about', services: 'travel' };
    const pageContent = pageContentMap[page] ? loadPageContent(pageContentMap[page]) : {};
    const pageSettings = { ...settings, ...pageContent };

    // Inject computed meta block
    const firstProjectSrc = sortedForColors[0] && sortedForColors[0].cardImage && sortedForColors[0].cardImage.src;
    const gaSnippet = settings.ga_tracking_id
      ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${settings.ga_tracking_id}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${settings.ga_tracking_id}');</script>`
      : '';
    html = html.replace('<!-- #meta -->', computePageMeta(page, pageContent, settings, firstProjectSrc) + (gaSnippet ? '\n' + gaSnippet : ''));

    html = applySettings(html, pageSettings);

    // Auto-generate filter bar and inject project cards
    if (page === 'index') {
      const sorted = sortedForColors;
      html = html.replace('<!-- #filter-bar -->',    renderFilterBar(sorted, settings));
      html = html.replace('<!-- #projects-cards -->', sorted.map(p => renderCard(p, colorMap[p.id] || '')).join('\n'));
      const heroAccent = pageContent.hero_accent ? `<br>${pageContent.hero_accent}` : '';
      html = html.replace('<!-- #hero-title -->', `${pageContent.hero_main || ''}${heroAccent}`);
    }

    // Inject about page dynamic content
    if (page === 'about') {
      const skills = [1,2,3,4].map(i => {
        const name = pageContent[`skill${i}_name`];
        const desc = pageContent[`skill${i}_desc`];
        if (!name) return '';
        return `      <div class="skill-item">\n        <p class="skill-name">${name}</p>\n        ${desc ? `<p class="skill-desc">${desc}</p>` : ''}\n      </div>`;
      }).filter(Boolean).join('\n');
      html = html.replace('<!-- #about-skills -->', skills);

      const bio = (pageContent.bio || '').split(/\n\n+/).filter(Boolean)
        .map(p => `      <p class="bio-para">${p.replace(/\n/g, ' ')}</p>`).join('\n');
      html = html.replace('<!-- #about-bio -->', bio);
    }

    // Inject travel page dynamic content
    if (page === 'services') {
      const approach = (pageContent.approach || '').split(/\n\n+/).filter(Boolean)
        .map(p => `      <p class="bio-para">${p.replace(/\n/g, ' ')}</p>`).join('\n');
      html = html.replace('<!-- #travel-approach -->', approach);

      const services = (Array.isArray(pageContent.services) ? pageContent.services : [])
        .map(s => `        <li>${s}</li>`).join('\n');
      html = html.replace('<!-- #travel-services -->', services);

      const clients = (Array.isArray(pageContent.clients) ? pageContent.clients : [])
        .map(c => `        <li>${c}</li>`).join('\n');
      html = html.replace('<!-- #travel-clients -->', clients);

      const cities = (Array.isArray(pageContent.cities) ? pageContent.cities : [])
        .map(c => `        <li>${c}</li>`).join('\n');
      html = html.replace('<!-- #travel-cities -->', cities);
    }

    // Inject projects data object into project page
    if (page === 'project') {
      const obj = {};
      projects.forEach(p => { const { id, ...rest } = p; obj[id] = rest; });
      html = html.replace('<!-- #projects-data -->', JSON.stringify(obj));
    }

    // Inject data-theme on body for static pages
    const defaultThemes = { about: 'about', services: 'services' };
    const theme = pageContent.color_theme || defaultThemes[page] || 'default';
    if (theme !== 'default') {
      html = html.replace('<body>', `<body data-theme="${theme}">`);
    }

    fs.writeFileSync(`${page}.html`, html);
    console.log(`  → wrote ${page}.html`);
  });

  console.log('[build] done');
}

// ─── Entry ───────────────────────────────────────────────────────────────────

build().catch(e => { console.error(e); process.exit(1); });

if (WATCH) {
  const chokidar = require('chokidar');
  console.log('[watch] watching src/ and content/…');
  chokidar
    .watch(['src', 'content'], { ignoreInitial: true })
    .on('all', (event, file) => {
      console.log(`[watch] ${event}: ${file}`);
      build().catch(e => console.error('[build error]', e.message));
    });
}
