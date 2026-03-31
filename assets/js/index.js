var GAP_VAL   = '5rem';
var STAGGER_2 = '9rem';

var allCards = Array.from(document.querySelectorAll('.project-card'));
var grid     = document.getElementById('grid');

function sortedCards(filter) {
  var key = filter === 'all' ? 'orderAll' : 'order';
  return allCards.slice().sort(function (a, b) {
    var av = a.dataset[key] !== undefined ? parseInt(a.dataset[key], 10) : Infinity;
    var bv = b.dataset[key] !== undefined ? parseInt(b.dataset[key], 10) : Infinity;
    if (av !== bv) return av - bv;
    return (a.dataset.title || '').localeCompare(b.dataset.title || '');
  });
}

function applyStagger(visibleCards) {
  visibleCards.forEach(function (el, i) {
    el.style.marginBottom = GAP_VAL;
    el.style.marginTop    = (i % 2 === 1) ? STAGGER_2 : '0px';
  });
}

function applyFilter(f, animate) {
  document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
  var btn = document.querySelector('.filter-btn[data-filter="' + f + '"]');
  if (btn) {
    btn.classList.add('active');
    document.body.dataset.scheme = btn.dataset.scheme || f;
  }

  var ordered = sortedCards(f);
  ordered.forEach(function (el) { grid.appendChild(el); });

  if (!animate) {
    ordered.forEach(function (el) {
      var match = f === 'all' || el.dataset.category === f;
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
        var match = f === 'all' || el.dataset.category === f;
        match ? el.classList.remove('hidden') : el.classList.add('hidden');
        el.style.marginTop = '';
      });
      var visible = ordered.filter(function (el) { return !el.classList.contains('hidden'); });
      applyStagger(visible);
      visible.forEach(function (el, i) { setTimeout(function () { el.classList.add('visible'); }, i * 60); });
    }, 270);
  }
}

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
