(function () {
'use strict';

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
var isFine = window.matchMedia('(pointer: fine)').matches;
var doc = document.documentElement;

document.documentElement.classList.add('js');

/* ============================================================
    SCROLL PROGRESS
    ============================================================ */
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
    if (window.innerWidth > 860) closeMenu();
});
})();

/* ============================================================
    CUSTOM CURSOR
    ============================================================ 
(function () {
if (!isFine || reduceMotion.matches) return;
var dot = document.getElementById('cursorDot');
var ring = document.getElementById('cursorRing');
if (!dot || !ring) return;

var mouseX = -100, mouseY = -100;
var dotX = -100, dotY = -100;
var ringX = -100, ringY = -100;
var visible = false;

document.body.classList.add('cursor-on');

function show() {
    if (!visible) {
    visible = true;
    dot.style.opacity = '1';
    ring.style.opacity = '1';
    }
}

document.addEventListener('pointermove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    show();
}, { passive: true });

document.addEventListener('pointerleave', function () {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    visible = false;
});

document.querySelectorAll('a, button, summary, [data-magnetic], .cap-card, .card, .division, .layer, .tech').forEach(function (el) {
    el.addEventListener('pointerenter', function () { ring.classList.add('is-link'); });
    el.addEventListener('pointerleave', function () { ring.classList.remove('is-link'); });
});

document.querySelectorAll('h1, h2, .hero-visual, .stat').forEach(function (el) {
    el.addEventListener('pointerenter', function () { ring.classList.add('is-active'); });
    el.addEventListener('pointerleave', function () { ring.classList.remove('is-active'); });
});

function tick() {
    dotX += (mouseX - dotX) * 0.55;
    dotY += (mouseY - dotY) * 0.55;
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    dot.style.transform = 'translate3d(' + dotX + 'px,' + dotY + 'px,0) translate(-50%,-50%)';
    ring.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0) translate(-50%,-50%)';
    requestAnimationFrame(tick);
}
if (!reduceMotion.matches) tick();
})();*/

/* ============================================================
    REVEALS
    ============================================================ */
(function () {
var revealItems = document.querySelectorAll('.reveal');
if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealItems.forEach(function (el) { el.classList.add('in'); });
    document.querySelectorAll('.section').forEach(function (s) { s.classList.add('is-visible'); });
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

var sectionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
}, { threshold: 0.15 });
document.querySelectorAll('.section').forEach(function (s) { sectionIO.observe(s); });
})();

/* ============================================================
    COUNTERS
    ============================================================ */
(function () {
var counters = document.querySelectorAll('[data-counter]');
if (!counters.length) return;

function animate(el) {
    var target = parseInt(el.getAttribute('data-counter'), 10);
    if (isNaN(target)) return;
    var start = Math.max(1800, target - 60);
    var startTime = null;
    var duration = 1400;

    function step(t) {
    if (!startTime) startTime = t;
    var progress = Math.min((t - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = Math.round(start + (target - start) * eased);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
    }
    requestAnimationFrame(step);
}

if (!('IntersectionObserver' in window)) return;
var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
    if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
    }
    });
}, { threshold: 0.6 });
counters.forEach(function (c) { io.observe(c); });
})();

/* ============================================================
    CARD SPOTLIGHT + TILT
    ============================================================ */
