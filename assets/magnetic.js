/* Magnetic cursor, plain JS. Only active inside sections marked class="fx".
   A smooth circle follows the pointer and grows over magnetic targets, which lean slightly toward it.
   Big targets (like the price card) move less than small ones (buttons), and every move is eased,
   in and out, so nothing snaps. Everywhere else the normal cursor is used.
   Off on touch screens and for people who prefer reduced motion. */
(function () {
  'use strict';
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce || !document.querySelector('.fx')) return;

  var SIZE = 40, EASE = 0.2, LEAN_EASE = 0.12;
  var SEL = '[data-magnetic], .fx .btn, .fx .price';
  var html = document.documentElement;

  var cur = document.createElement('div');
  cur.className = 'mc-cursor';
  cur.setAttribute('aria-hidden', 'true');
  cur.style.width = cur.style.height = SIZE + 'px';
  document.body.appendChild(cur);

  var tx = 0, ty = 0, x = 0, y = 0, scale = 1, tScale = 1, shown = false, running = false;
  var hover = null;
  var offs = new Map();                       // element -> { x, y } its current eased lean in px

  function leave() { shown = false; cur.classList.remove('mc-show'); html.classList.remove('mc-in'); hover = null; tScale = 1; }

  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var inside = e.target.closest && e.target.closest('.fx');
    var onField = e.target.closest && e.target.closest('input, select, textarea, dialog.reg');
    if (!inside || onField) { if (shown) leave(); return; }
    tx = e.clientX; ty = e.clientY;
    if (!shown) {
      x = tx; y = ty; shown = true;
      cur.classList.add('mc-show'); html.classList.add('mc-in');
    }
    var t = e.target.closest(SEL);
    if (t !== hover) { hover = t; tScale = t ? 1.7 : 1; if (t && !offs.has(t)) offs.set(t, { x: 0, y: 0 }); }
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });
  document.addEventListener('pointerleave', leave);
  document.addEventListener('pointerdown', function () { if (shown) tScale = hover ? 1.2 : 0.8; });
  document.addEventListener('pointerup', function () { if (shown) tScale = hover ? 1.7 : 1; });

  var scrollTimer = 0;
  addEventListener('scroll', function () {
    if (!shown) return;
    html.classList.add('mc-scrolling');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () { html.classList.remove('mc-scrolling'); }, 140);
  }, { passive: true });

  function loop() {
    var gx = tx, gy = ty;

    // 1) ease every leaning element toward its target (or back to rest)
    offs.forEach(function (o, el) {
      var tox = 0, toy = 0;
      var r = el.getBoundingClientRect();
      var w = r.width, h = r.height, big = Math.max(w, h);
      var cx = r.left - o.x + w / 2, cy = r.top - o.y + h / 2;           // centre without the current lean, so it never feeds back
      if (el === hover && shown) {
        var maxShift = Math.max(4, Math.min(14, 10 + (200 - big) / 20));   // buttons ~10px, the big card ~4px
        tox = Math.max(-1, Math.min(1, (tx - cx) / (w / 2))) * maxShift;
        toy = Math.max(-1, Math.min(1, (ty - cy) / (h / 2))) * maxShift * 0.7;
        var pull = Math.max(0.08, Math.min(0.33, 70 / big));              // the circle is drawn a little toward the centre, less on big things
        gx = tx + (cx - tx) * pull; gy = ty + (cy - ty) * pull;
      }
      o.x += (tox - o.x) * LEAN_EASE; o.y += (toy - o.y) * LEAN_EASE;
      if (el !== hover && Math.abs(o.x) < 0.05 && Math.abs(o.y) < 0.05) { el.style.translate = ''; offs.delete(el); }
      else el.style.translate = o.x.toFixed(2) + 'px ' + o.y.toFixed(2) + 'px';
    });

    // 2) the circle
    if (shown) {
      var dx = gx - x, dy = gy - y;
      x += dx * EASE; y += dy * EASE;
      scale += (tScale - scale) * 0.18;
      var speed = Math.min(1, Math.hypot(dx, dy) / 60);                   // stretch a little along the motion
      var ang = Math.atan2(dy, dx);
      cur.style.transform = 'translate3d(' + (x - SIZE / 2).toFixed(1) + 'px,' + (y - SIZE / 2).toFixed(1) + 'px,0) rotate(' + ang.toFixed(3) + 'rad) scale(' + (scale * (1 + speed * 0.25)).toFixed(3) + ',' + (scale * (1 - speed * 0.12)).toFixed(3) + ')';
    }

    if (shown || offs.size) requestAnimationFrame(loop); else running = false;   // rest when nothing moves
  }

  // the popup sits above everything, so use the normal cursor there
  var dlg = document.querySelector('dialog.reg');
  if (dlg) new MutationObserver(function () { html.classList.toggle('mc-modal', dlg.open); if (dlg.open) leave(); }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  document.addEventListener('visibilitychange', function () { if (document.hidden) leave(); });
})();
