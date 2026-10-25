/* ============================================================================
   Beast Machine — portfolio interactions
   Vanilla port of the v2 Claude Design component (DCLogic).
   Logo animation (WAAPI), scroll-driven mockups, parallax wolf, marquees, HUD.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* current year in footer */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ── logo animation ─────────────────────────────────────────────────── */
  function startLogo() {
    var q = function (s) { return $('[data-l="' + s + '"]'); };
    var base = q('base'), mark = q('mark'), scan = q('scan'), eyes = q('eyes'), eyes2 = q('eyes2');
    if (reduce || !document.body.animate) { if (scan) scan.style.clipPath = 'inset(0 100% 0 0)'; return; }
    var A = function (el, k, o) { if (el) el.animate(k, o); };
    A(base, [{ opacity: 0, transform: 'scale(0.9)', filter: 'blur(18px)' }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }], { duration: 1400, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
    A(mark, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 1700, delay: 900, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'both' });
    A(mark, [{ opacity: 1 }, { opacity: 0.55 }, { opacity: 1 }], { duration: 4200, delay: 2800, iterations: Infinity, easing: 'ease-in-out' });
    A(scan, [{ clipPath: 'inset(0 100% 0 -12%)', offset: 0 }, { clipPath: 'inset(0 -12% 0 100%)', offset: 0.55 }, { clipPath: 'inset(0 -12% 0 100%)', offset: 1 }], { duration: 4800, delay: 2900, iterations: Infinity, easing: 'ease-in-out' });
    A(eyes, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.15, offset: 0.45 }, { opacity: 1 }], { duration: 700, delay: 2400, fill: 'both' });
    A(eyes, [{ filter: 'drop-shadow(0 0 3px #38C8F2)' }, { filter: 'drop-shadow(0 0 16px #38C8F2) brightness(1.3)' }, { filter: 'drop-shadow(0 0 3px #38C8F2)' }], { duration: 2600, delay: 3100, iterations: Infinity, easing: 'ease-in-out' });
    var blink = [{ transform: 'scaleY(1)', offset: 0 }, { transform: 'scaleY(1)', offset: 0.92 }, { transform: 'scaleY(0.08)', offset: 0.95 }, { transform: 'scaleY(1)', offset: 0.98 }, { transform: 'scaleY(1)', offset: 1 }];
    A(eyes, blink, { duration: 5200, delay: 3600, iterations: Infinity });
    A(eyes2, blink, { duration: 4400, iterations: Infinity });
    A(eyes2, [{ filter: 'drop-shadow(0 0 2px #38C8F2)' }, { filter: 'drop-shadow(0 0 12px #38C8F2)' }, { filter: 'drop-shadow(0 0 2px #38C8F2)' }], { duration: 2600, iterations: Infinity });
    $$('[data-hero-word]').forEach(function (w, i) {
      A(w, [{ opacity: 0, transform: 'translateX(' + (i ? 8 : -8) + 'vw)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 1600, delay: 300, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
    });
  }

  /* ── reveal on scroll ───────────────────────────────────────────────── */
  function setupReveal() {
    var els = $$('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.style.opacity = '1'; e.style.transform = 'none'; });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(48px)';
      el.style.transition = 'opacity 1s cubic-bezier(.2,.7,.2,1), transform 1s cubic-bezier(.2,.7,.2,1)';
      io.observe(el);
    });
  }

  /* ── per-frame loop ─────────────────────────────────────────────────── */
  var mx = 0, my = 0, tx = 0, ty = 0, last = performance.now();
  var marq = new WeakMap();
  var hero = $('[data-hero]'), wolf = $('[data-wolf]'), glow = $('[data-glow]'), hud = $('[data-hud]');

  if (hero && !reduce) {
    hero.addEventListener('mousemove', function (e) {
      var b = hero.getBoundingClientRect();
      mx = (e.clientX - b.left) / b.width - 0.5;
      my = (e.clientY - b.top) / b.height - 0.5;
    });
    hero.addEventListener('mouseleave', function () { mx = 0; my = 0; });
  }

  function frame(t) {
    var dt = Math.min(64, t - last); last = t;
    var vh = window.innerHeight, sy = window.scrollY;

    if (!reduce) {
      $$('[data-marquee]').forEach(function (el) {
        var sp = parseFloat(el.dataset.marquee) || 0.04;
        var x = marq.get(el); if (x === undefined) x = sp < 0 ? -el.scrollWidth / 2 : 0;
        x -= dt * sp;
        var half = el.scrollWidth / 2;
        if (half) { if (-x >= half) x += half; if (x > 0) x -= half; }
        marq.set(el, x);
        el.style.transform = 'translate3d(' + x + 'px,0,0)';
      });
    }

    tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06;

    if (wolf && !reduce) {
      // the beast runs its own mouse parallax (beast-logo.js); here we only
      // fade and recede the whole wolf as the hero scrolls away.
      var k = clamp(sy / vh, 0, 1);
      wolf.style.transform = 'translateY(' + (k * 14) + 'vh) scale(' + (1 - k * 0.12) + ')';
      wolf.style.opacity = String(1 - k * 0.7);
    }
    if (glow && !reduce) glow.style.transform = 'translate(' + (tx * 60) + 'px,' + (ty * 60) + 'px)';

    if (!reduce) {
      $$('[data-scale]').forEach(function (el) {
        var b = el.getBoundingClientRect();
        var p = clamp((vh - b.top) / (vh * 0.85), 0, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.style.transform = 'rotateX(' + ((1 - e) * 28) + 'deg) scale(' + (0.84 + 0.16 * e) + ') translateY(' + ((1 - e) * 60) + 'px)';
      });
      $$('[data-phone]').forEach(function (el) {
        var b = el.getBoundingClientRect();
        var p = clamp((vh - b.top) / (vh * 0.9), 0, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.style.transform = 'perspective(1400px) rotateY(' + ((1 - e) * -24) + 'deg) rotateZ(' + ((1 - e) * 6) + 'deg) translateY(' + ((1 - e) * 120 + Math.sin(performance.now() / 1400) * 6) + 'px)';
      });
      var now = performance.now();
      $$('[data-phonescroll]').forEach(function (img) {
        var box = img.parentElement.getBoundingClientRect();
        var max = img.getBoundingClientRect().height - box.height;
        if (max <= 0 || box.bottom < 0 || box.top > vh) return;
        var ph = (now % 18000) / 18000;
        var kk = ph < 0.1 ? 0 : ph < 0.5 ? (ph - 0.1) / 0.4 : ph < 0.6 ? 1 : 1 - (ph - 0.6) / 0.4;
        var ease = kk < 0.5 ? 4 * kk * kk * kk : 1 - Math.pow(-2 * kk + 2, 3) / 2;
        img.style.transform = 'translateY(' + (-ease * max) + 'px)';
      });
    }

    if (hud) {
      var cur = null;
      $$('[data-stage]').forEach(function (el) {
        var b = el.getBoundingClientRect();
        if (b.top < vh * 0.5 && b.bottom > vh * 0.5) cur = el.dataset.stage;
      });
      if (cur) { if (hud.textContent !== cur) hud.textContent = cur; hud.style.opacity = '1'; }
      else hud.style.opacity = '0';
    }

    requestAnimationFrame(frame);
  }

  startLogo();
  setupReveal();
  requestAnimationFrame(frame);
})();