(function () {
if (!isFine || reduceMotion.matches) return;
var cards = document.querySelectorAll('[data-tilt], .card, .cap-card, .division, .tech, .layer, .tech-layer');

cards.forEach(function (card) {
    var rafId = null;
    var targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;
    var isCap = card.classList.contains('cap-card') || card.hasAttribute('data-tilt');
    var maxTilt = isCap ? 5 : 2.5;

    card.addEventListener('pointermove', function (e) {
    var r = card.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    var y = (e.clientY - r.top) / r.height;

    card.style.setProperty('--mx', (x * 100) + '%');
    card.style.setProperty('--my', (y * 100) + '%');

    targetRX = (0.5 - y) * maxTilt;
    targetRY = (x - 0.5) * maxTilt;

    if (!rafId) loop();
    });

    card.addEventListener('pointerleave', function () {
    targetRX = 0;
    targetRY = 0;
    if (!rafId) loop();
    });

    function loop() {
    currentRX += (targetRX - currentRX) * 0.14;
    currentRY += (targetRY - currentRY) * 0.14;

    if (Math.abs(currentRX) < 0.02 && Math.abs(currentRY) < 0.02 &&
        Math.abs(targetRX) < 0.02 && Math.abs(targetRY) < 0.02) {
        card.style.transform = '';
        rafId = null;
        return;
    }

    card.style.transform = 'perspective(900px) rotateX(' + currentRX.toFixed(2) + 'deg) rotateY(' + currentRY.toFixed(2) + 'deg)';
    rafId = requestAnimationFrame(loop);
    }
});
})();

/* ============================================================
    NAV ACTIVE STATE
    ============================================================ */
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

/* ============================================================
    PARALLAX BACKGROUNDS
    ============================================================ */
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

/* ============================================================
    HERO 3D — Three.js
    ============================================================ */
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

        /* Inner icosahedron */
        var ico = new THREE.IcosahedronGeometry(1.72, 1);
        var wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(ico),
        new THREE.LineBasicMaterial({ color: 0x202020, transparent: true, opacity: 0.18 })
        );
        group.add(wire);

        /* Outer shell */
        var wire2 = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.5, 0)),
        new THREE.LineBasicMaterial({ color: 0x202020, transparent: true, opacity: 0.09 })
        );
        group.add(wire2);

        /* Vertex points, few in brand red */
        var src = ico.attributes.position;
        var colors = new Float32Array(src.count * 3);
        for (var i = 0; i < src.count; i++) {
        var isRed = Math.random() < 0.11;
        colors[i * 3]     = isRed ? 0.957 : 0.125;
        colors[i * 3 + 1] = isRed ? 0.102 : 0.125;
        colors[i * 3 + 2] = isRed ? 0.102 : 0.125;
        }
        var pointGeo = new THREE.BufferGeometry();
        pointGeo.setAttribute('position', src);
        pointGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var points = new THREE.Points(
        pointGeo,
        new THREE.PointsMaterial({
            size: 0.06,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            sizeAttenuation: true
        })
        );
        group.add(points);

        /* Orbiting ring particles */
        var ringCount = 220;
        var ringGeo = new THREE.BufferGeometry();
        var ringPos = new Float32Array(ringCount * 3);
        var ringColors = new Float32Array(ringCount * 3);
        for (var j = 0; j < ringCount; j++) {
        var angle = (j / ringCount) * Math.PI * 2;
        var radius = 2.7 + (Math.random() - 0.5) * 0.35;
        ringPos[j * 3] = Math.cos(angle) * radius;
        ringPos[j * 3 + 1] = (Math.random() - 0.5) * 0.35;
        ringPos[j * 3 + 2] = Math.sin(angle) * radius;
        var red = Math.random() < 0.18;
        ringColors[j * 3]     = red ? 0.957 : 0.125;
        ringColors[j * 3 + 1] = red ? 0.102 : 0.125;
        ringColors[j * 3 + 2] = red ? 0.102 : 0.125;
        }
        ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
        ringGeo.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));
        var ring = new THREE.Points(
        ringGeo,
        new THREE.PointsMaterial({
            size: 0.04,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        })
        );
        group.add(ring);

        /* Mouse parallax */
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
        if (rafId === null) {
            clock.start();
            loop();
        }
        }
        function stop() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
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

/* ============================================================
    THEORITHM PARTICLE NETWORK
    ============================================================ */
(function () {
var canvas = document.getElementById('theorithm-canvas');
if (!canvas || reduceMotion.matches) return;
var ctx = canvas.getContext('2d');
if (!ctx) return;

var w = 0, h = 0, dpr = 1;
var particles = [];
var mouseX = -1000, mouseY = -1000;
var rafId = null;
var visible = false;
var container = canvas.parentElement;

function resize() {
    var r = container.getBoundingClientRect();
    w = r.width;
    h = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
}

function seed() {
    var count = Math.min(80, Math.max(30, Math.floor(w * h / 14000)));
    particles = [];
    for (var i = 0; i < count; i++) {
    particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        red: Math.random() < 0.2
    });
    }
}

