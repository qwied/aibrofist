/* AIBROFIST — монета из игры в виде иконки для интерфейса.
   Повторяет PAINT.coin из редактора: золотой градиент и блик. */
(function () {
  'use strict';
  var n = 0;

  function svg(size) {
    size = size || 18;
    var id = 'cg' + (++n);
    return '<svg class="bfCoinIcon" width="' + size + '" height="' + size +
      '" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" style="vertical-align:-0.16em">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#d4a017"/>' +
      '</linearGradient></defs>' +
      '<ellipse cx="11" cy="11" rx="11" ry="11" fill="url(#' + id + ')"/>' +
      '<ellipse cx="8.4" cy="8" rx="3.1" ry="3.3" fill="rgba(255,255,255,.5)"/></svg>';
  }

  // «123 🪙» -> «123 <монета>»
  function amount(v, size) { return v + ' ' + svg(size); }

  // заменить эмодзи на иконку в готовой строке
  function fix(text, size) {
    return String(text == null ? '' : text).replace(/🪙/g, svg(size));
  }

  // пройтись по DOM и заменить оставшиеся эмодзи (в т.ч. в текстах с сервера)
  function sweep(root) {
    root = root || document.body;
    if (!root || !root.querySelectorAll) return;
    var w;
    try { w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false); }
    catch (e) { return; }
    var list = [], node;
    while ((node = w.nextNode())) if (node.nodeValue.indexOf('🪙') !== -1) list.push(node);
    list.forEach(function (tn) {
      var span = document.createElement('span');
      span.innerHTML = fix(tn.nodeValue, 16);
      tn.parentNode.replaceChild(span, tn);
    });
  }

  window.BFCoin = { svg: svg, amount: amount, fix: fix, sweep: sweep };

  function boot() {
    sweep(document.body);
    try {
      new MutationObserver(function (m) {
        for (var i = 0; i < m.length; i++)
          for (var j = 0; j < m[i].addedNodes.length; j++)
            if (m[i].addedNodes[j].nodeType === 1) sweep(m[i].addedNodes[j]);
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
