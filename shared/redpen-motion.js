/* ── PunanePastakas shared motion engine ────────────────────────────────
   Pen-stroke drawing (enter + scroll-scrub), pen sprite overlay, counters,
   reveals, ET/EN toggle, variant switcher. No dependencies.
   Deliberately avoids IntersectionObserver and bare rAF loops: everything
   is driven by scroll/resize events + a rAF-with-setTimeout-fallback tick,
   so it keeps working in throttled iframes, previews and webviews. */

(function () {
  'use strict';
  var doc = document;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.documentElement.classList.remove('no-js');

  /* ── tiny helpers ──────────────────────────────────────────────────── */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  /* rAF that falls back to setTimeout when rAF is throttled/suspended */
  function tick(fn) {
    var fired = false;
    function run() { if (fired) return; fired = true; fn(now()); }
    if (window.requestAnimationFrame) {
      var id = requestAnimationFrame(function () { run(); });
      setTimeout(function () { if (!fired && window.cancelAnimationFrame) cancelAnimationFrame(id); run(); }, 42);
    } else {
      setTimeout(run, 16);
    }
  }

  function inView(el, margin) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || doc.documentElement.clientHeight;
    if (r.width === 0 && r.height === 0) return false;
    return r.top < vh * (margin == null ? 0.88 : margin) && r.bottom > 0;
  }

  /* ── pen sprite overlay (one HTML pen per actively-drawing stroke) ─── */
  var penCSS = '.pen-overlay{position:absolute;left:0;top:0;z-index:70;pointer-events:none;opacity:0;transition:opacity .25s ease}.pen-overlay.on{opacity:1}.pen-overlay svg{display:block;margin-left:-46px;margin-top:-78px;transform-origin:46px 78px}';
  var styleEl = doc.createElement('style');
  styleEl.textContent = penCSS;
  doc.head.appendChild(styleEl);

  function penMarkup() {
    return '<svg width="92" height="92" viewBox="-46 -78 92 92" overflow="visible" aria-hidden="true">' +
      '<g>' +
      '<ellipse cx="3" cy="2" rx="7" ry="2.4" fill="rgba(17,17,17,0.12)"></ellipse>' +
      '<polygon points="0,0 -7.5,-17 7.5,-17" fill="#111111"></polygon>' +
      '<circle cx="0" cy="-1" r="2" fill="#b91c1c"></circle>' +
      '<rect x="-8" y="-60" width="16" height="45" rx="4" fill="#b91c1c" stroke="#111111" stroke-width="2"></rect>' +
      '<rect x="-4.5" y="-56" width="3.4" height="37" rx="1.7" fill="#ffffff" opacity="0.4"></rect>' +
      '<rect x="-8" y="-66" width="16" height="8" rx="3" fill="#111111"></rect>' +
      '<rect x="3" y="-58" width="3.4" height="16" rx="1.6" fill="#111111" opacity="0.85"></rect>' +
      '</g></svg>';
  }

  function createPen() {
    var el = doc.createElement('div');
    el.className = 'pen-overlay';
    el.innerHTML = penMarkup();
    doc.body.appendChild(el);
    return el;
  }

  function movePen(pen, path, len) {
    var pt, ctm;
    try {
      pt = path.getPointAtLength(len);
      ctm = path.getScreenCTM();
    } catch (e) { return; }
    if (!ctm) return;
    var x = pt.x * ctm.a + pt.y * ctm.c + ctm.e + window.scrollX;
    var y = pt.x * ctm.b + pt.y * ctm.d + ctm.f + window.scrollY;
    var wob = Math.sin(len * 0.15) * 3;
    pen.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    pen.querySelector('svg').style.transform = 'rotate(' + (26 + wob) + 'deg)';
  }

  /* ── stroke registry ───────────────────────────────────────────────── */
  // Every .pen-stroke path gets prepared. Modes:
  //   default        → draws once when its svg scrolls into view
  //   data-scrub     → progress tied to nearest [data-scrub] container's --p
  //                    optionally windowed by data-from / data-to
  var strokes = [];
  $$('.pen-stroke').forEach(function (path) {
    var len;
    try { len = path.getTotalLength(); } catch (e) { return; }
    if (!reduced) {
      path.style.strokeDasharray = len + ' ' + len;
      path.style.strokeDashoffset = len;
    }
    strokes.push({
      path: path,
      len: len,
      scrub: path.hasAttribute('data-scrub'),
      from: parseFloat(path.getAttribute('data-from') || '0'),
      to: parseFloat(path.getAttribute('data-to') || '1'),
      dur: parseFloat(path.getAttribute('data-dur') || '1100'),
      delay: parseFloat(path.getAttribute('data-delay-ms') || '0'),
      pen: path.getAttribute('data-pen') !== 'off',
      started: false,
      p: 0,
      penEl: null
    });
  });

  function setStroke(s, p, showPen) {
    p = clamp01(p);
    s.p = p;
    if (!reduced) s.path.style.strokeDashoffset = s.len * (1 - p);
    if (reduced || !s.pen) return;
    var active = showPen && p > 0.001 && p < 0.999;
    if (active) {
      if (!s.penEl) s.penEl = createPen();
      s.penEl.classList.add('on');
      movePen(s.penEl, s.path, s.len * p);
    } else if (s.penEl) {
      if (p >= 0.999) movePen(s.penEl, s.path, s.len);
      s.penEl.classList.remove('on');
    }
  }

  function tweenStroke(s) {
    if (s.started) return;
    s.started = true;
    if (reduced) { setStroke(s, 1, false); return; }
    var t0 = null;
    function frame(ts) {
      if (t0 === null) t0 = ts + s.delay;
      var t = (ts - t0) / s.dur;
      if (t >= 1) { setStroke(s, 1, false); return; }
      if (t >= 0) setStroke(s, easeOut(t), true);
      tick(frame);
    }
    tick(frame);
  }

  /* ── scrub containers ──────────────────────────────────────────────── */
  // [data-scrub] gets --p (0..1). Tall sticky wrappers scrub across their
  // pinned travel; normal blocks scrub across their viewport transit.
  var scrubEls = $$('[data-scrub]').map(function (el) {
    return { el: el, p: -1, steps: $$('[data-step]', el) };
  });
  var scrubStrokes = strokes.filter(function (s) { return s.scrub; });

  function containerFor(path) {
    var el = path.ownerSVGElement;
    while (el && el !== doc.body) {
      if (el.hasAttribute && el.hasAttribute('data-scrub')) return el;
      el = el.parentNode;
    }
    return null;
  }
  scrubStrokes.forEach(function (s) { s.container = containerFor(s.path); });

  function updateScrub() {
    var vh = window.innerHeight;
    scrubEls.forEach(function (c) {
      var r = c.el.getBoundingClientRect();
      var p;
      if (r.height > vh * 1.4) {
        p = clamp01(-r.top / (r.height - vh));
      } else {
        p = clamp01((vh - r.top) / (vh + r.height));
      }
      if (Math.abs(p - c.p) < 0.0005) return;
      c.p = p;
      c.el.style.setProperty('--p', p.toFixed(4));
      if (c.steps.length) {
        var idx = Math.min(c.steps.length - 1, Math.floor(p * c.steps.length));
        c.steps.forEach(function (st, i) {
          st.classList.toggle('step-active', i === idx);
          st.classList.toggle('step-past', i < idx);
        });
      }
      scrubStrokes.forEach(function (s) {
        if (s.container !== c.el) return;
        var local = (p - s.from) / (s.to - s.from);
        setStroke(s, local, true);
      });
    });
  }

  /* ── visibility watchers (reveals, counters, enter-strokes) ────────── */
  var watchers = [];
  function watch(el, margin, cb) { watchers.push({ el: el, margin: margin, cb: cb, done: false }); }

  function checkWatchers() {
    for (var i = 0; i < watchers.length; i++) {
      var w = watchers[i];
      if (w.done) continue;
      if (inView(w.el, w.margin)) { w.done = true; w.cb(); }
    }
  }

  /* reveals */
  $$('.reveal, .line-mask[data-auto]').forEach(function (el) {
    if (reduced) { el.classList.add('in'); return; }
    watch(el, 0.92, function () { el.classList.add('in'); });
  });

  /* enter-mode strokes: watch the owning svg */
  strokes.forEach(function (s) {
    if (s.scrub) return;
    var svg = s.path.ownerSVGElement;
    if (!svg) return;
    watch(svg, 0.82, function () { tweenStroke(s); });
  });

  /* counters */
  function fmt(n, dec) {
    var s = n.toFixed(dec);
    if (dec === 0) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    return s;
  }
  $$('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var dur = parseFloat(el.getAttribute('data-count-dur') || '1600');
    watch(el, 0.85, function () {
      if (reduced) { el.textContent = fmt(target, dec); return; }
      var t0 = null;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var t = clamp01((ts - t0) / dur);
        el.textContent = fmt(target * easeOut(t), dec);
        if (t < 1) tick(frame);
      }
      tick(frame);
    });
  });

  /* ── scroll/resize loop (event-driven, tick-throttled) ─────────────── */
  var ticking = false;
  function runUpdates() {
    try { updateScrub(); checkWatchers(); }
    catch (e) { /* never wedge the loop */ }
    ticking = false;
  }
  function onScrollResize() {
    if (ticking) return;
    ticking = true;
    tick(runUpdates);
  }
  window.addEventListener('scroll', onScrollResize, { passive: true });
  doc.addEventListener('scroll', onScrollResize, { passive: true, capture: true });
  window.addEventListener('resize', onScrollResize);
  window.addEventListener('load', onScrollResize);

  /* initial pass — late passes for layout shifts — interval safety net
     (covers environments where scroll events are coalesced or dropped) */
  runUpdates();
  setTimeout(runUpdates, 250);
  setTimeout(runUpdates, 1200);
  setInterval(function () {
    var y = window.scrollY || window.pageYOffset || 0;
    if (y !== lastY) { lastY = y; runUpdates(); }
  }, 200);
  var lastY = -1;

  /* ── ET / EN toggle ────────────────────────────────────────────────── */
  /* Estonian is always the default on load. Clicking EN switches the current
     view only — there is no persistence, so a fresh load is always Estonian
     and English appears only after an explicit click. */
  function applyLang(lang) {
    $$('[data-en]').forEach(function (el) {
      if (!el.hasAttribute('data-et')) el.setAttribute('data-et', el.innerHTML);
      el.innerHTML = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-et');
    });
    $$('[data-en-placeholder]').forEach(function (el) {
      if (!el.hasAttribute('data-et-placeholder')) el.setAttribute('data-et-placeholder', el.getAttribute('placeholder') || '');
      el.setAttribute('placeholder', lang === 'en' ? el.getAttribute('data-en-placeholder') : el.getAttribute('data-et-placeholder'));
    });
    $$('.lang-toggle button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    doc.documentElement.lang = lang;
  }
  $$('.lang-toggle button').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
  });

  /* ── variant switcher ──────────────────────────────────────────────── */
  var VARIANTS = [
    ['v1', '../v1/'],
    ['v2', '../v2/'],
    ['v3', '../v3/'],
    ['v4', '../v4/'],
    ['v5', '../v5/']
  ];
  var current = doc.body.getAttribute('data-variant');
  if (current) {
    var sw = doc.createElement('nav');
    sw.className = 'variant-switcher';
    sw.setAttribute('aria-label', 'Variandid');
    sw.innerHTML = '<span class="vs-label">Variant</span>' + VARIANTS.map(function (v) {
      return '<a href="' + encodeURI(v[1]) + '"' + (v[0] === current ? ' aria-current="true"' : '') + '>' + v[0] + '</a>';
    }).join('');
    doc.body.appendChild(sw);
  }

  /* ── misc: year + mobile nav ───────────────────────────────────────── */
  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var navBtn = doc.getElementById('navToggle');
  var mobileNav = doc.getElementById('mobileNav');
  if (navBtn && mobileNav) {
    navBtn.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('hidden') === false;
      navBtn.setAttribute('aria-expanded', String(open));
    });
    $$('a', mobileNav).forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.add('hidden');
        navBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();