function draw() {
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    /* Mouse repel */
    var dx = p.x - mouseX;
    var dy = p.y - mouseY;
    var dist2 = dx * dx + dy * dy;
    if (dist2 < 12000 && dist2 > 1) {
        var dist = Math.sqrt(dist2);
        var force = (120 - dist) / 120;
        p.x += (dx / dist) * force * 0.8;
        p.y += (dy / dist) * force * 0.8;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.red ? 'rgba(244,26,26,0.75)' : 'rgba(255,255,255,0.5)';
    ctx.fill();

    /* Connections */
    for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var ddx = p.x - q.x;
        var ddy = p.y - q.y;
        var d2 = ddx * ddx + ddy * ddy;
        if (d2 < 14000) {
        var a = 1 - d2 / 14000;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        if (p.red || q.red) {
            ctx.strokeStyle = 'rgba(244,26,26,' + (a * 0.28).toFixed(3) + ')';
        } else {
            ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.16).toFixed(3) + ')';
        }
        ctx.lineWidth = 0.6;
        ctx.stroke();
        }
    }
    }
    rafId = requestAnimationFrame(draw);
}

function start() {
    if (rafId === null) draw();
}
function stop() {
    if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
    }
}

container.addEventListener('pointermove', function (e) {
    var r = container.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
}, { passive: true });
container.addEventListener('pointerleave', function () {
    mouseX = -1000;
    mouseY = -1000;
});

window.addEventListener('resize', function () {
    resize();
});

if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0 }).observe(canvas);
}

document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else if (visible) start();
});

resize();
start();
})();

/* ============================================================
    CONTACT BOX SPOTLIGHT
    ============================================================ */
(function () {
var box = document.getElementById('contactBox');
if (!box || !isFine) return;
box.addEventListener('pointermove', function (e) {
    var r = box.getBoundingClientRect();
    box.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    box.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
});
})();

/* ============================================================
    TABS
    ============================================================ */
(function() {
  const tabContainers = document.querySelectorAll('[data-tabs]');
  if (!tabContainers.length) return;

  tabContainers.forEach(container => {
    const tabButtons = container.querySelectorAll('[role="tab"]');
    const tabPanels = container.querySelectorAll('[role="tabpanel"]');

    if (!tabButtons.length || !tabPanels.length) return;

    // Function to switch tabs
    const switchTab = (newTab) => {
      // Deactivate all tabs and panels
      tabButtons.forEach(t => t.setAttribute('aria-selected', 'false'));
      tabPanels.forEach(p => p.setAttribute('hidden', ''));

      // Activate new tab and panel
      newTab.setAttribute('aria-selected', 'true');
      const panelId = newTab.getAttribute('aria-controls');
      const panel = container.querySelector(`#${panelId}`);
      if (panel) {
        panel.removeAttribute('hidden');
      }
    };

    // Add click listeners
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(button);
      });
    });

    // Add keyboard navigation (optional but good for accessibility)
    container.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
      const currentTab = document.activeElement;
      if (!currentTab || currentTab.getAttribute('role') !== 'tab') return;

      let nextTab = null;
      const tabsArray = Array.from(tabButtons);
      const currentIndex = tabsArray.indexOf(currentTab);

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextTab = tabsArray[(currentIndex + 1) % tabsArray.length];
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextTab = tabsArray[(currentIndex - 1 + tabsArray.length) % tabsArray.length];
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextTab = tabsArray[0];
      } else if (e.key === 'End') {
        e.preventDefault();
        nextTab = tabsArray[tabsArray.length - 1];
      }

      if (nextTab) {
        nextTab.focus();
        switchTab(nextTab);
      }
    });
  });
})();

})();