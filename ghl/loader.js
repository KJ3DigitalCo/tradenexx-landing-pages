/* TEST ONLY: loads the live Tradenexx landing page into a GoHighLevel "Custom HTML/Javascript" element, to see how it behaves inside GHL.
   Use:  <div id="tnx-app"></div><script src="https://founderalexanderuy.com/ghl/loader.js?p=webinar"></script>   (p = webinar or event) */
(async function () {
  var B = 'https://founderalexanderuy.com';
  var me = document.currentScript;
  var p = (me && new URL(me.src).searchParams.get('p')) || 'webinar';
  var base = B + '/' + p + '/';
  var html = await (await fetch(base)).text();
  var d = new DOMParser().parseFromString(html, 'text/html');
  d.querySelectorAll('head link[rel=stylesheet], head link[rel=preload]').forEach(function (l) {
    var u = l.getAttribute('href'); if (!u) return;
    var a = document.createElement('link'); a.rel = 'stylesheet'; a.href = new URL(u, base).href; document.head.appendChild(a);
  });
  d.querySelectorAll('head style').forEach(function (s) { document.head.appendChild(s.cloneNode(true)); });   // pages that use inline CSS (the thank-you page)
  var scripts = [].slice.call(d.body.querySelectorAll('script'));
  scripts.forEach(function (s) { s.parentNode.removeChild(s); });
  var qs0 = me ? new URL(me.src).searchParams : new URLSearchParams();
  var root = document.getElementById('tnx-app') || document.body;
  root.innerHTML = d.body.innerHTML
    .replace(/\.\.\/assets\//g, B + '/assets/')
    .replace(/href="\.\/"/g, 'href="#"')
    .replace(/href="\.\.\/(webinar|event)\/"/g, 'href="' + B + '/$1/"');
  // ?form=1: the GHL order form lives in the same builder column; move it into our page, between the last section and the footer
  if (qs0.get('form')) {
    var of = document.querySelector('.c-order-form') || document.querySelector('[class*="order-form"]');
    var ow = of && (of.closest('.c-wrapper') || of), foot = root.querySelector('footer');
    if (ow && foot) {
      // same layout idea as a classic checkout: left = card with a price header and the order form, right = "What you get"
      var esc = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
      var facts = [].map.call(root.querySelectorAll('ul.facts li'), function (li) { return li.textContent.trim(); });
      var items = [].map.call(root.querySelectorAll('ul.incl li'), function (li) {
        var b = li.querySelector('b'), s = li.querySelector('small');
        return { t: b ? b.textContent : '', d: s ? s.textContent : '' };
      });
      var label = { webinar: 'Online webinar seat', event: 'Live training seat' }[p] || 'Your seat';
      var tick = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
      var css = document.createElement('style');
      css.textContent = '#tnx-checkout{background:#050d26;padding:8px clamp(16px,4vw,48px) 84px;font-family:Tahoma,"Segoe UI",Verdana,sans-serif}'
        + '#tnx-checkout .co-grid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:start}'
        + '#tnx-checkout .co-card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.45)}'
        + '#tnx-checkout .co-head{background:linear-gradient(160deg,#0a1a44,#214EA2);color:#fff;text-align:center;padding:30px 24px 26px}'
        + '#tnx-checkout .co-head h3{font:700 22px/1.2 Tahoma,Verdana,sans-serif;margin:0}'
        + '#tnx-checkout .co-price{font:700 46px/1 Tahoma,Verdana,sans-serif;color:#A4B5DB;margin:14px 0 6px}'
        + '#tnx-checkout .co-head p{margin:0;color:#dbe5fb;font-size:14px;line-height:1.6}'
        + '#tnx-checkout .co-body{padding:8px 18px 22px}'
        + '#tnx-checkout .co-list{background:#0a1a44;border:1px solid #2a427f;border-radius:18px;padding:28px 26px;color:#eef2fb}'
        + '#tnx-checkout .co-list h3{font:700 22px/1.2 Tahoma,Verdana,sans-serif;margin:0 0 10px;color:#fff}'
        + '#tnx-checkout .co-list ul{list-style:none;margin:0;padding:0}'
        + '#tnx-checkout .co-list li{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid rgba(164,181,219,.16)}'
        + '#tnx-checkout .co-list li:last-child{border:0}'
        + '#tnx-checkout .co-list .ck{flex:none;width:26px;height:26px;border-radius:50%;background:#214EA2;display:grid;place-items:center;margin-top:1px}'
        + '#tnx-checkout .co-list b{display:block;font:700 15px/1.35 Tahoma,Verdana,sans-serif;color:#fff}'
        + '#tnx-checkout .co-list span.d{display:block;font:400 13px/1.5 "IBM Plex Mono",ui-monospace,monospace;color:#b6c3e3}'
        + '@media (max-width:860px){#tnx-checkout .co-grid{grid-template-columns:1fr}#tnx-checkout .co-list{order:-1}}';
      document.head.appendChild(css);
      var sec = document.createElement('section');
      sec.id = 'tnx-checkout';
      sec.innerHTML = '<div class="co-grid"><div class="co-card"><div class="co-head"><h3>Reserve your seat</h3><div class="co-price">' + esc(facts[0] || '₱500') + '</div><p>' + esc(label) + ' · one payment, no hidden fees' + '</p></div><div class="co-body"></div></div>'
        + '<div class="co-list"><h3>What you get</h3><ul>' + items.map(function (i) { return '<li><span class="ck">' + tick + '</span><div><b>' + esc(i.t) + '</b><span class="d">' + esc(i.d) + '</span></div></li>'; }).join('') + '</ul></div></div>';
      sec.querySelector('.co-body').appendChild(ow);
      foot.parentNode.insertBefore(sec, foot);
    }
  }
  // GHL wraps the element in a narrow, padded column: let our page break out to the full screen width without touching the column (the order form shares it)
  for (var el = root.parentNode; el && el !== document.documentElement; el = el.parentNode) el.style.setProperty('overflow', 'visible', 'important');
  root.style.cssText = 'display:block;width:100vw;position:relative;left:50%;margin-left:-50vw';
  // optional ?co=URL: every "Reserve your seat" button goes to the checkout page instead of opening the popup form
  var qs = me ? new URL(me.src).searchParams : new URLSearchParams();
  var co = qs.get('co');
  if (co) root.querySelectorAll('[data-join]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); location.href = co; }, true);
  });
  // ?form=1: the GHL order form sits on this same page, so our own popup and sign-up card are hidden and every button scrolls to the order form
  if (qs.get('form')) {
    var st = document.createElement('style');
    st.textContent = 'dialog.reg,.reg-inline{display:none!important}.final-grid{grid-template-columns:minmax(0,1fr)!important;justify-items:center;text-align:center}.final h2,.final .lede{text-align:center!important;margin-inline:auto!important}.final-points{justify-items:center}';
    document.head.appendChild(st);
    root.querySelectorAll('[data-join]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopImmediatePropagation();
        var f = document.getElementById('tnx-checkout') || document.querySelector('.c-order-form');
        if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, true);
    });
  }
  for (var i = 0; i < scripts.length; i++) {
    await new Promise(function (done) {
      var s = scripts[i], n = document.createElement('script'), src = s.getAttribute('src');
      if (src) { n.src = new URL(src, base).href; n.onload = n.onerror = done; } else { n.textContent = s.textContent; }
      document.body.appendChild(n);
      if (!src) done();
    });
  }
})();
