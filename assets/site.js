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

  /* ---------- EXPAND-HERO: the video frame opens as the page scrolls (transform/clip only, no layout) ---------- */
  const h3 = $('.hero3');
  if (h3 && !reduced.matches) {
    const root = document.documentElement, vf = $('.vframe', h3), t1 = $('.t1', h3), t2 = $('.t2', h3);
    let ticking = false, last = -1;
    const ease = p => p * p * (3 - 2 * p);
    function draw() {
      ticking = false;
      const W = innerWidth, H = innerHeight, rect = h3.getBoundingClientRect();
      const p = Math.round(clamp(-rect.top / (rect.height - H), 0, 1) * 500) / 500;
      const vbox = $('.vid', h3);
      if (p >= 0.98) { if (vbox.dataset.state === 'ready') mountVideo(vbox, !userActive()); }
      else if (p < 0.55 && vbox.dataset.state === 'playing') stopVideo(vbox);
      if (p === last) return; last = p;
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
      const fade = (1 - smooth(p, 0.55, 0.92)).toFixed(2);
      t1.style.opacity = t2.style.opacity = fade;
      h3.style.setProperty('--io', (1 - smooth(p, 0, 0.22)).toFixed(2));
      h3.style.setProperty('--bgo', (1 - smooth(p, 0, 0.9)).toFixed(2));
    }
    const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', () => { last = -1; kick(); });
    draw();
  }

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
