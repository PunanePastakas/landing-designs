/* ── Variant D: Tres Mares-style effects ────────────────────────────────
   1. Flowing ink-line canvases  (.ink-waves)
   2. Word-by-word scroll fill   (.fill-text)
   3. Parallax columns           ([data-parallax])
   4. Anchor tabs for pinned steps (#steps-anchors mirrors #kuidas --p)
   Requires shared/redpen-motion.js loaded first (scrub engine). */

(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ── 1. flowing ink lines (cloudsea analog) ────────────────────────── */
  function initWaves(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 0, H = 0, t = Math.random() * 100, running = false;
    var red = canvas.getAttribute('data-ink') || 'rgba(185,28,28,0.16)';
    var LINES = parseInt(canvas.getAttribute('data-lines') || '42', 10);

    function resize() {
      var r = canvas.parentNode.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var step = 14;
      for (var i = 0; i < LINES; i++) {
        var f = i / (LINES - 1);
        var baseY = H * 0.12 + f * H * 0.82;
        ctx.beginPath();
        for (var x = -20; x <= W + 20; x += step) {
          var n = x / W;
          var y = baseY
            + Math.sin(n * 4.1 + t * 0.45 + i * 0.32) * 14
            + Math.sin(n * 9.7 - t * 0.3 + i * 0.18) * 7
            + Math.sin(n * 2.0 + t * 0.18 + i * 0.55) * 22 * Math.sin(f * Math.PI);
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = red;
        ctx.globalAlpha = 0.25 + 0.75 * Math.sin(f * Math.PI);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      if (!running) return;
      t += 0.016;
      draw();
      requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    if (reduced) { draw(); return; }
    var io = new IntersectionObserver(function (en) {
      var vis = en[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(loop); }
      else if (!vis) running = false;
    }, { threshold: 0.02 });
    io.observe(canvas);
    draw();
  }
  $$('.ink-waves').forEach(initWaves);

  /* ── 2. word-by-word scroll fill ───────────────────────────────────── */
  var fills = $$('.fill-text').map(function (el) {
    // split into word spans once (keep <em>/<strong> child words intact)
    function splitNode(node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span');
          w.className = 'fw';
          w.textContent = part;
          frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        Array.prototype.slice.call(node.childNodes).forEach(splitNode);
      }
    }
    Array.prototype.slice.call(el.childNodes).forEach(splitNode);
    return { el: el, words: $$('.fw', el), done: -1 };
  });

  function updateFills() {
    var vh = window.innerHeight;
    fills.forEach(function (f) {
      var r = f.el.getBoundingClientRect();
      var p = reduced ? 1 : clamp01((vh * 0.86 - r.top) / Math.min(vh * 0.55, r.height + vh * 0.3));
      var n = Math.round(p * f.words.length);
      if (n === f.done) return;
      f.done = n;
      for (var i = 0; i < f.words.length; i++) {
        f.words[i].classList.toggle('on', i < n);
      }
    });
  }

  /* ── 3. parallax columns ───────────────────────────────────────────── */
  var parallax = $$('[data-parallax]').map(function (el) {
    return { el: el, amt: parseFloat(el.getAttribute('data-parallax') || '60') };
  });
  function updateParallax() {
    if (reduced) return;
    var vh = window.innerHeight;
    parallax.forEach(function (p) {
      var r = p.el.parentNode.getBoundingClientRect();
      var f = clamp01((vh - r.top) / (vh + r.height)) - 0.5;
      p.el.style.transform = 'translateY(' + (-f * 2 * p.amt) + 'px)';
    });
  }

  /* ── 4. anchor tabs mirror pinned-steps progress ───────────────────── */
  var stepsSection = document.getElementById('kuidas');
  var anchors = $$('#steps-anchors .anchor');
  function updateAnchors() {
    if (!stepsSection || !anchors.length) return;
    var vh = window.innerHeight;
    var r = stepsSection.getBoundingClientRect();
    var p = clamp01(-r.top / (r.height - vh));
    var idx = Math.min(anchors.length - 1, Math.floor(p * anchors.length));
    if (r.bottom < vh * 0.5) idx = anchors.length - 1;
    anchors.forEach(function (a, i) { a.classList.toggle('on', i === idx); });
  }

  /* ── shared scroll loop ────────────────────────────────────────────── */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateFills(); updateParallax(); updateAnchors();
      ticking = false;
    });
    // fallback for throttled rAF
    setTimeout(function () {
      if (!ticking) return;
      updateFills(); updateParallax(); updateAnchors();
      ticking = false;
    }, 60);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateFills(); updateParallax(); updateAnchors();
  setTimeout(function () { updateFills(); updateParallax(); updateAnchors(); }, 300);
  setInterval(function () {
    var y = window.scrollY;
    if (y !== onScroll._y) { onScroll._y = y; updateFills(); updateParallax(); updateAnchors(); }
  }, 200);
})();
