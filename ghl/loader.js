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
  var scripts = [].slice.call(d.body.querySelectorAll('script'));
  scripts.forEach(function (s) { s.parentNode.removeChild(s); });
  var root = document.getElementById('tnx-app') || document.body;
  root.innerHTML = d.body.innerHTML
    .replace(/\.\.\/assets\//g, B + '/assets/')
    .replace(/href="\.\/"/g, 'href="#"')
    .replace(/href="\.\.\/(webinar|event)\/"/g, 'href="' + B + '/$1/"');
  // GHL wraps the element in sections, rows and columns that have side padding and a max width: make them full width and see-through
  for (var el = root.parentNode; el && el !== document.documentElement; el = el.parentNode) {
    ['padding', 'margin'].forEach(function (k) { el.style.setProperty(k, '0', 'important'); });
    el.style.setProperty('max-width', 'none', 'important'); el.style.setProperty('width', '100%', 'important');
    el.style.setProperty('background', 'transparent', 'important'); el.style.setProperty('overflow', 'visible', 'important');
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
