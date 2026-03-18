// Active nav link
(function () {
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
})();

// Custom cursor
(function () {
  var cursor = document.getElementById('cursor');
  if (!cursor) return;
  document.addEventListener('mousemove', function (e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest('a, button, .project-card, .nav-brand'))
      cursor.classList.add('large');
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest('a, button, .project-card, .nav-brand'))
      cursor.classList.remove('large');
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
    setTimeout(function () { window.location.href = href; }, 250);
  });
})();
