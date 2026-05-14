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

  if (!p) { document.getElementById('pTitle').textContent = 'Project not found'; return; }

  if (p.colorTheme && p.colorTheme !== 'default') document.body.dataset.theme = p.colorTheme;

  document.title = (p.client ? p.client + ' / ' + p.title : p.title) + ' — Gabrielle J. Sirkin, Creative Studio for Travel';

  // Header: client above title
  var clientEl = document.getElementById('pClient');
  var titleEl  = document.getElementById('pTitle');
  if (p.client) {
    clientEl.textContent = p.client;
  } else {
    clientEl.style.display = 'none';
  }
  titleEl.textContent = p.title || '';

  // Credits row
  var credits = '';
  var cat = p.cat;

  if (cat === 'Brand Work' || cat === 'Editorial') {
    if (p.client)       credits += creditField('Client',       p.client);
    if (p.photographer) credits += creditField('Photographer', p.photographer);
    if (p.director)     credits += creditField('Director',     p.director);
    if (p.bts)          credits += creditField('BTS',          p.bts);
    if (p.date)         credits += creditField('Year',         p.date);
  } else if (cat === 'Personal' || cat === 'Curation') {
    if (p.photographer) credits += creditField('Photographer', p.photographer);
    if (p.director)     credits += creditField('Director',     p.director);
    if (p.date)         credits += creditField('Year',         p.date);
  } else if (cat === 'Content Creation') {
    if (p.destination)  credits += creditField('Destination',  p.destination);
    if (p.date)         credits += creditField('Year',         p.date);
  }

  if (p.skills && p.skills.length) {
    credits += creditTags('Services', p.skills);
  }

  if (p.credits) {
    credits += creditField('Credits', p.credits);
  }

  document.getElementById('pCredits').innerHTML = credits;

  // Description — prefer markdown body, fall back to description frontmatter field
  var descText = (p.contentHtml && p.contentHtml.desc) || (p.description ? '<p>' + p.description.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>' : null);
  if (descText) {
    var descEl = document.getElementById('pDesc');
    descEl.innerHTML = descText;
    descEl.style.display = '';
  }

  // Images
  if (p.contentHtml && p.contentHtml.images) {
    document.getElementById('pImages').innerHTML = p.contentHtml.images;
  } else {
    renderPlaceholders(p);
  }
})();

function creditField(label, value) {
  return '<div class="credit-item">'
    + '<dt class="credit-label">' + label + '</dt>'
    + '<dd class="credit-value">' + value + '</dd>'
    + '</div>';
}

function creditTags(label, values) {
  var tags = values.map(function (s, i) {
    return '<span class="credit-value">' + s + (i < values.length - 1 ? ',' : '') + '</span>';
  }).join(' ');
  return '<div class="credit-item">'
    + '<dt class="credit-label">' + label + '</dt>'
    + '<dd class="credit-tags">' + tags + '</dd>'
    + '</div>';
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
