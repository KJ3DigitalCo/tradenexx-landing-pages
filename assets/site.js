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

  /* ---------- photo fan: 7 cards at a time, arrows and swipe to cycle, hover pushes the neighbours ---------- */
  $$('[data-fan]').forEach(root => {
    const layout = $('.fan-layout', root), cards = $$('.fan-card', layout), dots = $$('.fan-dots span', root);
    const total = cards.length, MAXV = 7, HALF = 3, paginate = total > MAXV;
    const FAN = [
      { rot: -21, scale: 0.7756, x: -30, y: 7.3, z: 1 }, { rot: -14, scale: 0.8498, x: -22, y: 4.0, z: 2 }, { rot: -7, scale: 0.9346, x: -11, y: 1.3, z: 3 },
      { rot: 0, scale: 1.0, x: 0, y: 0, z: 10 },
      { rot: 7, scale: 0.9346, x: 11, y: 1.3, z: 3 }, { rot: 14, scale: 0.8498, x: 22, y: 4.0, z: 2 }, { rot: 21, scale: 0.7756, x: 30, y: 7.3, z: 1 }];
    // springy easing where the browser supports it, an overshoot curve where it does not
    const SPRING = (window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0,1)'))
      ? 'linear(0,.38 6%,.82 12%,1.08 19%,1.14 24%,1.09 30%,1.02 38%,.99 46%,1.005 58%,1)' : 'cubic-bezier(.34,1.56,.64,1)';
    const OUT = 'cubic-bezier(.22,.8,.3,1)', IN = 'cubic-bezier(.5,0,.9,.6)';
    const calm = reduced.matches;
    const mult = () => { const w = innerWidth; return w < 480 ? .28 : w < 640 ? .38 : w < 768 ? .5 : w < 1024 ? .75 : 1; };
    const hmult = () => { const w = innerWidth, ideal = (w < 480 ? 22 : w < 640 ? 26 : w < 768 ? 28 : w < 1024 ? 34 : 38) * 16, avail = innerHeight * 0.7; return avail >= ideal ? 1 : avail / ideal; };
    const slotCfg = (count, slot) => {
      if (count >= MAXV) return FAN[slot];
      const c = count >> 1, d = count > 1 ? (slot - c) / c : 0, ad = Math.abs(d);
      return { rot: d * 21, scale: 1 - .2244 * ad * ad, x: d * 30, y: ad * ad * 7.3, z: 10 - Math.abs(slot - c) };
    };
    let center = paginate ? HALF : total >> 1, busy = false, entered = false, prevVis = new Set(), activeSlot = null, leaveT = 0;
    const visibleMap = c => {
      const m = new Map();
      if (!paginate) { cards.forEach((_, i) => m.set(i, i)); return m; }
      for (let sl = 0; sl < MAXV; sl++) m.set((((c + sl - HALF) % total) + total) % total, sl);
      return m;
    };
    const tf = (x, y, rot, sc) => 'translate(-50%,-50%) translate(' + x.toFixed(2) + 'rem,' + y.toFixed(2) + 'rem) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
    // set a card's state; dur 0 means "jump there"
    function put(el, st, dur, ease, delay) {
      el.style.transition = (calm || !dur) ? 'none' : 'transform ' + dur + 's ' + ease + ' ' + (delay || 0) + 's, opacity ' + Math.min(dur, .5) + 's ease ' + (delay || 0) + 's';
      el.style.transform = tf(st.x, st.y, st.rot, st.scale);
      el.style.opacity = st.op;
      if (st.z !== undefined) el.style.zIndex = st.z;
    }
    const target = (slot, count) => { const k = slotCfg(count, slot); return { x: k.x * mult(), y: k.y * hmult(), rot: k.rot, scale: k.scale, op: 1, z: k.z }; };
    const settle = ms => { busy = true; setTimeout(() => { busy = false; }, calm ? 0 : ms); };

    function layout_(dir, first) {
      const vis = visibleMap(center), count = paginate ? MAXV : total, hm = hmult();
      cards.forEach((el, i) => {
        const slot = vis.get(i), was = prevVis.has(i);
        if (slot !== undefined) {
          const t = target(slot, count);
          if (first) {
            put(el, { x: 0, y: 12 * hm, rot: 0, scale: .5, op: 0, z: t.z }, 0);
            void el.offsetWidth;
            put(el, t, 1.2, SPRING, .2 + slot * .06);
          } else if (!was) {
            put(el, { x: (dir === 'right' ? 40 : -40), y: t.y, rot: dir === 'right' ? 30 : -30, scale: .5, op: 0, z: t.z }, 0);
            void el.offsetWidth;
            put(el, t, .6, OUT);
          } else put(el, t, .5, OUT);
        } else if (was) {
          put(el, { x: dir === 'right' ? -40 : 40, y: 0, rot: dir === 'right' ? -30 : 30, scale: .5, op: 0, z: 0 }, .4, IN);
        } else if (first) {
          put(el, { x: 0, y: 0, rot: 0, scale: .3, op: 0, z: 0 }, 0);
        }
      });
      prevVis = new Set(vis.keys());
      dots.forEach((d, i) => d.classList.toggle('on', i === center));
      settle(first ? 1500 : 700);
    }

    // hover: lift the card under the pointer, push the others away
    function hoverLayout(hs) {
      const vis = visibleMap(center), count = paginate ? MAXV : total, m = mult(), hm = hmult();
      const entries = []; cards.forEach((el, i) => { const sl = vis.get(i); if (sl !== undefined) entries.push({ el, sl }); });
      entries.sort((a, b) => a.sl - b.sl);
      const cs = entries.length >> 1;
      entries.forEach(({ el, sl }) => {
        const base = slotCfg(count, sl);
        let x = base.x * m, y = base.y * hm, rot = base.rot, sc = base.scale, delay = Math.abs(sl - cs) * .02;
        if (hs !== null) {
          const dist = Math.abs(sl - hs); delay = dist * .02;
          if (sl === hs) { y -= 2.5 * hm; sc *= 1.08; }
          else {
            const nrm = cs > 0 ? (sl - cs) / cs : 0, push = 8 * (1 - Math.abs(nrm)) * (1 + .2 * Math.max(0, 3 - dist));
            if (sl < hs) { x -= push * m; rot -= 3 / (dist + 1); } else { x += push * m; rot += 3 / (dist + 1); }
          }
        }
        put(el, { x, y, rot, scale: sc, op: 1, z: base.z }, .5, SPRING, delay);
      });
    }
    cards.forEach((el, i) => el.addEventListener('mouseenter', () => {
      if (busy || !entered) return;
      const sl = visibleMap(center).get(i); if (sl === undefined) return;
      clearTimeout(leaveT); if (activeSlot !== sl) { activeSlot = sl; hoverLayout(sl); }
    }));
    layout.addEventListener('mouseleave', () => { if (busy || !entered) return; clearTimeout(leaveT); leaveT = setTimeout(() => { activeSlot = null; hoverLayout(null); }, 50); });

    function cycle(dir) {
      if (busy || !paginate || !entered) return;
      center = dir === 'right' ? (center + 1) % total : (center - 1 + total) % total;
      activeSlot = null;
      layout_(dir, false);
    }
    $('[data-prev]', root).addEventListener('click', () => cycle('left'));
    $('[data-next]', root).addEventListener('click', () => cycle('right'));
    // swipe on touch screens
    let sx = null;
    layout.addEventListener('pointerdown', e => { sx = e.pointerType === 'mouse' ? null : e.clientX; });
    layout.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) cycle(dx < 0 ? 'right' : 'left'); });
    addEventListener('resize', () => { if (entered && !busy) hoverLayout(activeSlot); });

    // the cards arrive when the section first comes into view
    if ('IntersectionObserver' in window) {
      const io2 = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting && !entered) { entered = true; io2.disconnect(); layout_(null, true); }
      }), { threshold: 0.3 });
      io2.observe(root);
    } else { entered = true; layout_(null, true); }
  });

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
      if (el.tagName === 'VIDEO') { el.muted = false; el.play().catch(() => {}); }
      else if (yt) {
        const send = (func, args) => el.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
        send('unMute', []); send('setVolume', [100]); send('playVideo', []);
      } else { stopVideo(box); mountVideo(box, false); return; }   // facebook embeds cannot be unmuted from outside: reload with sound
      b.remove();
    });
    box.appendChild(b);
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
    const toStep = n => {
      box.dataset.step = n;
      if (isDlg) box.scrollTo({ top: 0 });
      else box.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'center' });
    };
    const fill = (ref, name) => { $('[data-ref]', box).textContent = ref; $$('[data-name]', box).forEach(n => n.textContent = name.split(' ')[0]); };
    mob.addEventListener('input', () => { mob.value = fmtMobile(normMobile(mob.value).slice(0, 11)); });

    form.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = '';
      const d = Object.fromEntries(new FormData(form));
      const num = normMobile(d.mobile);
      const bad = checkName(d.name)
        || (!/^09\d{9}$/.test(num) ? 'Enter your 11-digit mobile number, like 0917 506 0103.' : fakeNumber(num) ? 'That number looks made up. Enter your real GCash number.' : '')
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
    $('[data-paid]', box).addEventListener('click', () => toStep('3'));
    const reset = $('[data-reset]', box);
    if (reset) reset.addEventListener('click', () => { form.reset(); err.textContent = ''; toStep('1'); });
  }
  $$('.reg').forEach(wireReg);

  const dlg = $('dialog.reg');
  if (dlg) {
    const open = () => { dlg.dataset.step = '1'; $('.err', dlg).textContent = ''; if (!dlg.open) dlg.showModal(); };
    $$('[data-join]').forEach(b => b.addEventListener('click', open));
    $$('[data-close]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }
})();
