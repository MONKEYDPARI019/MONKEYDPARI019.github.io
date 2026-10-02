/* Page behaviour: theme, nav, smooth scroll, reveals, hero Mochi, pinned
   DeskBuddy walkthrough, project tabs, code copy, boot screen. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var motion = hasGsap && !reduce;
  var M = window.Mochi;
  if (motion) doc.classList.add('motion');

  /* ---------------- theme ---------------- */
  var themeBtn = $('#themeBtn');
  function syncThemeBtn() {
    var d = doc.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', d ? 'Switch to light theme' : 'Switch to dark theme');
  }
  themeBtn.addEventListener('click', function () {
    var next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', next);
    try { localStorage.setItem('db-theme', next); } catch (e) {}
    syncThemeBtn();
  });
  syncThemeBtn();
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- smooth scroll (Lenis) ---------------- */
  var lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function navH() { return $('#nav').offsetHeight; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href'); if (id.length < 2) return;
    var t = document.getElementById(id.slice(1)); if (!t) return;
    e.preventDefault();
    if (window.__bootFinish) window.__bootFinish(true);
    if (lenis) lenis.start();
    var land = (id !== '#top' && t.querySelector('.sec-head, .win')) || t;
    if (lenis) lenis.scrollTo(land, { offset: id === '#top' ? 0 : -navH() - 28, duration: 0.9 });
    else land.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
    if (id !== '#top') { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
  });

  /* ---------------- nav: hide on scroll down, active indicator ---------------- */
  var nav = $('#nav'), lastY = window.scrollY;
  function onScroll(y) { nav.classList.toggle('is-scrolled', y > 8); lastY = y; }
  if (lenis) lenis.on('scroll', function (l) { onScroll(l.scroll); });
  else window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });
  nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });

  var ind = $('#navInd'), links = $$('#navLinks a');
  function setActive(id) {
    var a = null;
    links.forEach(function (l) { var on = l.getAttribute('href') === '#' + id; l.classList.toggle('is-active', on); if (on) a = l; if (on) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
    if (a && ind) { ind.style.opacity = 1; ind.style.width = (a.offsetWidth - 20) + 'px'; ind.style.transform = 'translateX(' + (a.offsetLeft + 10) + 'px)'; }
    else if (ind) ind.style.opacity = 0;
  }
  if ('IntersectionObserver' in window) {
    var secs = ['about', 'deskbuddy', 'simulator', 'projects', 'contact'].map(function (i) { return document.getElementById(i); }).filter(Boolean);
    var vis = {};
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
      var cur = null; secs.forEach(function (s) { if (vis[s.id]) cur = cur || s.id; });
      setActive(cur);
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ---------------- hero Mochi: follows cursor, blinks, changes mood ---------------- */
  var hf = $('#heroFace'), heroMood = 'default', heroBlink = false;
  function drawHero() { if (hf && M) hf.innerHTML = M.face(heroBlink ? 'blink' : heroMood); }
  drawHero();
  if (hf && !reduce) {
    var px = 0, py = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) {
      var r = hf.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      tx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2))) * 6;
      ty = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2))) * 4;
    }, { passive: true });
    (function loop() {
      px += (tx - px) * 0.12; py += (ty - py) * 0.12;
      var p = hf.querySelector('.pupil');
      if (p) p.setAttribute('transform', 'translate(' + Math.round(px) + ' ' + Math.round(py) + ')');
      requestAnimationFrame(loop);
    })();
    (function blink() {
      setTimeout(function () {
        if (heroMood === 'default') { heroBlink = true; drawHero(); setTimeout(function () { heroBlink = false; drawHero(); }, 130); }
        blink();
      }, 3000 + Math.random() * 3000);
    })();
    var moods = ['happy', 'love', 'wink', 'star', 'cute', 'smug'], mi = 0;
    setInterval(function () {
      heroMood = moods[mi++ % moods.length]; drawHero();
      setTimeout(function () { heroMood = 'default'; drawHero(); }, 1600);
    }, 7000);
  }

  /* ---------------- pinned DeskBuddy walkthrough ---------------- */
  var pinOled = $('#pinOled'), steps = $$('#pinSteps .pstep'), pinLabel = $('#pinLabel'), pbar = $('.pbar');
  var NOTE = { app: 'WhatsApp', title: 'Mom', msg: 'Dinner is ready' };
  var curStep = -1, pinMood = 'happy';
  if (pbar) { for (var i = 0; i < 20; i++) pbar.appendChild(document.createElement('i')); }
  function pinDraw() {
    if (!pinOled || curStep < 0) return;
    var s = steps[curStep].getAttribute('data-screen');
    var o = { unread: s === 'notify' || s === 'pomo' ? 1 : 0, city: 'Bengaluru', demo: true, temp: 28, note: NOTE, idx: 1, count: 1, pomoLeft: 18 * 60 + 42, pomoRun: true, mood: pinMood };
    pinOled.innerHTML = s === 'mochi' ? M.face(pinMood) : M.screen(s, o);
    $('#pinLedY').classList.toggle('on', o.unread > 0);
  }
  function setStep(i, prog) {
    i = Math.max(0, Math.min(steps.length - 1, i));
    if (prog != null && pbar) {
      var n = Math.round(prog * 20);
      $$('i', pbar).forEach(function (b, k) { b.classList.toggle('on', k < n); });
    }
    if (i === curStep) return;
    curStep = i;
    steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    pinLabel.textContent = steps[i].querySelector('h3').textContent;
    pinDraw();
  }
  setInterval(function () { if (curStep === 0) pinDraw(); }, 1000);
  setInterval(function () { if (curStep === 2) { pinMood = pinMood === 'happy' ? 'love' : pinMood === 'love' ? 'wink' : 'happy'; pinDraw(); } }, 1400);
  function stepsByObserver() {
    // stacked layout / no-motion: whichever step crosses the middle of the screen is active
    var io2 = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { var k = steps.indexOf(e.target); setStep(k, (k + 1) / steps.length); } });
    }, { rootMargin: '-40% 0px -45% 0px' });
    steps.forEach(function (s) { io2.observe(s); });
  }
  setStep(0, 0.2);

  /* ---------------- project tabs ---------------- */
  function hl(src) {
    var re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])')|(^[ \t]*#\w+)|\b(void|int|float|double|bool|char|const|unsigned|long|uint8_t|uint16_t|uint32_t|uint64_t|int16_t|int32_t|byte|String|struct|if|else|for|while|return|switch|case|break|static|true|false|HIGH|LOW|OUTPUT|INPUT|INPUT_PULLUP|define|include|auto|enum|class|new|delete|nullptr|NULL)\b|\b(\d+(?:\.\d+)?[fFLlUu]*|0x[0-9A-Fa-f]+[LlUu]*)\b/gm;
    var out = '', last = 0, m;
    function e(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    while ((m = re.exec(src))) {
      out += e(src.slice(last, m.index));
      var cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'p' : m[4] ? 'k' : 'n';
      out += '<span class="' + cls + '">' + e(m[0]) + '</span>';
      last = re.lastIndex;
    }
    return out + e(src.slice(last));
  }
  function highlight(panel) {
    $$('code', panel).forEach(function (c) { if (!c.dataset.hl) { c.dataset.hl = 1; c.innerHTML = hl(c.textContent); } });
  }
  function drawCircuit(panel) {
    if (!motion) return;
    var paths = $$('.tr', panel);
    paths.forEach(function (p) { var L = 1200; try { L = Math.ceil(p.getTotalLength()); } catch (e) {} p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    gsap.to(paths, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out', stagger: 0.03, onComplete: function () { paths.forEach(function (p) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }); } });
  }
  var refreshT;
  function refresh() { if (!hasGsap) return; clearTimeout(refreshT); refreshT = setTimeout(function () { ScrollTrigger.refresh(); }, 120); }

  $$('.pcard').forEach(function (card) {
    var tabs = $$('[role="tab"]', card), box = $('.ppanels', card);
    function select(tab, focus) {
      if (tab.getAttribute('aria-selected') === 'true') return;
      var h0 = box.offsetHeight;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        $('.ob-st', t).textContent = on ? 'ON' : 'OFF';
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (/-code$/.test(panel.id)) highlight(panel);
      if (/-circuit$/.test(panel.id)) drawCircuit(panel);
      if (focus) tab.focus();
      if (motion) {
        var h1 = box.offsetHeight;
        gsap.fromTo(box, { height: h0 }, { height: h1, duration: 0.35, ease: 'power2.inOut', clearProps: 'height', onComplete: refresh });
        gsap.fromTo(panel, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'steps(4)', clearProps: 'opacity,transform' });
      } else refresh();
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(k + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(k - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* copy code */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.copybtn'); if (!b) return;
    var c = document.getElementById(b.dataset.copy); if (!c) return;
    var txt = c.textContent;
    function done(ok) {
      b.textContent = ok ? 'COPIED' : 'PRESS CTRL+C'; b.classList.toggle('is-done', ok);
      setTimeout(function () { b.textContent = 'COPY'; b.classList.remove('is-done'); }, 1600);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(fallback()); });
    else done(fallback());
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = 0;
      document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (er) {} ta.remove(); return ok;
    }
  });

  /* ---------------- static mode (no GSAP or reduced motion) ---------------- */
  if (!motion) {
    doc.classList.add('no-pin');
    stepsByObserver();
    return;
  }

  /* ---------------- GSAP motion ---------------- */
  gsap.registerPlugin(ScrollTrigger);

  // reveals
  // reveals: CSS transition toggled by IntersectionObserver, with a scroll
  // fallback so nothing can stay hidden (e.g. after jumping to a section)
  var pending = $$('.reveal');
  function show(el, i) { if (el.classList.contains('is-in')) return; el.style.transitionDelay = Math.min(i || 0, 4) * 60 + 'ms'; el.classList.add('is-in'); }
  function sweep() {
    var vh = window.innerHeight;
    pending = pending.filter(function (el) { if (el.getBoundingClientRect().top < vh * 0.95) { show(el); return false; } return true; });
  }
  var rio = new IntersectionObserver(function (en) {
    var k = 0;
    en.forEach(function (e) { if (e.isIntersecting) { show(e.target, k++); rio.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  pending.forEach(function (el) { rio.observe(el); });
  window.addEventListener('scroll', sweep, { passive: true });
  if (lenis) lenis.on('scroll', sweep);
  setTimeout(sweep, 300);

  // stat counters
  $$('.stat b[data-count]').forEach(function (b) {
    var to = parseFloat(b.dataset.count), dec = (b.dataset.count.split('.')[1] || '').length, o = { v: 0 };
    b.textContent = (0).toFixed(dec);
    ScrollTrigger.create({ trigger: b, start: 'top 90%', once: true, onEnter: function () {
      gsap.to(o, { v: to, duration: 1.2, ease: 'steps(' + Math.min(24, Math.max(4, Math.round(to))) + ')', onUpdate: function () { b.textContent = o.v.toFixed(dec); } });
    } });
  });

  // pinned walkthrough (desktop) / sticky + observer (stacked)
  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', function () {
    var st = ScrollTrigger.create({
      trigger: '#dbPin', start: 'top top+=' + (navH() + 8), end: '+=' + Math.round(window.innerHeight * 1.6),
      pin: true, pinSpacing: true, anticipatePin: 1,
      onUpdate: function (self) { setStep(Math.floor(self.progress * steps.length * 0.999), self.progress); }
    });
    return function () { st.kill(); };
  });
  mm.add('(max-width: 900px)', function () { doc.classList.add('no-pin'); stepsByObserver(); return function () { doc.classList.remove('no-pin'); }; });

  // hero intro (after boot)
  function heroIntro() {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero .kicker', { opacity: 0, y: 10, duration: 0.4 })
      .fromTo('.ht-line', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'steps(10)', stagger: 0.18, clearProps: 'clipPath' }, '-=0.1')
      .from('.hero .lead, .hero-cta, .hero-links', { opacity: 0, y: 16, duration: 0.6, stagger: 0.08 }, '-=0.2')
      .from('.hero-shell', { opacity: 0, scale: 0.94, duration: 0.5, ease: 'steps(6)' }, 0.25)
      .from('.hero-cap, .scroll-cue', { opacity: 0, duration: 0.4 }, '-=0.2');
  }

  /* ---------------- boot screen (once per session) ---------------- */
  var booted = false; try { booted = sessionStorage.getItem('db-booted') === '1'; } catch (e) {}
  if (booted) { heroIntro(); return; }
  try { sessionStorage.setItem('db-booted', '1'); } catch (e) {}

  var boot = document.createElement('div');
  boot.className = 'boot'; boot.setAttribute('role', 'presentation');
  boot.innerHTML = '<div class="boot-in"><div class="boot-title">DESKBUDDY OS v2.0</div>' +
    '<div class="bl" data-t="&gt; init oled ......... "></div><div class="bl" data-t="&gt; wifi link ......... "></div><div class="bl" data-t="&gt; load portfolio .... "></div>' +
    '<svg class="boot-face" viewBox="0 0 128 64">' + M.face('default') + '</svg></div><div class="boot-skip">CLICK OR PRESS ANY KEY TO SKIP</div>';
  document.body.appendChild(boot);
  if (lenis) lenis.stop();
  var lines = $$('.bl', boot), ended = false;
  var btl = gsap.timeline({ onComplete: finish });
  lines.forEach(function (l) {
    var tmp = document.createElement('div'); tmp.innerHTML = l.dataset.t; var full = tmp.textContent;
    var o = { n: 0 };
    btl.to(o, { n: full.length, duration: 0.28, ease: 'steps(' + full.length + ')', onUpdate: function () { l.textContent = full.slice(0, Math.round(o.n)); } });
    btl.add(function () { var s = document.createElement('span'); s.className = 'ok'; s.textContent = 'OK'; l.appendChild(s); }, '+=0.06');
  });
  btl.to($('.boot-face', boot), { opacity: 1, duration: 0.2, ease: 'steps(2)' }, '+=0.05')
     .add(function () { $('.boot-face', boot).innerHTML = M.face('blink'); }, '+=0.25')
     .add(function () { $('.boot-face', boot).innerHTML = M.face('happy'); }, '+=0.12')
     .to({}, { duration: 0.3 });
  function finish(fast) {
    if (ended) return; ended = true; btl.kill(); window.__bootFinish = null;
    if (fast === true) { boot.remove(); if (lenis) lenis.start(); heroIntro(); return; }
    var inner = $('.boot-in', boot);
    gsap.timeline({ onComplete: function () { boot.remove(); if (lenis) lenis.start(); } })
      .to($('.boot-skip', boot), { opacity: 0, duration: 0.1 })
      .to(inner, { scaleY: 0.01, duration: 0.18, ease: 'power2.in' })
      .to(inner, { scaleX: 0, duration: 0.14, ease: 'power2.in' })
      .add(heroIntro)
      .to(boot, { opacity: 0, duration: 0.3, ease: 'steps(4)' }, '-=0.05');
  }
  window.__bootFinish = finish;
  boot.addEventListener('click', function () { finish(); });
  window.addEventListener('keydown', function k() { window.removeEventListener('keydown', k); finish(); });
})();
