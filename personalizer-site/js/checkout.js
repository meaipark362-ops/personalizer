/**
 * PERSONALIZER — Checkout page controller
 *
 * 1. Reads selected plan from URL query (?plan=monthly / ?plan=annual)
 * 2. Synchronizes radio buttons, order summary, and mobile sticky bar
 * 3. Handles checkout submission honestly:
 *    - Never fakes payment completion
 *    - Never collects credit card numbers or sensitive data
 *    - Explains that the payment gateway is pending integration
 */
(function () {
  'use strict';

  var cfg = window.PERSONALIZER_CONFIG || {};
  var site = window.PersonalizerSite || {
    formatKRW: function (n) { return Number(n).toLocaleString('ko-KR') + '원'; }
  };

  var form = document.getElementById('coForm');
  var radios = Array.prototype.slice.call(document.querySelectorAll('input[name="plan"]'));
  var planLabels = Array.prototype.slice.call(document.querySelectorAll('.co-plan'));
  var planHint = document.getElementById('planHint');

  // Summary elements
  var sumPlan = document.getElementById('sumPlan');
  var sumCycle = document.getElementById('sumCycle');
  var sumTotal = document.getElementById('sumTotal');
  var sumNote = document.getElementById('sumNote');
  var payBtn = document.getElementById('payBtn');
  var payLabel = document.getElementById('payLabel');
  var payDesc = document.getElementById('payDesc');
  var coAlert = document.getElementById('coAlert');

  // Mobile sticky bar
  var coBar = document.getElementById('coBar');
  var barPlan = document.getElementById('barPlan');
  var barTotal = document.getElementById('barTotal');
  var barBtn = document.getElementById('barBtn');

  var currentPlanId = null;
  var currentBilling = 'monthly'; // 'monthly' | 'annual'

  // Card price elements
  var coPlusAmt = document.getElementById('coPlusAmt');
  var coPlusPeriod = document.getElementById('coPlusPeriod');
  var coProAmt = document.getElementById('coProAmt');
  var coProPeriod = document.getElementById('coProPeriod');
  var cycleBtns = Array.prototype.slice.call(document.querySelectorAll('.co-cycle-btn'));

  function getPlanData(id) {
    if (!cfg.plans) return null;
    return cfg.plans[id] || null;
  }

  function getActiveCycleData(planData) {
    if (!planData) return null;
    if (planData[currentBilling]) {
      return planData[currentBilling];
    }
    return planData;
  }

  function updatePlanCardPrices() {
    var plusData = getPlanData('plus');
    var proData = getPlanData('pro');
    var isAnnual = currentBilling === 'annual';

    if (coPlusAmt) coPlusAmt.textContent = isAnnual ? '90,000' : '9,000';
    if (coPlusPeriod) coPlusPeriod.textContent = isAnnual ? '/ 년' : '/ 월';
    if (coProAmt) coProAmt.textContent = isAnnual ? '120,000' : '12,000';
    if (coProPeriod) coProPeriod.textContent = isAnnual ? '/ 년' : '/ 월';

    cycleBtns.forEach(function (btn) {
      var active = btn.getAttribute('data-billing') === currentBilling;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function updateSelection(planId, shouldFocus) {
    var planData = getPlanData(planId);
    if (!planData) {
      currentPlanId = null;
      radios.forEach(function (r) { r.checked = false; });
      planLabels.forEach(function (l) { l.classList.remove('is-checked'); });

      if (sumPlan) { sumPlan.textContent = '선택 전'; sumPlan.classList.add('is-empty'); }
      if (sumCycle) { sumCycle.textContent = '—'; sumCycle.classList.add('is-empty'); }
      if (sumTotal) { sumTotal.textContent = '—'; sumTotal.classList.add('is-empty'); }
      if (sumNote) { sumNote.textContent = '요금제를 선택하면 금액이 표시됩니다.'; }
      if (payBtn) { payBtn.disabled = true; }
      if (payLabel) { payLabel.textContent = '요금제를 선택하세요'; }

      if (barPlan) { barPlan.textContent = '요금제 선택 전'; }
      if (barTotal) { barTotal.textContent = '—'; }
      if (barBtn) { barBtn.disabled = true; }
      return;
    }

    currentPlanId = planId;
    var cycleData = getActiveCycleData(planData);

    // Radio & styling sync
    radios.forEach(function (r) {
      var isTarget = r.value === planId;
      r.checked = isTarget;
      var parentLabel = r.closest('.co-plan');
      if (parentLabel) {
        parentLabel.classList.toggle('is-checked', isTarget);
      }
      if (isTarget && shouldFocus) {
        r.focus();
      }
    });

    if (planHint) {
      planHint.classList.remove('is-error');
      var cycleName = currentBilling === 'annual' ? '연간 구독 (2개월 무료)' : '월간 구독';
      planHint.textContent = planData.name + ' (' + cycleName + ')가 선택되었습니다.';
    }

    // Summary update
    var formattedAmt = site.formatKRW(cycleData.amount);
    if (sumPlan) { sumPlan.textContent = planData.name; sumPlan.classList.remove('is-empty'); }
    if (sumCycle) { sumCycle.textContent = cycleData.cycleLabel; sumCycle.classList.remove('is-empty'); }
    if (sumTotal) {
      sumTotal.textContent = formattedAmt;
      sumTotal.classList.remove('is-empty');
      sumTotal.classList.remove('is-bump');
      void sumTotal.offsetWidth;
      sumTotal.classList.add('is-bump');
    }
    if (sumNote) {
      sumNote.textContent = '결제 주기: ' + cycleData.cycleLabel;
    }

    // Button states
    if (payBtn) {
      payBtn.disabled = false;
    }
    if (payLabel) {
      payLabel.textContent = formattedAmt + ' 결제 진행 (연동 준비 중)';
    }

    // Mobile sticky bar
    if (barPlan) { barPlan.textContent = planData.name + (currentBilling === 'annual' ? ' (연간)' : ''); }
    if (barTotal) { barTotal.textContent = formattedAmt; }
    if (barBtn) { barBtn.disabled = false; }
  }

  function setBillingCycle(billing) {
    if (billing !== 'monthly' && billing !== 'annual') return;
    currentBilling = billing;
    updatePlanCardPrices();
    if (currentPlanId) {
      updateSelection(currentPlanId, false);
      syncUrlParams();
    }
  }

  function syncUrlParams() {
    var url = new URL(window.location);
    if (currentPlanId) url.searchParams.set('plan', currentPlanId);
    url.searchParams.set('billing', currentBilling);
    window.history.replaceState({}, '', url);
  }

  function showAlert(type, title, message) {
    if (!coAlert) return;
    coAlert.className = 'co-alert co-alert--' + type;
    coAlert.innerHTML = '<b>' + title + '</b><p>' + message + '</p>';
    coAlert.hidden = false;
    coAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleFormSubmit(e) {
    if (e) e.preventDefault();

    if (!currentPlanId) {
      if (planHint) {
        planHint.classList.add('is-error');
        planHint.textContent = '결제를 진행하려면 요금제를 먼저 선택해 주세요.';
      }
      showAlert('warn', '요금제 미선택', '결제를 진행하기 전에 요금제를 선택해 주세요.');
      var firstRadio = radios[0];
      if (firstRadio) firstRadio.focus();
      return;
    }

    var planData = getPlanData(currentPlanId);
    var cycleData = getActiveCycleData(planData);
    var paymentCfg = cfg.payment || {};
    var cycleName = currentBilling === 'annual' ? '연간 구독 (2개월 무료)' : '월간 구독';

    // 결제 제공자가 연동되어 있지 않은 상태를 정직하게 명시 (결제 완료 사칭 금지)
    if (!paymentCfg.provider) {
      showAlert(
        'warn',
        '결제 시스템 연동 준비 중 (미연동 상태 안내)',
        '현재 Personalizer는 개발 및 출시 준비 단계입니다. 실제 결제 대행사(PG)가 연동되어 있지 않으므로 ' +
        '<b>' + planData.name + ' · ' + cycleName + ' (' + site.formatKRW(cycleData.amount) + ')</b>에 대한 결제가 청구되지 않습니다. ' +
        '공식 출시 후 안전한 보안 결제창을 통해 결제가 진행될 예정입니다. ' +
        '<span style="display:block;margin-top:10px;font-size:13px;color:var(--offwhite);">' +
        '👉 아래의 <b>설문조사</b>를 통해 원하시는 결제 방식 및 기능 의견을 남겨주시면 개발에 적극 반영하겠습니다.</span>'
      );
      // 안내 알림 후 하단 설문 영역으로 시선 유도
      var surveySec = document.getElementById('coSurvey');
      if (surveySec) {
        setTimeout(function () {
          surveySec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350);
      }
      return;
    }

    // 실제 PG 연동이 구현될 경우를 위한 통합 진입점
    showAlert(
      'warn',
      '결제 제공자 호출',
      '연동된 결제 대행사(' + paymentCfg.provider + ')로 연결을 시도합니다...'
    );
  }

  /* ==========================================================================
     🫠 Acrobatic Apple-Style 🫠 Emoji Pop Animation
     - Explosive surge from bottom
     - High acrobatic somersaults and rolls in 3D
     - Elastic bounce and decelerated float
     - Dissolves naturally with soft mist trail
     ========================================================================== */
  function playMeltingFacePop() {
    // Respect prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'emoji-pop-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    // Staggered launch specs for 16 emojis with distinct acrobatic trajectories
    var emojis = [
      { xPct: 18, delay: 0,   size: 44, ySurge: -280, xDist: -40, rInit: -15, rSurge: 160, rySurge: 80,  rApex: 360, rxApex: 35,  ryApex: 180, rDrift: -60, dur: 2200 },
      { xPct: 26, delay: 70,  size: 58, ySurge: -370, xDist: -70, rInit: 10,  rSurge: 240, rySurge: -100,rApex: 540, rxApex: -45, ryApex: 270, rDrift: 80,  dur: 2500 },
      { xPct: 35, delay: 140, size: 50, ySurge: -320, xDist: 35,  rInit: -20, rSurge: 190, rySurge: 90,  rApex: 420, rxApex: 40,  ryApex: -190,rDrift: -50, dur: 2300 },
      { xPct: 44, delay: 210, size: 66, ySurge: -420, xDist: -30, rInit: 15,  rSurge: 280, rySurge: -120,rApex: 720, rxApex: -50, ryApex: 360, rDrift: 90,  dur: 2600 },
      { xPct: 52, delay: 280, size: 60, ySurge: -390, xDist: 55,  rInit: -10, rSurge: 220, rySurge: 110, rApex: 500, rxApex: 45,  ryApex: -240,rDrift: -70, dur: 2400 },
      { xPct: 62, delay: 360, size: 54, ySurge: -340, xDist: -50, rInit: 25,  rSurge: 180, rySurge: -90, rApex: 380, rxApex: -35, ryApex: 180, rDrift: 60,  dur: 2300 },
      { xPct: 70, delay: 440, size: 48, ySurge: -300, xDist: 60,  rInit: -12, rSurge: 200, rySurge: 85,  rApex: 440, rxApex: 30,  ryApex: -160,rDrift: -80, dur: 2200 },
      { xPct: 22, delay: 520, size: 52, ySurge: -350, xDist: -45, rInit: 18,  rSurge: 250, rySurge: -110,rApex: 540, rxApex: -40, ryApex: 220, rDrift: 70,  dur: 2400 },
      { xPct: 58, delay: 600, size: 64, ySurge: -410, xDist: 40,  rInit: -22, rSurge: 300, rySurge: 130, rApex: 680, rxApex: 55,  ryApex: -300,rDrift: -90, dur: 2600 },
      { xPct: 38, delay: 680, size: 56, ySurge: -360, xDist: -35, rInit: 12,  rSurge: 210, rySurge: -95, rApex: 460, rxApex: -45, ryApex: 200, rDrift: 60,  dur: 2350 },
      { xPct: 76, delay: 760, size: 46, ySurge: -290, xDist: 50,  rInit: -16, rSurge: 170, rySurge: 80,  rApex: 360, rxApex: 30,  ryApex: -150,rDrift: -60, dur: 2200 },
      { xPct: 30, delay: 840, size: 54, ySurge: -330, xDist: 30,  rInit: 14,  rSurge: 230, rySurge: -100,rApex: 500, rxApex: -35, ryApex: 210, rDrift: 50,  dur: 2300 },
      { xPct: 48, delay: 920, size: 62, ySurge: -400, xDist: -60, rInit: -18, rSurge: 270, rySurge: 115, rApex: 640, rxApex: 50,  ryApex: -280,rDrift: -80, dur: 2550 },
      { xPct: 66, delay: 1000,size: 52, ySurge: -340, xDist: 45,  rInit: 20,  rSurge: 190, rySurge: -90, rApex: 420, rxApex: -38, ryApex: 190, rDrift: 65,  dur: 2300 },
      { xPct: 42, delay: 1090,size: 58, ySurge: -370, xDist: 25,  rInit: -14, rSurge: 240, rySurge: 105, rApex: 520, rxApex: 42,  ryApex: -230,rDrift: -70, dur: 2400 },
      { xPct: 54, delay: 1180,size: 48, ySurge: -310, xDist: -35, rInit: 16,  rSurge: 180, rySurge: -85, rApex: 380, rxApex: -30, ryApex: 170, rDrift: 55,  dur: 2200 }
    ];

    var completed = 0;
    var total = emojis.length;

    emojis.forEach(function (spec) {
      setTimeout(function () {
        var bubble = document.createElement('div');
        bubble.className = 'emoji-bubble';

        bubble.style.left = spec.xPct + '%';
        bubble.style.fontSize = spec.size + 'px';
        bubble.style.setProperty('--y-surge', spec.ySurge + 'px');
        bubble.style.setProperty('--x-dist', spec.xDist + 'px');
        bubble.style.setProperty('--r-init', spec.rInit + 'deg');
        bubble.style.setProperty('--r-surge', spec.rSurge + 'deg');
        bubble.style.setProperty('--ry-surge', spec.rySurge + 'deg');
        bubble.style.setProperty('--r-apex', spec.rApex + 'deg');
        bubble.style.setProperty('--rx-apex', spec.rxApex + 'deg');
        bubble.style.setProperty('--ry-apex', spec.ryApex + 'deg');
        bubble.style.setProperty('--r-drift', spec.rDrift + 'deg');
        bubble.style.animationDuration = spec.dur + 'ms';

        bubble.innerHTML =
          '<span class="emoji-bubble__trail" aria-hidden="true"></span>' +
          '<span class="emoji-bubble__inner" aria-hidden="true">🫠</span>';

        overlay.appendChild(bubble);

        setTimeout(function () {
          if (bubble && bubble.parentNode) {
            bubble.parentNode.removeChild(bubble);
          }
          completed++;
          if (completed >= total) {
            if (overlay && overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }
        }, spec.dur + 100);
      }, spec.delay);
    });
  }

  /* ==========================================================================
     Smooth Scroll to Survey Section via payDesc Prompt
     ========================================================================== */
  function initGuideScroll() {
    var scrollPrompt = document.getElementById('payDesc');
    var surveySec = document.getElementById('coSurvey');

    if (scrollPrompt && surveySec) {
      scrollPrompt.addEventListener('click', function (e) {
        e.preventDefault();
        surveySec.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Highlight or focus the survey action button for keyboard accessibility
        var surveyBtn = document.getElementById('btnSurveyLink');
        if (surveyBtn) {
          setTimeout(function () {
            surveyBtn.focus({ preventScroll: true });
          }, 600);
        }
      });
    }
  }

  function initFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var planParam = (params.get('plan') || '').toLowerCase();
    var billingParam = (params.get('billing') || '').toLowerCase();

    // Check billing cycle parameter
    if (billingParam === 'annual') {
      currentBilling = 'annual';
    } else if (billingParam === 'monthly') {
      currentBilling = 'monthly';
    }

    // Backwards-compatibility aliases
    if (planParam === 'annual') {
      planParam = 'pro';
      currentBilling = 'annual';
    } else if (planParam === 'monthly') {
      planParam = 'pro';
      currentBilling = 'monthly';
    } else if (planParam === 'lite') {
      planParam = 'plus';
    }

    updatePlanCardPrices();

    if (planParam && (planParam === 'plus' || planParam === 'pro')) {
      updateSelection(planParam, false);
    }
  }

  function initEvents() {
    cycleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var billing = btn.getAttribute('data-billing');
        setBillingCycle(billing);
      });
    });

    radios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) {
          updateSelection(radio.value, false);
          syncUrlParams();
        }
      });
    });

    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }

    if (barBtn) {
      barBtn.addEventListener('click', function () {
        handleFormSubmit();
      });
    }

    // Mobile bar hide/show when summary is visible
    if (coBar && 'IntersectionObserver' in window) {
      var summaryCard = document.querySelector('.co-card');
      if (summaryCard) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            coBar.classList.toggle('is-hidden', en.isIntersecting);
          });
        }, { threshold: 0.1 });
        observer.observe(summaryCard);
      }
    }
  }

  function init() {
    initEvents();
    initFromUrl();
    initGuideScroll();

    // Trigger 🫠 Melting Face Bubble Pop on page entry
    // slight delay (150ms) to ensure initial render is complete
    setTimeout(playMeltingFacePop, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
