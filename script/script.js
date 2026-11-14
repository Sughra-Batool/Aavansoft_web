/* ============================================================================
   AAVANSOFT — script.js
   Sections:
     1. Boot (class hooks, scroll restoration)
     2. Scroll progress
     3. Mobile nav
     4. Reveal choreography (site-wide) + THEORITHM [data-reveal] scoped
     5. Data Stacks interactive accordion + ring
     6. Technology Pack hover sync
     7. Nav active state
     8. Parallax backgrounds
     9. Hero 3D (Three.js, lazy)
    10. Contact box spotlight
    11. Clean-URL router (pushState + popstate + deep-link on load)
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isFine = window.matchMedia('(pointer: fine)').matches;

  document.documentElement.classList.add('js');

  /* ==========================================================================
     1. BOOT — scroll restoration policy
     - Preserve the URL path on refresh (do not force redirect to /home).
     - But scroll to top on a fresh load with no path, so the hero is visible.
     ========================================================================== */
  (function () {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/' || path === '') {
      window.scrollTo(0, 0);
    }
  })();

  /* ==========================================================================
     2. SCROLL PROGRESS + HEADER STATE
     ========================================================================== */
  (function () {
    var bar = document.getElementById('scrollBar');
    var header = document.getElementById('siteHeader');
    var lastY = -1, ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset;
      if (y === lastY) { ticking = false; return; }
      lastY = y;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      if (bar) bar.style.width = pct + '%';
      if (header) header.classList.toggle('is-scrolled', y > 8);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ==========================================================================
     3. MOBILE NAV
     ========================================================================== */
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
      toggle.innerHTML = open
        ? 'Close <span aria-hidden="true">&times;</span>'
        : 'Menu <span aria-hidden="true">+</span>';
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

    /* ==========================================================================
     4a. REVEAL CHOREOGRAPHY — AAVANSOFT sections
     ========================================================================== */
  (function () {
    var revealItems = document.querySelectorAll('.reveal');
    var dataInt = document.querySelector('.data-interactive');
    var tower = document.getElementById('techTower');

    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      revealItems.forEach(function (el) { el.classList.add('in'); });
      document.querySelectorAll('.section').forEach(function (s) { s.classList.add('is-visible'); });
      if (dataInt) dataInt.classList.add('in');
      if (tower) tower.classList.add('in');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(function (el) { io.observe(el); });

    if (dataInt) {
      var dataIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            dataIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      dataIO.observe(dataInt);
    }

    /* Technology Pack — #techTower now wraps the whole grid (bars + tag
       groups). Observe it once; .tech-layout.in reveals both columns via
       the .tech-layout.in .tech-bar / .tech-tags-group rules in CSS. */
    if (tower) {
      var techIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            techIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });
      techIO.observe(tower);
    }

    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.section').forEach(function (s) { sectionIO.observe(s); });
  })();

  /* ==========================================================================
     4b. THEORITHM — [data-reveal] choreography (scoped to .thrm only)
     Ported from thrm.js: ONLY the piece that the Intellitecture hero uses.
     The [data-reveal] attribute + .is-in class are driven by CSS keyframes.
     ========================================================================== */
  (function () {
    var root = document.querySelector('.thrm');
    if (!root) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var supportsIO = ('IntersectionObserver' in window);
    var revealEls = Array.prototype.slice.call(root.querySelectorAll('[data-reveal]'));

    if (reduce || !supportsIO) {
      revealEls.forEach(function (el) {
        el.classList.add('is-in');
        el.removeAttribute('data-reveal');
      });
      return;
    }

    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { revealIO.observe(el); });

    root.addEventListener('animationend', function (event) {
      if (event.animationName === 'thrm-rise') {
        event.target.removeAttribute('data-reveal');
      }
    });
  })();

  /* ==========================================================================
     5. DATA STACKS — accordion + ring
     ========================================================================== */
  (function () {
    var dataWrap = document.getElementById('dataInteractive');
    var numEl = document.getElementById('dataNum');
    var captionEl = document.getElementById('dataCaption');
    var progressEl = document.getElementById('dataProgress');
    var cards = document.querySelectorAll('.data-card');
    var dots = document.querySelectorAll('.ring-dot');
    if (!dataWrap || !cards.length) return;

    var titles = [
      'Data Strategy, Engineering & Infrastructure',
      'Data Governance, Quality & Security',
      'Data Analytics, Business Intelligence & Visualization',
      'Artificial Intelligence & Machine Learning',
      'Graph Intelligence, Knowledge Systems & Causal Analytics',
      'Scientific Computing, Simulation & Digital Twins',
      'Decision Intelligence, Optimization & Autonomous Systems',
      'Data Products, MLOps & Managed AI Operations'
    ];
    var total = cards.length;

    function setActive(index) {
      var padded = String(index + 1).padStart(2, '0');
      if (numEl && numEl.textContent !== padded) {
        numEl.textContent = padded;
        numEl.classList.remove('is-animating');
        void numEl.offsetWidth;
        numEl.classList.add('is-animating');
      }
      if (captionEl) captionEl.textContent = titles[index] || '';
      if (progressEl) progressEl.style.width = ((index + 1) / total * 100) + '%';
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
      });
    }

    function openCard(index) {
      cards.forEach(function (card, i) {
        var isTarget = i === index;
        card.classList.toggle('is-open', isTarget);
        var header = card.querySelector('.data-card__header');
        if (header) header.setAttribute('aria-expanded', String(isTarget));
      });
      setActive(index);
    }

    cards.forEach(function (card, i) {
      var header = card.querySelector('.data-card__header');
      if (!header) return;

      header.addEventListener('click', function () {
        var isOpen = card.classList.contains('is-open');
        if (isOpen) {
          card.classList.remove('is-open');
          header.setAttribute('aria-expanded', 'false');
          setActive(i);
        } else {
          openCard(i);
        }
      });

      card.addEventListener('mouseenter', function () { setActive(i); });
      card.addEventListener('focusin', function () { setActive(i); });
    });

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        openCard(i);
        var card = cards[i];
        if (card) {
          var rect = card.getBoundingClientRect();
          if (rect.top < 80 || rect.top > window.innerHeight - 120) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    });

    dataWrap.addEventListener('mouseleave', function () {
      var openIndex = 0;
      cards.forEach(function (c, i) {
        if (c.classList.contains('is-open')) openIndex = i;
      });
      setActive(openIndex);
    });

    setActive(0);
  })();

    /* ==========================================================================
     6. TECHNOLOGY PACK — hover / focus sync between bars and their tags group
     --------------------------------------------------------------------------
     Bars and tags groups are now siblings inside a single grid. They share a
     `data-layer` attribute. Any hover/focus on either side toggles `.is-active`
     on BOTH cells so the row highlights as a unit — matches the previous feel
     where the layer's accent appeared simultaneously on both sides.
     ========================================================================== */
  (function () {
    var bars   = document.querySelectorAll('.tech-bar');
    var groups = document.querySelectorAll('.tech-tags-group');
    if (!bars.length || !groups.length) return;

    var byLayer = {};
    bars.forEach(function (bar) {
      var key = bar.getAttribute('data-layer');
      if (!key) return;
      byLayer[key] = byLayer[key] || {};
      byLayer[key].bar = bar;
    });
    groups.forEach(function (group) {
      var key = group.getAttribute('data-layer');
      if (!key) return;
      byLayer[key] = byLayer[key] || {};
      byLayer[key].group = group;
    });

    function setActive(key, on) {
      var pair = byLayer[key];
      if (!pair) return;
      if (pair.bar)   pair.bar.classList.toggle('is-active', on);
      if (pair.group) pair.group.classList.toggle('is-active', on);
    }

    Object.keys(byLayer).forEach(function (key) {
      var pair = byLayer[key];
      var bar = pair.bar;
      var group = pair.group;

      if (bar) {
        bar.addEventListener('mouseenter', function () { setActive(key, true);  });
        bar.addEventListener('mouseleave', function () { setActive(key, false); });
        bar.addEventListener('focusin',    function () { setActive(key, true);  });
        bar.addEventListener('focusout',   function () { setActive(key, false); });
      }

      if (group) {
        group.addEventListener('mouseenter', function () { setActive(key, true);  });
        group.addEventListener('mouseleave', function () { setActive(key, false); });
        group.addEventListener('focusin',    function () { setActive(key, true);  });
        group.addEventListener('focusout',   function () { setActive(key, false); });
      }
    });
  })();
  /* ==========================================================================
     7. NAV ACTIVE STATE
     ========================================================================== */
  (function () {
    var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!navLinks.length || !('IntersectionObserver' in window)) return;
    var map = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (id) map[id] = a;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); });
          var a = map[entry.target.id];
          if (a) a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  })();

  /* ==========================================================================
     8. PARALLAX BACKGROUNDS
     ========================================================================== */
  (function () {
    if (reduceMotion.matches) return;
    var parallaxEls = document.querySelectorAll('[data-parallax]');
    if (!parallaxEls.length) return;
    var rafId = null;

    function update() {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var offset = (center - vh / 2) / vh;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.03;
        el.style.transform = 'translate3d(0,' + (offset * speed * 1000).toFixed(1) + 'px,0)';
      });
      rafId = null;
    }

    window.addEventListener('scroll', function () {
      if (!rafId) rafId = requestAnimationFrame(update);
    }, { passive: true });
    update();
  })();

  /* ==========================================================================
     9. HERO 3D — Three.js (lazy module import)
     ========================================================================== */
  (function () {
    var canvas = document.getElementById('hero-3d');
    var fallback = document.querySelector('.hero-visual-fallback');
    if (!canvas) return;

    if (reduceMotion.matches) {
      canvas.style.display = 'none';
      if (fallback) fallback.style.display = 'block';
      return;
    }

    import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js')
      .then(function (THREE) {
        try {
          var container = canvas.parentElement;
          var scene = new THREE.Scene();
          var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
          camera.position.set(0, 0, 6.6);

          var renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'low-power'
          });
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

          var group = new THREE.Group();
          scene.add(group);

          var ico = new THREE.IcosahedronGeometry(1.72, 1);
          var wire = new THREE.LineSegments(
            new THREE.WireframeGeometry(ico),
            new THREE.LineBasicMaterial({ color: 0x202020, transparent: true, opacity: 0.16 })
          );
          group.add(wire);

          var wire2 = new THREE.LineSegments(
            new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.5, 0)),
            new THREE.LineBasicMaterial({ color: 0x202020, transparent: true, opacity: 0.08 })
          );
          group.add(wire2);

          var src = ico.attributes.position;
          var colors = new Float32Array(src.count * 3);
          for (var i = 0; i < src.count; i++) {
            var isRed = Math.random() < 0.1;
            colors[i * 3]     = isRed ? 0.957 : 0.125;
            colors[i * 3 + 1] = isRed ? 0.102 : 0.125;
            colors[i * 3 + 2] = isRed ? 0.102 : 0.125;
          }
          var pointGeo = new THREE.BufferGeometry();
          pointGeo.setAttribute('position', src);
          pointGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          var points = new THREE.Points(
            pointGeo,
            new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.95, sizeAttenuation: true })
          );
          group.add(points);

          var ringCount = 200;
          var ringGeo = new THREE.BufferGeometry();
          var ringPos = new Float32Array(ringCount * 3);
          var ringColors = new Float32Array(ringCount * 3);
          for (var j = 0; j < ringCount; j++) {
            var angle = (j / ringCount) * Math.PI * 2;
            var radius = 2.7 + (Math.random() - 0.5) * 0.35;
            ringPos[j * 3] = Math.cos(angle) * radius;
            ringPos[j * 3 + 1] = (Math.random() - 0.5) * 0.35;
            ringPos[j * 3 + 2] = Math.sin(angle) * radius;
            var red = Math.random() < 0.12;
            ringColors[j * 3]     = red ? 0.957 : 0.125;
            ringColors[j * 3 + 1] = red ? 0.102 : 0.125;
            ringColors[j * 3 + 2] = red ? 0.102 : 0.125;
          }
          ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
          ringGeo.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));
          var ring = new THREE.Points(
            ringGeo,
            new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true })
          );
          group.add(ring);

          var mx = 0, my = 0, tmx = 0, tmy = 0;
          document.addEventListener('pointermove', function (e) {
            var r = container.getBoundingClientRect();
            tmx = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
            tmy = ((e.clientY - r.top) / r.height - 0.5) * 0.6;
          }, { passive: true });

          function resize() {
            var w = container.clientWidth || 1;
            var h = container.clientHeight || 1;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
          }
          resize();
          if ('ResizeObserver' in window) {
            new ResizeObserver(resize).observe(container);
          } else {
            window.addEventListener('resize', resize);
          }

          var clock = new THREE.Clock();
          var rafId = null;
          var visible = true;

          function renderFrame() {
            var t = clock.getElapsedTime();
            mx += (tmx - mx) * 0.05;
            my += (tmy - my) * 0.05;

            group.rotation.y = t * 0.18 + mx * 0.6;
            group.rotation.x = Math.sin(t * 0.28) * 0.16 + my * 0.4;
            wire.rotation.y = t * -0.12;
            wire2.rotation.z = t * 0.07;
            ring.rotation.y = t * -0.05;
            ring.rotation.x = Math.sin(t * 0.4) * 0.15;
            camera.position.x = mx * 0.4;
            camera.position.y = -my * 0.4;
            camera.lookAt(0, 0, 0);
            renderer.render(scene, camera);
          }

          function loop() {
            rafId = requestAnimationFrame(loop);
            renderFrame();
          }
          function start() {
            if (rafId === null) { clock.start(); loop(); }
          }
          function stop() {
            if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
          }

          if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
              visible = entries[0].isIntersecting;
              if (visible && !document.hidden) start(); else stop();
            }, { threshold: 0 }).observe(canvas);
          }

          document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop(); else if (visible) start();
          });

          renderFrame();
          start();
        } catch (err) {
          canvas.style.display = 'none';
          if (fallback) fallback.style.display = 'block';
        }
      })
      .catch(function () {
        canvas.style.display = 'none';
        if (fallback) fallback.style.display = 'block';
      });
  })();

  /* ==========================================================================
     10. CONTACT BOX SPOTLIGHT
     ========================================================================== */
  (function () {
    var box = document.getElementById('contactBox');
    if (!box || !isFine) return;
    box.addEventListener('pointermove', function (e) {
      var r = box.getBoundingClientRect();
      box.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      box.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  })();

  /* ==========================================================================
     11. CLEAN-URL ROUTER
     Pattern ported from thrm.js: for every anchor carrying `data-path`, push a
     clean URL (e.g. /data) into history and smooth-scroll to the target
     section. On page load, if the URL matches a known slug, scroll to the
     matching section. Works with back/forward via popstate.
     ========================================================================== */
  (function () {
    var urlToSectionMap = {
      '/home': 'top',
      '/insights': 'insights',
      '/data': 'data',
      '/design': 'design',
      '/technology': 'technology',
      '/support': 'support',
      '/theorithm': 'thrm-intel',
      '/faq': 'faq',
      '/contact': 'contact'
    };

    function scrollToSection(targetId, smooth) {
      var el = document.getElementById(targetId);
      if (!el) return;
      var behavior = smooth ? 'smooth' : 'auto';
      el.scrollIntoView({ behavior: behavior, block: 'start' });
    }

    function closeMobileMenu() {
      var mobileMenu = document.getElementById('primary-nav');
      var mobileToggle = document.querySelector('.menu-toggle');
      if (mobileMenu && mobileMenu.classList.contains('is-open')) {
        mobileMenu.classList.remove('is-open');
        if (mobileToggle) {
          mobileToggle.setAttribute('aria-expanded', 'false');
          mobileToggle.innerHTML = 'Menu <span aria-hidden="true">+</span>';
        }
      }
    }

    // Handle every <a data-path="..."> click
    document.querySelectorAll('a[data-path]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href') || '';
        var cleanPath = this.getAttribute('data-path');

        if (!cleanPath) return;

        // /home — treat as top, don't try to scroll to a missing #top from outside hero
        if (cleanPath === '/home') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.history.pushState({ path: cleanPath }, '', cleanPath);
          closeMobileMenu();
          return;
        }

        if (targetId && targetId.charAt(0) === '#' && targetId.length > 1) {
          e.preventDefault();
          var id = targetId.slice(1);
          scrollToSection(id, true);
          window.history.pushState({ path: cleanPath }, '', cleanPath);
          closeMobileMenu();
        }
      });
    });

    // On load, deep-link to the matching section for the current path
    (function restoreFromPath() {
      var path = window.location.pathname.replace(/\/+$/, '') || '/';
      var targetId = urlToSectionMap[path];
      if (targetId) {
        // Let layout settle before scrolling
        window.setTimeout(function () {
          scrollToSection(targetId, false);
        }, 60);
      }
    })();

    // Back / forward
    window.addEventListener('popstate', function () {
      var path = window.location.pathname.replace(/\/+$/, '') || '/';
      var targetId = urlToSectionMap[path];
      if (path === '/' || !targetId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        scrollToSection(targetId, true);
      }
    });
  })();

})();