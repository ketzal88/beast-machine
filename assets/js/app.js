/* ==========================================================================
   Beast Machine — interactions
   Vanilla JS, no dependencies. All motion respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ── Scroll progress + sticky nav + hero parallax ───────────────────── */

  var progress = $('.scroll-progress i');
  var nav = $('.nav');
  var hero = $('.hero');
  var heroInner = $('.hero-inner');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (nav) nav.classList.toggle('is-stuck', y > 12);

    if (hero && heroInner && !reduced) {
      var h = hero.offsetHeight || 1;
      var t = Math.min(y / h, 1);
      heroInner.style.opacity = String(1 - t * 1.15);
      heroInner.style.transform = 'translate3d(0,' + (t * 70).toFixed(2) + 'px,0) scale(' + (1 - t * 0.06).toFixed(4) + ')';
      var cue = $('.scroll-cue');
      if (cue) cue.style.opacity = String(Math.max(0, 1 - t * 4));
    }
    ticking = false;
  }

  function requestScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);
  onScroll();

  /* ── Mobile menu ────────────────────────────────────────────────────── */

  var burger = $('.burger');
  var panel = $('.mobile-panel');

  function setMenu(open) {
    if (!burger || !panel) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
  }

  if (burger && panel) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', panel).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ── Reveal on scroll ───────────────────────────────────────────────── */

  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Count-up numbers ───────────────────────────────────────────────── */

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    if (reduced) { el.textContent = target + suffix; return; }

    var duration = 1400;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ── Process: scroll-driven active step ─────────────────────────────── */

  var steps = $$('.step');
  var rail = $('.process-rail i');
  var counterNow = $('.process-counter b');

  function setStep(index) {
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
    if (rail) rail.style.setProperty('--p', ((index + 1) / steps.length).toFixed(3));
    if (counterNow) counterNow.textContent = ('0' + (index + 1)).slice(-2);
  }

  if (steps.length) {
    setStep(0);
    if ('IntersectionObserver' in window) {
      var stepObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setStep(steps.indexOf(entry.target));
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (s) { stepObserver.observe(s); });
    } else {
      steps.forEach(function (s) { s.classList.add('is-active'); });
    }
  }

  /* ── Pause the hero's fur filter while it is off screen ─────────────── */

  if (hero && 'IntersectionObserver' in window) {
    var heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        hero.classList.toggle('is-idle', !entry.isIntersecting);
      });
    }, { threshold: 0 });
    heroObserver.observe(hero);
  }

  /* ── Card spotlight follows the cursor ──────────────────────────────── */

  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ── Active nav link ────────────────────────────────────────────────── */

  var sections = $$('main section[id]');
  var navLinks = $$('.nav-menu a[href^="#"]');

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.getAttribute('id');
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ── Contact form → WhatsApp ────────────────────────────────────────── */

  var form = $('#brief-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = form.getAttribute('data-phone') || '';
      var tpl = form.getAttribute('data-template') || '{name} · {scope} · {message}';
      var data = new FormData(form);
      var text = tpl
        .replace('{name}', (data.get('name') || '').toString().trim())
        .replace('{scope}', (data.get('scope') || '').toString().trim())
        .replace('{message}', (data.get('message') || '').toString().trim());
      window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  /* ── Marquees: seamless loop, speed driven by scroll velocity ───────── */
  /* Port of Magic UI's Scroll Based Velocity: scrolling speeds the strip up
     and flips its direction; idle, it drifts at its base speed. Without JS
     (or with reduced motion) the CSS animation keeps running as before. */

  var scrollVelocity = 0;
  var lastScrollY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    scrollVelocity += y - lastScrollY;
    lastScrollY = y;
  }, { passive: true });

  $$('.marquee').forEach(function (marquee) {
    var track = $('.marquee-track', marquee);
    if (!track) return;
    if (track.children.length === 1) {
      var clone = track.children[0].cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    }
    if (reduced || !('IntersectionObserver' in window)) return;

    var dir = parseFloat(marquee.getAttribute('data-direction')) || 1;
    var x = 0, boost = 0, last = null, visible = false, raf = 0;
    marquee.classList.add('is-driven');

    function step(now) {
      if (last === null) last = now;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      var half = track.scrollWidth / 2 || 1;
      // velocity decays so a flick fades out instead of sticking
      boost += (scrollVelocity * 0.9 - boost) * 0.12;
      if (boost > 0.5) dir = Math.abs(dir); else if (boost < -0.5) dir = -Math.abs(dir);
      var speed = 42 + Math.min(Math.abs(boost) * 14, 520);
      x -= dir * speed * dt;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      raf = visible ? window.requestAnimationFrame(step) : 0;
    }

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !raf) { last = null; raf = window.requestAnimationFrame(step); }
    }).observe(marquee);
  });

  (function decayVelocity() {
    scrollVelocity *= 0.8;
    window.requestAnimationFrame(decayVelocity);
  })();

  /* ── Hyper Text: letters decode into place ──────────────────────────── */

  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&';

  function scramble(el) {
    if (el._scrambling) return;
    var final = el.getAttribute('data-text') || el.textContent;
    el.setAttribute('data-text', final);
    el._scrambling = true;
    var total = final.length, frame = 0, frames = Math.max(14, total * 1.6);
    var timer = window.setInterval(function () {
      frame++;
      var revealed = Math.floor((frame / frames) * total);
      var out = '';
      for (var i = 0; i < total; i++) {
        var c = final.charAt(i);
        if (i < revealed || !/[0-9A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(c)) { out += c; continue; }
        var g = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        out += c === c.toLowerCase() ? g.toLowerCase() : g;
      }
      el.textContent = out;
      if (frame >= frames) {
        window.clearInterval(timer);
        el.textContent = final;
        el._scrambling = false;
      }
    }, 38);
  }

  if (!reduced) {
    var heroWord = $('[data-scramble]');
    if (heroWord) {
      window.setTimeout(function () { scramble(heroWord); }, 950);
      heroWord.addEventListener('pointerenter', function () { scramble(heroWord); });
    }

    var eyebrows = $$('.section-head .eyebrow, .contact-copy .eyebrow');
    if ('IntersectionObserver' in window) {
      var eyebrowObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            scramble(entry.target);
            eyebrowObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 1 });
      eyebrows.forEach(function (el) { eyebrowObserver.observe(el); });
    }
  }

  /* ── Border Beam: stagger so the lights never move in sync ──────────── */

  $$('.cases-featured .beam').forEach(function (el, i) {
    el.style.setProperty('--beam-delay', (-i * 1.7).toFixed(1) + 's');
  });

  /* ── Flickering Grid behind the contact panel ───────────────────────── */

  var contact = $('.contact');
  if (contact && !reduced && 'IntersectionObserver' in window) {
    var canvas = document.createElement('canvas');
    canvas.className = 'flicker-grid';
    canvas.setAttribute('aria-hidden', 'true');
    contact.insertBefore(canvas, contact.firstChild);
    var ctx = canvas.getContext('2d');
    var SQ = 4, GAP = 6, cols = 0, rows = 0, cells = null, dpr = 1;
    var flickerOn = false, flickerRaf = 0, flickerLast = 0;

    function sizeGrid() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = contact.clientWidth, h = contact.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      cols = Math.ceil(w / (SQ + GAP));
      rows = Math.ceil(h / (SQ + GAP));
      cells = new Float32Array(cols * rows);
      for (var i = 0; i < cells.length; i++) cells[i] = Math.random() * 0.42;
    }

    function drawGrid(now) {
      if (now - flickerLast > 60) {
        flickerLast = now;
        for (var i = 0; i < cells.length; i++) {
          if (Math.random() < 0.025) cells[i] = Math.random() * 0.42;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var s = SQ * dpr, step = (SQ + GAP) * dpr;
        for (var c = 0; c < cols; c++) {
          for (var r = 0; r < rows; r++) {
            ctx.fillStyle = 'rgba(0,174,239,' + cells[c * rows + r].toFixed(3) + ')';
            ctx.fillRect(c * step, r * step, s, s);
          }
        }
      }
      flickerRaf = flickerOn ? window.requestAnimationFrame(drawGrid) : 0;
    }

    sizeGrid();
    window.addEventListener('resize', sizeGrid);
    new IntersectionObserver(function (entries) {
      flickerOn = entries[0].isIntersecting;
      if (flickerOn && !flickerRaf) flickerRaf = window.requestAnimationFrame(drawGrid);
    }).observe(contact);
  }

  /* ── Process logo video: plays only while on screen ─────────────────── */

  var processLogo = $('.process-logo');
  if (processLogo && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        var playing = processLogo.play();
        if (playing && playing.catch) playing.catch(function () {});
      } else {
        processLogo.pause();
      }
    }, { threshold: 0.2 }).observe(processLogo);
  }

  /* ── Footer year ────────────────────────────────────────────────────── */

  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
