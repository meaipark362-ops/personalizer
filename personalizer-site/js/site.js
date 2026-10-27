/**
 * PERSONALIZER — Shared site behaviour (landing + checkout)
 * - navigation state & mobile menu
 * - scroll reveal (respects prefers-reduced-motion)
 * - config-driven links (survey / contact / legal) with honest "준비 중" fallback
 */
(function () {
  'use strict';

  var cfg = window.PERSONALIZER_CONFIG || {};
  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Navigation ---------- */
  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var toggle = nav.querySelector('.nav__toggle');
    var links = nav.querySelector('.nav__links');

    var onScroll = function () { nav.classList.toggle('is-solid', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!toggle || !links) return;
    var close = function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '메뉴 열기');
    };
    toggle.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { close(); toggle.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) close(); });
  }

  /* ---------- Reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length || reduceMQ.matches || !('IntersectionObserver' in window)) return;
    root.classList.add('js-motion');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Config-driven links ---------- */
  function resolveLink(key) {
    if (key === 'survey') return cfg.surveyUrl || '';
    if (key === 'privacy') return (cfg.legal && cfg.legal.privacyUrl) || '';
    if (key === 'terms') return (cfg.legal && cfg.legal.termsUrl) || '';
    if (key === 'contact') return (cfg.contact && cfg.contact.email) || '';
    return '';
  }

  function initConfigLinks() {
    document.querySelectorAll('[data-config-link]').forEach(function (el) {
      var url = resolveLink(el.getAttribute('data-config-link'));
      if (!url) return; // keep the honest "준비 중" markup
      var a = document.createElement('a');
      a.href = url;
      a.className = el.getAttribute('data-ready-class') || el.className.replace('is-pending', '').trim();
      a.innerHTML = el.getAttribute('data-ready-html') || el.textContent;
      if (/^https?:/i.test(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      el.replaceWith(a);
    });
  }

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* expose small helpers for page scripts */
  window.PersonalizerSite = {
    formatKRW: function (n) { return Number(n).toLocaleString('ko-KR') + '원'; },
    reducedMotion: function () { return reduceMQ.matches; }
  };

  function init() { initNav(); initReveal(); initConfigLinks(); initYear(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
