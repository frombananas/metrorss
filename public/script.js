/* ===== IE9 Polyfills ===== */
(function () {
  'use strict';

  // String.prototype.startsWith
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (s, p) {
      p = p || 0;
      return this.substr(p, s.length) === s;
    };
  }
  // String.prototype.includes
  if (!String.prototype.includes) {
    String.prototype.includes = function (s, p) {
      return this.indexOf(s, p || 0) !== -1;
    };
  }
  // String.prototype.padStart
  if (!String.prototype.padStart) {
    String.prototype.padStart = function (len, str) {
      var s = String(this);
      while (s.length < len) s = (str || ' ').substr(0, len - s.length) + s;
      return s;
    };
  }
  // Array.from
  if (!Array.from) {
    Array.from = function (a) {
      var r = [];
      for (var i = 0; i < a.length; i++) r[i] = a[i];
      return r;
    };
  }
  // Array.prototype.find
  if (!Array.prototype.find) {
    Array.prototype.find = function (fn) {
      for (var i = 0; i < this.length; i++) {
        if (fn(this[i], i, this)) return this[i];
      }
    };
  }
  // Array.prototype.findIndex
  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function (fn) {
      for (var i = 0; i < this.length; i++) {
        if (fn(this[i], i, this)) return i;
      }
      return -1;
    };
  }
  // Object.entries
  if (!Object.entries) {
    Object.entries = function (obj) {
      var r = [];
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) r.push([k, obj[k]]);
      }
      return r;
    };
  }
  // Element.prototype.remove
  if (!Element.prototype.remove) {
    Element.prototype.remove = function () {
      if (this.parentNode) this.parentNode.removeChild(this);
    };
  }
  // Element.prototype.matches
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }
  // Element.prototype.closest
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (sel) {
      var el = this;
      while (el && el.nodeType === 1) {
        if (el.matches(sel)) return el;
        el = el.parentNode;
      }
      return null;
    };
  }
  // Element.classList (basic)
  if (!('classList' in document.documentElement)) {
    var clp = {
      add: function (c) { if (this.className.indexOf(c) === -1) this.className += (this.className ? ' ' : '') + c; },
      remove: function (c) { this.className = this.className.replace(new RegExp('(^|\\s)' + c + '(\\s|$)', 'g'), ' ').replace(/^\s+|\s+$/g, ''); },
      contains: function (c) { return new RegExp('(^|\\s)' + c + '(\\s|$)').test(this.className); },
      toggle: function (c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    };
    Object.defineProperty(Element.prototype, 'classList', { get: function () { var el = this; return { add: function (c) { clp.add.call(el, c); }, remove: function (c) { clp.remove.call(el, c); }, contains: function (c) { return clp.contains.call(el, c); }, toggle: function (c) { clp.toggle.call(el, c); } }; } });
  }
  // dataset polyfill
  if (!('dataset' in document.documentElement)) {
    Object.defineProperty(Element.prototype, 'dataset', {
      get: function () {
        var el = this;
        return {
          get: function (key) {
            return el.getAttribute('data-' + key.replace(/([A-Z])/g, '-$1').toLowerCase());
          },
          set: function (key, val) {
            el.setAttribute('data-' + key.replace(/([A-Z])/g, '-$1').toLowerCase(), val);
          }
        };
      }
    });
  }
  // TextEncoder polyfill
  if (typeof TextEncoder === 'undefined') {
    window.TextEncoder = function () {};
    TextEncoder.prototype.encode = function (s) {
      var buf = new ArrayBuffer(s.length);
      var view = new Uint8Array(buf);
      for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
      return view;
    };
  }
  // Promise polyfill (basic)
  if (typeof Promise === 'undefined') {
    (function (global) {
      function Promise(fn) {
        var self = this;
        self._state = 'pending';
        self._value = undefined;
        self._callbacks = [];
        function resolve(val) {
          if (self._state !== 'pending') return;
          if (val && typeof val.then === 'function') { val.then(resolve, reject); return; }
          self._state = 'fulfilled';
          self._value = val;
          var cb;
          while ((cb = self._callbacks.shift())) cb.onFulfilled(val);
        }
        function reject(err) {
          if (self._state !== 'pending') return;
          self._state = 'rejected';
          self._value = err;
          var cb;
          while ((cb = self._callbacks.shift())) cb.onRejected(err);
        }
        try { fn(resolve, reject); } catch (e) { reject(e); }
      }
      Promise.prototype.then = function (onFulfilled, onRejected) {
        var self = this;
        return new Promise(function (resolve, reject) {
          function handle() {
            var cb = self._state === 'fulfilled' ? (onFulfilled || resolve) : (onRejected || reject);
            try { var result = cb(self._value); if (result instanceof Promise) result.then(resolve, reject); else resolve(result); } catch (e) { reject(e); }
          }
          if (self._state === 'pending') self._callbacks.push({ onFulfilled: function () { handle(); }, onRejected: function () { handle(); } });
          else setTimeout(handle, 0);
        });
      };
      Promise.prototype.catch = function (onRejected) { return this.then(null, onRejected); };
      Promise.resolve = function (v) { return new Promise(function (r) { r(v); }); };
      Promise.reject = function (v) { return new Promise(function (_, r) { r(v); }); };
      Promise.all = function (arr) {
        return new Promise(function (resolve, reject) {
          var results = [], remaining = arr.length;
          if (!remaining) { resolve(results); return; }
          arr.forEach(function (p, i) {
            Promise.resolve(p).then(function (v) { results[i] = v; remaining--; if (!remaining) resolve(results); }, reject);
          });
        });
      };
      global.Promise = Promise;
    })(window);
  }
  // fetch polyfill based on XMLHttpRequest
  if (typeof fetch === 'undefined') {
    window.fetch = function (url, opts) {
      opts = opts || {};
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(opts.method || 'GET', url, true);
        var headers = opts.headers || {};
        for (var k in headers) {
          if (Object.prototype.hasOwnProperty.call(headers, k)) {
            xhr.setRequestHeader(k, headers[k]);
          }
        }
        xhr.onreadystatechange = function () {
          if (xhr.readyState !== 4) return;
          var resp = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            json: function () { return Promise.resolve(JSON.parse(xhr.responseText)); },
            text: function () { return Promise.resolve(xhr.responseText); }
          };
          if (resp.ok || xhr.status === 409 || xhr.status === 403 || xhr.status === 429) resolve(resp);
          else reject(new Error('HTTP ' + xhr.status));
        };
        xhr.onerror = function () { reject(new Error('network error')); };
        xhr.ontimeout = function () { reject(new Error('timeout')); }
        try {
          if (opts.body) xhr.send(opts.body);
          else xhr.send();
        } catch (e) { reject(e); }
      });
    };
  }
})();

