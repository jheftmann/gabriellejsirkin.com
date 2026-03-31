// `projects` is injected at build time by build.js

function getParams() {
  var search = window.location.search;
  if (!search && window.location.hash && window.location.hash.indexOf('?') !== -1) {
    search = window.location.hash.substring(window.location.hash.indexOf('?'));
  }
  return new URLSearchParams(search);
}

(function () {
  var params = getParams();
  var id     = params.get('id');
  var filter = params.get('filter') || 'all';
  var p      = projects[id];

  var backUrl = 'index.html' + (filter !== 'all' ? '#?filter=' + filter : '');
  document.getElementById('backLink').href = backUrl;

  if (!p) { document.getElementById('pTitle').textContent = 'Project not found'; return; }

  // Apply color scheme from project filter
  if (p.filter) document.body.dataset.scheme = p.filter;

  document.title = p.title + ' — Gabrielle J. Sirkin';
  document.getElementById('pCat').textContent = p.cat;
  document.getElementById('pTitle').textContent = (p.client ? p.client + ' — ' : '') + p.title;

  // Meta credits
  var meta = '';
  var cat = p.cat;
  if (cat === 'Brand Work' || cat === 'Editorial') {
    if (p.description)  meta += fieldDesc(p.description);
    if (p.client)       meta += field('Client',       p.client);
    if (p.photographer) meta += field('Photographer', p.photographer);
    if (p.director)     meta += field('Director',     p.director);
    if (p.bts)          meta += field('BTS',          p.bts);
    if (p.date)         meta += field('Year',         p.date);
    if (p.credits)      meta += fieldCredits(p.credits);
  } else if (cat === 'Personal' || cat === 'Curation') {
    if (p.description)  meta += fieldDesc(p.description);
    if (p.photographer) meta += field('Photographer', p.photographer);
    if (p.director)     meta += field('Director',     p.director);
    if (p.bts)          meta += field('BTS',          p.bts);
    if (p.date)         meta += field('Year',         p.date);
    if (p.credits)      meta += fieldCredits(p.credits);
  } else if (cat === 'Content Creation') {
    if (p.description)  meta += fieldDesc(p.description);
    if (p.destination)  meta += field('Destination',  p.destination);
    if (p.credits)      meta += fieldCredits(p.credits);
  }
  meta += '<div class="meta-group"><p class="meta-label">Areas of Expertise</p><div class="pills">' +
    p.skills.map(function (s) { return '<span class="pill">' + s + '</span>'; }).join('') +
    '</div></div>';
  document.getElementById('pMeta').innerHTML = meta;

  // Content (pre-rendered at build time — works as file:// with no server needed)
  if (p.contentHtml) {
    if (p.contentHtml.desc) {
      var descEl = document.getElementById('pDesc');
      descEl.innerHTML = p.contentHtml.desc;
      descEl.style.display = '';
    }
    document.getElementById('pImages').innerHTML = p.contentHtml.images || '';
    if (!p.contentHtml.images) renderPlaceholders(p);
  } else {
    renderPlaceholders(p);
  }
})();

function field(label, value) {
  return '<div class="meta-group"><p class="meta-label">' + label + '</p><p class="meta-value">' + value + '</p></div>';
}

function fieldDesc(value) {
  return '<p class="meta-desc">' + value + '</p>';
}

function fieldCredits(value) {
  return '<p class="meta-credits">' + value + '</p>';
}

function renderPlaceholders(p) {
  var images = p.images || [];
  var html = '';
  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    html += '<div class="proj-img ' + img.r + (img.span ? ' span2' : '') + '">Image ' + (i + 1) + '</div>';
  }
  document.getElementById('pImages').innerHTML = html;
}
