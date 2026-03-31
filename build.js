#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const { marked } = require('marked');

const WATCH = process.argv.includes('--watch');

// URL-encode each path segment (handles spaces/special chars in filenames)
function encodeSrc(p) {
  return p.split('/').map(s => encodeURIComponent(s)).join('/');
}

// ─── Category → filter key mapping ───────────────────────────────────────────

const CAT_TO_FILTER = {
  'Brand Work':       'brand',
  'Editorial':        'editorial',
  'Content Creation': 'content',
  'Personal':         'personal',
};

// ─── Frontmatter parser ──────────────────────────────────────────────────────
// Handles flat key: value pairs and simple YAML arrays (key: / - item)

function parseFrontmatter(text) {
  const fm = {};
  let body = text;
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) {
    const lines = m[1].split('\n');
    let arrayKey = null;
    let blockKey = null;
    let blockLines = [];
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
        const item = line.match(/^\s+-\s+(.*)$/);
        if (item) {
          const v = item[1].trim();
          // Handle "key: value" object-style list items — extract just the value
          const kv2 = v.match(/^\w+:\s*(.+)$/);
          fm[arrayKey].push(kv2 ? kv2[1].trim() : v);
          continue;
        }
        arrayKey = null; // end of array — fall through to check for new key
      }
      // Detect block scalar: key: | or key: |- or key: |+
      const kb = line.match(/^(\w+):\s*\|[-+]?\s*$/);
      if (kb) { blockKey = kb[1]; blockLines = []; continue; }
      const ka = line.match(/^(\w+):\s*$/);
      if (ka) { arrayKey = ka[1]; fm[arrayKey] = []; continue; }
      const kv = line.match(/^(\w+):\s*(.+)$/);
      if (kv) {
        let val = kv[2].trim();
        if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
          val = val.slice(1, -1);
        }
        fm[kv[1].trim()] = val;
      }
    }
    // Flush any trailing block scalar
    if (blockKey !== null) fm[blockKey] = blockLines.join('\n').replace(/\n+$/, '');
    body = m[2];
  }
  return { fm, body };
}

// ─── Settings ────────────────────────────────────────────────────────────────

function loadSettings() {
  const text = fs.readFileSync('content/settings.md', 'utf8');
  const { fm } = parseFrontmatter(text);
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
    '_head.html':   fs.readFileSync('src/partials/_head.html',   'utf8'),
    '_nav.html':    fs.readFileSync('src/partials/_nav.html',    'utf8'),
    '_footer.html': fs.readFileSync('src/partials/_footer.html', 'utf8'),
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
          title:        fm.title        || id,
          client:       fm.client       || '',
          cat:          fm.cat          || '',
          filter:       fm.filter || CAT_TO_FILTER[fm.cat] || 'personal',
          photographer: fm.photographer || '',
          director:     fm.director     || '',
          bts:          fm.bts          || '',
          date:         fm.date         || '',
          order:        fm.order        != null ? parseInt(fm.order,    10) : null,
          orderAll:     fm.order_all    != null ? parseInt(fm.order_all, 10) : null,
          description:  fm.description  || '',
          credits:      fm.credits      || '',
          destination:  fm.destination  || '',
          skills:       typeof fm.skills === 'string'
                          ? fm.skills.split(',').map(s => s.trim()).filter(Boolean)
                          : (Array.isArray(fm.skills) ? fm.skills : []),
          thumbnail:    fm.thumbnail    || '',
          cardImage:    { ratio: fm.card_ratio || 'r-4-3', placeholder: fm.card_placeholder || '' },
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
      // Filter to strings only — placeholder objects like { r: 'r-4-3' } are not real paths
      const stringMedia = Array.isArray(meta.media) ? meta.media.filter(x => typeof x === 'string') : [];
      const fmMedia = stringMedia.length > 0 ? stringMedia : null;
      const folderMedia = fmMedia ? [] : fs.readdirSync(path.join(dir, id))
        .filter(f => /\.(jpe?g|png|webp|gif|avif|mp4)$/i.test(f))
        .sort();
      const resolvedImages = fmMedia
        ? fmMedia.map(src => path.isAbsolute(src) ? src.replace(/^\//, '') : `${baseUrl}${src}`)
        : folderMedia.map(f => `${baseUrl}${f}`);

      // Card thumbnail: explicit thumbnail field > first image
      if (meta.thumbnail) {
        meta.cardImage.src = meta.thumbnail.startsWith('/') ? meta.thumbnail.replace(/^\//, '') : `${baseUrl}${meta.thumbnail}`;
      } else if (resolvedImages.length > 0) {
        meta.cardImage.src = resolvedImages[0];
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
            .map(src => /\.mp4$/i.test(src)
              ? `<video src="${encodeSrc(src)}" autoplay loop muted playsinline></video>`
              : `<img src="${encodeSrc(src)}" alt="">`)
            .join('\n');
        } else {
          imgsHtml = null;
        }

        contentHtml = { desc: descHtml, images: imgsHtml };
      }

      return { id, ...meta, contentHtml };
    });
}

