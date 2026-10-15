/* =========================================================
   main.js — UI behaviour & animations
   ========================================================= */
(function () {
  'use strict';

  /* ---------- CONFIG: edit these ---------- */
  var CONFIG = {
    // Lines that type out under the headline
    roles: [
      'Native Android apps in Java',
      'Clean, maintainable software architecture',
      'Data-driven apps with MySQL',
      'Interactive experiences with JavaScript'
    ],
    // Contact form: with no endpoint, the form opens the visitor's email app.
    // To receive messages directly, paste a Formspree (or similar) URL, e.g.
    // 'https://formspree.io/f/xxxxxxxx'
    contactEmail: 'you@example.com',
    formEndpoint: ''
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof gsap !== 'undefined';
  var hasST = hasGSAP && typeof ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Footer year ---------- */
  function initYear() {
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Preloader ---------- */
  function initPreloader(done) {
    var pre = $('#preloader');
    if (!pre) { document.body.classList.remove('is-loading'); done(); return; }

    var bar = $('.pre-bar span', pre);
    var num = $('.pre-count', pre);
    var progress = 0;
    var loaded = document.readyState === 'complete';
    var finished = false;
    window.addEventListener('load', function () { loaded = true; });

    function finish() {
      if (finished) return;
      finished = true;
      pre.classList.add('is-done');
      document.body.classList.remove('is-loading');
      setTimeout(function () { pre.remove(); }, 900);
      done();
    }

    (function tick() {
      progress = Math.min(100, progress + Math.random() * 14 + 4);
      bar.style.width = progress + '%';
      num.textContent = Math.floor(progress);
      if (progress < 100) setTimeout(tick, 70);
      else if (loaded) setTimeout(finish, 250);
      else setTimeout(tick, 120);
    })();

    setTimeout(finish, 4000); // safety net
  }

  /* ---------- Typing effect ---------- */
  function initTyped() {
    var el = $('#typed');
    if (!el) return;
    if (reduceMotion) { el.textContent = CONFIG.roles[0]; return; }

    var r = 0, i = 0, deleting = false;
    (function step() {
      var word = CONFIG.roles[r];
      el.textContent = word.slice(0, i);
      if (!deleting && i === word.length) { deleting = true; return setTimeout(step, 1700); }
      if (deleting && i === 0) { deleting = false; r = (r + 1) % CONFIG.roles.length; return setTimeout(step, 350); }
      i += deleting ? -1 : 1;
      setTimeout(step, deleting ? 26 : 60);
    })();
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    var nav = $('#nav'), toggle = $('.nav-toggle'), links = $('#nav-links');
    var bar = $('.progress span');

    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 30);
      var h = document.documentElement;
      var max = h.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    }
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    $$('a', links).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) setMenu(false); });

    // Highlight the link of the section in view
    var map = {};
    $$('a[data-link]', links).forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          Object.keys(map).forEach(function (k) { map[k].classList.remove('active'); });
          if (map[en.target.id]) map[en.target.id].classList.add('active');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main section[id]').forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- Cursor glow ---------- */
  function initCursor() {
    var glow = $('.cursor-glow');
    if (!glow) return;
    if (!finePointer || reduceMotion) { glow.remove(); return; }

    var x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      glow.classList.toggle('active', !!(e.target.closest && e.target.closest('a, button, .tilt, input, textarea')));
    });
    (function loop() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      glow.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 3D tilt cards ---------- */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$('.tilt').forEach(function (el) {
      var max = parseFloat(el.dataset.tilt || 8);
      var raf = null;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
          el.style.setProperty('--rx', ((0.5 - py) * 2 * max).toFixed(2) + 'deg');
          el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
          el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        });
      });
      el.addEventListener('pointerleave', function () {
        cancelAnimationFrame(raf);
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }
  
var CONFIG = {
  roles: [
    'Full Stack Web Developer',
    'Native Android apps in Java',
    'REST APIs with Node.js & MySQL',
    'Clean, maintainable architecture',
    'Responsive front-ends with JavaScript'
  ],
  contactEmail: 'umairyasin911410@gmail.com',
  formEndpoint: ''
};

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!finePointer || reduceMotion || !hasGSAP || !gsap.quickTo) return;
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Hero intro (runs once after the preloader) ---------- */
  function heroIntro() {
    if (!hasGSAP || reduceMotion) return;
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.eyebrow', { y: 20, opacity: 0, duration: 0.8 })
      .from('.headline .inner', { yPercent: 110, duration: 1.1, stagger: 0.12 }, '-=0.5')
      .from('.typed-line', { opacity: 0, y: 16, duration: 0.7 }, '-=0.6')
      .from('.hero .lead', { opacity: 0, y: 20, duration: 0.8 }, '-=0.55')
      .from('.hero .cta', { opacity: 0, y: 24, duration: 0.8 }, '-=0.6')
      .from('.hero-chips li', { opacity: 0, y: 16, duration: 0.6, stagger: 0.06 }, '-=0.5');
    // clearProps keeps the nav free of a leftover transform (it holds the mobile menu)
    gsap.from('.nav', { yPercent: -120, opacity: 0, duration: 1, ease: 'power4.out', delay: 0.2, clearProps: 'transform,opacity' });
  }

  /* ---------- Scroll-triggered animations ---------- */
  function initScrollAnimations() {
    var bars = $$('.skill-card');

    if (!hasST || reduceMotion) {
      bars.forEach(function (card) {
        var n = $('.skill-num', card);
        if (n && n.dataset.label) n.textContent = n.dataset.label;
      });
      return;
    }

    // Fade/slide reveals
    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, {
        y: 44, opacity: 0, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
    $$('[data-stagger]').forEach(function (group) {
      gsap.from(group.children, {
        y: 50, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: group, start: 'top 85%', once: true }
      });
    });

    // Skill bars + percentage counters
    bars.forEach(function (card) {
      var fill = $('.skill-fill', card);
      var num = $('.skill-num', card);
      var level = parseFloat(fill.dataset.level);
      var counter = { v: 0 };
      var trigger = { trigger: card, start: 'top 88%', once: true };

      gsap.fromTo(fill, { width: '0%' }, { width: level + '%', duration: 1.6, delay: 0.2, ease: 'power3.out', scrollTrigger: trigger });
      gsap.to(counter, {
        v: level, duration: 1.6, delay: 0.2, ease: 'power3.out', scrollTrigger: trigger,
        onUpdate: function () { num.textContent = Math.round(counter.v) + '%'; },
        onComplete: function () { if (num.dataset.label) num.textContent = num.dataset.label; }
      });
    });

    // Hero content drifts up and fades as you leave it
    gsap.to('.hero-inner', {
      yPercent: -10, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true }
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ---------- Project filter ---------- */
  function initFilter() {
    var buttons = $$('.filter button');
    var cards = $$('.project');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        var f = btn.dataset.filter;
        cards.forEach(function (c) { c.hidden = !(f === 'all' || c.dataset.cat === f); });
        var visible = cards.filter(function (c) { return !c.hidden; });
        if (hasGSAP && !reduceMotion) {
          gsap.fromTo(visible, { y: 30, opacity: 0, scale: 0.96 },
            { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity' });
        }
        if (hasST) ScrollTrigger.refresh();
      });
    });
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    var form = $('#contact-form');
    if (!form) return;
    var status = $('.form-status', form);
    var btn = $('button[type="submit"]', form);

    var rules = {
      name: function (v) { return v.trim().length >= 2 || 'Enter your name.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.'; },
      message: function (v) { return v.trim().length >= 10 || 'Write at least 10 characters.'; }
    };

    function check(input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var res = rule(input.value);
      var ok = res === true;
      var field = input.closest('.field');
      field.classList.toggle('invalid', !ok);
      $('.err', field).textContent = ok ? '' : res;
      return ok;
    }
    function setStatus(msg, type) {
      status.textContent = msg;
      status.className = 'form-status' + (type ? ' ' + type : '');
    }

    $$('input[name], textarea[name]', form).forEach(function (input) {
      input.addEventListener('blur', function () { check(input); });
      input.addEventListener('input', function () {
        if (input.closest('.field').classList.contains('invalid')) check(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('input[name], textarea[name]', form).filter(function (i) { return i.name !== 'company'; });
      var valid = fields.map(check).every(Boolean);
      if (!valid) { setStatus('Fix the highlighted fields and try again.', 'error'); return; }
      if (form.elements.company.value) return; // honeypot caught a bot

      var data = {};
      fields.forEach(function (i) { data[i.name] = i.value.trim(); });

      btn.classList.add('loading');
      btn.disabled = true;
      setStatus('');

      var finishUI = function () { btn.classList.remove('loading'); btn.disabled = false; };

      if (CONFIG.formEndpoint) {
        fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          form.reset();
          $$('.field', form).forEach(function (f) { f.classList.remove('invalid'); });
          setStatus('Message sent. Thank you, I\'ll reply soon.', 'success');
        }).catch(function () {
          setStatus('The message could not be sent. Try again or email me directly.', 'error');
        }).then(finishUI);
      } else {
        var subject = encodeURIComponent('Portfolio message from ' + data.name);
        var body = encodeURIComponent(data.message + '\n\n' + data.name + ' (' + data.email + ')');
        window.location.href = 'mailto:' + CONFIG.contactEmail + '?subject=' + subject + '&body=' + body;
        setStatus('Opening your email app to send the message.', 'success');
        setTimeout(finishUI, 800);
      }
    });
  }

  /* ---------- Boot ---------- */
  initYear();
  initNav();
  initCursor();
  initTilt();
  initMagnetic();
  initFilter();
  initForm();
  initScrollAnimations();
  initPreloader(function () {
    heroIntro();
    initTyped();
  });
})();
