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
    .replace(/(?:\.\.\/)+assets\//g, B + '/assets/')
    .replace(/href="\.\/"/g, 'href="#"')
    .replace(/href="(?:\.\.\/)+"/g, 'href="#"')
    .replace(/href="\.\.\/(webinar|event)\/"/g, 'href="' + B + '/$1/"');
  document.documentElement.style.overflowX = 'clip';   // the full-width breakout would otherwise add a sideways scrollbar
  // ?form=1: checkout layout on the SAME page. The GHL order form stays exactly where GHL renders it (moving it breaks it);
  // instead the column around it becomes a grid: [our page] / [price card | What you get] / [order form | What you get] / [footer]
  if (qs0.get('form')) {
    var of = document.querySelector('.c-order-form') || document.querySelector('[class*="order-form"]');
    var ow = of && (of.closest('.c-wrapper') || of), foot = root.querySelector('footer');
    var inner = ow && ow.parentNode;
    if (ow && foot && inner) {
      var esc = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
      var facts = [].map.call(root.querySelectorAll('li'), function (li) { return li.textContent.trim(); }).map(function (t) { var m = t.match(/^₱\s?\d+(?:,\d{3})*/); return m ? m[0] : ''; }).filter(Boolean);
      var items = [].map.call(root.querySelectorAll('ul.incl li'), function (li) {
        var b = li.querySelector('b'), s = li.querySelector('small');
        return { t: b && b.firstChild ? b.firstChild.textContent : '', d: s ? s.textContent : '' };   // the title only: some titles carry a decorative bot icon
      });
      var label = { webinar: 'Online webinar seat', event: 'Live training seat' }[p] || 'Your seat';
      var tick = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
      var g = '.tnx-grid';
      var css = document.createElement('style');
      css.textContent = 'html,body{background:#050d26!important}.c-section,.c-row,.c-column{background:transparent!important}'
        + g + '{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;column-gap:28px;max-width:1100px;margin:0 auto!important;padding:0 clamp(16px,4vw,48px) 84px!important;width:100%!important;box-sizing:border-box;font-family:Tahoma,"Segoe UI",Verdana,sans-serif}'
        + g + ' > .c-custom-code{grid-column:1/-1;grid-row:1}'
        + g + ' > .co-head-card{grid-column:1;grid-row:2;background:linear-gradient(160deg,#0a1a44,#214EA2);color:#fff;text-align:center;padding:30px 24px 26px;border-radius:18px 18px 0 0;margin-top:8px}'
        + g + ' > .co-head-card h3{font:700 22px/1.2 Tahoma,Verdana,sans-serif;margin:0}'
        + g + ' .co-price{font:700 46px/1 Tahoma,Verdana,sans-serif;color:#A4B5DB;margin:14px 0 6px}'
        + g + ' .co-head-card p{margin:0;color:#dbe5fb;font-size:14px;line-height:1.6}'
        + g + ' > .c-order-form{grid-column:1;grid-row:3;background:#fff;border-radius:0 0 18px 18px;padding:10px 18px 22px;box-shadow:0 24px 70px rgba(0,0,0,.45);align-self:start}'
        + g + ' > .co-list{grid-column:2;grid-row:2 / span 2;align-self:start;margin-top:8px;background:#0a1a44;border:1px solid #2a427f;border-radius:18px;padding:28px 26px;color:#eef2fb}'
        + g + ' .co-list h3{font:700 22px/1.2 Tahoma,Verdana,sans-serif;margin:0 0 10px;color:#fff}'
        + g + ' .co-list ul{list-style:none;margin:0;padding:0}'
        + g + ' .co-list li{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid rgba(164,181,219,.16)}'
        + g + ' .co-list li:last-child{border:0}'
        + g + ' .co-list .ck{flex:none;width:26px;height:26px;border-radius:50%;background:#214EA2;display:grid;place-items:center;margin-top:1px}'
        + g + ' .co-list b{display:block;font:700 15px/1.35 Tahoma,Verdana,sans-serif;color:#fff}'
        + g + ' .co-list span.d{display:block;font:400 13px/1.5 "IBM Plex Mono",ui-monospace,monospace;color:#b6c3e3}'
        + g + ' > .co-foot{grid-column:1/-1;grid-row:4;margin-top:48px}'
        + '@media (max-width:860px){' + g + '{grid-template-columns:minmax(0,1fr)!important}' + g + ' > .co-list{grid-column:1;grid-row:2;order:0}' + g + ' > .co-head-card{grid-row:3}' + g + ' > .c-order-form{grid-row:4}' + g + ' > .co-foot{grid-row:5}}';
      document.head.appendChild(css);
      var head = document.createElement('div'); head.className = 'co-head-card'; head.id = 'tnx-checkout';
      head.innerHTML = '<h3>Reserve your seat</h3><div class="co-price">' + esc(facts[0] || '₱500') + '</div><p>' + esc(label) + ' · one payment, no hidden fees</p>';
      var list = document.createElement('div'); list.className = 'co-list';
      list.innerHTML = '<h3>What you get</h3><ul>' + items.map(function (i) { return '<li><span class="ck">' + tick + '</span><div><b>' + esc(i.t) + '</b><span class="d">' + esc(i.d) + '</span></div></li>'; }).join('') + '</ul>';
      var fw = document.createElement('div'); fw.className = 'co-foot'; fw.appendChild(foot);
      inner.classList.add('tnx-grid');
      ow.classList.add('c-order-form');
      inner.insertBefore(head, ow); inner.appendChild(list); inner.appendChild(fw);
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
        var f = document.getElementById('tnx-checkout') || document.querySelector('.c-order-form');   // the price card sits right above the order form
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
