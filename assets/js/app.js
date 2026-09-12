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
  var heroMark = $('.hero-mark');
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

    /* hero mark drifts with the pointer */
    if (heroMark) {
      window.addEventListener('pointermove', function (e) {
        var dx = (e.clientX / window.innerWidth - 0.5) * 18;
        var dy = (e.clientY / window.innerHeight - 0.5) * 18;
        heroMark.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
      }, { passive: true });
    }
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

  /* ── Marquee: duplicate the track so the loop is seamless ───────────── */

  var track = $('.marquee-track');
  if (track && track.children.length === 1) {
    var clone = track.children[0].cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }

  /* ── Footer year ────────────────────────────────────────────────────── */

  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
