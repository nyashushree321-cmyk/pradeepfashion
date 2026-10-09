/* Pradeep Fashion — front-end interactions (vanilla JS, no dependencies) */
(function () {
  "use strict";

  var PHONE = "919449249460";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Header shadow on scroll ---------- */
  var header = $(".site-header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile drawer ---------- */
  var menuBtn = $(".menu-btn");
  var closeBtn = $(".drawer-close");
  var backdrop = $(".drawer-backdrop");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (menuBtn) menuBtn.addEventListener("click", function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setMenu(false); });
  if (backdrop) backdrop.addEventListener("click", function () { setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  $$(".drawer a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Hero video slider ---------- */
  var hero = $(".hero");
  if (hero) {
    var vids = $$("video", hero);
    var dots = $$(".hero-dots button", hero);
    var counter = $(".hero-count", hero);
    var idx = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var show = function (n) {
      idx = (n + vids.length) % vids.length;
      vids.forEach(function (v, i) {
        var on = i === idx;
        v.classList.toggle("active", on);
        if (on) { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else { v.pause(); }
      });
      dots.forEach(function (d, i) { d.classList.toggle("active", i === idx); d.setAttribute("aria-current", i === idx ? "true" : "false"); });
      if (counter) counter.textContent = "0" + (idx + 1) + " / 0" + vids.length;
      clearTimeout(timer);
      timer = setTimeout(function () { show(idx + 1); }, 9000); // fallback if 'ended' never fires
    };

    vids.forEach(function (v, i) {
      v.addEventListener("ended", function () { if (i === idx) show(idx + 1); });
    });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { show(i); }); });

    if (reduce) { vids.forEach(function (v) { v.removeAttribute("autoplay"); v.pause(); }); vids[0].classList.add("active"); }
    else if (vids.length) { show(0); }
  }

  /* ---------- Product filtering (home + collections) ---------- */
  var grid = $("[data-product-grid]");
  if (grid) {
    var cards = $$(".product-card", grid);
    var chips = $$(".chip[data-cat]");
    var searchInput = $("#search");
    var sortSel = $("#sort");
    var countEl = $("#result-count");
    var emptyEl = $(".empty");
    var isHome = grid.hasAttribute("data-home");
    var state = { cat: "All", q: "" };

    // Preselect category from ?cat= (also supports the old ?fil= link)
    var params = new URLSearchParams(window.location.search);
    var pre = params.get("cat") || params.get("fil");
    if (pre) {
      var match = chips.filter(function (c) { return c.dataset.cat.toLowerCase() === pre.toLowerCase(); })[0];
      if (match) state.cat = match.dataset.cat;
    }

    var apply = function () {
      var q = state.q.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (c) {
        var okCat = state.cat === "All" || c.dataset.cat === state.cat;
        var okQ = !q || c.dataset.name.toLowerCase().indexOf(q) > -1 || c.dataset.cat.toLowerCase().indexOf(q) > -1;
        // On the home page "All" shows only the featured picks
        var okFeat = !isHome || state.cat !== "All" || c.hasAttribute("data-featured");
        var show = okCat && okQ && okFeat;
        c.hidden = !show;
        if (show) visible++;
      });
      if (countEl) countEl.textContent = visible + (visible === 1 ? " style" : " styles");
      if (emptyEl) emptyEl.classList.toggle("show", visible === 0);
      chips.forEach(function (c) {
        var on = c.dataset.cat === state.cat;
        c.classList.toggle("active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { state.cat = chip.dataset.cat; apply(); });
    });
    if (searchInput) searchInput.addEventListener("input", function () { state.q = searchInput.value; apply(); });
    if (sortSel) sortSel.addEventListener("change", function () {
      var dir = sortSel.value;
      var sorted = cards.slice().sort(function (a, b) {
        if (dir === "az") return a.dataset.name.localeCompare(b.dataset.name);
        if (dir === "za") return b.dataset.name.localeCompare(a.dataset.name);
        return Number(a.dataset.order) - Number(b.dataset.order);
      });
      sorted.forEach(function (c) { grid.appendChild(c); });
    });
    apply();
  }

  /* ---------- Carousel arrows ---------- */
  $$("[data-carousel]").forEach(function (wrap) {
    var track = $(".carousel", wrap);
    var step = function () { return Math.max(track.clientWidth * 0.8, 200); };
    var prev = $("[data-prev]", wrap), next = $("[data-next]", wrap);
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
  });

  /* ---------- Count-up stats ---------- */
  var nums = $$("[data-count]");
  if (nums.length) {
    var run = function (el) {
      var target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "";
      var start = null, dur = 1400;
      var tick = function (t) {
        if (!start) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString("en-IN") + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io2.unobserve(en.target); } });
      }, { threshold: 0.5 });
      nums.forEach(function (n) { io2.observe(n); });
    }
  }

  /* ---------- Contact form → opens WhatsApp with the message ---------- */
  var form = $("#contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var msg = form.elements.message.value.trim();
      var text = "Hi Pradeep Fashion! My name is " + name + " (" + email + ").\n\n" + msg;
      window.open("https://wa.me/" + PHONE + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      var ok = $(".form-ok");
      if (ok) ok.classList.add("show");
      form.reset();
    });
  }

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