/* ===== App Code ===== */
(function () {
  'use strict';

  var API = '/api/posts';

  function hashStr(s) {
    var h = 0, i;
    for (i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    return Math.abs(h).toString(36);
  }

  function sha256(s) {
    try {
      var buf = crypto.subtle ? null : null;
      if (crypto && crypto.subtle) {
        // use promise wrapped for IE9 polyfill
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (buf) {
          return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(36).padStart(2, '0'); }).join('').slice(0, 60);
        });
      }
    } catch (e) {}
    return Promise.resolve(null);
  }

  function getCanvasFP() {
    try {
      var c = document.createElement('canvas');
      if (!c.getContext) return '';
      c.width = 256; c.height = 128;
      var ctx = c.getContext('2d');
      ctx.textBaseline = 'alphabetic';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(10, 10, 60, 60);
      ctx.fillStyle = '#069';
      ctx.fillText('C=π·d', 5, 40);
      ctx.fillStyle = '#444';
      ctx.font = '12px monospace';
      ctx.fillText(navigator.userAgent.slice(-8), 5, 70);
      ctx.font = 'bold 20px Georgia';
      ctx.fillStyle = '#2a9';
      ctx.fillText('g@', 120, 50);
      ctx.strokeStyle = '#e3a87e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(200, 60, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,40,80,0.25)';
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(35, 100, 42, 18, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      var grad = ctx.createLinearGradient(120, 0, 220, 0);
      grad.addColorStop(0, '#a0f');
      grad.addColorStop(1, '#0af');
      ctx.fillStyle = grad;
      ctx.fillRect(140, 90, 60, 25);
      return hashStr(c.toDataURL());
    } catch (e) { return ''; }
  }

  function getSignalString() {
    var parts = [
      navigator.userAgent,
      screen.width + 'x' + screen.height + 'x' + (screen.colorDepth || ''),
      navigator.language || navigator.userLanguage || '',
      (typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''),
      navigator.platform || '',
      navigator.hardwareConcurrency || '',
      navigator.deviceMemory || '',
      navigator.maxTouchPoints || 0,
      getCanvasFP(),
      navigator.webdriver || '',
      navigator.vendor || '',
      window.devicePixelRatio || '',
      (screen.availWidth || screen.width) + 'x' + (screen.availHeight || screen.height),
      screen.pixelDepth || '',
      (screen.orientation && screen.orientation.type ? screen.orientation.type : ''),
      (navigator.plugins ? navigator.plugins.length : ''),
      navigator.productSub || '',
      (navigator.userAgent.match(/Android\s[\d.]+/) ? navigator.userAgent.match(/Android\s[\d.]+/)[0] : ''),
      (navigator.userAgentData && navigator.userAgentData.platform ? navigator.userAgentData.platform : '')
    ];
    return parts.join('|');
  }

  var _cachedDID = null;

  function generateDeviceID() {
    var signals = getSignalString();
    return sha256(signals).then(function (h) {
      if (!h || h.length < 16) h = hashStr(signals);
      var id = 'd3_' + h;
      saveDeviceID(id);
      _cachedDID = id;
      return id;
    });
  }

  function getDeviceID() {
    if (_cachedDID) return _cachedDID;
    var id = localStorage.getItem('_did') || sessionStorage.getItem('_did') || getCookie('_did');
    if (!id) {
      var signals = getSignalString();
      var h = hashStr(signals);
      id = 'd2_' + h;
      saveDeviceID(id);
    }
    _cachedDID = id;
    generateDeviceID().catch(function () {});
    return id;
  }

  function saveDeviceID(id) {
    try { localStorage.setItem('_did', id); } catch (e) {}
    try { sessionStorage.setItem('_did', id); } catch (e) {}
    try { setCookie('_did', id, 365); } catch (e) {}
    try {
      if (window.indexedDB) {
        var req = indexedDB.open('_did_db', 1);
        req.onupgradeneeded = function () { req.result.createObjectStore('d', { keyPath: 'k' }); };
        req.onsuccess = function () {
          var tx = req.result.transaction('d', 'readwrite');
          var store = tx.objectStore('d');
          store.get('id').onsuccess = function (e) {
            if (!e.target.result) store.put({ k: 'id', v: id });
          };
        };
      }
    } catch (e) {}
  }

  function getCookie(n) {
    var m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : '';
  }

  function setCookie(n, v, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 864e5);
    document.cookie = n + '=' + v + '; expires=' + d.toUTCString() + '; path=/; SameSite=Lax; Secure';
  }

  var origFetch = window.fetch;
  window.fetch = function (url, opts) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers['X-Device-ID'] = getDeviceID();
    opts.headers['X-Device-Signals'] = getSignalString().slice(0, 2000);
    return origFetch.call(window, url, opts);
  };

  function showToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = 'position:fixed;bottom:60px;left:50%;margin-left:-100px;background:#744da9;color:#fff;padding:10px 24px;font-size:14px;z-index:999;display:none;';
      document.body.appendChild(toast);
    }
    toast.innerHTML = msg;
    toast.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.style.display = 'none'; }, 2000);
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function copyText(txt) {
    var el = document.createElement('textarea');
    el.value = txt;
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); showToast('скопировано'); } catch (ex) { prompt('Скопируй вручную (Ctrl+C):', txt); }
    el.remove();
  }

  // ===== Like / Comment =====

  function likePost(id, btn) {
    var countEl = getElByClass(btn, 'lc');
    fetch(API + '/' + id + '/like', { method: 'POST' }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (errData) {
          if (res.status === 403 && errData.error) alert(errData.error + (errData.reason ? ' (' + errData.reason + ')' : ''));
        });
      }
      return res.json().then(function (data) {
        countEl.innerHTML = data.likes;
        addClass(btn, 'liked');
        setTimeout(function () { removeClass(btn, 'liked'); }, 300);
      });
    }).catch(function () {});
  }

  function addComment(id, inputEl, listEl, postEl) {
    var text = inputEl.value.replace(/^\s+|\s+$/g, '');
    if (!text) return;
    inputEl.value = '';
    inputEl.disabled = true;
    fetch(API + '/' + id + '/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (errData) {
          if (res.status === 403 && errData.error) alert(errData.error + (errData.reason ? ' (' + errData.reason + ')' : ''));
          inputEl.disabled = false;
        });
      }
      return res.json().then(function (comments) {
        renderComments(comments, listEl);
        inputEl.disabled = false;
        var cmtBtn = postEl.querySelector('.cmt-btn span');
        var c = postEl.querySelectorAll('.c');
        cmtBtn.innerHTML = c.length;
      });
    }).catch(function () { inputEl.disabled = false; });
  }

  function renderComments(comments, listEl) {
    if (!comments || comments.length === 0) {
      listEl.innerHTML = '';
      return;
    }
    var html = '';
    for (var i = 0; i < comments.length; i++) {
      var c = comments[i];
      html += '<div class="c"><span class="cd">' + new Date(c.date).toLocaleDateString('ru') + '</span>' + esc(c.text) + '</div>';
    }
    listEl.innerHTML = html;
  }

  // ===== DOM Helpers =====

  function addClass(el, cls) { if (!hasClass(el, cls)) el.className += (el.className ? ' ' : '') + cls; }
  function removeClass(el, cls) { el.className = el.className.replace(new RegExp('(^|\\s)' + cls + '(\\s|$)', 'g'), ' ').replace(/^\s+|\s+$/g, ''); }
  function hasClass(el, cls) { return new RegExp('(^|\\s)' + cls + '(\\s|$)').test(el.className); }
  function toggleClass(el, cls) { if (hasClass(el, cls)) removeClass(el, cls); else addClass(el, cls); }
  function getElByClass(el, cls) {
    var els = el.getElementsByTagName('*');
    for (var i = 0; i < els.length; i++) {
      if (hasClass(els[i], cls)) return els[i];
    }
    return null;
  }

  function getData(el, key) { return el.getAttribute('data-' + key); }

  function closest(el, sel) {
    while (el && el.nodeType === 1) {
      if (elMatches(el, sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function elMatches(el, sel) {
    var m = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
    return m ? m.call(el, sel) : false;
  }

  function forEachQS(sel, fn) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) fn(els[i], i);
  }

  // ===== Load News =====

  function loadNews(silent) {
    var feed = document.getElementById('feed');
    if (!silent) feed.innerHTML = '<img class="loader-gif" src="/loader.gif">';
    fetch(API).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (errData) {
          if (res.status === 403 && errData.error) {
            var banHtml = '<div class="post" style="border-color:#e51400;"><p style="color:#e51400;font-weight:300;"><b>вы забанены</b>';
            if (errData.reason) banHtml += '<br><span style="color:#999;font-size:13px;">причина: ' + esc(errData.reason) + '</span>';
            if (errData.deviceId) {
              banHtml += '<br><span style="color:#555;font-size:11px;">device: ' + esc(errData.deviceId);
              banHtml += ' <button style="background:none;border:1px solid #744da9;color:#744da9;padding:1px 8px;font-size:11px;cursor:pointer;font-family:inherit;" onclick="copyText(\'' + esc(errData.deviceId) + '\')">копировать</button></span>';
            }
            banHtml += '</p></div>';
            feed.innerHTML = banHtml;
            return;
          }
          throw new Error('Ошибка сервера (' + res.status + ')');
        });
      }
      return res.json().then(function (data) {
        if (!Array.isArray(data) || data.length === 0) {
          feed.innerHTML = '<p style="color:#666;font-style:italic;font-weight:300;">лента новостей пуста.</p>';
          return;
        }
        var html = '';
        for (var i = 0; i < data.length; i++) {
          var p = data[i];
          var id = p && p.id ? p.id : '';
          var title = p && p.title ? String(p.title).toLowerCase() : 'без заголовка';
          var text = p && p.text ? String(p.text) : '';
          var likes = p && typeof p.likes === 'number' ? p.likes : 0;
          var comments = p && Array.isArray(p.comments) ? p.comments : [];
          html += '<div class="post' + (silent ? ' no-anim' : '') + '" data-id="' + id + '">';
          html += '<h2>' + title + '</h2><p>' + text + '</p>';
          html += '<div class="bar">';
          html += '<button class="like-btn" data-id="' + id + '"><i class="material-icons">favorite_border</i><span class="lc">' + likes + '</span></button>';
          html += '<button class="cmt-btn" data-id="' + id + '"><i class="material-icons">chat_bubble_outline</i><span>' + comments.length + '</span></button>';
          html += '</div>';
          html += '<div class="comments"><div class="cmt-list">';
          for (var j = 0; j < comments.length; j++) {
            html += '<div class="c"><span class="cd">' + new Date(comments[j].date).toLocaleDateString('ru') + '</span>' + esc(comments[j].text) + '</div>';
          }
          html += '</div>';
          html += '<div class="cmt-form"><input class="cmt-input" placeholder="комментарий..."><button class="cmt-send"><i class="material-icons">send</i></button></div>';
          html += '</div></div>';
        }
        feed.innerHTML = html;
        attachListeners();
      });
    }).catch(function (e) {
      if (!silent) feed.innerHTML = '<p style="color:#e51400;font-weight:300;">не удалось загрузить ленту: ' + esc(e.message || 'ошибка') + '</p>';
    });
  }

  function attachListeners() {
    forEachQS('.like-btn', function (btn) {
      btn.onclick = function (e) {
        e = e || window.event;
        if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
        var id = getData(btn, 'id');
        likePost(id, btn);
      };
    });

    forEachQS('.cmt-btn', function (btn) {
      btn.onclick = function (e) {
        e = e || window.event;
        if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
        var id = getData(btn, 'id');
        var postEl = document.querySelector('.post[data-id="' + id + '"]');
        var commentsEl = postEl.querySelector('.comments');
        toggleClass(commentsEl, 'open');
      };
    });

    forEachQS('.cmt-send', function (btn) {
      btn.onclick = function (e) {
        e = e || window.event;
        if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true;
        var postEl = closest(btn, '.post');
        var id = getData(postEl, 'id');
        var inputEl = postEl.querySelector('.cmt-input');
        var listEl = postEl.querySelector('.cmt-list');
        addComment(id, inputEl, listEl, postEl);
      };
    });

    forEachQS('.cmt-input', function (input) {
      input.onkeydown = function (e) {
        e = e || window.event;
        if (e.keyCode === 13 || e.key === 'Enter') {
          var postEl = closest(input, '.post');
          var id = getData(postEl, 'id');
          var listEl = postEl.querySelector('.cmt-list');
          addComment(id, input, listEl, postEl);
        }
      };
      input.onclick = function (e) { e = e || window.event; if (e.stopPropagation) e.stopPropagation(); else e.cancelBubble = true; };
    });
  }

  function postNews() {
    var titleEl = document.getElementById('t');
    var textEl = document.getElementById('d');
    var btn = document.getElementById('submit-btn');
    if (!titleEl.value.replace(/^\s+|\s+$/g, '') || !textEl.value.replace(/^\s+|\s+$/g, '')) {
      return alert('Заполните все поля!');
    }
    btn.disabled = true;
    btn.innerHTML = 'публикация...';
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleEl.value, text: textEl.value })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var msg = data.reason ? data.error + ' (' + data.reason + ')' : data.error;
          throw new Error(msg || 'Сервер ответил ошибкой: ' + res.status);
        }
        titleEl.value = '';
        textEl.value = '';
        loadNews(false);
        btn.disabled = false;
        btn.innerHTML = '<i class="material-icons" style="font-size:18px;">send</i> опубликовать';
      });
    }).catch(function (e) {
      alert(e.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="material-icons" style="font-size:18px;">send</i> опубликовать';
    });
  }

  // Only init main page if we're on the main page
  if (document.getElementById('feed')) {
    document.getElementById('submit-btn').onclick = postNews;
    loadNews(false);
    loadEmergency();

    var autoRefresh = setInterval(function () {
      if (currentFeed === 'all') loadNews(true);
    }, 30000);
  }

  function loadEmergency() {
    fetch('/api/emergency').then(function (res) { return res.json(); }).then(function (data) {
      var banner = document.getElementById('emergency-banner');
      var textEl = document.getElementById('emergency-text');
      if (data.active && data.text) {
        textEl.innerHTML = esc(data.text);
        banner.style.display = 'block';
      } else {
        banner.style.display = 'none';
      }
    }).catch(function () {});
  }

  var currentFeed = 'all';

  forEachQS('.tab-btn', function (btn) {
    btn.onclick = function () {
      forEachQS('.tab-btn', function (b) { removeClass(b, 'active'); });
      addClass(btn, 'active');
      currentFeed = getData(btn, 'feed');
      if (currentFeed === 'all') {
        loadNews(true);
      } else if (currentFeed === 'liked') {
        loadLiked();
      }
    };
  });

  function loadLiked() {
    var feed = document.getElementById('feed');
    feed.innerHTML = '<img class="loader-gif" src="/loader.gif">';
    fetch('/api/liked-by-device').then(function (res) { return res.json(); }).then(function (data) {
      if (!Array.isArray(data) || data.length === 0) {
        feed.innerHTML = '<p style="color:#666;font-style:italic;font-weight:300;">вы ещё не лайкали посты.</p>';
        return;
      }
      var html = '';
      for (var i = 0; i < data.length; i++) {
        var p = data[i];
        var id = p && p.id ? p.id : '';
        var title = p && p.title ? String(p.title).toLowerCase() : 'без заголовка';
        var text = p && p.text ? String(p.text) : '';
        var likes = p && typeof p.likes === 'number' ? p.likes : 0;
        var comments = p && Array.isArray(p.comments) ? p.comments : [];
        html += '<div class="post" data-id="' + id + '">';
        html += '<h2>' + title + '</h2><p>' + text + '</p>';
        html += '<div class="bar">';
        html += '<button class="like-btn" data-id="' + id + '"><i class="material-icons">favorite_border</i><span class="lc">' + likes + '</span></button>';
        html += '<button class="cmt-btn" data-id="' + id + '"><i class="material-icons">chat_bubble_outline</i><span>' + comments.length + '</span></button>';
        html += '</div>';
        html += '<div class="comments"><div class="cmt-list">';
        for (var j = 0; j < comments.length; j++) {
          html += '<div class="c"><span class="cd">' + new Date(comments[j].date).toLocaleDateString('ru') + '</span>' + esc(comments[j].text) + '</div>';
        }
        html += '</div>';
        html += '<div class="cmt-form"><input class="cmt-input" placeholder="комментарий..."><button class="cmt-send"><i class="material-icons">send</i></button></div>';
        html += '</div></div>';
      }
      feed.innerHTML = html;
      attachListeners();
    }).catch(function () {
      feed.innerHTML = '<p style="color:#e51400;font-weight:300;">ошибка загрузки.</p>';
    });
  }

  // Expose copyText globally for inline onclick
  window.copyText = copyText;
})();