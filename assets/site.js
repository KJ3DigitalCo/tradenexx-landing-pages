/* Tradenexx landing pages. Plain JS, no build step. Page config lives in window.TNX. */
(() => {
  'use strict';
  const T = window.TNX || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smooth = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  addEventListener('load', () => requestAnimationFrame(() => document.body.classList.add('ready')));
  setTimeout(() => document.body.classList.add('ready'), 1200); // never leave the page invisible

  /* nav turns solid after the first scroll */
  const nav = $('nav.top'); let navSolid = false;

  addEventListener('scroll', () => { const sd = scrollY > 40; if (sd !== navSolid) { navSolid = sd; nav.classList.toggle('solid', sd); } }, { passive: true });

  /* ---------- PROGRESS-BAR: how far down the page you are (the page height can change, so it is measured each time) ---------- */
  const bar = $('.progress i');
  if (bar) {
    let pt = false, pl = -1;
    const drawBar = () => {
      pt = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0, q = Math.round(p * 1000) / 1000;
      if (q !== pl) { pl = q; bar.style.transform = 'scaleX(' + q + ')'; }
    };
    const kickBar = () => { if (!pt) { pt = true; requestAnimationFrame(drawBar); } };
    addEventListener('scroll', kickBar, { passive: true });
    addEventListener('resize', kickBar);
    drawBar();
  }

  /* ---------- EXPAND-HERO: the video frame opens as the page scrolls (transform/clip only, no layout).
     Once it is fully open it stays open: the hero turns into one plain screen and never shrinks again. ---------- */
  const h3 = $('.hero3');
  if (h3 && !reduced.matches) {
    const vf = $('.vframe', h3), t1 = $('.t1', h3), t2 = $('.t2', h3), vbox = $('.vid', h3);
    let ticking = false, last = -1, latched = false;
    const ease = p => p * p * (3 - 2 * p);
    function apply(p) {
      const W = innerWidth, H = innerHeight;
      const e = ease(p), small = W < 768;
      const w0 = Math.min(300, W * 0.72), hh0 = Math.min(400, H * 0.5);
      const w1 = W * (small ? 0.94 : 0.95), h1 = H * (small ? 0.62 : 0.78);
      const w = w0 + (w1 - w0) * e, hh = hh0 + (h1 - hh0) * e;
      const cy = H * (0.5 + 0.045 * e);
      const left = (W - w) / 2, top = cy - hh / 2;
      vf.style.setProperty('--cs', left.toFixed(1) + 'px');
      vf.style.setProperty('--ct', top.toFixed(1) + 'px');
      vf.style.setProperty('--cb', (H - top - hh).toFixed(1) + 'px');
      vf.style.setProperty('--cr', (24 - 6 * e).toFixed(1) + 'px');
      const tx = (p * 105).toFixed(2);
      t1.style.transform = 'translate3d(-' + tx + 'vw,0,0)';
      t2.style.transform = 'translate3d(' + tx + 'vw,0,0)';
      t1.style.opacity = t2.style.opacity = (1 - smooth(p, 0.55, 0.92)).toFixed(2);
      h3.style.setProperty('--io', (1 - smooth(p, 0, 0.22)).toFixed(2));
      h3.style.setProperty('--bgo', (1 - smooth(p, 0, 0.9)).toFixed(2));
    }
    function latch() {
      if (latched) return;
      latched = true;
      apply(1);
      const y = scrollY, before = h3.offsetHeight;
      h3.classList.add('done');                                   // the tall scroll area goes away: the hero is one screen now
      const removed = before - h3.offsetHeight;
      window.scrollTo({ top: Math.max(0, y - removed), behavior: 'instant' });   // keep everything exactly where it appears on screen
      // from here on the video only plays while it is on screen
      new IntersectionObserver(es => es.forEach(en => {
        if (en.intersectionRatio >= 0.6) { if (vbox.dataset.state === 'ready') mountVideo(vbox, !userActive()); }
        else if (en.intersectionRatio < 0.25 && vbox.dataset.state === 'playing') stopVideo(vbox);
      }), { threshold: [0, 0.25, 0.6] }).observe(h3);
    }
    function draw() {
      ticking = false;
      if (latched) return;
      const rect = h3.getBoundingClientRect();
      const p = Math.round(clamp(-rect.top / (rect.height - innerHeight), 0, 1) * 500) / 500;
      if (p >= 0.98) { latch(); return; }
      if (p === last) return; last = p;
      apply(p);
    }
    const kick = () => { if (!ticking && !latched) { ticking = true; requestAnimationFrame(draw); } };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', () => { if (latched) apply(1); else { last = -1; kick(); } });
    draw();
  }

  /* ---------- photo wall: tilted at first, flattens as you scroll, columns drift (transform only) ---------- */
  $$('.gal-head').forEach(h => {
    if (!('IntersectionObserver' in window)) { h.classList.add('in'); return; }
    const io3 = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { h.classList.add('in'); io3.disconnect(); } }), { threshold: 0.25 });
    io3.observe(h);
  });
  $$('.gal-scroll').forEach(box => {
    if (reduced.matches) return;
    const grid = $('.gal-grid', box), cols = $$('.gal-col', box).map(c => ({ el: c, y: JSON.parse(c.dataset.y) }));
    const lerp = (a, b2, t) => a + (b2 - a) * t, seg = (p, a, b2) => clamp((p - a) / (b2 - a), 0, 1);
    let ticking = false, last = -1;
    function draw() {
      ticking = false;
      const r = box.getBoundingClientRect(), H = innerHeight;
      const p = clamp((H - r.top) / (r.height + H), 0, 1), q = Math.round(p * 1000) / 1000;   // same progress framer's useScroll gives for this element
      if (q === last) return; last = q;
      grid.style.transform = 'rotateX(' + lerp(75, 0, seg(p, 0, 0.5)).toFixed(2) + 'deg) scale(' + lerp(1.2, 1, seg(p, 0.5, 0.9)).toFixed(4) + ')';
      const t = seg(p, 0.5, 1);
      cols.forEach(c => { c.el.style.transform = 'translate3d(0,' + lerp(c.y[0], c.y[1], t).toFixed(2) + '%,0)'; });
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    addEventListener('resize', () => { last = -1; draw(); });
    draw();
  });

  /* ---------- GRID-PULSE: cells take colour where the pointer passes, then let go. A few light on their own. ---------- */
  $$('.gp').forEach(el => {
    if (reduced.matches) return;
    const paper = $('canvas', el), ctx = paper.getContext('2d'), host = el.parentElement, avoid = el.dataset.avoid || '';
    const CELL = 24, REACH = 2.6, AMBIENT = 2, MAXLIT = 180, FAINT = 0.13, FADE = 2.2, PAD = 5, FADE_IN = 160, FADE_OUT = 750;
    // Tradenexx blues instead of a rainbow: the hue drifts a little down the field, lightness varies per cell
    const HUE_TOP = 222, HUE_SPAN = 22, TINTS = [92, 86, 80, 74, 68];
    const easeOut = t => 1 - (1 - t) * (1 - t), easeIn = t => t * t;
    let cols = 1, rows = 1, width = 0, height = 0, clear = [];
    const cells = new Map();

    function measureText() {
      const b = el.getBoundingClientRect();
      clear = [];
      $$(avoid, host).forEach(node => {
        const range = document.createRange(); range.selectNodeContents(node);
        const lines = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
        (lines.length ? lines : [node.getBoundingClientRect()]).forEach(r =>
          clear.push({ left: r.left - b.left - PAD, top: r.top - b.top - PAD, right: r.right - b.left + PAD, bottom: r.bottom - b.top + PAD }));
      });
    }
    function measure() {
      width = el.clientWidth; height = el.clientHeight;
      cols = Math.max(1, Math.ceil(width / CELL)); rows = Math.max(1, Math.ceil(height / CELL));
      const dpr = Math.min(devicePixelRatio || 1, 2);
      paper.width = Math.round(width * dpr); paper.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureText(); wake();
    }
    // how bright a cell may be, by its distance from the nearest line of text (faint, never a hole)
    function brightness(col, row) {
      const x = col * CELL + CELL / 2, y = row * CELL + CELL / 2;
      let nearest = Infinity;
      for (const r of clear) {
        const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
        nearest = Math.min(nearest, Math.hypot(dx, dy));
        if (nearest === 0) break;
      }
      return nearest === Infinity ? 1 : FAINT + (1 - FAINT) * Math.min(1, nearest / (FADE * CELL));
    }
    function ink(row) {
      const t = rows > 1 ? Math.min(1, row / (rows - 1)) : 0;
      return 'hsl(' + Math.round(HUE_TOP - t * HUE_SPAN) + ' 95% ' + TINTS[Math.floor(Math.random() * TINTS.length)] + '%)';
    }
    let frame = 0;
    function draw(now) {
      frame = 0;
      ctx.clearRect(0, 0, width, height);
      for (const [key, c] of cells) {
        let alpha;
        if (now < c.until) alpha = easeOut(Math.min(1, (now - c.born) / FADE_IN));
        else { const t = (now - c.until) / FADE_OUT; if (t >= 1) { cells.delete(key); continue; } alpha = 1 - easeIn(t); }
        ctx.globalAlpha = alpha * c.dim; ctx.fillStyle = c.colour;
        ctx.fillRect(c.col * CELL + 1, c.row * CELL + 1, CELL - 1, CELL - 1);   // inset by the hairline so the grid still shows
      }
      ctx.globalAlpha = 1;
      if (cells.size > 0) frame = requestAnimationFrame(draw);                  // sleeps whenever nothing is lit
    }
    function wake() { if (!frame) frame = requestAnimationFrame(draw); }
    function light(col, row, hold) {
      if (col < 0 || row < 0 || col >= cols || row >= rows || cells.size >= MAXLIT) return;
      const key = col + ',' + row, now = performance.now(), lit = cells.get(key);
      if (lit && now < lit.until) return;
      let born = now;
      if (lit) { const faded = 1 - easeIn(Math.min(1, (now - lit.until) / FADE_OUT)); born = now - (1 - Math.sqrt(1 - faded)) * FADE_IN; }
      cells.set(key, { col, row, colour: lit ? lit.colour : ink(row), dim: brightness(col, row), born, until: now + hold });
      wake();
    }
    // the pointer paints; cells further away catch light less often, so the trail breaks up softly
    let pending = 0, at = null;
    function paint() {
      pending = 0; if (!at) return;
      const cx = Math.floor(at.x / CELL), cy = Math.floor(at.y / CELL), span = Math.ceil(REACH);
      for (let dy = -span; dy <= span; dy++) for (let dx = -span; dx <= span; dx++) {
        const away = Math.hypot(dx, dy);
        if (away > REACH || Math.random() > 1 - away / (REACH + 0.6)) continue;
        light(cx + dx, cy + dy, 260 + Math.random() * 900);
      }
    }
    addEventListener('pointermove', e => {
      if (!visible) return;
      const b = el.getBoundingClientRect();
      if (e.clientY < b.top - 80 || e.clientY > b.bottom + 80 || e.clientX < b.left - 80 || e.clientX > b.right + 80) return;
      at = { x: e.clientX - b.left, y: e.clientY - b.top };
      if (!pending) pending = requestAnimationFrame(paint);
    }, { passive: true });
    // a few cells light on their own so the grid is alive on arrival and on screens with no pointer
    let visible = false;
    (function drift() {
      setTimeout(drift, 1400 + Math.random() * 1800);
      if (!visible || document.hidden) return;
      for (let i = 0; i < AMBIENT; i++) light(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows), 900 + Math.random() * 1600);
    })();
    new IntersectionObserver(es => es.forEach(en => { visible = en.isIntersecting; if (visible) setTimeout(measureText, 1300); }), { threshold: 0 }).observe(el);   // measure again once the section's own reveal has settled
    new ResizeObserver(measure).observe(el);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureText).catch(() => {});
    measure();
  });

  /* ---------- STACK-SCROLL: section A stays pinned and shrinks; section B rises over it, growing from 80% to full ---------- */
  $$('.stack').forEach(st => {
    if (reduced.matches || /[?&]plain\b/.test(location.search)) return;   // ?plain turns the scroll effects off (for testing)
    const A = st.children[0], B = st.children[1];
    A.classList.add('stack-a'); B.classList.add('stack-b'); st.classList.add('on');
    let ticking = false, last = -1;
    // A pins when its bottom reaches the bottom of the screen (a section taller than the screen still scrolls through first)
    const fit = () => { A.style.top = Math.min(0, innerHeight - A.offsetHeight) + 'px'; };
    function draw() {
      ticking = false;
      const top = st.getBoundingClientRect().top + B.offsetTop;      // B's own top, which its transform cannot change
      const p = clamp(1 - top / innerHeight, 0, 1), q = Math.round(p * 1000) / 1000;
      if (q === last) return; last = q;
      A.style.transform = 'scale(' + (1 - 0.2 * p).toFixed(4) + ') rotate(' + (-5 * p).toFixed(3) + 'deg)';
      B.style.transform = 'scale(' + (0.8 + 0.2 * p).toFixed(4) + ') rotate(' + (5 * (1 - p)).toFixed(3) + 'deg)';
    }
    const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
    fit(); draw();
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', () => { fit(); last = -1; kick(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => { fit(); last = -1; kick(); }).observe(A);
  });

  /* ---------- FLOW: each section pins when its bottom reaches the screen bottom; the next one swings in from 30deg to flat ---------- */
  $$('.flow').forEach(box => {
    if (reduced.matches || /[?&]plain\b/.test(location.search)) return;   // ?plain turns the scroll effects off (for testing)
    const secs = [...box.children].filter(sec => !sec.matches('.final')).map((sec, i, all) => {   // the sign-up form stays a plain section: browsers' autofill works best on fields with no transformed ancestors
      const s = document.createElement('div'), r = document.createElement('div');
      s.className = 'flow-s' + (i < all.length - 1 ? ' pin' : ''); s.style.zIndex = i + 1; r.className = 'flow-r';
      box.insertBefore(s, sec); r.appendChild(sec); s.appendChild(r);
      return { s, r, i };
    });
    box.classList.add('on');
    let ticking = false;
    const fit = () => secs.forEach(o => { if (o.s.classList.contains('pin')) o.s.style.top = Math.min(0, innerHeight - o.s.offsetHeight) + 'px'; });
    function draw() {
      ticking = false;
      const H = innerHeight, base = box.getBoundingClientRect().top;
      let y = 0;
      secs.forEach(o => {
        const top = base + y; y += o.s.offsetHeight;                  // natural top: sticky offsets and transforms don't change it
        if (o.i === 0) return;
        const p = clamp((H - top) / (H * 0.75), 0, 1);
        o.r.style.transform = p >= 1 ? '' : 'rotate(' + (30 * (1 - p)).toFixed(2) + 'deg)';
        o.r.style.willChange = p >= 1 ? 'auto' : 'transform';   // a settled section is a plain layer, so the browser's autofill popup can anchor to its fields
      });
    }
    const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
    const again = () => { fit(); kick(); };
    fit(); draw();
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', again);
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(again); secs.forEach(o => ro.observe(o.s)); }
  });

  /* ---------- TESTIMONIALS: tap a card to load and play that video; only one plays at a time ---------- */
  $$('.tv').forEach(btn => btn.addEventListener('click', () => {
    $$('.tvf video').forEach(v => v.pause());
    const fig = btn.closest('.tvf'), cap = $('figcaption', fig), v = document.createElement('video');
    v.src = btn.dataset.src; v.controls = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
    v.setAttribute('aria-label', btn.getAttribute('aria-label').replace('Play ', ''));
    fig.classList.add('on'); fig.replaceChildren(v, cap);
    v.play().catch(() => {});
  }));

  /* ---------- reveal on scroll, path line, lit modules ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.18 });
  $$('.reveal').forEach(el => io.observe(el));

  const mods = $$('.mod'), path = $('.path');
  const litIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('lit', e.isIntersecting || e.boundingClientRect.top < 0)), { rootMargin: '-35% 0px -45% 0px' });
  mods.forEach(m => litIO.observe(m));
  let lastP = -1;
  function drawPath() {
    if (!path) return;
    const r = path.getBoundingClientRect();
    const p = Math.round(clamp((innerHeight * 0.55 - r.top) / r.height, 0, 1) * 200) / 200;
    if (p !== lastP) { lastP = p; path.style.setProperty('--p', p); }
  }
  if (path) { addEventListener('scroll', drawPath, { passive: true }); drawPath(); }

  /* ---------- the one interactive moment: the 1 to 2 percent rule ---------- */
  const cap = $('#capital'), rng = $('#riskpct');
  if (cap && rng) {
    const out = $('#riskout'), pct = $('#riskpctlabel'), per = $('#riskper'), chips = $$('[data-cap]'), capf = $('#capfield'), slw = $('#slidewrap');
    const peso = n => '\u20B1' + Math.round(n).toLocaleString('en-PH');
    let used = false;
    const calc = bump => {
      const c = Math.max(0, +cap.value || 0), r = +rng.value, before = out.textContent;
      pct.textContent = r.toFixed(1) + '%';
      out.textContent = peso(c * r / 100);
      per.textContent = c ? 'Most you would risk on one trade. If it loses, ' + peso(c - c * r / 100) + ' is still in your account.' : 'Type your starting capital to see it.';
      chips.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.cap === c)));
      if (bump && before !== out.textContent) { out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump'); }
    };
    const touch = () => { if (used) return; used = true; capf.classList.remove('nudge'); slw.classList.remove('nudge'); };
    cap.addEventListener('input', () => { touch(); calc(true); });
    rng.addEventListener('input', () => { touch(); calc(true); });
    cap.addEventListener('focus', touch);
    rng.addEventListener('pointerdown', touch);
    chips.forEach(b => b.addEventListener('click', () => { touch(); cap.value = b.dataset.cap; calc(true); }));
    calc(false);
    // the dot sways between 1% and 2% by itself while the calculator is on screen,
    // and stops for good the moment someone touches it, types, or taps a quick amount
    if (!reduced.matches && 'IntersectionObserver' in window) {
      let raf = 0, phase = 0, last = 0, shownV = '';
      const loop = t => {
        if (used) { raf = 0; return; }
        if (!last) last = t;
        phase += (t - last) / 4200; last = t;             // one trip from 1% to 2% takes about 4 seconds
        const k = phase % 2, tri = k < 1 ? k : 2 - k;
        const v = (1 + (0.5 - 0.5 * Math.cos(Math.PI * tri))).toFixed(1);
        if (v !== shownV) { shownV = v; rng.value = v; calc(false); }
        raf = requestAnimationFrame(loop);
      };
      new IntersectionObserver(es => es.forEach(en => {
        if (used) return;
        if (en.isIntersecting) { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
        else { cancelAnimationFrame(raf); raf = 0; }      // off screen: rest
      }), { threshold: 0.35 }).observe(rng);
    }
  }

  /* ---------- video: nothing loads until it plays. Plays on click (with sound), or on its own
     when the hero finishes opening (muted, because browsers block sound until the visitor has clicked or tapped). ---------- */
  function ytId(src) {
    const m = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return m ? m[1] : (/^[\w-]{11}$/.test(src) ? src : null);
  }
  function userActive() { return !!(navigator.userActivation && navigator.userActivation.hasBeenActive); }
  function stopVideo(box) {
    box.querySelectorAll('iframe,video,.vid-unmute').forEach(n => n.remove());
    box.dataset.state = 'ready';
  }
  function showUnmute(box, el, yt) {
    if ($('.vid-unmute', box)) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'vid-unmute';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg><span>Tap for sound</span>';
    b.addEventListener('click', () => {
      if (el.tagName === 'VIDEO') {
        el.muted = false; el.play().catch(() => {});
        // the same tap can also reach the player's own pause toggle (touch devices): undo any pause for a moment
        const keep = () => el.play().catch(() => {});
        el.addEventListener('pause', keep); setTimeout(() => el.removeEventListener('pause', keep), 900);
      }
      else if (yt) {
        const send = (func, args) => el.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
        send('unMute', []); send('setVolume', [100]); send('playVideo', []);
      } else { stopVideo(box); mountVideo(box, false); return; }   // facebook embeds cannot be unmuted from outside: reload with sound
      b.remove();
    });
    box.appendChild(b);
    // the first click, tap or key press anywhere is the gesture browsers need, so use it to turn the sound on.
    // A tap on the video itself only unmutes (it must not also pause it); the button handles its own click.
    const go = e => {
      if (!b.isConnected) return rm();
      if (b.contains(e.target)) return;
      if (e.type === 'click' && box.contains(e.target)) e.stopPropagation();
      b.click(); rm();
    };
    const rm = () => ['click', 'keydown'].forEach(ev => removeEventListener(ev, go, true));
    ['click', 'keydown'].forEach(ev => addEventListener(ev, go, true));
  }
  function mountVideo(box, muted) {
    if (box.dataset.state === 'playing' || !box.dataset.src) return;
    const src = box.dataset.src, yt = ytId(src);
    let el;
    if (yt) {
      el = document.createElement('iframe');
      el.src = 'https://www.youtube-nocookie.com/embed/' + yt + '?autoplay=1&mute=' + (muted ? 1 : 0) + '&rel=0&modestbranding=1&playsinline=1&enablejsapi=1';
      el.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; el.allowFullscreen = true;
    } else if (/facebook\.com|fb\.watch/.test(src)) {
      el = document.createElement('iframe');
      el.src = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(src) + '&show_text=false&autoplay=true&muted=' + (muted ? 'true' : 'false');
      el.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; el.allowFullscreen = true;
    } else {
      el = document.createElement('video');
      el.src = src; el.controls = true; el.playsInline = true; el.muted = muted; el.autoplay = true;
      const pr = el.play();
      if (pr && pr.catch) pr.catch(() => { if (!el.muted) { el.muted = true; el.play().catch(() => {}); showUnmute(box, el, false); } });
    }
    el.title = 'Tradenexx video';
    box.appendChild(el); box.dataset.state = 'playing';
    if (muted) showUnmute(box, el, yt);
  }
  $$('.vid[data-state=ready]').forEach(box => {
    $('.vid-play', box).addEventListener('click', () => mountVideo(box, false));   // a click is allowed to have sound
  });

  /* ---------- registration: the same form lives in the popup and in the final section ---------- */
  const code = () => (T.prefix || 'TNX') + '-' + Array.from(crypto.getRandomValues(new Uint8Array(4)), n => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[n % 31]).join('');
  const digits = v => v.replace(/\D/g, '');
  const normMobile = v => { let d = digits(v); if (d.startsWith('639') && d.length === 12) d = '0' + d.slice(2); return d; };
  const fmtMobile = d => d.slice(0, 4) + (d.length > 4 ? ' ' + d.slice(4, 7) : '') + (d.length > 7 ? ' ' + d.slice(7, 11) : '');
  const fakeNumber = d => /^(\d)\1{10}$/.test(d) || /(0123456|1234567|2345678|3456789|9876543|8765432)/.test(d) || /^09(\d)\1{8}\d?$/.test(d);
  const DOMAINS = ['gmail.com', 'yahoo.com', 'yahoo.com.ph', 'outlook.com', 'hotmail.com', 'icloud.com', 'live.com', 'proton.me', 'protonmail.com'];
  const dist = (x, y) => {
    const m = Array.from({ length: x.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= y.length; j++) m[0][j] = j;
    for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    return m[x.length][y.length];
  };
  const DISPOSABLE = ['mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'mailnesia.com', 'mohmal.com', 'emailondeck.com'];
  const FAKE_LOCAL = /^(test|tests|testing|asdf|asd|qwerty|dummy|fake|none|noemail|no|na|abc|xyz|sample|email|example|admin)[0-9]*$/;
  function checkEmail(v) {
    v = v.trim().toLowerCase();
    if (DISPOSABLE.includes(v.split('@')[1])) return 'Please use your real email address, not a temporary one.';
    if (FAKE_LOCAL.test(v.split('@')[0]) || /^(.)\1{3,}$/.test(v.split('@')[0])) return 'Invalid email. Please enter your real email address.';
    if (!/^[a-z0-9._%+-]{3,}@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v)) return 'Enter a full email address, like name@gmail.com.';
    const dom = v.split('@')[1];
    if (!DOMAINS.includes(dom)) {
      const near = DOMAINS.find(d => dist(d, dom) <= 2);
      if (near) return 'Did you mean ' + v.split('@')[0] + '@' + near + '? Please fix the spelling.';
      if (!/\.[a-z]{2,}$/.test(dom)) return 'Enter a full email address, like name@gmail.com.';
    }
    return '';
  }
  function domainAcceptsMail(domain) {
    const ask = type => {
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 3000);
      return fetch('https://dns.google/resolve?name=' + encodeURIComponent(domain) + '&type=' + type, { signal: ctl.signal }).then(r => r.json());
    };
    return ask('MX').then(r => {
      if (r.Status === 3) return false;
      if (r.Answer && r.Answer.length) return true;
      return ask('A').then(a => !!(a.Answer && a.Answer.length));
    }).catch(() => true);
  }
  function checkName(v) {
    v = v.trim();
    if (/[@\d]/.test(v)) return 'Type your real name here, with no email or numbers.';
    if (v.split(/\s+/).filter(w => w.length > 1).length < 2) return 'Enter your first and last name.';
    return '';
  }
  let done = {};
  try { done = JSON.parse(localStorage.getItem('tnx-regs') || '{}'); } catch (x) {}

  function wireReg(box) {
    const isDlg = box.matches('dialog'), form = $('form', box), err = $('.err', box), mob = form.mobile;
    // the popup and the form at the bottom of the page always show the same step; sign-ups from the bottom form also open the popup
    const popup = $('dialog.reg'), all = $$('.reg');
    const toStep = n => {
      all.forEach(r => { r.dataset.step = n; });
      if (!isDlg && popup && n !== '1') { if (!popup.open) popup.showModal(); popup.scrollTo({ top: 0 }); }
      else if (isDlg) box.scrollTo({ top: 0 });
    };
    const fill = (ref, name) => all.forEach(r => {
      $$('[data-ref]', r).forEach(n => n.textContent = ref);
      $$('[data-name]', r).forEach(n => n.textContent = name.split(' ')[0]);
    });
    mob.addEventListener('input', () => { mob.value = fmtMobile(normMobile(mob.value).slice(0, 11)); });

    form.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = '';
      const d = Object.fromEntries(new FormData(form));
      const num = normMobile(d.mobile);
      const bad = checkName(d.name)
        || (!/^09\d{9}$/.test(num) ? 'Enter your 11-digit mobile number, like 09XX XXX XXXX.' : fakeNumber(num) ? 'That number looks made up. Enter your real GCash number.' : '')
        || checkEmail(d.email);
      if (bad) { err.textContent = bad; return; }
      const goodDomain = await domainAcceptsMail(d.email.trim().toLowerCase().split('@')[1]);
      if (!goodDomain) { err.textContent = 'Invalid email. Please enter your real email address.'; return; }
      d.mobile = fmtMobile(num); d.email = d.email.trim().toLowerCase(); d.name = d.name.trim().replace(/\s+/g, ' ');
      const key = T.product + ':' + num;
      if (done[key]) { fill(done[key], d.name); toStep('2'); return; }   // same person tapping twice: show their existing code, send nothing
      const ref = code();
      const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'Sending...';
      try {
        if (T.endpoint) {
          const row = { ...d, product: T.product, ref, price: T.price, at: new Date().toISOString() };
          const body = new URLSearchParams(); Object.entries(T.fields).forEach(([k, id]) => body.set(id, row[k]));
          await fetch(T.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        } else console.warn('TNX.endpoint is empty: registrations are not being saved yet.');
      } catch (x) {
        err.textContent = 'We could not send your details. Check your connection and try again.';
        btn.disabled = false; btn.textContent = 'Continue to payment'; return;
      }
      done[key] = ref; try { localStorage.setItem('tnx-regs', JSON.stringify(done)); } catch (x) {}
      fill(ref, d.name);
      btn.disabled = false; btn.textContent = 'Continue to payment';
      toStep('2');
    });
    $('[data-paid]', box).addEventListener('click', () => { toStep('3'); window.open('https://m.me/tradenexx', '_blank', 'noopener'); });
    const reset = $('[data-reset]', box);
    if (reset) reset.addEventListener('click', () => { $$('.reg form').forEach(f => f.reset()); $$('.reg .err').forEach(n => n.textContent = ''); toStep('1'); });
  }
  $$('.reg').forEach(wireReg);

  const dlg = $('dialog.reg');
  if (dlg) {
    const open = () => { if (dlg.dataset.step === '3') $$('.reg').forEach(r => { r.dataset.step = '1'; }); $('.err', dlg).textContent = ''; if (!dlg.open) dlg.showModal(); };   // reopening after a closed payment step keeps it; after a finished sign-up it starts fresh
    $$('[data-join]').forEach(b => b.addEventListener('click', open));
    $$('[data-close]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }
})();
