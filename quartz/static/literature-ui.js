// Literature Notes - Dynamic Article UI
// Injects back button, thumbnail, read/want marks on article pages
// Works with Quartz SPA mode (listens to 'nav' event)
// NOTE: window._litArticles is prepended by build-index.mjs at build time
(function () {
  var K = "lit-marks"
  var BASE = "/literature/"
  var container = null // persistent DOM container

  function gm() {
    try { return JSON.parse(localStorage.getItem(K) || "{}") } catch (e) { return {} }
  }
  function sm(m) { localStorage.setItem(K, JSON.stringify(m)) }

  function isArticle() {
    var p = location.pathname
    return p.startsWith(BASE) && p !== BASE && p !== BASE.slice(0, -1) && p.indexOf("/tags/") === -1
  }

  function getSlug() {
    return decodeURIComponent(location.pathname.replace(BASE, "").replace(/\.html$/, "").replace(/\/$/, ""))
  }

  function findMeta(slug) {
    if (!window._litArticles) return null
    // Try exact match first, then fuzzy
    return window._litArticles.find(function (a) { return a.slug === slug }) ||
      window._litArticles.find(function (a) { return a.slug.replace(/-/g, " ") === slug.replace(/-/g, " ") })
  }

  function ensureContainer() {
    if (container && document.body.contains(container)) return
    container = document.createElement("div")
    container.id = "lit-ui"
    document.body.insertBefore(container, document.body.firstChild)
  }

  function toggle(slug, type) {
    var m = gm()
    if (!m[slug]) m[slug] = {}
    m[slug][type] = !m[slug][type]
    sm(m)
    updateButtons(slug)
    syncToGitHub(m)
  }

  function updateButtons(slug) {
    var m = gm(), mk = m[slug] || {}
    var rb = document.getElementById("lit-read")
    var wb = document.getElementById("lit-want")
    if (rb) { rb.className = "lit-action-btn" + (mk.read ? " ra" : ""); rb.textContent = mk.read ? "✓ 読んだ！" : "✓ 読んだ" }
    if (wb) { wb.className = "lit-action-btn" + (mk.want ? " wa" : ""); wb.textContent = mk.want ? "★ やりたい！" : "★ やりたい" }
  }

  // Debounced sync to GitHub (writes marks.json to repo)
  var syncTimer = null
  function syncToGitHub(marks) {
    clearTimeout(syncTimer)
    syncTimer = setTimeout(function () {
      var token = localStorage.getItem("lit-gh-token")
      if (!token) return
      var content = btoa(unescape(encodeURIComponent(JSON.stringify(marks, null, 2))))
      // Get current file SHA first
      fetch("https://api.github.com/repos/fujimoto-cpu/literature/contents/marks.json?ref=gh-pages", {
        headers: { Authorization: "token " + token }
      }).then(function (r) { return r.ok ? r.json() : { sha: null } }).then(function (data) {
        var body = { message: "sync marks", content: content, branch: "gh-pages" }
        if (data.sha) body.sha = data.sha
        return fetch("https://api.github.com/repos/fujimoto-cpu/literature/contents/marks.json", {
          method: "PUT",
          headers: { Authorization: "token " + token, "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
      }).catch(function () { /* silent fail */ })
    }, 3000) // 3 second debounce
  }

  // Load marks from GitHub on first visit
  function loadMarksFromGitHub() {
    fetch(BASE + "marks.json?" + Date.now()).then(function (r) {
      return r.ok ? r.json() : null
    }).then(function (remote) {
      if (!remote) return
      var local = gm()
      // Merge: remote wins for items not in local, local wins for items that exist
      var merged = Object.assign({}, remote, local)
      sm(merged)
    }).catch(function () { })
  }

  function render() {
    ensureContainer()

    if (!isArticle()) {
      container.style.display = "none"
      return
    }
    container.style.display = "block"

    var slug = getSlug()
    var a = findMeta(slug)
    var h = ""

    // Back button - uses history.back() to preserve filter state
    h += '<div class="lit-back"><a href="javascript:void(0)" onclick="history.back()">← 一覧に戻る</a></div>'

    // Thumbnail
    if (a && a.thumbnail) {
      var src = a.thumbnail.startsWith("http") ? a.thumbnail : BASE + a.thumbnail
      h += '<img class="lit-hero" src="' + src + '" alt="" onerror="this.style.display=\'none\'">'
    }

    // Action buttons
    h += '<div class="lit-actions">'
    h += '<button class="lit-action-btn" id="lit-read">✓ 読んだ</button>'
    h += '<button class="lit-action-btn" id="lit-want">★ やりたい</button>'
    h += '</div>'

    // Original link
    if (a && a.url) {
      h += '<a class="lit-original-link" href="' + a.url + '" target="_blank">元の投稿を開く ↗</a>'
    }

    container.innerHTML = h

    // Bind click events
    var rb = document.getElementById("lit-read")
    var wb = document.getElementById("lit-want")
    if (rb) rb.onclick = function () { toggle(slug, "read") }
    if (wb) wb.onclick = function () { toggle(slug, "want") }

    updateButtons(slug)
  }

  // Quartz SPA navigation event
  document.addEventListener("nav", function () { setTimeout(render, 50) })
  // Initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { render(); loadMarksFromGitHub() })
  } else {
    render()
    loadMarksFromGitHub()
  }
})()
