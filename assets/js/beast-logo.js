/* ==========================================================================
   Beast Machine — logo animado del hero ("Logo v2 · gruñido + cyberpunk")
   Port a JS vanilla del componente de Claude Design que vive en
   assets/Mejoras para animación web/Logo Animation v2.dc.html. Mismos tiempos,
   mismas capas y los mismos valores por defecto de sus controles (speed 1,
   traffic 1, glitch 1, autoGrowl 9 s, sound off, parallax on).
   ========================================================================== */
(function () {
  'use strict';

  var stage = document.querySelector('[data-beast]');
  if (!stage || !stage.animate) return;

  var CIRCUITS = '/assets/img/logo-front-circuits.svg?v=9';
  var MAG = '#ff2bd6', CY = '#4cc6f2';
  var SPEED = 1, TRAFFIC = 1, GLITCH = 1, AUTO_GROWL = 9, PARALLAX = true;

  var q = function (c) { return stage.querySelector('.beast-' + c); };
  var halo = q('halo'), halo2 = q('halo2'), head = q('head'), base = q('base'), mark = q('mark');
  var mouth = q('mouth'), jaw = q('jaw'), snout = q('snout'), svgBox = q('svg'), eyes = q('eyes');
  var lidL = q('lid-l'), lidR = q('lid-r'), rgbC = q('rgb-c'), rgbM = q('rgb-m'), scan = q('scan');
  var slices = Array.prototype.slice.call(stage.querySelectorAll('.beast-slice'));
  var rings = Array.prototype.slice.call(stage.querySelectorAll('.beast-ring'));

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hot = false, mx = 0, my = 0, rx = 0, ry = 0, anims = [], timers = [], tick = 0, hoverT = 0;
  var growlStart = -1e9, glitchUntil = 0, nextGlitch = 0, nextAuto = 0, introEnd = 0;
  var nextBlink = 0, blinkAt = -1e9, blinkDouble = false;
  var tr, trG, gl, sp, nd, dt, rp, raf = 0, visible = true;

  function A(el, kf, o) {
    var opts = { fill: 'both' };
    for (var k in o) opts[k] = o[k];
    var a = el.animate(kf, opts);
    anims.push(a);
    return a;
  }

  function prep(svg) {
    function uniq(sel) {
      var seen = {};
      return Array.prototype.slice.call(svg.querySelectorAll(sel)).filter(function (p) {
        var k = p.getAttribute('d');
        if (seen[k]) { p.remove(); return false; }
        seen[k] = true;
        return true;
      });
    }
    function start(p) {
      var m = p.getAttribute('d').match(/M\s*([\d.]+)\s+([\d.]+)/);
      return m ? [+m[1], +m[2]] : [280, 300];
    }
    // distancia a la costura entre el lado orgánico y el lado máquina: el
    // circuito se dibuja desde ahí hacia afuera
    function seam(x, y) { return Math.hypot(Math.max(0, x - 268), (y - 230) * 0.35); }
    function g(c) { return svg.querySelector('g.' + c); }
    ['gl', 'tr', 'fl', 'sp'].forEach(function (c) {
      var s = g(c).style; s.fill = 'none'; s.strokeLinecap = 'round'; s.strokeLinejoin = 'round';
    });
    gl = g('gl'); trG = g('tr');
    gl.style.stroke = CY; gl.style.opacity = 0; gl.style.filter = 'url(#b)';
    trG.style.stroke = CY;
    g('fl').style.stroke = CY; g('fl').style.opacity = 0;
    g('sp').style.stroke = '#e6f8ff'; g('sp').style.filter = 'url(#b)';

    tr = uniq('g.tr path').map(function (p) {
      var xy = start(p);
      p.setAttribute('pathLength', 100);
      p.style.strokeDasharray = '100 100'; p.style.strokeDashoffset = 100;
      return { el: p, d: seam(xy[0], xy[1]) };
    });
    uniq('g.gl path'); uniq('g.fl path');
    sp = uniq('g.sp path').map(function (p) {
      p.setAttribute('pathLength', 100);
      p.style.strokeDasharray = '7 200'; p.style.strokeDashoffset = 7; p.style.opacity = 0;
      var L = p.getTotalLength();
      return { el: p, end: p.getPointAtLength(L), len: L };
    }).filter(function (s) { return s.len > 40; });
    nd = Array.prototype.slice.call(svg.querySelectorAll('g.nd circle')).map(function (c) {
      var s = c.style;
      s.fill = '#05101C'; s.stroke = CY; s.strokeWidth = 2.5; s.transformBox = 'fill-box'; s.transformOrigin = 'center'; s.opacity = 0;
      var x = +c.getAttribute('cx'), y = +c.getAttribute('cy');
      return { el: c, x: x, y: y, d: seam(x, y) };
    });
    dt = Array.prototype.slice.call(svg.querySelectorAll('g.dt circle')).map(function (c) {
      c.style.fill = CY; c.style.opacity = 0; return c;
    });
    rp = Array.prototype.slice.call(svg.querySelectorAll('g.rp circle')).map(function (c) {
      var s = c.style;
      s.fill = 'none'; s.stroke = CY; s.strokeWidth = 1; s.transformBox = 'fill-box'; s.transformOrigin = 'center'; s.opacity = 0;
      return { el: c, x: +c.getAttribute('cx'), y: +c.getAttribute('cy') };
    });
    var max = Math.max.apply(null, tr.map(function (t) { return t.d; }).concat(nd.map(function (n) { return n.d; })));
    tr.forEach(function (t) { t.d /= max; });
    nd.forEach(function (n) { n.d /= max; });
  }

  function stopAll() {
    anims.forEach(function (a) { a.cancel(); });
    anims = []; clearTimeout(tick); timers.forEach(clearTimeout); timers = []; introEnd = 0;
  }

  function play() {
    if (!tr) return;
    stopAll();
    var sp1 = 1 / SPEED, ease = 'cubic-bezier(.22,.8,.24,1)';
    var draw = 1400 * sp1, t0 = 500 * sp1;
    if (reduced) {
      base.style.opacity = 1; mark.style.opacity = 1; eyes.style.opacity = 0.85; scan.style.opacity = 0.5;
      tr.forEach(function (t) { t.el.style.strokeDashoffset = 0; t.el.style.opacity = 0.25; });
      nd.forEach(function (n) { n.el.style.opacity = 1; });
      dt.forEach(function (d) { d.style.opacity = 0.7; });
      return;
    }
    var hand = t0 + draw + 500 * sp1;
    introEnd = performance.now() + hand + 1000 * sp1;
    nextGlitch = introEnd + 1500; nextAuto = introEnd + 2500;
    A(base, [{ opacity: 0, transform: 'scale(.97)', filter: 'blur(6px)' }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }], { duration: 700 * sp1, easing: ease });
    [mark, eyes, scan].forEach(function (el) { A(el, [{ opacity: 0 }, { opacity: 0 }], { duration: 1 }); });
    A(gl, [{ opacity: 0 }, { opacity: 0 }], { duration: 1 });
    tr.forEach(function (t) {
      A(t.el, [{ strokeDashoffset: 100, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }], { delay: t0 + t.d * draw, duration: 650 * sp1, easing: ease });
    });
    nd.forEach(function (n) {
      A(n.el, [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1.6)', fill: '#e6f8ff', offset: 0.45 }, { opacity: 1, transform: 'scale(1)', fill: '#05101C' }], { delay: t0 + n.d * draw + 450 * sp1, duration: 500 * sp1, easing: 'ease-out' });
    });
    dt.forEach(function (d, i) { A(d, [{ opacity: 0 }, { opacity: 0.8 }], { delay: t0 + draw + i * 25, duration: 300 }); });
    A(mark, [{ opacity: 0 }, { opacity: 1 }], { delay: hand, duration: 700 * sp1, easing: 'ease-out' });
    A(scan, [{ opacity: 0 }, { opacity: 0.55 }], { delay: hand, duration: 900 * sp1 });
    tr.forEach(function (t) {
      A(t.el, [{ strokeDashoffset: 0, opacity: 1 }, { strokeDashoffset: 0, opacity: 0.18 }], { delay: hand, duration: 900 * sp1 });
    });
    A(gl, [{ opacity: 0 }, { opacity: 0.5, offset: 0.3 }, { opacity: 0.18 }], { delay: t0 + draw * 0.6, duration: 1800 * sp1 });
    A(eyes, [0, 0.9, 0.1, 1, 0.35, 1].map(function (o) { return { opacity: o }; }), { delay: hand + 350 * sp1, duration: 650, easing: 'steps(1,end)' });
    A(halo, [{ opacity: 0 }, { opacity: 0.9 }], { delay: t0, duration: draw });
    A(halo2, [{ opacity: 0 }, { opacity: 0.7 }], { delay: hand, duration: 1200 });
    timers.push(setTimeout(function () { glitch(260); schedule(); }, hand + 900 * sp1));
  }

  function schedule() {
    if (visible && sp.length) packet(sp[Math.floor(Math.random() * sp.length)], Math.random() < 0.22 ? MAG : null);
    var b = hot ? 380 : 1300;
    tick = setTimeout(schedule, (b + Math.random() * b) / TRAFFIC);
  }

  function near(list, p) {
    var best = { n: null, d: 30 };
    list.forEach(function (n) {
      var d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < best.d) best = { n: n, d: d };
    });
    return best.n;
  }

  // un pulso de luz viaja por una traza y al llegar enciende el nodo del final
  function packet(s, color) {
    s.el.style.stroke = color || '';
    var a = s.el.animate([{ strokeDashoffset: 7, opacity: 1 }, { strokeDashoffset: -100, opacity: 1 }], { duration: 600 + s.len * 3.2, easing: 'cubic-bezier(.5,0,.5,1)' });
    a.onfinish = function () {
      var n = near(nd, s.end), hotC = color || '#e6f8ff';
      if (n) n.el.animate([{ transform: 'scale(1)', fill: '#05101C' }, { transform: 'scale(1.5)', fill: hotC, offset: 0.2 }, { transform: 'scale(1)', fill: '#05101C' }], { duration: 700, easing: 'ease-out' });
      var r = near(rp, s.end);
      if (r) {
        r.el.style.stroke = color || CY;
        r.el.animate([{ opacity: 0.9, transform: 'scale(2)' }, { opacity: 0, transform: 'scale(9)' }], { duration: 900, easing: 'ease-out' });
      }
    };
  }

  function glitch(ms) { glitchUntil = Math.max(glitchUntil, performance.now() + ms); }

  function growl() {
    var now = performance.now();
    if (!introEnd || now < introEnd || now - growlStart < 1600) return;
    growlStart = now; nextAuto = now + AUTO_GROWL * 1000 + 1600;
    glitch(160);
    setTimeout(function () { glitch(220); }, 420);
    setTimeout(function () { glitch(120); }, 900);
    trG.animate([{ stroke: CY }, { stroke: MAG, offset: 0.2 }, { stroke: MAG, offset: 0.7 }, { stroke: CY }], { duration: 1400 });
    tr.forEach(function (t) {
      t.el.animate([{ opacity: 0.18 }, { opacity: 1, offset: 0.2 }, { opacity: 0.9, offset: 0.7 }, { opacity: 0.18 }], { duration: 1400, easing: 'ease-out' });
    });
    sp.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 10).forEach(function (s, i) {
      setTimeout(function () { packet(s, MAG); }, 150 + i * 40);
    });
    rings.forEach(function (r, i) {
      r.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 0.9, transform: 'scale(.7)', offset: 0.1 }, { opacity: 0, transform: 'scale(3.2)' }],
        { delay: 220 + i * 160, duration: 900, easing: 'ease-out', fill: 'backwards' });
    });
  }

  function ss(a, b, x) { var k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); }

  function frame(now) {
    raf = visible ? requestAnimationFrame(frame) : 0;
    var t = now / 1000, idle = introEnd && now > introEnd;

    if (idle) {
      if (AUTO_GROWL > 0 && now > nextAuto) growl();
      if (now > nextGlitch) { glitch(80 + Math.random() * 120); nextGlitch = now + 3500 + Math.random() * 4500; }
    }

    // gruñido: el hocico se arruga y la mandíbula baja
    var gt = (now - growlStart) / 1300;
    var open = gt >= 0 && gt <= 1 ? ss(0.08, 0.22, gt) * (1 - ss(0.72, 1, gt)) : 0;
    var pull = gt >= 0 && gt < 0.14 ? Math.sin(gt / 0.14 * Math.PI) : 0;
    var vis = open > 0.001 ? 1 : 0;
    jaw.style.opacity = vis; snout.style.opacity = vis; mouth.style.opacity = vis;
    jaw.style.transform = 'translateY(' + (open * 4.4) + '%)';
    snout.style.transform = 'translateY(' + (-open * 1.1) + '%) scaleY(' + (1 - open * 0.05) + ')';
    mouth.style.transform = 'scaleY(' + Math.min(1, open * 1.05) + ')';

    // parpadeo, a veces doble
    if (idle && !nextBlink) nextBlink = now + 1200;
    if (idle && now > nextBlink && open < 0.01) {
      blinkAt = now; blinkDouble = Math.random() < 0.3;
      nextBlink = now + 2600 + Math.random() * 3800;
    }
    var bt = (now - blinkAt) / 170;
    var lid = bt >= 0 && bt < 1 ? Math.sin(bt * Math.PI) : 0;
    if (blinkDouble && bt >= 1.4 && bt < 2.4) lid = Math.sin((bt - 1.4) * Math.PI);
    lid = Math.min(1, lid * 1.15);
    var lt = 'translate(' + (rx * 4) + 'px, ' + (ry * 4) + 'px) scaleY(' + lid + ')';
    lidL.style.transform = lt; lidR.style.transform = lt;

    // cabeza: parallax con el mouse, embestida y temblor durante el gruñido
    rx += ((PARALLAX ? mx : 0) - rx) * 0.06; ry += ((PARALLAX ? my : 0) - ry) * 0.06;
    var trem = open > 0.15 ? open : 0, jx = (Math.random() - 0.5) * 3.2 * trem, jy = (Math.random() - 0.5) * 2.2 * trem;
    head.style.transform = 'translate(' + jx + 'px, ' + (jy + pull * -3) + 'px) scale(' + (1 - pull * 0.015 + open * 0.025) + ')';
    svgBox.style.transform = 'translate(' + (rx * 7) + 'px, ' + (ry * 7) + 'px)';
    eyes.style.transform = 'translate(' + (rx * 4) + 'px, ' + (ry * 4) + 'px)';
    halo.style.transform = 'translate(' + (rx * -6) + 'px, ' + (ry * -6) + 'px)';

    if (idle) {
      var br = 0.78 + 0.18 * Math.sin(t * 1.3) + (hot ? 0.15 : 0) + open * 0.4;
      eyes.style.opacity = Math.min(1, br) * (1 - lid);
      eyes.style.filter = open > 0.25
        ? 'hue-rotate(95deg) saturate(2.2) brightness(1.5) drop-shadow(0 0 12px ' + MAG + ')'
        : 'drop-shadow(0 0 ' + (hot ? 10 : 5) + 'px rgba(76,198,242,.9))';
      halo.style.opacity = 0.65 + 0.2 * Math.sin(t * 0.9) + (hot ? 0.25 : 0);
      halo2.style.opacity = 0.55 + 0.15 * Math.sin(t * 0.7 + 2) + open * 0.8;
    }

    // glitch: separación RGB y cortes horizontales
    var g = now < glitchUntil ? 1 : 0, amt = g * GLITCH + open * 0.6 * GLITCH, k = amt > 0 ? 1 : 0;
    rgbC.style.opacity = k * 0.45; rgbM.style.opacity = k * 0.45;
    if (k) {
      var off = (2 + Math.random() * 6) * Math.min(1.5, amt);
      rgbC.style.transform = 'translate(' + (-off) + 'px, ' + ((Math.random() - 0.5) * 2) + 'px)';
      rgbM.style.transform = 'translate(' + off + 'px, ' + ((Math.random() - 0.5) * 2) + 'px)';
    }
    slices.forEach(function (el) {
      if (g && Math.random() < 0.7) {
        var top = Math.random() * 90, h = 1 + Math.random() * 6;
        el.style.opacity = 1;
        el.style.clipPath = 'inset(' + top + '% 0 ' + Math.max(0, 100 - top - h) + '% 0)';
        el.style.transform = 'translateX(' + ((Math.random() - 0.5) * 28 * Math.min(1.5, amt)) + 'px)';
        el.style.filter = Math.random() < 0.5 ? 'drop-shadow(2px 0 0 ' + MAG + ')' : 'drop-shadow(-2px 0 0 #00e5ff)';
      } else {
        el.style.opacity = 0;
      }
    });
    if (idle) scan.style.transform = 'translateY(' + ((t * 6) % 3) + 'px)';
  }

  fetch(CIRCUITS).then(function (r) { return r.text(); }).then(function (txt) {
    // el SVG trae su propia animación CSS (la del logo anterior): se descarta,
    // acá la maneja este script
    svgBox.innerHTML = txt.replace(/<metadata>[\s\S]*?<\/metadata>/, '').replace(/<style>[\s\S]*?<\/style>/, '');
    var svg = svgBox.querySelector('svg');
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.style.width = '100%'; svg.style.height = '100%'; svg.style.display = 'block'; svg.style.overflow = 'visible';
    prep(svg);
    stage.classList.add('is-live');

    window.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      mx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / r.width));
      my = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / r.height));
    }, { passive: true });
    stage.addEventListener('click', growl);
    stage.addEventListener('pointerenter', function () {
      hot = true; clearTimeout(hoverT);
      hoverT = setTimeout(function () { if (hot) growl(); }, 700);
    });
    stage.addEventListener('pointerleave', function () { hot = false; clearTimeout(hoverT); });

    if (!reduced && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
      }).observe(stage);
    }
    if (!reduced) raf = requestAnimationFrame(frame);
    play();
  }).catch(function () { /* sin circuitos queda el logo estático */ });
})();
