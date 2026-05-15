var allCards = Array.from(document.querySelectorAll('.project-card'));
var grid     = document.getElementById('grid');

function isMobile() {
  return window.matchMedia('(max-width: 767px)').matches;
}

function getStagger() {
  return isMobile()
    ? { gap: '3.875rem', offset: '1.5rem' }
    : { gap: '5rem',     offset: '9rem'   };
}

function sortedCards(filter) {
  // Cards carry one data-order-<slug>="N" attribute per category they're in,
  // plus data-order-all="N" for the All tab. Use getAttribute (not dataset)
  // because attribute names contain hyphens, which dataset camelCases.
  var attr = filter === 'all' ? 'data-order-all' : 'data-order-' + filter;
  return allCards.slice().sort(function (a, b) {
    var av = a.getAttribute(attr); av = av != null ? parseFloat(av) : Infinity;
    var bv = b.getAttribute(attr); bv = bv != null ? parseFloat(bv) : Infinity;
    if (av !== bv) return av - bv;
    return (a.dataset.title || '').localeCompare(b.dataset.title || '');
  });
}

function applyStagger(visibleCards) {
  var s = getStagger();
  visibleCards.forEach(function (el, i) {
    el.style.marginBottom = s.gap;
    el.style.marginTop    = (i % 2 === 1) ? s.offset : '0px';
  });
}

function applyFilter(f, animate) {
  document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
  var btn = document.querySelector('.filter-btn[data-filter="' + f + '"]');
  if (btn) {
    btn.classList.add('active');
  }

  // Sync mobile select
  var sel = document.getElementById('filterSelect');
  if (sel) sel.value = f;

  var ordered = sortedCards(f);
  ordered.forEach(function (el) { grid.appendChild(el); });

  if (!animate) {
    ordered.forEach(function (el) {
      var match = f === 'all' || el.dataset.category.split(' ').includes(f);
      match ? el.classList.remove('hidden') : el.classList.add('hidden');
      el.style.marginTop = '';
    });
    var visible = ordered.filter(function (el) { return !el.classList.contains('hidden'); });
    applyStagger(visible);
    requestAnimationFrame(function () {
      visible.forEach(function (el, i) { setTimeout(function () { el.classList.add('visible'); }, i * 52); });
    });
  } else {
    allCards.forEach(function (el) { el.classList.remove('visible'); });
    setTimeout(function () {
      ordered.forEach(function (el) {
        var match = f === 'all' || el.dataset.category.split(' ').includes(f);
        match ? el.classList.remove('hidden') : el.classList.add('hidden');
        el.style.marginTop = '';
      });
      var visible = ordered.filter(function (el) { return !el.classList.contains('hidden'); });
      applyStagger(visible);
      visible.forEach(function (el, i) { setTimeout(function () { el.classList.add('visible'); }, i * 60); });
    }, 270);
  }
}

// Populate mobile select from filter buttons
(function () {
  var sel = document.getElementById('filterSelect');
  if (!sel) return;
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    var opt = document.createElement('option');
    opt.value = btn.dataset.filter || 'all';
    opt.textContent = btn.dataset.filter === 'all' ? 'All Categories' : btn.textContent.trim();
    sel.appendChild(opt);
  });
  sel.addEventListener('change', function () {
    applyFilter(this.value, true);
  });
})();

// Restore filter from URL on load
(function () {
  var search = window.location.search;
  if (!search && window.location.hash && window.location.hash.indexOf('?') !== -1) {
    search = window.location.hash.substring(window.location.hash.indexOf('?'));
  }
  applyFilter(new URLSearchParams(search).get('filter') || 'all', false);
})();

document.getElementById('filterBar').addEventListener('click', function (e) {
  var btn = e.target.closest('.filter-btn');
  if (!btn) return;
  applyFilter(btn.dataset.filter || 'all', true);
});

// Image loading state: show dominant color until image renders
document.querySelectorAll('.thumb img').forEach(function (img) {
  if (img.complete && img.naturalWidth > 0) return;
  img.classList.add('loading');
  img.addEventListener('load', function () { img.classList.remove('loading'); }, { once: true });
});
