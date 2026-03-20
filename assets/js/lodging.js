/**
 * 숙소 후보 페이지
 * 6조 루트 6개 거점의 숙소 후보를 카드 그리드로 표시
 * activities.js 패턴 참고, 전면 리팩토링
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════
     CSS 주입
     ══════════════════════════════════════════ */
  var css = document.createElement('style');
  css.textContent = [
    '.lodging-page { max-width: 1100px; margin: 0 auto; }',
    '.lodging-subtitle { color: #586069; margin-bottom: 1.2em; }',

    /* 지도 */
    '#lodgingMap { height: 320px; border-radius: 10px; border: 1px solid #e1e4e8; margin-bottom: 1.2em; z-index: 0; }',
    '.stop-marker { background: #fff; border: 2px solid #157878; border-radius: 16px; padding: 4px 12px; font-size: 0.82em; font-weight: 700; color: #157878; white-space: nowrap; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.15); text-align: center; transform: translate(-50%, -50%); }',
    '.stop-marker:hover { background: #157878; color: #fff; z-index: 9000 !important; }',
    '.stop-marker.active { background: #157878; color: #fff; box-shadow: 0 2px 8px rgba(21,120,120,.35); z-index: 8000 !important; }',
    '.stop-marker .marker-day { display: block; font-size: 0.75em; font-weight: 400; opacity: .8; margin-top: 1px; }',

    /* 탭 */
    '.stop-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.2em; }',
    '.stop-tab { padding: 8px 16px; border: 2px solid #d1d5da; border-radius: 20px; background: #fff; color: #24292e; font-size: 0.9em; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; }',
    '.stop-tab:hover { border-color: #157878; color: #157878; }',
    '.stop-tab.active { background: #157878; border-color: #157878; color: #fff; }',

    /* 요약 */
    '.stop-summary { background: #f6f8fa; border-radius: 8px; padding: 14px 18px; margin-bottom: 1.2em; font-size: 0.92em; line-height: 1.6; }',
    '.stop-summary .stop-role { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 0.85em; font-weight: 600; margin-right: 8px; }',
    '.role-transit { background: #e1f0ff; color: #0366d6; }',
    '.role-budget { background: #dcffe4; color: #22863a; }',
    '.role-view { background: #f1e5ff; color: #6f42c1; }',
    '.role-invest { background: #fff8c5; color: #b08800; }',
    '.role-city { background: #ffeef0; color: #d73a49; }',

    /* 예산 시뮬레이션 바 */
    '.budget-bar { display: flex; gap: 8px; margin-bottom: 1.2em; flex-wrap: wrap; }',
    '.budget-scenario { flex: 1; min-width: 200px; background: #fff; border: 2px solid #e1e4e8; border-radius: 8px; padding: 12px 16px; cursor: pointer; transition: all .2s; }',
    '.budget-scenario:hover { border-color: #157878; }',
    '.budget-scenario.active { border-color: #157878; background: #f0fafa; box-shadow: 0 2px 8px rgba(21,120,120,.15); }',
    '.budget-scenario .scenario-name { font-weight: 700; font-size: 0.9em; margin-bottom: 4px; }',
    '.budget-scenario .scenario-total { font-size: 1.2em; font-weight: 700; color: #157878; }',
    '.budget-scenario .scenario-krw { font-size: 0.82em; color: #586069; }',
    '.budget-scenario .scenario-pick { font-size: 0.8em; color: #157878; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e8eded; line-height: 1.4; }',
    '.budget-scenario .scenario-pick strong { font-weight: 700; }',

    /* 카드 그리드 */
    '.lodging-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 2em; }',

    /* 카드 */
    '.lodge-card { background: #fff; border: 1px solid #e1e4e8; border-radius: 10px; padding: 16px; cursor: pointer; transition: all .15s; position: relative; }',
    '.lodge-card:hover { border-color: #157878; box-shadow: 0 2px 12px rgba(21,120,120,.12); transform: translateY(-2px); }',
    '.lodge-card.recommended { border-left: 4px solid #157878; }',
    '.lodge-card.budget-pick { border-color: #157878; box-shadow: 0 0 0 2px rgba(21,120,120,.25); }',
    '.lodge-card.budget-pick::after { content: attr(data-pick-label); position: absolute; top: -1px; left: -1px; background: #157878; color: #fff; font-size: 0.72em; font-weight: 700; padding: 2px 10px; border-radius: 10px 0 8px 0; pointer-events: none; }',
    '.lodge-card.recommended.budget-pick::after { left: 2px; }',
    '.lodge-card .card-rank { position: absolute; top: 12px; right: 14px; font-size: 1.1em; font-weight: 800; color: #157878; }',
    '.lodge-card .card-name { font-size: 1.05em; font-weight: 700; color: #24292e; margin-bottom: 4px; padding-right: 40px; }',
    '.lodge-card .card-type { font-size: 0.82em; color: #6a737d; margin-bottom: 8px; }',
    '.lodge-card .card-score { display: inline-block; background: #157878; color: #fff; font-size: 0.78em; font-weight: 700; padding: 1px 8px; border-radius: 10px; margin-left: 6px; }',
    '.lodge-card .card-price { font-size: 1.1em; font-weight: 700; color: #157878; margin-bottom: 8px; }',
    '.lodge-card .card-metrics { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 0.85em; color: #586069; margin-bottom: 8px; }',
    '.lodge-card .card-metrics span { display: inline-flex; align-items: center; gap: 3px; }',
    '.lodge-card .card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }',
    '.lodge-tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.78em; font-weight: 600; }',
    '.tag-view { background: #f1e5ff; color: #6f42c1; }',
    '.tag-fireplace { background: #fff0e6; color: #c45100; }',
    '.tag-parking { background: #dcffe4; color: #22863a; }',
    '.tag-selfcheckin { background: #e1f0ff; color: #0366d6; }',
    '.tag-kitchen { background: #fff8c5; color: #b08800; }',
    '.tag-breakfast { background: #ffeef0; color: #d73a49; }',
    '.tag-vivid { background: #f1e5ff; color: #6f42c1; }',
    '.tag-reno { background: #dcffe4; color: #22863a; }',
    '.tag-pool { background: #e1f0ff; color: #0366d6; }',
    '.lodge-card .card-note { font-size: 0.82em; color: #6a737d; line-height: 1.4; border-top: 1px solid #f0f0f0; padding-top: 8px; margin-top: 4px; }',
    '.lodge-card .card-warning { font-size: 0.8em; color: #d73a49; margin-top: 6px; }',

    /* 모달 */
    '.lodge-modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.5); z-index: 1000; justify-content: center; align-items: flex-start; padding: 40px 16px; overflow-y: auto; }',
    '.lodge-modal-overlay.open { display: flex; }',
    '.lodge-modal-content { background: #fff; border-radius: 12px; max-width: 720px; width: 100%; max-height: calc(100vh - 80px); overflow-y: auto; padding: 28px 32px; position: relative; box-shadow: 0 8px 32px rgba(0,0,0,.2); }',
    '.lodge-modal-close { position: sticky; top: 0; float: right; background: #f6f8fa; border: none; font-size: 1.5em; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 1; color: #586069; }',
    '.lodge-modal-close:hover { background: #e1e4e8; }',
    '.lodge-modal-body { line-height: 1.7; }',

    /* 모달 상단 */
    '.lodge-modal-body .lm-title { font-size: 1.3em; font-weight: 700; color: #24292e; margin: 0 0 2px; padding-right: 2em; }',
    '.lodge-modal-body .lm-subtitle { font-size: 0.88em; color: #586069; margin: 0 0 12px; }',

    /* 예약 링크 버튼들 */
    '.lm-booking-links { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }',
    '.lm-book-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 6px; font-size: 0.82em; font-weight: 600; text-decoration: none; transition: all .15s; border: 1.5px solid; }',
    '.lm-book-btn:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,.12); }',
    '.lm-book-btn.btn-booking { color: #003580; border-color: #003580; background: #f0f4ff; }',
    '.lm-book-btn.btn-booking:hover { background: #003580; color: #fff; }',
    '.lm-book-btn.btn-trip { color: #287DFA; border-color: #287DFA; background: #f0f7ff; }',
    '.lm-book-btn.btn-trip:hover { background: #287DFA; color: #fff; }',
    '.lm-book-btn.btn-airbnb { color: #FF5A5F; border-color: #FF5A5F; background: #fff5f5; }',
    '.lm-book-btn.btn-airbnb:hover { background: #FF5A5F; color: #fff; }',
    '.lm-book-btn.btn-gmaps { color: #4285F4; border-color: #4285F4; background: #f0f6ff; }',
    '.lm-book-btn.btn-gmaps:hover { background: #4285F4; color: #fff; }',
    '.lm-book-btn.btn-kayak { color: #FF690F; border-color: #FF690F; background: #fff6f0; }',
    '.lm-book-btn.btn-kayak:hover { background: #FF690F; color: #fff; }',
    '.lm-book-btn.btn-wotif { color: #E4002B; border-color: #E4002B; background: #fff5f7; }',
    '.lm-book-btn.btn-wotif:hover { background: #E4002B; color: #fff; }',
    '.lm-book-btn.btn-hotels { color: #D32F2F; border-color: #D32F2F; background: #fff5f5; }',
    '.lm-book-btn.btn-hotels:hover { background: #D32F2F; color: #fff; }',
    '.lm-book-btn.btn-ta { color: #00AF87; border-color: #00AF87; background: #f0fff8; }',
    '.lm-book-btn.btn-ta:hover { background: #00AF87; color: #fff; }',
    '.lm-book-btn.btn-momondo { color: #5C2D91; border-color: #5C2D91; background: #f8f0ff; }',
    '.lm-book-btn.btn-momondo:hover { background: #5C2D91; color: #fff; }',

    /* 핵심 정보 그리드 */
    '.lm-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px; }',
    '.lm-info-cell { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 8px; padding: 10px 12px; text-align: center; }',
    '.lm-info-cell .lm-info-label { font-size: 0.75em; color: #586069; font-weight: 600; margin-bottom: 4px; }',
    '.lm-info-cell .lm-info-value { font-size: 1.05em; font-weight: 700; color: #24292e; }',
    '.lm-info-cell .lm-info-value.lm-highlight { color: #157878; font-size: 1.15em; }',
    '.lm-info-cell .lm-info-value.lm-couple { color: #d4380d; }',

    /* 태그 배지 (모달) */
    '.lm-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }',

    /* 장단점 */
    '.lm-pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }',
    '.lm-pc-section { border-radius: 8px; padding: 12px 14px; }',
    '.lm-pc-section.lm-pros-box { background: #f0fff4; border: 1px solid #dcffe4; }',
    '.lm-pc-section.lm-cons-box { background: #fff5f5; border: 1px solid #ffeef0; }',
    '.lm-pc-section h4 { margin: 0 0 8px; font-size: 0.88em; }',
    '.lm-pc-section.lm-pros-box h4 { color: #22863a; }',
    '.lm-pc-section.lm-cons-box h4 { color: #d73a49; }',
    '.lm-pc-list { list-style: none; padding: 0; margin: 0; }',
    '.lm-pc-list li { font-size: 0.85em; line-height: 1.5; padding: 3px 0; padding-left: 18px; position: relative; }',
    '.lm-pc-list li::before { position: absolute; left: 0; }',
    '.lm-pros-box .lm-pc-list li::before { content: "\\2713"; color: #22863a; font-weight: 700; }',
    '.lm-cons-box .lm-pc-list li::before { content: "\\2717"; color: #d73a49; font-weight: 700; }',

    /* 플랫폼 가격 비교 */
    '.lm-platforms { margin-bottom: 16px; }',
    '.lm-platforms h4 { margin: 0 0 8px; font-size: 0.9em; color: #157878; }',
    '.lm-platform-cards { display: flex; flex-wrap: wrap; gap: 8px; }',
    '.lm-platform-card { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 8px; padding: 8px 14px; min-width: 120px; }',
    '.lm-platform-card .lm-pf-name { font-size: 0.78em; color: #586069; font-weight: 600; margin-bottom: 2px; }',
    '.lm-platform-card .lm-pf-price { font-size: 0.95em; font-weight: 700; color: #24292e; }',

    /* 참고 노트 */
    '.lm-note-box { background: #fffdf0; border: 1px solid #ffeaa7; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }',
    '.lm-note-box .lm-note-label { font-size: 0.78em; font-weight: 700; color: #b08800; margin-bottom: 4px; }',
    '.lm-note-box .lm-note-text { font-size: 0.88em; color: #24292e; line-height: 1.5; }',

    /* 트랙 탭 (기본평가/투자평가) */
    '.track-tabs { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }',
    '.track-tab { padding: 6px 16px; border: 2px solid #d1d5da; border-radius: 16px; background: #fff; color: #24292e; font-size: 0.84em; font-weight: 600; cursor: pointer; transition: all .15s; }',
    '.track-tab:hover { border-color: #157878; color: #157878; }',
    '.track-tab.active[data-track="basic"] { background: #157878; border-color: #157878; color: #fff; }',
    '.track-tab.active[data-track="invest"] { background: #e36209; border-color: #e36209; color: #fff; }',
    '.track-count { display: inline-block; background: rgba(255,255,255,.25); border-radius: 8px; padding: 0 6px; font-size: 0.85em; margin-left: 4px; }',
    '.track-hint { font-size: 0.78em; color: #586069; font-style: italic; margin-left: 4px; }',

    /* 반응형 */
    '@media (max-width: 600px) {',
    '  .lodging-grid { grid-template-columns: 1fr; }',
    '  .stop-tabs { gap: 4px; }',
    '  .stop-tab { padding: 6px 12px; font-size: 0.82em; }',
    '  .lodge-modal-content { padding: 20px 16px; }',
    '  .budget-bar { flex-direction: column; }',
    '  .lm-info-grid { grid-template-columns: repeat(2, 1fr); }',
    '  .lm-pros-cons { grid-template-columns: 1fr; }',
    '  .lm-booking-links { gap: 6px; }',
    '  .lm-book-btn { padding: 5px 10px; font-size: 0.78em; }',
    '}'
  ].join('\n');
  document.head.appendChild(css);

  /* ══════════════════════════════════════════
     데이터 (변경 금지)
     ══════════════════════════════════════════ */
  var STOPS = []; // data/lodging/lodging_data.json에서 로드
  /* ══════════════════════════════════════════
     시나리오 정의
     ══════════════════════════════════════════ */
  var SCENARIOS = [
    { key: 'economy', label: '가성비', desc: '블루마운틴만 투자' },
    { key: 'balance', label: '밸런스', desc: '뷰+감성 분배' },
    { key: 'premium', label: '투자형', desc: '핵심 거점 프리미엄' }
  ];

  var SCENARIO_LABELS = { economy: '가성비 추천', balance: '밸런스 추천', premium: '투자형 추천' };
  var TAG_LABELS = {
    view: '뷰', fireplace: '벽난로', parking: '보안주차', selfcheckin: '셀프체크인',
    kitchen: '키친넷', breakfast: '조식', vivid: 'Vivid', reno: '리노베이션', pool: '수영장'
  };

  /* ══════════════════════════════════════════
     상태
     ══════════════════════════════════════════ */
  var activeStop = null;
  var activeScenario = 'balance';
  var activeTrack = 'basic';   // 'basic' | 'invest'
  var stopMarkers = {};
  var leafletMap = null;

  /* 현재 트랙에 해당하는 숙소 목록 반환 + rank 재부여 */
  function isInvestLodging(stopId, l) {
    return l.track === 'invest';
  }
  function getActiveLodgings(stop) {
    var filtered = stop.lodgings.filter(function (l) {
      var invest = isInvestLodging(stop.id, l);
      return activeTrack === 'invest' ? invest : !invest;
    });
    /* rank 재부여 */
    for (var i = 0; i < filtered.length; i++) filtered[i]._displayRank = i + 1;
    return filtered;
  }

  /* 예산 바 내부 DOM 참조 (한 번만 생성) */
  var budgetBarEls = {};   // { economy: { card, pickEl }, balance: ..., premium: ... }

  /* ══════════════════════════════════════════
     초기화
     ══════════════════════════════════════════ */
  // 데이터를 fetch로 로드한 후 초기화
  var base = (window.__BASE_URL__ || '').replace(/\/+$/, '');
  fetch(base + '/data/lodging/lodging_data.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      STOPS = data.stops;
      /* subtitle 동적 생성 */
      var totalLodgings = STOPS.reduce(function(s, st) { return s + st.lodgings.length; }, 0);
      var sub = document.getElementById('subtitle');
      if (sub) sub.textContent = '6조 루트 · ' + STOPS.length + '개 거점 · ' + totalLodgings + '개 CRITIC 채점 · 3명 페르소나 평가 · 2026년 5월 기준';
      activeStop = STOPS[0].id;
      renderTabs();
      initBudgetBar();
      leafletMap = initMap();
      bindModal();
      selectStop(activeStop);
    })
    .catch(function(err) { console.error('lodging 데이터 로드 실패:', err); });

  /* ══════════════════════════════════════════
     지도 초기화 (activities.js 패턴)
     ══════════════════════════════════════════ */
  function initMap() {
    var mapEl = document.getElementById('lodgingMap');
    if (!mapEl || typeof L === 'undefined') return null;

    /* 모든 거점 좌표로 bounds 계산 */
    var bounds = [];
    STOPS.forEach(function (s) { if (s.center) bounds.push(s.center); });
    if (!bounds.length) return null;

    var map = L.map('lodgingMap', {
      scrollWheelZoom: false,
      zoomControl: true
    });

    /* NSW 해안에 맞게 fitBounds */
    map.fitBounds(bounds, { padding: [30, 30] });

    /* 타일 레이어 — OSM 통일 */
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18
    }).addTo(map);

    /* 점선 루트 연결 */
    L.polyline(bounds, { color: '#157878', weight: 2, opacity: 0.4, dashArray: '8 6' }).addTo(map);

    /* 각 거점에 커스텀 마커 생성 */
    STOPS.forEach(function (s) {
      if (!s.center) return;
      var icon = L.divIcon({
        className: '',
        html: '<div class="stop-marker' + (s.id === activeStop ? ' active' : '') + '" data-stop="' + s.id + '">' +
              s.name.split('·')[0] +
              '<span class="marker-day">' + s.day + '</span></div>',
        iconSize: null,
        iconAnchor: [0, 0]
      });
      var marker = L.marker(s.center, { icon: icon }).addTo(map);
      marker.on('click', function () { selectStop(s.id); });
      stopMarkers[s.id] = marker;
    });

    return map;
  }

  /* ══════════════════════════════════════════
     탭 렌더링 (한 번만)
     ══════════════════════════════════════════ */
  function renderTabs() {
    var container = document.getElementById('stopTabs');
    STOPS.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'stop-tab' + (s.id === activeStop ? ' active' : '');
      btn.setAttribute('data-stop', s.id);
      btn.textContent = s.day + ' ' + s.name;
      btn.addEventListener('click', function () { selectStop(s.id); });
      container.appendChild(btn);
    });
  }

  /* ══════════════════════════════════════════
     예산 시뮬레이션 바 (DOM 한 번만 생성)
     ══════════════════════════════════════════ */
  function initBudgetBar() {
    var bar = document.getElementById('budgetBar');

    SCENARIOS.forEach(function (sc) {
      /* 총액 계산 */
      var total = 0;
      STOPS.forEach(function (s) { total += s.budgetPick[sc.key].price; });

      var div = document.createElement('div');
      div.className = 'budget-scenario' + (sc.key === activeScenario ? ' active' : '');
      div.setAttribute('data-scenario', sc.key);

      /* 내부 구조 생성 */
      div.innerHTML =
        '<div class="scenario-name">' + sc.label + ' <span style="font-weight:400;color:#586069">— ' + sc.desc + '</span></div>' +
        '<div class="scenario-total">$' + total.toLocaleString() + '</div>' +
        '<div class="scenario-krw">~' + Math.round(total * 1030 / 10000) + '만원</div>' +
        '<div class="scenario-pick"></div>';

      /* 클릭 핸들러 */
      div.addEventListener('click', function () {
        activeScenario = sc.key;
        /* active 토글 */
        SCENARIOS.forEach(function (s2) {
          budgetBarEls[s2.key].card.classList.toggle('active', s2.key === sc.key);
        });
        /* 모든 시나리오 관련 UI 갱신 */
        refresh();
      });

      bar.appendChild(div);

      /* 참조 저장 */
      budgetBarEls[sc.key] = {
        card: div,
        pickEl: div.querySelector('.scenario-pick')
      };
    });
  }

  /* ══════════════════════════════════════════
     모달 이벤트 바인딩 (한 번만)
     ══════════════════════════════════════════ */
  function bindModal() {
    var modal = document.getElementById('lodgeModal');
    document.getElementById('lodgeModalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  /* ══════════════════════════════════════════
     거점 선택 — 단일 진입점
     ══════════════════════════════════════════ */
  function selectStop(stopId) {
    activeStop = stopId;

    /* 탭 동기화 */
    var tabs = document.querySelectorAll('.stop-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i].getAttribute('data-stop') === stopId);
    }

    /* 마커 동기화 + 선택 거점으로 줌 */
    var selectedCenter = null;
    STOPS.forEach(function (s) {
      var m = stopMarkers[s.id];
      if (!m) return;
      var el = m.getElement();
      if (!el) return;
      var md = el.querySelector('.stop-marker');
      if (md) md.classList.toggle('active', s.id === stopId);
      if (s.id === stopId) selectedCenter = s.center;
    });

    if (selectedCenter && leafletMap) {
      leafletMap.setView(selectedCenter, 10, { animate: true });
    }

    /* 거점 내용 렌더링 + 시나리오 UI */
    renderStop(stopId);
  }

  /* ══════════════════════════════════════════
     거점 렌더링 — 요약 + 카드 + 시나리오
     ══════════════════════════════════════════ */
  function renderStop(stopId) {
    var stop = getStop(stopId);
    if (!stop) return;

    var activeLodgings = getActiveLodgings(stop);
    var basicCount = stop.lodgings.filter(function (l) { return !isInvestLodging(stop.id, l); }).length;
    var investCount = stop.lodgings.filter(function (l) { return isInvestLodging(stop.id, l); }).length;

    /* 요약 */
    var summary = document.getElementById('stopSummary');
    var roleClass = 'role-' + stop.role;
    summary.innerHTML =
      '<div style="margin-bottom:6px">' +
      '<span class="stop-role ' + roleClass + '">' + stop.roleLabel + '</span>' +
      '<strong>' + stop.name + '</strong> — ' + stop.date + ' (' + stop.nights + '박)' +
      '</div>' +
      '<div style="margin-bottom:4px">' + stop.summary + '</div>' +
      '<div style="font-size:0.85em;color:#586069">예산 범위: <strong>' + stop.budget + '</strong></div>' +
      '<div id="summaryPick" style="margin-top:6px;font-size:0.88em;color:#157878;font-weight:600"></div>';

    /* 평가 트랙 탭 */
    var trackArea = document.createElement('div');
    trackArea.className = 'track-tabs';
    trackArea.innerHTML =
      '<button class="track-tab' + (activeTrack === 'basic' ? ' active' : '') + '" data-track="basic">기본평가 <span class="track-count">' + basicCount + '</span></button>' +
      '<button class="track-tab' + (activeTrack === 'invest' ? ' active' : '') + '" data-track="invest">투자평가 <span class="track-count">' + investCount + '</span></button>' +
      '<span class="track-hint">' + (activeTrack === 'basic' ? '표준 예산($150~300) 프레임 채점' : '확장 예산($300~900) 프레임 채점') + '</span>';
    trackArea.querySelectorAll('.track-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTrack = btn.getAttribute('data-track');
        renderStop(stopId);
      });
    });
    summary.appendChild(trackArea);

    /* 카드 그리드 */
    var grid = document.getElementById('lodgingGrid');
    grid.innerHTML = '';
    if (activeLodgings.length === 0) {
      grid.innerHTML = '<div style="padding:32px;text-align:center;color:#586069">이 거점의 ' + (activeTrack === 'invest' ? '투자평가' : '기본평가') + ' 숙소가 없습니다.</div>';
    } else {
      activeLodgings.forEach(function (lodge) {
        grid.appendChild(createCard(lodge, stop));
      });
    }

    /* 시나리오 관련 UI 전부 갱신 */
    refresh();
  }

  /* ══════════════════════════════════════════
     refresh — 시나리오 변경/거점 변경 시 통합 갱신
     ══════════════════════════════════════════ */
  function refresh() {
    updateBudgetBarPicks();
    applyBudgetHighlight();
    updateSummaryPick();
  }

  /* ══════════════════════════════════════════
     예산 바 pick 텍스트 갱신 (innerHTML 재생성 없이)
     ══════════════════════════════════════════ */
  function updateBudgetBarPicks() {
    var stop = getStop(activeStop);
    if (!stop) return;

    SCENARIOS.forEach(function (sc) {
      var pick = stop.budgetPick[sc.key];
      var el = budgetBarEls[sc.key].pickEl;
      if (el && pick) {
        el.innerHTML = '<strong>' + pick.name + '</strong> · $' + pick.price;
      }
    });
  }

  /* ══════════════════════════════════════════
     카드 하이라이트 — 선택된 시나리오의 추천 숙소
     ══════════════════════════════════════════ */
  function applyBudgetHighlight() {
    var stop = getStop(activeStop);
    if (!stop) return;

    var pick = stop.budgetPick[activeScenario];
    if (!pick) return;

    var matched = findPickLodging(stop, pick.name);
    if (!matched) return;
    var matchedName = matched.name;
    var label = SCENARIO_LABELS[activeScenario] || '';

    /* 매칭된 숙소가 현재 트랙에 없으면 트랙 자동 전환 */
    var matchedTrack = matched.track === 'invest' ? 'invest' : 'basic';
    if (matchedTrack !== activeTrack) {
      activeTrack = matchedTrack;
      renderStop(activeStop);
      return; /* renderStop이 refresh()를 호출하므로 여기서 종료 */
    }

    var cards = document.querySelectorAll('.lodge-card');
    var highlightedCard = null;
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var cardDataName = card.getAttribute('data-name') || '';
      if (matchedName && cardDataName === matchedName) {
        card.classList.add('budget-pick');
        card.setAttribute('data-pick-label', label);
        highlightedCard = card;
      } else {
        card.classList.remove('budget-pick');
        card.removeAttribute('data-pick-label');
      }
    }

    /* 추천 카드로 스크롤 + 깜빡임 효과 */
    if (highlightedCard) {
      highlightedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      highlightedCard.style.transition = 'background .3s';
      highlightedCard.style.background = '#e6f7f7';
      setTimeout(function () { highlightedCard.style.background = ''; }, 600);
    }
  }

  /* ══════════════════════════════════════════
     요약 영역 내 시나리오 추천 표시
     ══════════════════════════════════════════ */
  function updateSummaryPick() {
    var el = document.getElementById('summaryPick');
    if (!el) return;

    var stop = getStop(activeStop);
    if (!stop) return;

    var pick = stop.budgetPick[activeScenario];
    var scenarioNames = { economy: '가성비', balance: '밸런스', premium: '투자형' };
    if (pick) {
      var matched = findPickLodging(stop, pick.name);
      var displayName = matched ? matched.name : pick.name;
      var detail = pick.name !== displayName ? ' (' + pick.name + ')' : '';
      el.innerHTML = scenarioNames[activeScenario] + ' 시나리오 추천: <strong>' + displayName + detail + '</strong> · $' + pick.price;
    }
  }

  /* ══════════════════════════════════════════
     budgetPick 이름 → lodging 매칭 (부분 매칭)
     ══════════════════════════════════════════ */
  function findPickLodging(stop, pickName) {
    if (!stop || !pickName) return null;
    /* 현재 트랙의 숙소에서 먼저 검색, 없으면 전체에서 검색 */
    var activeLodgings = getActiveLodgings(stop);
    var searchArrays = [activeLodgings, stop.lodgings];
    var pn = pickName.toLowerCase();
    for (var a = 0; a < searchArrays.length; a++) {
      var arr = searchArrays[a];
      for (var i = 0; i < arr.length; i++) {
        var ln = arr[i].name.toLowerCase();
        if (ln === pn || ln.indexOf(pn) !== -1 || pn.indexOf(ln) !== -1) return arr[i];
      }
      var firstWord = pn.split(' ')[0];
      if (firstWord.length >= 3) {
        for (var j = 0; j < arr.length; j++) {
          if (arr[j].name.toLowerCase().indexOf(firstWord) !== -1) return arr[j];
        }
      }
    }
    return null;
  }

  /* ══════════════════════════════════════════
     카드 생성
     ══════════════════════════════════════════ */
  function createCard(lodge, stop) {
    var card = document.createElement('div');
    card.className = 'lodge-card' + (lodge._displayRank === 1 ? ' recommended' : '');

    var displayRank = lodge._displayRank || lodge.rank;
    var rankLabel = displayRank === 1 ? '1st' : displayRank === 2 ? '2nd' : displayRank === 3 ? '3rd' : displayRank + 'th';

    var tagsHtml = (lodge.tags || []).map(function (t) {
      return '<span class="lodge-tag tag-' + t + '">' + (TAG_LABELS[t] || t) + '</span>';
    }).join('');

    card.setAttribute('data-name', lodge.name);
    card.innerHTML =
      '<div class="card-rank">' + rankLabel + '</div>' +
      '<div class="card-name">' + lodge.name + (lodge.score ? '<span class="card-score">' + lodge.score + '점</span>' : '') + (lodge.label ? '<span class="card-score" style="background:#e36209">' + lodge.label + '</span>' : '') + '</div>' +
      '<div class="card-type">' + lodge.type + '</div>' +
      '<div class="card-price">' + lodge.price + '</div>' +
      '<div class="card-metrics">' +
      (lodge.couple !== '—' ? '<span>&#10084;&#65039; 커플 ' + lodge.couple + '</span>' : '') +
      '<span>&#128663; ' + lodge.parking + '</span>' +
      (lodge.view !== '없음' ? '<span>&#127748; ' + lodge.view + '</span>' : '') +
      '</div>' +
      (tagsHtml ? '<div class="card-tags">' + tagsHtml + '</div>' : '') +
      '<div class="card-note">' + lodge.pros + '</div>';

    card.addEventListener('click', function () { openModal(lodge, stop); });
    return card;
  }

  /* ══════════════════════════════════════════
     모달
     ══════════════════════════════════════════ */
  function openModal(lodge, stop) {
    var body = document.getElementById('lodgeModalBody');
    var html = '';

    /* ── 상단: 숙소명 + 메타 ── */
    html += '<h2 class="lm-title">' + lodge.name + '</h2>';
    html += '<p class="lm-subtitle">' + lodge.type + ' · ' + stop.name + ' · ' + stop.date + '</p>';

    /* ── 예약 링크 버튼 — platforms 필드에 언급된 플랫폼만 표시 ── */
    var lodgeName = lodge.name;
    var regionName = stop.name;
    var qGoogle = encodeURIComponent(lodgeName + ' ' + regionName + ' NSW Australia');
    var pf = (lodge.platforms || '').toLowerCase();
    var PLATFORM_LINKS = [
      { key: 'booking', label: 'Booking.com', cls: 'btn-booking',
        url: 'https://www.booking.com/searchresults.html?ss=' + encodeURIComponent(lodgeName + ' ' + regionName) + '&lang=en-us' },
      { key: 'trip.com', label: 'Trip.com', cls: 'btn-trip',
        url: 'https://www.trip.com/hotels/list?keyword=' + encodeURIComponent(lodgeName + ' ' + regionName) },
      { key: 'airbnb', label: 'Airbnb', cls: 'btn-airbnb',
        url: 'https://www.airbnb.com/s/' + encodeURIComponent(regionName + '--Australia') + '/homes?query=' + encodeURIComponent(lodgeName) },
      { key: 'kayak', label: 'KAYAK', cls: 'btn-kayak',
        url: 'https://www.kayak.com/hotels/' + encodeURIComponent(regionName) + '/' + encodeURIComponent(lodgeName) },
      { key: 'wotif', label: 'Wotif', cls: 'btn-wotif',
        url: 'https://www.wotif.com/Hotel-Search?destination=' + encodeURIComponent(lodgeName + ', ' + regionName) },
      { key: 'hotels.com', label: 'Hotels.com', cls: 'btn-hotels',
        url: 'https://www.hotels.com/search.do?q-destination=' + encodeURIComponent(lodgeName + ', ' + regionName + ', NSW') },
      { key: 'tripadvisor', label: 'TripAdvisor', cls: 'btn-ta',
        url: 'https://www.tripadvisor.com/Search?q=' + encodeURIComponent(lodgeName + ' ' + regionName) },
      { key: 'momondo', label: 'Momondo', cls: 'btn-momondo',
        url: 'https://www.momondo.com/hotels/' + encodeURIComponent(regionName) + '/' + encodeURIComponent(lodgeName) }
    ];
    var linkBtns = '';
    PLATFORM_LINKS.forEach(function (pl) {
      if (pf.indexOf(pl.key) !== -1) {
        linkBtns += '<a class="lm-book-btn ' + pl.cls + '" href="' + pl.url + '" target="_blank" rel="noopener">' + pl.label + '</a>';
      }
    });
    /* Google Maps는 항상 표시 */
    linkBtns += '<a class="lm-book-btn btn-gmaps" href="https://www.google.com/maps/search/' + qGoogle + '" target="_blank" rel="noopener">Google Maps</a>';
    html += '<div class="lm-booking-links">' + linkBtns + '</div>';

    /* ── 핵심 정보 그리드 ── */
    html += '<div class="lm-info-grid">';
    if (lodge.score) {
      html += '<div class="lm-info-cell"><div class="lm-info-label">CRITIC 점수</div><div class="lm-info-value lm-highlight">' + lodge.score + '</div></div>';
    }
    html += '<div class="lm-info-cell"><div class="lm-info-label">가격</div><div class="lm-info-value lm-highlight">' + lodge.price + '</div></div>';
    html += '<div class="lm-info-cell"><div class="lm-info-label">커플 평점</div><div class="lm-info-value' + (lodge.couple !== '—' ? ' lm-couple' : '') + '">' + (lodge.couple !== '—' ? lodge.couple : '—') + '</div></div>';
    html += '<div class="lm-info-cell"><div class="lm-info-label">주차</div><div class="lm-info-value">' + lodge.parking + '</div></div>';
    html += '<div class="lm-info-cell"><div class="lm-info-label">체크인</div><div class="lm-info-value">' + lodge.checkin + '</div></div>';
    html += '<div class="lm-info-cell"><div class="lm-info-label">뷰</div><div class="lm-info-value">' + lodge.view + '</div></div>';
    html += '</div>';

    /* ── 태그 배지 ── */
    if (lodge.tags && lodge.tags.length) {
      html += '<div class="lm-tags">';
      lodge.tags.forEach(function (t) {
        html += '<span class="lodge-tag tag-' + t + '">' + (TAG_LABELS[t] || t) + '</span>';
      });
      html += '</div>';
    }

    /* ── 장단점 ── */
    var prosItems = lodge.pros ? lodge.pros.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
    var consItems = lodge.cons ? lodge.cons.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
    html += '<div class="lm-pros-cons">';
    html += '<div class="lm-pc-section lm-pros-box"><h4>장점</h4><ul class="lm-pc-list">';
    prosItems.forEach(function (item) { html += '<li>' + item + '</li>'; });
    html += '</ul></div>';
    html += '<div class="lm-pc-section lm-cons-box"><h4>단점</h4><ul class="lm-pc-list">';
    consItems.forEach(function (item) { html += '<li>' + item + '</li>'; });
    html += '</ul></div>';
    html += '</div>';

    /* ── 플랫폼 가격 비교 ── */
    if (lodge.platforms) {
      var platformEntries = lodge.platforms.split('/').map(function (s) { return s.trim(); }).filter(Boolean);
      if (platformEntries.length) {
        html += '<div class="lm-platforms"><h4>플랫폼 가격 비교</h4><div class="lm-platform-cards">';
        platformEntries.forEach(function (entry) {
          /* "Booking ~$150", "KAYAK $106~", "Booking $150~250", "Trip.com $99~(프로모)" 등 */
          /* 마지막으로 등장하는 $기호 위치를 기준으로 이름/가격 분리 */
          var dollarIdx = entry.lastIndexOf('$');
          var tildeBeforeDollar = (dollarIdx > 0 && entry[dollarIdx - 1] === '~') ? dollarIdx - 1 : dollarIdx;
          var splitIdx = tildeBeforeDollar;
          /* 이름 부분: $ 앞의 공백까지 (예: "Booking " → "Booking") */
          while (splitIdx > 0 && entry[splitIdx - 1] === ' ') splitIdx--;
          var pfName = splitIdx > 0 ? entry.substring(0, splitIdx).trim() : '';
          var pfPrice = entry.substring(splitIdx).trim();
          if (pfName) {
            html += '<div class="lm-platform-card"><div class="lm-pf-name">' + pfName + '</div><div class="lm-pf-price">' + pfPrice + '</div></div>';
          } else {
            html += '<div class="lm-platform-card"><div class="lm-pf-price">' + entry + '</div></div>';
          }
        });
        html += '</div></div>';
      }
    }

    /* ── 참고 노트 ── */
    if (lodge.note) {
      html += '<div class="lm-note-box"><div class="lm-note-label">참고</div><div class="lm-note-text">' + lodge.note + '</div></div>';
    }

    body.innerHTML = html;

    var modal = document.getElementById('lodgeModal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var modal = document.getElementById('lodgeModal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ══════════════════════════════════════════
     유틸리티
     ══════════════════════════════════════════ */
  function getStop(stopId) {
    for (var i = 0; i < STOPS.length; i++) {
      if (STOPS[i].id === stopId) return STOPS[i];
    }
    return null;
  }

})();
