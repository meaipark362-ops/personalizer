/**
 * PERSONALIZER — Landing page interactions
 * - Feature 01 gesture tabs (WAI-ARIA tabs pattern) + concept stage
 * - Feature 02 mapping example (cycles demo options; nothing is saved)
 * - Feature 03 voice bars
 */
(function () {
  'use strict';

  var GESTURES = {
    move:  { label: 'MOVE',  desc: '손가락 움직임으로 커서를 이동합니다.',        hint: 'MOVE · 포인터를 움직여 보세요' },
    pinch: { label: 'PINCH', desc: '엄지와 검지를 맞대는 동작으로 클릭합니다.',    hint: 'PINCH · 핀치로 클릭' },
    click: { label: 'CLICK', desc: '미리 설정해 둔 동작을 즉시 실행합니다.',       hint: 'CLICK · 설정한 동작 실행' },
    twist: { label: 'TWIST', desc: '손목을 돌려 화면을 부드럽게 스크롤합니다.',    hint: 'TWIST · 포인터를 좌우로 움직여 보세요' }
  };

  /* ---------- Feature 01 ---------- */
  function initGestures() {
    var stage = document.getElementById('gstage');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.gtab'));
    var panel = document.getElementById('gpanel');
    var hint = document.getElementById('gstageHint');
    if (!stage || !tabs.length) return;

    var ghost = stage.querySelector('.stage__ghost');
    var stageIn = stage.querySelector('.stage__in');
    var gMove = stage.querySelector('.g--move');
    var gTwist = stage.querySelector('.g--twist');

    // ring ticks
    var ticks = stage.querySelector('.ticks');
    if (ticks) {
      var ns = 'http://www.w3.org/2000/svg';
      for (var i = 0; i < 60; i++) {
        var a = (i / 60) * Math.PI * 2, long = i % 5 === 0;
        var r1 = 70, r2 = long ? 78 : 74;
        var ln = document.createElementNS(ns, 'line');
        ln.setAttribute('x1', (Math.cos(a) * r1).toFixed(2)); ln.setAttribute('y1', (Math.sin(a) * r1).toFixed(2));
        ln.setAttribute('x2', (Math.cos(a) * r2).toFixed(2)); ln.setAttribute('y2', (Math.sin(a) * r2).toFixed(2));
        ticks.appendChild(ln);
      }
    }

    function select(tab, focus) {
      var key = tab.getAttribute('data-g');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      stage.setAttribute('data-g', key);
      panel.setAttribute('aria-labelledby', tab.id);
      panel.textContent = GESTURES[key].desc;
      if (ghost) ghost.textContent = GESTURES[key].label;
      if (hint) hint.textContent = GESTURES[key].hint;
      gMove.classList.remove('tracking'); gTwist.classList.remove('tracking');
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (idx + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(tabs[n], true); }
      });
    });

    // pointer interaction (concept demo only)
    stageIn.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = stageIn.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width) * 100;
      var y = ((e.clientY - r.top) / r.height) * 100;
      var key = stage.getAttribute('data-g');
      if (key === 'move') {
        // .g--move spans 80% of the stage, centred -> remap
        var gx = Math.max(0, Math.min(100, (x - 10) / 0.8));
        var gy = Math.max(0, Math.min(100, (y - 10) / 0.8));
        gMove.classList.add('tracking');
        gMove.style.setProperty('--mx', gx + '%');
        gMove.style.setProperty('--my', gy + '%');
      } else if (key === 'twist') {
        var deg = (x - 50) * 1.8;
        gTwist.classList.add('tracking');
        gTwist.style.setProperty('--twist', deg + 'deg');
        gTwist.style.setProperty('--feed', (-(x / 100) * 46) + '%');
      }
    });
    stageIn.addEventListener('pointerleave', function () {
      gMove.classList.remove('tracking'); gTwist.classList.remove('tracking');
    });
  }

  /* ---------- Feature 02 ---------- */
  function initMapper() {
    document.querySelectorAll('.mrow__a').forEach(function (btn) {
      var opts = (btn.getAttribute('data-options') || '').split('|').filter(Boolean);
      if (opts.length < 2) return;
      var gesture = btn.parentElement.querySelector('.mrow__g').textContent.trim();
      var setLabel = function () { btn.setAttribute('aria-label', gesture + ' 동작: ' + btn.textContent + ' (눌러서 예시 동작 바꾸기)'); };
      setLabel();
      btn.addEventListener('click', function () {
        var i = opts.indexOf(btn.textContent.trim());
        btn.textContent = opts[(i + 1) % opts.length];
        setLabel();
        btn.classList.remove('is-flash'); void btn.offsetWidth; btn.classList.add('is-flash');
      });
    });
  }

  /* ---------- Feature 03 ---------- */
  function initVoice() {
    var bars = document.querySelector('.vf__bars');
    if (!bars || bars.children.length) return;
    for (var i = 0; i < 32; i++) {
      var b = document.createElement('i');
      var s = 0.25 + Math.abs(Math.sin(i * 0.55)) * 0.75;
      b.style.setProperty('--s', s.toFixed(2));
      b.style.setProperty('--d', ((i % 8) * 0.09).toFixed(2) + 's');
      bars.appendChild(b);
    }
  }

  /* ---------- Pricing Billing Cycle Toggle ---------- */
  function initBillingToggle() {
    var buttons = document.querySelectorAll('.billing-btn');
    if (!buttons.length) return;

    var plusAmt = document.getElementById('plusPriceAmt');
    var plusPeriod = document.getElementById('plusPricePeriod');
    var plusCycle = document.getElementById('plusPriceCycle');
    var buyPlus = document.getElementById('buy-plus');

    var proAmt = document.getElementById('proPriceAmt');
    var proPeriod = document.getElementById('proPricePeriod');
    var proCycle = document.getElementById('proPriceCycle');
    var buyPro = document.getElementById('buy-pro');

    function setCycle(cycle) {
      buttons.forEach(function (btn) {
        var on = btn.getAttribute('data-cycle') === cycle;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
      });

      if (cycle === 'annual') {
        if (plusAmt) plusAmt.textContent = '90,000';
        if (plusPeriod) plusPeriod.textContent = '/ 년';
        if (plusCycle) plusCycle.textContent = '연 90,000원 결제 (12개월 단위 · 월 7,500원 상당)';
        if (buyPlus) buyPlus.href = 'checkout/?plan=plus&billing=annual';

        if (proAmt) proAmt.textContent = '120,000';
        if (proPeriod) proPeriod.textContent = '/ 년';
        if (proCycle) proCycle.textContent = '연 120,000원 결제 (12개월 단위 · 월 10,000원 상당)';
        if (buyPro) buyPro.href = 'checkout/?plan=pro&billing=annual';
      } else {
        if (plusAmt) plusAmt.textContent = '9,000';
        if (plusPeriod) plusPeriod.textContent = '/ 월';
        if (plusCycle) plusCycle.textContent = '1개월 단위 결제 · 언제든 해지 가능';
        if (buyPlus) buyPlus.href = 'checkout/?plan=plus&billing=monthly';

        if (proAmt) proAmt.textContent = '12,000';
        if (proPeriod) proPeriod.textContent = '/ 월';
        if (proCycle) proCycle.textContent = '1개월 단위 결제 · 고급 기능 확장 지원';
        if (buyPro) buyPro.href = 'checkout/?plan=pro&billing=monthly';
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var targetBtn = (e.target && e.target.closest('.billing-btn')) || btn;
        var cycle = targetBtn.getAttribute('data-cycle');
        if (cycle) setCycle(cycle);
      });
    });
  }

  function init() { initGestures(); initMapper(); initVoice(); initBillingToggle(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
