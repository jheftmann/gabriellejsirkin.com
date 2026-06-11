// Active nav link
(function () {
  var pathname = location.pathname;
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    var match = href === pathname ||
      (href === '/' && (pathname === '/' || pathname === '/index.html'));
    if (match) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); a.removeAttribute('href'); }
  });
})();

// Page exit transition
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('http') === 0 || a.target === '_blank') return;
    e.preventDefault();
    document.body.style.transition = 'opacity 0.25s ease';
    document.body.style.opacity = '0';
    setTimeout(function () { window.location.href = a.href; }, 250);
  });

  // When the browser restores a page from bfcache (back/forward button),
  // body.style.opacity is still '0' from the exit fade — reset it so the
  // page is visible (#102).
  window.addEventListener('pageshow', function () {
    document.body.style.opacity = '';
    document.body.style.transition = '';
  });
})();
