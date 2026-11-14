(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ============================================================
     SCROLL PROGRESS + HEADER + BACK TO TOP
     ============================================================ */
  (function () {
    var bar = document.getElementById('scrollBar');
    var header = document.getElementById('siteHeader');
    var toTop = document.getElementById('toTop');
    var lastY = -1, ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;
      if (y === lastY) { ticking = false; return; }
      lastY = y;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      if (bar) bar.style.width = pct + '%';
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (toTop) toTop.classList.toggle('is-visible', y > 480);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      });
    }
  })();

  /* ============================================================
     MOBILE NAV
     ============================================================ */
  (function () {
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    function closeMenu() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = 'Menu <span aria-hidden="true">+</span>';
    }

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      toggle.innerHTML = open ? 'Close <span aria-hidden="true">&times;</span>' : 'Menu <span aria-hidden="true">+</span>';
    });

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });
  })();

  /* ============================================================
     PRINT
     ============================================================ */
  (function () {
    var btn = document.getElementById('printPolicy');
    if (!btn) return;
    btn.addEventListener('click', function () {
      window.print();
    });
  })();

  /* ============================================================
     TOC SCROLL SPY
     ============================================================ */
  (function () {
    var toc = document.getElementById('legalToc');
    if (!toc || !('IntersectionObserver' in window)) return;

    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (id) map[id] = a;
    });

    var sections = Object.keys(map)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (!sections.length) return;

    function activate(id) {
      links.forEach(function (a) { a.classList.remove('is-active'); });
      var a = map[id];
      if (a) {
        a.classList.add('is-active');
        /* Keep active chip visible in the horizontal mobile TOC */
        if (window.innerWidth <= 1024 && toc.scrollWidth > toc.clientWidth) {
          var parent = a.parentElement;
          if (parent) {
            var left = parent.offsetLeft - 12;
            if (Math.abs(toc.scrollLeft - left) > 40) {
              toc.scrollTo({ left: left, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
            }
          }
        }
      }
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) activate(entry.target.id);
      });
    }, { rootMargin: '-20% 0px -68% 0px', threshold: 0 });

    sections.forEach(function (s) { io.observe(s); });

    /* Fallback: pick the top-most visible section on short pages */
    window.addEventListener('scroll', function () {
      var bestId = null;
      var bestTop = Infinity;
      var offset = 120;
      sections.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.top <= offset && r.top < bestTop) {
          bestTop = r.top;
          bestId = s.id;
        }
      });
      if (!bestId && sections.length) {
        bestId = sections[0].id;
      }
      if (bestId) activate(bestId);
    }, { passive: true });
  })();

})();