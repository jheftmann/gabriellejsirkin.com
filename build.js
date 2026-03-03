#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const { marked } = require('marked');

const WATCH = process.argv.includes('--watch');

// ─── Frontmatter parser ──────────────────────────────────────────────────────
// Handles flat key: value pairs and simple YAML arrays (key: / - item)

function parseFrontmatter(text) {
  const fm = {};
  let body = text;
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) {
    const lines = m[1].split('\n');
    let arrayKey = null;
    for (const line of lines) {
      if (arrayKey !== null) {
        const item = line.match(/^\s+-\s+(.*)$/);
        if (item) { fm[arrayKey].push(item[1].trim()); continue; }
        arrayKey = null; // end of array — fall through to check for new key
      }
      const ka = line.match(/^(\w+):\s*$/);
      if (ka) { arrayKey = ka[1]; fm[arrayKey] = []; continue; }
      const kv = line.match(/^(\w+):\s*(.+)$/);
      if (kv) fm[kv[1].trim()] = kv[2].trim();
    }
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
          filter:       fm.filter       || 'personal',
          photographer: fm.photographer || '',
          date:         fm.date         || '',
          description:  fm.description  || '',
          destination:  fm.destination  || '',
          skills:       typeof fm.skills === 'string'
                          ? fm.skills.split(',').map(s => s.trim()).filter(Boolean)
                          : (Array.isArray(fm.skills) ? fm.skills : []),
          cardImage:    { ratio: fm.card_ratio || 'r-4-3', placeholder: fm.card_placeholder || '' },
          comingSoon:   fm.coming_soon === 'true',
          images:       fm.placeholder_count
                          ? Array.from({ length: parseInt(fm.placeholder_count) }, () => ({ r: 'r-4-3' }))
                          : [],
        };
      } else {
        meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      }

      const baseUrl = `content/projects/${id}/`;

      // Auto-discover image files in the project folder
      const folderImages = fs.readdirSync(path.join(dir, id))
        .filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f))
        .sort();

      // Use first image as card thumbnail if available
      if (folderImages.length > 0) {
        meta.cardImage.src = `${baseUrl}${folderImages[0]}`;
      }

      let contentHtml = null;
      if (bodyText.trim() || folderImages.length > 0) {
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
        } else if (folderImages.length > 0) {
          // Auto-discovered images from the project folder
          imgsHtml = folderImages
            .map(f => `<img src="${baseUrl}${f}" alt="">`)
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
  const tags  = p.skills.map(s => `<span class="tag">${s}</span>`).join('');
  const cs    = p.comingSoon ? '<span class="cs-badge">Coming Soon</span>' : '';
  const r     = p.cardImage && p.cardImage.ratio       || 'r-4-3';
  const ph    = p.cardImage && p.cardImage.placeholder || '';
  const src   = p.cardImage && p.cardImage.src;
  const inner = src
    ? `<img src="${src}" class="card-img-photo" alt="${p.title}">`
    : `<div class="card-ph">${ph}</div>`;
  return (
    `    <a class="card" data-cat="${p.filter}" href="project.html#?id=${p.id}&filter=${p.filter}">\n` +
    `      <div class="card-img ${r}">${inner}</div>\n` +
    `      <div class="card-caption">${cs}<span class="card-pub">${pub}</span>` +
    `<p class="card-name">${p.title}</p>` +
    `<div class="tags">${tags}</div></div>\n` +
    `    </a>`
  );
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

function renderFilterBar(projects) {
  const seen    = new Set();
  const filters = [];
  projects.forEach(p => {
    if (p.filter && !seen.has(p.filter)) {
      seen.add(p.filter);
      filters.push({ filter: p.filter, label: p.cat });
    }
  });
  const btns = filters
    .map(f => `    <button class="fbtn" id="f-${f.filter}">${f.label}</button>`)
    .join('\n');
  return `    <button class="fbtn on" id="f-all">All</button>\n${btns}`;
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

  const pages = ['index', 'about', 'productions', 'project'];
  pages.forEach(page => {
    let html = fs.readFileSync(`src/${page}.html`, 'utf8');

    // Resolve partials
    html = applyIncludes(html, partials);

    // Merge page-specific content into settings, then apply tokens
    const pageSettings = page === 'index'
      ? { ...settings, ...loadPageContent('home') }
      : settings;
    html = applySettings(html, pageSettings);

    // Auto-generate filter bar and inject project cards
    if (page === 'index') {
      html = html.replace('<!-- #filter-bar -->',    renderFilterBar(projects));
      html = html.replace('<!-- #projects-cards -->', projects.map(renderCard).join('\n'));
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