// ─── Card HTML ───────────────────────────────────────────────────────────────

function renderCard(p) {
  const pub   = p.client || p.cat;
  const pills = p.skills.map(s => `<span class="pill">${s}</span>`).join('');
  const cs    = p.comingSoon ? '<span class="cs-badge">Coming Soon</span>' : '';
  const r     = (p.cardImage && p.cardImage.ratio || 'r-4-3').replace(/^r-(\d+)-(\d+)$/, 'ratio-$1x$2');
  const ph    = p.cardImage && p.cardImage.placeholder || '';
  const src   = p.cardImage && p.cardImage.src;
  const inner = src
    ? `<img src="${encodeSrc(src)}" alt="${p.title}">`
    : `<div class="thumb-ph">${ph}</div>`;
  const orderAttr    = p.order    != null ? ` data-order="${p.order}"`         : '';
  const orderAllAttr = p.orderAll != null ? ` data-order-all="${p.orderAll}"` : '';
  return (
    `    <a class="project-card" data-category="${p.filter}"${orderAttr}${orderAllAttr} data-title="${p.title.replace(/"/g, '&quot;')}" href="project.html#?id=${p.id}&filter=${p.filter}">\n` +
    `      <div class="thumb ${r}">${inner}</div>\n` +
    `      <div class="card-info">${cs}<p class="card-title">${p.title}</p>` +
    `<p class="card-subtitle">${pub}</p>` +
    `<div class="pills">${pills}</div></div>\n` +
    `    </a>`
  );
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

const FILTER_ORDER = ['brand', 'editorial', 'content', 'personal'];

function renderFilterBar(projects) {
  const map = {};
  projects.forEach(p => { if (p.filter && !map[p.filter]) map[p.filter] = p.cat; });
  const filters = FILTER_ORDER
    .filter(f => map[f])
    .map(f => ({ filter: f, label: map[f] }));
  const btns = filters
    .map(f => `    <button class="filter-btn" data-filter="${f.filter}" data-scheme="${f.filter}">${f.label}</button>`)
    .join('\n');
  return `    <button class="filter-btn active" data-filter="all" data-scheme="all">All</button>\n${btns}`;
}

// ─── Build ───────────────────────────────────────────────────────────────────

function build() {
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

  const pages = ['index', 'about', 'project', 'travel'];
  pages.forEach(page => {
    let html = fs.readFileSync(`src/${page}.html`, 'utf8');

    // Resolve partials
    html = applyIncludes(html, partials);

    // Merge page-specific content into settings, then apply tokens
    const pageContentMap = { index: 'home', about: 'about', travel: 'travel' };
    const pageContent = pageContentMap[page] ? loadPageContent(pageContentMap[page]) : {};
    const pageSettings = { ...settings, ...pageContent };
    html = applySettings(html, pageSettings);

    // Auto-generate filter bar and inject project cards
    if (page === 'index') {
      const sorted = projects.slice().sort((a, b) => {
        const av = a.orderAll != null ? a.orderAll : Infinity;
        const bv = b.orderAll != null ? b.orderAll : Infinity;
        return av !== bv ? av - bv : a.title.localeCompare(b.title);
      });
      html = html.replace('<!-- #filter-bar -->',    renderFilterBar(sorted));
      html = html.replace('<!-- #projects-cards -->', sorted.map(renderCard).join('\n'));
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
    if (page === 'travel') {
      const approach = (pageContent.approach || '').split(/\n\n+/).filter(Boolean)
        .map(p => `      <p class="bio-para">${p.replace(/\n/g, ' ')}</p>`).join('\n');
      html = html.replace('<!-- #travel-approach -->', approach);

      const services = (Array.isArray(pageContent.services) ? pageContent.services : [])
        .map(s => `        <span>${s}</span>`).join('\n');
      html = html.replace('<!-- #travel-services -->', services);

      const clients = (Array.isArray(pageContent.clients) ? pageContent.clients : [])
        .map(c => `      <p class="services-text">${c}</p>`).join('\n');
      html = html.replace('<!-- #travel-clients -->', clients);

      const cities = (Array.isArray(pageContent.cities) ? pageContent.cities : [])
        .map(c => `        <span>${c}</span>`).join('\n');
      html = html.replace('<!-- #travel-cities -->', cities);
    }

    // Inject projects data object into project page
    if (page === 'project') {
      const obj = {};
      projects.forEach(p => { const { id, ...rest } = p; obj[id] = rest; });
      html = html.replace('<!-- #projects-data -->', JSON.stringify(obj));
    }

    fs.writeFileSync(`${page}.html`, html);
    console.log(`  → wrote ${page}.html`);
  });

  console.log('[build] done');
}

// ─── Entry ───────────────────────────────────────────────────────────────────

build();

if (WATCH) {
  const chokidar = require('chokidar');
  console.log('[watch] watching src/ and content/…');
  chokidar
    .watch(['src', 'content'], { ignoreInitial: true })
    .on('all', (event, file) => {
      console.log(`[watch] ${event}: ${file}`);
      try { build(); } catch (e) { console.error('[build error]', e.message); }
    });
}
