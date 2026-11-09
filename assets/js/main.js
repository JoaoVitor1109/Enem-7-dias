/* Matemática para o ENEM em 7 Dias — interações e rastreamento (sem bibliotecas).
 * Configuração em /config.js (window.LP_CONFIG), gerado por build.py a partir de site.config.json. */
(function () {
  "use strict";
  var C = window.LP_CONFIG || {};
  var CHECKOUT = C.CHECKOUT_URL || "https://pay.cakto.com.br/36dgtmd_1301393";
  var KEY = "lp_consent_v1";
  var hasTracking = !!(C.META_PIXEL_ID || C.GA4_ID);
  var loaded = false, viewSent = false, pendingView = false;

  /* ---------- 1. Repasse opcional de UTMs para o checkout (desligado por padrão) ---------- */
  if (C.PASS_UTM_TO_CHECKOUT) {
    try {
      var src = new URLSearchParams(location.search), keep = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
      var extra = new URLSearchParams();
      keep.forEach(function (k) { var v = src.get(k); if (v) extra.set(k, v); });
      if ([...extra.keys()].length) {
        document.querySelectorAll("a.js-cta").forEach(function (a) {
          var u = new URL(a.getAttribute("href"));
          if (u.origin + u.pathname !== new URL(CHECKOUT).origin + new URL(CHECKOUT).pathname) return; // só mexe no checkout oficial
          extra.forEach(function (v, k) { if (!u.searchParams.has(k)) u.searchParams.set(k, v); });
          a.setAttribute("href", u.toString());
        });
      }
    } catch (e) { /* mantém o link literal */ }
  }

  /* ---------- 2. Consentimento + carregamento do Meta Pixel / GA4 ---------- */
  function getConsent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadTracking() {
    if (loaded) return; loaded = true;
    if (C.META_PIXEL_ID) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", String(C.META_PIXEL_ID));
      window.fbq("track", "PageView");
    }
    if (C.GA4_ID) {
      var s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.GA4_ID); document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", C.GA4_ID, { transport_type: "beacon" }); // envia page_view
    }
    if (pendingView) sendViewContent();
  }
  function track(metaEvent, gaEvent, params) {
    if (!loaded) return;
    try { if (window.fbq && metaEvent) window.fbq("track", metaEvent, params || {}); } catch (e) {}
    try { if (window.gtag && gaEvent) window.gtag("event", gaEvent, Object.assign({ transport_type: "beacon" }, params || {})); } catch (e) {}
  }
  var PRODUCT = { content_name: "Matemática para o ENEM em 7 Dias", content_type: "product", content_ids: ["matematica-enem-7-dias"] };
  if (C.PRICE_VALUE) { PRODUCT.value = Number(C.PRICE_VALUE); PRODUCT.currency = "BRL"; }
  function sendViewContent() {
    if (viewSent) return;
    if (!loaded) { pendingView = true; return; }
    viewSent = true;
    track("ViewContent", "view_item", PRODUCT);
  }

  var banner = document.getElementById("consent");
  var prefBtn = document.querySelector(".js-consent-open");
  if (hasTracking) {
    if (prefBtn) { prefBtn.hidden = false; prefBtn.addEventListener("click", function () { banner.hidden = false; }); }
    var c = getConsent();
    if (c === "granted") loadTracking();
    else if (c !== "denied") setTimeout(function () { banner.hidden = false; }, 1200); // discreto, sem bloquear a página
    document.querySelectorAll(".js-consent").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-v"); setConsent(v); banner.hidden = true;
        if (v === "granted") loadTracking();
      });
    });
  }

  /* ---------- 3. Eventos ---------- */
  // ViewContent: quando a seção de demonstração (páginas reais do ebook) ou a de conteúdo aparece na tela.
  var vcTargets = ["demonstracao", "assuntos"].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if ("IntersectionObserver" in window && vcTargets.length) {
    var vo = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { sendViewContent(); vo.disconnect(); } });
    }, { threshold: 0.25 });
    vcTargets.forEach(function (t) { vo.observe(t); });
  }
  // InitiateCheckout: no clique de qualquer CTA. Não atrasa a navegação (GA4 via beacon; Pixel dispara antes de sair).
  // NUNCA dispara Purchase aqui: a compra só é confirmada pela Cakto (ver README).
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a.js-cta");
    if (!a) return;
    track("InitiateCheckout", "begin_checkout", Object.assign({ cta_position: a.getAttribute("data-cta") || "" }, PRODUCT));
  });

  /* ---------- 4. CTA fixo no celular: aparece só depois do hero ---------- */
  var sticky = document.getElementById("sticky"), hero = document.getElementById("hero"), finalSec = document.getElementById("comprar"), footer = document.querySelector(".footer");
  if (sticky && hero && "IntersectionObserver" in window) {
    var pastHero = false, nearEnd = false;
    var stickyLink = sticky.querySelector("a");
    function update() {
      var show = pastHero && !nearEnd;
      sticky.classList.toggle("is-visible", show);
      sticky.setAttribute("aria-hidden", show ? "false" : "true");
      if (stickyLink) stickyLink.tabIndex = show ? 0 : -1;
      document.body.style.setProperty("--sticky-h", show && window.matchMedia("(max-width: 959px)").matches ? (sticky.offsetHeight + "px") : "0px");
    }
    new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; });
      update();
    }).observe(hero);
    var endIO = new IntersectionObserver(function (ents) {
      nearEnd = ents.some(function (e) { return e.isIntersecting; });
      update();
    });
    if (finalSec) endIO.observe(finalSec);
    if (footer) endIO.observe(footer);
    window.addEventListener("resize", update, { passive: true });
  }

  /* ---------- 5. Lightbox leve (sem biblioteca). Sem JS, o link abre a imagem. ---------- */
  var dlg = document.getElementById("lightbox");
  if (dlg && typeof dlg.showModal === "function") {
    var img = dlg.querySelector("img");
    document.querySelectorAll(".demo__zoom").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var inner = a.querySelector("img");
        img.src = a.getAttribute("href"); img.alt = inner ? inner.alt : "";
        img.width = +a.getAttribute("data-w") || 1200; img.height = +a.getAttribute("data-h") || 800;
        dlg.showModal();
        sendViewContent();
      });
    });
    dlg.querySelector(".lightbox__close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
  }
})();
