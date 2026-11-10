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
  // ?form=1: put our page ABOVE the GHL order form that lives in the same column (no need to drag elements around in the builder)
  if (qs0.get('form')) {
    var of = document.querySelector('.c-order-form') || document.querySelector('[class*="order-form"]');
    var ow = of && (of.closest('.c-wrapper') || of);
    if (ow && ow.parentNode) ow.parentNode.insertBefore(root, ow);
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
        var f = document.querySelector('.c-order-form') || document.querySelector('[class*="order-form"]');
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
