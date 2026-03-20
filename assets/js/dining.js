/**
 * 식당 후보 페이지
 * 6조 루트 6개 거점의 식당 후보를 카드 그리드로 표시
 * CRITIC_DINING.md 3명 페르소나(A'''/B'''/C''') 평가 기반
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════
     CSS 주입
     ══════════════════════════════════════════ */
  var css = document.createElement('style');
  css.textContent = [
    '.dining-page { max-width: 1100px; margin: 0 auto; }',
    '.dining-subtitle { color: #586069; margin-bottom: 1.2em; }',

    /* 지도 */
    '#diningMap { height: 320px; border-radius: 10px; border: 1px solid #e1e4e8; margin-bottom: 1.2em; z-index: 0; }',
    '.stop-marker { background: #fff; border: 2px solid #d4380d; border-radius: 16px; padding: 4px 12px; font-size: 0.82em; font-weight: 700; color: #d4380d; white-space: nowrap; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.15); text-align: center; transform: translate(-50%, -50%); }',
    '.stop-marker:hover { background: #d4380d; color: #fff; z-index: 9000 !important; }',
    '.stop-marker.active { background: #d4380d; color: #fff; box-shadow: 0 2px 8px rgba(212,56,13,.35); z-index: 8000 !important; }',
    '.stop-marker .marker-day { display: block; font-size: 0.75em; font-weight: 400; opacity: .8; margin-top: 1px; }',

    /* 탭 */
    '.stop-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.2em; }',
    '.stop-tab { padding: 8px 16px; border: 2px solid #d1d5da; border-radius: 20px; background: #fff; color: #24292e; font-size: 0.9em; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; }',
    '.stop-tab:hover { border-color: #d4380d; color: #d4380d; }',
    '.stop-tab.active { background: #d4380d; border-color: #d4380d; color: #fff; }',
    '.stop-tab .tab-count { display: inline-block; background: rgba(0,0,0,.1); border-radius: 8px; padding: 0 6px; font-size: 0.85em; margin-left: 4px; }',
    '.stop-tab.active .tab-count { background: rgba(255,255,255,.25); }',

    /* 요약 */
    '.stop-summary { background: #f6f8fa; border-radius: 8px; padding: 14px 18px; margin-bottom: 1.2em; font-size: 0.92em; line-height: 1.6; }',
    '.stop-summary .stop-role { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 0.85em; font-weight: 600; margin-right: 8px; }',
    '.role-first { background: #fff0e6; color: #c45100; }',
    '.role-seafood { background: #e1f0ff; color: #0366d6; }',
    '.role-coastal { background: #dcffe4; color: #22863a; }',
    '.role-nature { background: #f1e5ff; color: #6f42c1; }',
    '.role-mountain { background: #fff8c5; color: #b08800; }',
    '.role-city { background: #ffeef0; color: #d73a49; }',

    /* 필터 행 */
    '.filter-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 1.2em; }',
    '.filter-group { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }',
    '.filter-group-label { font-size: 0.82em; font-weight: 600; color: #586069; margin-right: 4px; }',
    '.meal-btn, .label-btn { padding: 5px 12px; border: 1.5px solid #d1d5da; border-radius: 14px; background: #fff; font-size: 0.82em; font-weight: 600; cursor: pointer; transition: all .15s; }',
    '.meal-btn:hover, .label-btn:hover { border-color: #888; }',
    '.meal-btn.active { background: #24292e; border-color: #24292e; color: #fff; }',
    '.label-btn[data-label="추천"].active { background: #22863a; border-color: #22863a; color: #fff; }',
    '.label-btn[data-label="차선"].active { background: #0366d6; border-color: #0366d6; color: #fff; }',
    '.label-btn[data-label="가능"].active { background: #b08800; border-color: #b08800; color: #fff; }',
    '.label-btn[data-label="비추"].active { background: #d73a49; border-color: #d73a49; color: #fff; }',
    '.label-btn[data-label="all"].active { background: #24292e; border-color: #24292e; color: #fff; }',
    '.filter-divider { width: 1px; height: 24px; background: #d1d5da; margin: 0 6px; }',

    /* 예산 시뮬레이션 바 */
    '.budget-bar { display: flex; gap: 8px; margin-bottom: 1.2em; flex-wrap: wrap; }',
    '.budget-scenario { flex: 1; min-width: 200px; background: #fff; border: 2px solid #e1e4e8; border-radius: 8px; padding: 12px 16px; cursor: pointer; transition: all .2s; }',
    '.budget-scenario:hover { border-color: #d4380d; }',
    '.budget-scenario.active { border-color: #d4380d; background: #fff8f6; box-shadow: 0 2px 8px rgba(212,56,13,.15); }',
    '.budget-scenario .scenario-name { font-weight: 700; font-size: 0.9em; margin-bottom: 4px; }',
    '.budget-scenario .scenario-total { font-size: 1.2em; font-weight: 700; color: #d4380d; }',
    '.budget-scenario .scenario-krw { font-size: 0.82em; color: #586069; }',
    '.budget-scenario .scenario-desc { font-size: 0.8em; color: #586069; margin-top: 4px; line-height: 1.4; }',

    /* 카드 그리드 */
    '.dining-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 2em; }',
    '.meal-group-header { grid-column: 1 / -1; font-size: 1em; font-weight: 700; color: #24292e; padding: 8px 0 4px; border-bottom: 2px solid #e1e4e8; margin-top: 8px; display: flex; align-items: center; gap: 8px; }',
    '.meal-group-header .meal-context { font-size: 0.82em; font-weight: 400; color: #586069; }',

    /* 카드 */
    '.dine-card { background: #fff; border: 1px solid #e1e4e8; border-radius: 10px; padding: 16px; cursor: pointer; transition: all .15s; position: relative; }',
    '.dine-card:hover { border-color: #d4380d; box-shadow: 0 2px 12px rgba(212,56,13,.12); transform: translateY(-2px); }',
    '.dine-card .card-label { position: absolute; top: -1px; left: -1px; padding: 3px 12px; border-radius: 10px 0 8px 0; font-size: 0.72em; font-weight: 700; color: #fff; pointer-events: none; }',
    '.card-label-추천 { background: #22863a; }',
    '.card-label-차선 { background: #0366d6; }',
    '.card-label-가능 { background: #b08800; }',
    '.card-label-비추 { background: #d73a49; }',
    '.dine-card .card-score { position: absolute; top: 12px; right: 14px; font-size: 1.1em; font-weight: 800; color: #d4380d; }',
    '.dine-card .card-name { font-size: 1.05em; font-weight: 700; color: #24292e; margin-bottom: 2px; margin-top: 4px; padding-right: 45px; }',
    '.dine-card .card-cuisine { font-size: 0.82em; color: #6a737d; margin-bottom: 8px; }',
    '.dine-card .card-price { display: inline-block; font-size: 0.95em; font-weight: 700; color: #d4380d; margin-bottom: 8px; }',
    '.dine-card .card-price-label { font-size: 0.78em; color: #586069; font-weight: 400; margin-left: 2px; }',
    '.dine-card .card-personas { display: flex; gap: 8px; font-size: 0.8em; margin-bottom: 8px; }',
    '.dine-card .card-persona { padding: 2px 8px; border-radius: 10px; font-weight: 600; }',
    '.persona-a { background: #fff1f0; color: #cf1322; }',
    '.persona-b { background: #e6f7ff; color: #0050b3; }',
    '.persona-c { background: #f6ffed; color: #389e0d; }',
    '.dine-card .card-pros { font-size: 0.82em; color: #22863a; line-height: 1.4; margin-bottom: 4px; }',
    '.dine-card .card-controversy { display: inline-block; font-size: 0.75em; font-weight: 600; color: #d4380d; background: #fff1f0; padding: 1px 8px; border-radius: 8px; }',
    '.dine-card.budget-pick { border-color: #d4380d; box-shadow: 0 0 0 2px rgba(212,56,13,.25); }',
    '.dine-card.budget-pick::after { content: attr(data-pick-label); position: absolute; top: -1px; left: 44px; background: #d4380d; color: #fff; font-size: 0.72em; font-weight: 700; padding: 3px 10px; border-radius: 0 8px 8px 0; pointer-events: none; }',

    /* 모달 */
    '.dine-modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.5); z-index: 1000; justify-content: center; align-items: flex-start; padding: 40px 16px; overflow-y: auto; }',
    '.dine-modal-overlay.open { display: flex; }',
    '.dine-modal-content { background: #fff; border-radius: 12px; max-width: 720px; width: 100%; max-height: calc(100vh - 80px); overflow-y: auto; padding: 28px 32px; position: relative; box-shadow: 0 8px 32px rgba(0,0,0,.2); }',
    '.dine-modal-close { position: sticky; top: 0; float: right; background: #f6f8fa; border: none; font-size: 1.5em; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 1; color: #586069; }',
    '.dine-modal-close:hover { background: #e1e4e8; }',
    '.dine-modal-body { line-height: 1.7; }',
    '.dm-title { font-size: 1.3em; font-weight: 700; color: #24292e; margin: 0 0 2px; padding-right: 2em; }',
    '.dm-subtitle { font-size: 0.88em; color: #586069; margin: 0 0 12px; }',
    '.dm-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px; }',
    '.dm-info-cell { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 8px; padding: 10px 12px; text-align: center; }',
    '.dm-info-cell .dm-label { font-size: 0.75em; color: #586069; font-weight: 600; margin-bottom: 4px; }',
    '.dm-info-cell .dm-value { font-size: 1.05em; font-weight: 700; color: #24292e; }',
    '.dm-info-cell .dm-value.dm-highlight { color: #d4380d; font-size: 1.15em; }',

    /* 모달 페르소나 카드 */
    '.dm-personas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }',
    '.dm-persona-card { border-radius: 8px; padding: 12px 14px; }',
    '.dm-persona-card.dm-pa { background: #fff1f0; border: 1px solid #ffccc7; }',
    '.dm-persona-card.dm-pb { background: #e6f7ff; border: 1px solid #91d5ff; }',
    '.dm-persona-card.dm-pc { background: #f6ffed; border: 1px solid #b7eb8f; }',
    '.dm-persona-card .dm-pname { font-size: 0.82em; font-weight: 700; margin-bottom: 4px; }',
    '.dm-pa .dm-pname { color: #cf1322; }',
    '.dm-pb .dm-pname { color: #0050b3; }',
    '.dm-pc .dm-pname { color: #389e0d; }',
    '.dm-persona-card .dm-pscore { font-size: 1.3em; font-weight: 800; margin-bottom: 2px; }',
    '.dm-pa .dm-pscore { color: #cf1322; }',
    '.dm-pb .dm-pscore { color: #0050b3; }',
    '.dm-pc .dm-pscore { color: #389e0d; }',
    '.dm-persona-card .dm-pbar { height: 6px; background: rgba(0,0,0,.08); border-radius: 3px; overflow: hidden; }',
    '.dm-persona-card .dm-pbar-fill { height: 100%; border-radius: 3px; }',
    '.dm-pa .dm-pbar-fill { background: #cf1322; }',
    '.dm-pb .dm-pbar-fill { background: #0050b3; }',
    '.dm-pc .dm-pbar-fill { background: #389e0d; }',

    /* 모달 장단점 */
    '.dm-pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }',
    '.dm-pc-section { border-radius: 8px; padding: 12px 14px; }',
    '.dm-pc-section.dm-pros-box { background: #f0fff4; border: 1px solid #dcffe4; }',
    '.dm-pc-section.dm-cons-box { background: #fff5f5; border: 1px solid #ffeef0; }',
    '.dm-pc-section h4 { margin: 0 0 8px; font-size: 0.88em; }',
    '.dm-pros-box h4 { color: #22863a; }',
    '.dm-cons-box h4 { color: #d73a49; }',
    '.dm-pc-list { list-style: none; padding: 0; margin: 0; }',
    '.dm-pc-list li { font-size: 0.85em; line-height: 1.5; padding: 3px 0 3px 18px; position: relative; }',
    '.dm-pc-list li::before { position: absolute; left: 0; }',
    '.dm-pros-box .dm-pc-list li::before { content: "\\2713"; color: #22863a; font-weight: 700; }',
    '.dm-cons-box .dm-pc-list li::before { content: "\\2717"; color: #d73a49; font-weight: 700; }',

    /* 모달 노트 */
    '.dm-note-box { background: #fffdf0; border: 1px solid #ffeaa7; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }',
    '.dm-note-box .dm-note-label { font-size: 0.78em; font-weight: 700; color: #b08800; margin-bottom: 4px; }',
    '.dm-note-box .dm-note-text { font-size: 0.88em; color: #24292e; line-height: 1.5; }',

    /* Google Maps 버튼 */
    '.dm-gmaps-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 6px; font-size: 0.82em; font-weight: 600; text-decoration: none; transition: all .15s; border: 1.5px solid #4285F4; color: #4285F4; background: #f0f6ff; }',
    '.dm-gmaps-btn:hover { background: #4285F4; color: #fff; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,.12); }',

    /* 빈 상태 */
    '.dining-empty { grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #586069; font-size: 0.95em; }',

    /* 반응형 */
    /* 뷰 모드 토글 */
    '.view-toggle { display: flex; gap: 4px; margin-bottom: 1.2em; background: #f6f8fa; border-radius: 24px; padding: 4px; width: fit-content; }',
    '.view-toggle-btn { padding: 8px 20px; border: none; border-radius: 20px; background: transparent; font-size: 0.9em; font-weight: 600; color: #586069; cursor: pointer; transition: all .15s; }',
    '.view-toggle-btn:hover { color: #24292e; }',
    '.view-toggle-btn.active { background: #d4380d; color: #fff; box-shadow: 0 1px 4px rgba(212,56,13,.25); }',

    /* 날짜 뷰 거점 태그 */
    '.day-stop-tag { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 0.82em; font-weight: 600; margin-right: 6px; }',
    '.meal-group-header .day-stop-tag { font-size: 0.78em; }',

    '@media (max-width: 600px) {',
    '  .dining-grid { grid-template-columns: 1fr; }',
    '  .stop-tabs { gap: 4px; }',
    '  .stop-tab { padding: 6px 12px; font-size: 0.82em; }',
    '  .dine-modal-content { padding: 20px 16px; }',
    '  .budget-bar { flex-direction: column; }',
    '  .dm-info-grid { grid-template-columns: repeat(2, 1fr); }',
    '  .dm-pros-cons { grid-template-columns: 1fr; }',
    '  .dm-personas { grid-template-columns: 1fr; }',
    '  .filter-row { gap: 6px; }',
    '  .filter-divider { display: none; }',
    '  .view-toggle { width: 100%; }',
    '  .view-toggle-btn { flex: 1; text-align: center; }',
    '}'
  ].join('\n');
  document.head.appendChild(css);

  /* ══════════════════════════════════════════
     상수
     ══════════════════════════════════════════ */
  var PERSONA_NAMES = {
    a: "A''' 동선 미식가",
    b: "B''' 미식 큐레이터",
    c: "C''' 리뷰 검증자"
  };

  var LABEL_COLORS = {
    '추천': '#22863a',
    '차선': '#0366d6',
    '가능': '#b08800',
    '비추': '#d73a49'
  };

  /* ══════════════════════════════════════════
     데이터
     ══════════════════════════════════════════ */
  var STOPS = []; // data/dining/dining_data.json에서 로드
  var SCENARIOS = []; // data/dining/dining_data.json에서 로드

  /* ══════════════════════════════════════════
     날짜별 데이터 매핑
     ══════════════════════════════════════════ */
  var DAYS = [
    {key:'Day 1', date:'5/24', label:'Day 1 (5/24)', weekday:'일'},
    {key:'Day 2', date:'5/25', label:'Day 2 (5/25)', weekday:'월'},
    {key:'Day 3', date:'5/26', label:'Day 3 (5/26)', weekday:'화'},
    {key:'Day 4', date:'5/27', label:'Day 4 (5/27)', weekday:'수'},
    {key:'Day 5', date:'5/28', label:'Day 5 (5/28)', weekday:'목'},
    {key:'Day 6', date:'5/29', label:'Day 6 (5/29)', weekday:'금'},
    {key:'Day 7', date:'5/30', label:'Day 7 (5/30)', weekday:'토'}
  ];

  var ROLE_COLORS = {
    first: {bg:'#fff0e6', color:'#c45100'},
    seafood: {bg:'#e1f0ff', color:'#0366d6'},
    coastal: {bg:'#dcffe4', color:'#22863a'},
    nature: {bg:'#f1e5ff', color:'#6f42c1'},
    mountain: {bg:'#fff8c5', color:'#b08800'},
    city: {bg:'#ffeef0', color:'#d73a49'}
  };

  /** 특정 day에 해당하는 식당들을 모든 거점에서 수집 */
  function getRestaurantsForDay(dayKey) {
    var results = [];
    STOPS.forEach(function(stop) {
      stop.restaurants.forEach(function(r) {
        if (r.day === dayKey) {
          results.push({restaurant: r, stop: stop});
        }
      });
    });
    return results;
  }

  /** 특정 day에 관여하는 거점 목록 */
  function getStopsForDay(dayKey) {
    var seen = {};
    var stops = [];
    STOPS.forEach(function(stop) {
      stop.restaurants.forEach(function(r) {
        if (r.day === dayKey && !seen[stop.id]) {
          seen[stop.id] = true;
          stops.push(stop);
        }
      });
    });
    return stops;
  }

  /* ══════════════════════════════════════════
     상태
     ══════════════════════════════════════════ */
  var viewMode = 'region'; // 'region' | 'date'
  var activeStop = null;
  var activeDay = 'Day 1';
  var activeMeal = 'all';
  var activeLabel = 'all';
  var activeScenario = 'balance';
  var map, markers = {};

  /* ══════════════════════════════════════════
     초기화
     ══════════════════════════════════════════ */
  function init() {
    try { initMap(); } catch(e) { console.warn('Map init failed:', e); }
    renderViewToggle();
    renderTabs();
    renderBudgetBar();
    initFilters();
    selectStop(STOPS[0].id);
    initModal();
  }

  function renderViewToggle() {
    var el = document.getElementById('viewToggle');
    el.innerHTML =
      '<button class="view-toggle-btn active" data-view="region">지역별</button>' +
      '<button class="view-toggle-btn" data-view="date">날짜별</button>';
    el.addEventListener('click', function(e) {
      var btn = e.target.closest('.view-toggle-btn');
      if (!btn || btn.dataset.view === viewMode) return;
      viewMode = btn.dataset.view;
      el.querySelectorAll('.view-toggle-btn').forEach(function(b) {
        b.classList.toggle('active', b.dataset.view === viewMode);
      });
      activeMeal = 'all';
      activeLabel = 'all';
      if (viewMode === 'region') {
        renderTabs();
        selectStop(activeStop);
      } else {
        renderDateTabs();
        selectDay(activeDay);
      }
    });
  }

  function initMap() {
    var bounds = [];
    STOPS.forEach(function(s) { if (s.center) bounds.push(s.center); });
    if (!bounds.length) return;

    map = L.map('diningMap', {
      scrollWheelZoom: false,
      zoomControl: true
    });

    map.fitBounds(bounds, { padding: [30, 30] });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18
    }).addTo(map);

    /* 점선 루트 연결 */
    L.polyline(bounds, { color: '#d4380d', weight: 2, opacity: 0.4, dashArray: '8 6' }).addTo(map);

    STOPS.forEach(function(s) {
      if (!s.center) return;
      var icon = L.divIcon({
        className: '',
        html: '<div class="stop-marker' + (s.id === activeStop ? ' active' : '') + '" data-stop="' + s.id + '">' +
              s.name + '<span class="marker-day">' + s.day + '</span></div>',
        iconSize: null,
        iconAnchor: [0, 0]
      });
      var m = L.marker(s.center, {icon: icon}).addTo(map);
      m.on('click', function() { selectStop(s.id); });
      markers[s.id] = m;
    });
  }

  function renderTabs() {
    var el = document.getElementById('stopTabs');
    el.innerHTML = STOPS.map(function(s) {
      return '<button class="stop-tab" data-stop="' + s.id + '">' +
        s.name + '<span class="tab-count">' + s.restaurants.length + '</span></button>';
    }).join('');
    el.addEventListener('click', function(e) {
      var btn = e.target.closest('.stop-tab');
      if (btn) selectStop(btn.dataset.stop);
    });
  }

  function renderBudgetBar() {
    var el = document.getElementById('budgetBar');
    el.innerHTML = SCENARIOS.map(function(sc) {
      return '<div class="budget-scenario' + (sc.key === activeScenario ? ' active' : '') +
        '" data-scenario="' + sc.key + '">' +
        '<div class="scenario-name">' + sc.label + '</div>' +
        '<div class="scenario-total">' + sc.total + '</div>' +
        '<div class="scenario-krw">7일 2인 ' + sc.krw + '</div>' +
        '<div class="scenario-desc">' + sc.desc + '</div></div>';
    }).join('');
    el.addEventListener('click', function(e) {
      var card = e.target.closest('.budget-scenario');
      if (card) {
        activeScenario = card.dataset.scenario;
        el.querySelectorAll('.budget-scenario').forEach(function(c) {
          c.classList.toggle('active', c.dataset.scenario === activeScenario);
        });
        if (viewMode === 'date') applyBudgetHighlightForDay();
        else applyBudgetHighlight();
      }
    });
  }

  /* ══════════════════════════════════════════
     거점 선택
     ══════════════════════════════════════════ */
  function selectStop(stopId) {
    activeStop = stopId;
    activeMeal = 'all';
    activeLabel = 'all';

    // 예산 바 표시
    document.getElementById('budgetBar').style.display = '';

    // 탭 활성화
    document.querySelectorAll('.stop-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.stop === stopId);
    });

    // 마커 활성화 (Leaflet divIcon은 렌더 후에만 getElement 가능)
    setTimeout(function() {
      try {
        Object.keys(markers).forEach(function(id) {
          var el = markers[id].getElement();
          if (el) el.classList.toggle('active', id === stopId);
        });
      } catch(e) { /* ignore */ }
    }, 50);
    var stop = getStop(stopId);
    if (stop && map) { try { map.setView(stop.center, 10, {animate: true}); } catch(e) {} }

    renderSummary();
    renderFilters();
    renderCards();
  }

  function getStop(id) {
    for (var i = 0; i < STOPS.length; i++) {
      if (STOPS[i].id === id) return STOPS[i];
    }
    return null;
  }

  /* ══════════════════════════════════════════
     날짜별 뷰
     ══════════════════════════════════════════ */
  function renderDateTabs() {
    var el = document.getElementById('stopTabs');
    el.innerHTML = DAYS.map(function(d) {
      var count = getRestaurantsForDay(d.key).length;
      return '<button class="stop-tab" data-day="' + d.key + '">' +
        d.date + ' ' + d.weekday +
        '<span class="tab-count">' + count + '</span></button>';
    }).join('');
    el.addEventListener('click', function(e) {
      var btn = e.target.closest('.stop-tab');
      if (btn && btn.dataset.day) selectDay(btn.dataset.day);
    });
  }

  function selectDay(dayKey) {
    activeDay = dayKey;
    activeMeal = 'all';
    activeLabel = 'all';

    // 예산 바 표시 (날짜 뷰에서도 시나리오 추천 강조 적용)
    document.getElementById('budgetBar').style.display = '';

    // 탭 활성화
    document.querySelectorAll('.stop-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.day === dayKey);
    });

    // 지도: 해당 날짜 거점들 하이라이트
    var dayStops = getStopsForDay(dayKey);
    setTimeout(function() {
      try {
        Object.keys(markers).forEach(function(id) {
          var el = markers[id].getElement();
          if (el) {
            var isActive = dayStops.some(function(s) { return s.id === id; });
            el.classList.toggle('active', isActive);
          }
        });
      } catch(e) {}
    }, 50);
    if (dayStops.length > 0 && map) {
      try {
        if (dayStops.length === 1) {
          map.setView(dayStops[0].center, 10, {animate: true});
        } else {
          var bounds = L.latLngBounds(dayStops.map(function(s) { return s.center; }));
          map.fitBounds(bounds, {padding: [40, 40], animate: true});
        }
      } catch(e) {}
    }

    renderDaySummary();
    renderDayFilters();
    renderDayCards();
  }

  function renderDaySummary() {
    var el = document.getElementById('stopSummary');
    var dayInfo = DAYS.filter(function(d) { return d.key === activeDay; })[0];
    if (!dayInfo) return;
    var dayStops = getStopsForDay(activeDay);
    var items = getRestaurantsForDay(activeDay);
    var labels = {'추천':0,'차선':0,'가능':0,'비추':0};
    items.forEach(function(item) { labels[item.restaurant.label] = (labels[item.restaurant.label]||0) + 1; });

    var stopTags = dayStops.map(function(s) {
      var rc = ROLE_COLORS[s.role] || {bg:'#f6f8fa', color:'#586069'};
      return '<span class="day-stop-tag" style="background:' + rc.bg + ';color:' + rc.color + '">' +
        s.name + '</span>';
    }).join('');

    el.innerHTML =
      '<strong>' + dayInfo.label + ' (' + dayInfo.weekday + ')</strong><br>' +
      stopTags +
      '<br><span style="font-size:.85em;color:#586069">' +
      '총 ' + items.length + '곳 · ' +
      '<span style="color:#22863a">추천 ' + labels['추천'] + '</span> · ' +
      '<span style="color:#0366d6">차선 ' + labels['차선'] + '</span> · ' +
      '<span style="color:#b08800">가능 ' + labels['가능'] + '</span> · ' +
      '<span style="color:#d73a49">비추 ' + labels['비추'] + '</span>' +
      '</span>';
  }

  function renderDayFilters() {
    var el = document.getElementById('filterRow');
    var items = getRestaurantsForDay(activeDay);

    // 해당 날짜의 식사유형 수집 (순서 유지)
    var mealOrder = ['아침','브런치','점심','카페','간식','저녁','점심2','저녁2'];
    var seenMeals = {};
    var mealTypes = [{type:'all', label:'전체'}];
    // 먼저 해당 날짜 식당들에서 meal 유형 수집
    var dayMeals = [];
    items.forEach(function(item) {
      if (!seenMeals[item.restaurant.meal]) {
        seenMeals[item.restaurant.meal] = true;
        dayMeals.push(item.restaurant.meal);
      }
    });
    // mealOrder 기준 정렬
    dayMeals.sort(function(a, b) {
      return mealOrder.indexOf(a) - mealOrder.indexOf(b);
    });
    dayMeals.forEach(function(m) {
      mealTypes.push({type: m, label: m.replace(/\d+$/, '')});
    });

    var labelTypes = [
      {type:'all', label:'전체'},
      {type:'추천', label:'추천'},
      {type:'차선', label:'차선'},
      {type:'가능', label:'가능'},
      {type:'비추', label:'비추'}
    ];

    el.innerHTML =
      '<div class="filter-group"><span class="filter-group-label">식사:</span>' +
      mealTypes.map(function(m) {
        return '<button class="meal-btn' + (activeMeal === m.type ? ' active' : '') +
          '" data-meal="' + m.type + '">' + m.label + '</button>';
      }).join('') + '</div>' +
      '<div class="filter-divider"></div>' +
      '<div class="filter-group"><span class="filter-group-label">라벨:</span>' +
      labelTypes.map(function(l) {
        return '<button class="label-btn' + (activeLabel === l.type ? ' active' : '') +
          '" data-label="' + l.type + '">' + l.label + '</button>';
      }).join('') + '</div>';
  }

  function renderDayCards() {
    var grid = document.getElementById('diningGrid');
    var items = getRestaurantsForDay(activeDay);

    // 필터링
    var filtered = items.filter(function(item) {
      var r = item.restaurant;
      if (activeMeal !== 'all' && r.meal !== activeMeal) return false;
      if (activeLabel !== 'all' && r.label !== activeLabel) return false;
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="dining-empty">조건에 맞는 식당이 없습니다.</div>';
      return;
    }

    // 식사 시간순 그룹핑
    var mealOrder = ['아침','브런치','점심','카페','간식','저녁','점심2','저녁2'];
    var groups = {};
    var groupOrder = [];
    filtered.forEach(function(item) {
      var key = item.restaurant.meal;
      if (!groups[key]) {
        groups[key] = [];
        groupOrder.push(key);
      }
      groups[key].push(item);
    });
    groupOrder.sort(function(a, b) {
      return mealOrder.indexOf(a) - mealOrder.indexOf(b);
    });

    var html = '';
    groupOrder.forEach(function(mealType) {
      var groupItems = groups[mealType];
      if (!groupItems || groupItems.length === 0) return;

      // 해당 그룹의 거점들 표시
      var stopNames = [];
      var seen = {};
      groupItems.forEach(function(item) {
        if (!seen[item.stop.id]) {
          seen[item.stop.id] = true;
          stopNames.push(item.stop);
        }
      });

      var stopTags = stopNames.map(function(s) {
        var rc = ROLE_COLORS[s.role] || {bg:'#f6f8fa', color:'#586069'};
        return '<span class="day-stop-tag" style="background:' + rc.bg + ';color:' + rc.color + '">' +
          s.name + '</span>';
      }).join('');

      // 그룹 헤더: 식사 컨텍스트 가져오기
      var ctx = '';
      stopNames.forEach(function(s) {
        s.meals.forEach(function(m) {
          if (m.type === mealType && !ctx) ctx = m.ctx;
        });
      });

      html += '<div class="meal-group-header">' + activeDay + ' ' + mealType.replace(/\d+$/, '') +
        ' ' + stopTags +
        (ctx ? '<span class="meal-context">' + ctx + '</span>' : '') +
        '</div>';

      // 점수 내림차순 정렬
      groupItems.sort(function(a, b) { return b.restaurant.avg - a.restaurant.avg; });

      groupItems.forEach(function(item) {
        html += createCard(item.restaurant, item.stop.id);
      });
    });

    grid.innerHTML = html;

    // 카드 클릭 이벤트
    grid.querySelectorAll('.dine-card').forEach(function(card) {
      card.addEventListener('click', function() {
        openModal(card.dataset.stop, card.dataset.name);
      });
    });

    // 날짜별 뷰에서도 해당 날짜 거점들의 picks 합산하여 강조
    applyBudgetHighlightForDay();
  }

  /* ══════════════════════════════════════════
     요약 렌더링
     ══════════════════════════════════════════ */
  function renderSummary() {
    var stop = getStop(activeStop);
    if (!stop) return;
    var el = document.getElementById('stopSummary');
    var roleClass = 'role-' + stop.role;
    var labels = countLabels(stop.restaurants);
    el.innerHTML =
      '<span class="stop-role ' + roleClass + '">' + stop.roleLabel + '</span>' +
      '<strong>' + stop.name + '</strong> · ' + stop.date + ' (' + stop.day + ')' +
      '<br>' + stop.summary +
      '<br><span style="font-size:.85em;color:#586069">' +
      '총 ' + stop.restaurants.length + '곳 · ' +
      '<span style="color:#22863a">추천 ' + labels['추천'] + '</span> · ' +
      '<span style="color:#0366d6">차선 ' + labels['차선'] + '</span> · ' +
      '<span style="color:#b08800">가능 ' + labels['가능'] + '</span> · ' +
      '<span style="color:#d73a49">비추 ' + labels['비추'] + '</span>' +
      '</span>';
  }

  function countLabels(restaurants) {
    var c = {'추천':0,'차선':0,'가능':0,'비추':0};
    restaurants.forEach(function(r) { c[r.label] = (c[r.label]||0) + 1; });
    return c;
  }

  /* ══════════════════════════════════════════
     필터 (이벤트는 initFilters에서 한 번만 등록)
     ══════════════════════════════════════════ */
  function initFilters() {
    var el = document.getElementById('filterRow');
    el.addEventListener('click', function(e) {
      var btn = e.target.closest('.meal-btn');
      if (btn) {
        activeMeal = btn.dataset.meal;
        el.querySelectorAll('.meal-btn').forEach(function(b) {
          b.classList.toggle('active', b.dataset.meal === activeMeal);
        });
        if (viewMode === 'date') renderDayCards(); else renderCards();
        return;
      }
      btn = e.target.closest('.label-btn');
      if (btn) {
        activeLabel = btn.dataset.label;
        el.querySelectorAll('.label-btn').forEach(function(b) {
          b.classList.toggle('active', b.dataset.label === activeLabel);
        });
        if (viewMode === 'date') renderDayCards(); else renderCards();
      }
    });
  }

  function renderFilters() {
    var stop = getStop(activeStop);
    if (!stop) return;
    var el = document.getElementById('filterRow');

    var mealTypes = [{type:'all', label:'전체'}];
    stop.meals.forEach(function(m) { mealTypes.push({type: m.type, label: m.label}); });

    var labelTypes = [
      {type:'all', label:'전체'},
      {type:'추천', label:'추천'},
      {type:'차선', label:'차선'},
      {type:'가능', label:'가능'},
      {type:'비추', label:'비추'}
    ];

    el.innerHTML =
      '<div class="filter-group"><span class="filter-group-label">식사:</span>' +
      mealTypes.map(function(m) {
        return '<button class="meal-btn' + (activeMeal === m.type ? ' active' : '') +
          '" data-meal="' + m.type + '">' + m.label + '</button>';
      }).join('') + '</div>' +
      '<div class="filter-divider"></div>' +
      '<div class="filter-group"><span class="filter-group-label">라벨:</span>' +
      labelTypes.map(function(l) {
        return '<button class="label-btn' + (activeLabel === l.type ? ' active' : '') +
          '" data-label="' + l.type + '">' + l.label + '</button>';
      }).join('') + '</div>';
  }

  /* ══════════════════════════════════════════
     카드 렌더링
     ══════════════════════════════════════════ */
  function renderCards() {
    var stop = getStop(activeStop);
    if (!stop) return;
    var grid = document.getElementById('diningGrid');

    // 필터링
    var filtered = stop.restaurants.filter(function(r) {
      if (activeMeal !== 'all' && r.meal !== activeMeal) return false;
      if (activeLabel !== 'all' && r.label !== activeLabel) return false;
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="dining-empty">조건에 맞는 식당이 없습니다.</div>';
      return;
    }

    // 식사 유형별 그룹핑
    var groups = {};
    var groupOrder = [];
    stop.meals.forEach(function(m) { groups[m.type] = []; groupOrder.push(m.type); });

    filtered.forEach(function(r) {
      if (groups[r.meal]) groups[r.meal].push(r);
    });

    var html = '';
    groupOrder.forEach(function(mealType) {
      var items = groups[mealType];
      if (!items || items.length === 0) return;
      var mealInfo = stop.meals.filter(function(m) { return m.type === mealType; })[0];
      if (!mealInfo) return;

      // 점수 내림차순 정렬
      items.sort(function(a, b) { return b.avg - a.avg; });

      html += '<div class="meal-group-header">' + mealInfo.label +
        '<span class="meal-context">' + mealInfo.ctx + '</span></div>';

      items.forEach(function(r, idx) {
        html += createCard(r, stop.id, idx);
      });
    });

    grid.innerHTML = html;

    // 카드 클릭 이벤트
    grid.querySelectorAll('.dine-card').forEach(function(card) {
      card.addEventListener('click', function() {
        openModal(card.dataset.stop, card.dataset.name);
      });
    });

    applyBudgetHighlight();
  }

  function applyBudgetHighlight() {
    var stop = STOPS.filter(function(s) { return s.id === activeStop; })[0];
    if (!stop || !stop.budgetPick) return;
    var bp = stop.budgetPick[activeScenario];
    var names = bp ? (bp.picks || []) : [];
    var grid = document.getElementById('diningGrid');
    grid.querySelectorAll('.dine-card').forEach(function(card) {
      var n = card.dataset.name;
      var isPick = names.indexOf(n) >= 0;
      card.classList.toggle('budget-pick', isPick);
      if (isPick) {
        var sc = SCENARIOS.filter(function(s) { return s.key === activeScenario; })[0];
        card.setAttribute('data-pick-label', sc ? sc.label + ' 추천' : '추천');
      } else {
        card.removeAttribute('data-pick-label');
      }
    });
  }

  function applyBudgetHighlightForDay() {
    // 해당 날짜에 포함된 모든 거점의 picks를 합산
    var dayStops = getStopsForDay(activeDay);
    var allPicks = [];
    dayStops.forEach(function(s) {
      if (!s.budgetPick) return;
      var bp = s.budgetPick[activeScenario];
      if (bp && bp.picks) {
        bp.picks.forEach(function(p) { allPicks.push(p); });
      }
    });
    var grid = document.getElementById('diningGrid');
    grid.querySelectorAll('.dine-card').forEach(function(card) {
      var n = card.dataset.name;
      var isPick = allPicks.indexOf(n) >= 0;
      card.classList.toggle('budget-pick', isPick);
      if (isPick) {
        var sc = SCENARIOS.filter(function(s) { return s.key === activeScenario; })[0];
        card.setAttribute('data-pick-label', sc ? sc.label + ' 추천' : '추천');
      } else {
        card.removeAttribute('data-pick-label');
      }
    });
  }

  function createCard(r, stopId) {
    var spread = Math.max(r.scores[0], r.scores[1], r.scores[2]) -
                 Math.min(r.scores[0], r.scores[1], r.scores[2]);
    return '<div class="dine-card" data-stop="' + stopId + '" data-name="' + esc(r.name) + '">' +
      '<div class="card-label card-label-' + r.label + '">' + r.label + '</div>' +
      '<div class="card-score">' + r.avg.toFixed(1) + '</div>' +
      '<div class="card-name">' + esc(r.name) + '</div>' +
      '<div class="card-cuisine">' + esc(r.cuisine) + ' · ' + r.day + ' ' + r.meal + '</div>' +
      '<div class="card-price">' + esc(r.price) + '<span class="card-price-label">/인</span></div>' +
      '<div class="card-personas">' +
        '<span class="card-persona persona-a">A\'\'\' ' + r.scores[0].toFixed(1) + '</span>' +
        '<span class="card-persona persona-b">B\'\'\' ' + r.scores[1].toFixed(1) + '</span>' +
        '<span class="card-persona persona-c">C\'\'\' ' + r.scores[2].toFixed(1) + '</span>' +
      '</div>' +
      '<div class="card-pros">' + esc(r.pros) + '</div>' +
      (r.controversy ? '<span class="card-controversy">⚡ 논쟁 (편차 ' + spread.toFixed(1) + ')</span>' : '') +
    '</div>';
  }

  /* ══════════════════════════════════════════
     모달
     ══════════════════════════════════════════ */
  function initModal() {
    var overlay = document.getElementById('dineModal');
    document.getElementById('dineModalClose').addEventListener('click', function() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  function openModal(stopId, name) {
    var stop = getStop(stopId);
    if (!stop) return;
    var r = null;
    for (var i = 0; i < stop.restaurants.length; i++) {
      if (stop.restaurants[i].name === name) { r = stop.restaurants[i]; break; }
    }
    if (!r) return;

    var spread = Math.max(r.scores[0], r.scores[1], r.scores[2]) -
                 Math.min(r.scores[0], r.scores[1], r.scores[2]);
    var labelColor = LABEL_COLORS[r.label] || '#586069';

    var html = '';
    // 제목
    html += '<h2 class="dm-title">' + esc(r.name) + '</h2>';
    html += '<p class="dm-subtitle">' + esc(r.cuisine) + ' · ' + stop.name + ' · ' + r.day + ' ' + r.meal + '</p>';

    // Google Maps 링크
    html += '<div style="margin-bottom:16px"><a class="dm-gmaps-btn" href="https://www.google.com/maps/search/' +
      encodeURIComponent(r.name + ' ' + stop.name + ' NSW Australia') +
      '" target="_blank" rel="noopener">📍 Google Maps에서 보기</a></div>';

    // 핵심 정보 그리드
    html += '<div class="dm-info-grid">';
    html += infoCell('CRITIC 점수', r.avg.toFixed(1), 'dm-highlight');
    html += infoCell('라벨', '<span style="color:' + labelColor + ';font-weight:800">' + r.label + '</span>', '');
    html += infoCell('1인 가격', esc(r.price), '');
    html += infoCell('편차', spread.toFixed(1) + 'p' + (r.controversy ? ' ⚡' : ''), r.controversy ? 'dm-highlight' : '');
    html += '</div>';

    // 3명 페르소나 카드
    html += '<div class="dm-personas">';
    html += personaCard('a', 'A\'\'\' 동선 미식가', r.scores[0]);
    html += personaCard('b', 'B\'\'\' 미식 큐레이터', r.scores[1]);
    html += personaCard('c', 'C\'\'\' 리뷰 검증자', r.scores[2]);
    html += '</div>';

    // 장단점
    html += '<div class="dm-pros-cons">';
    html += '<div class="dm-pc-section dm-pros-box"><h4>강점</h4><ul class="dm-pc-list">';
    (r.pros || '').split(', ').forEach(function(p) {
      if (p) html += '<li>' + esc(p) + '</li>';
    });
    html += '</ul></div>';
    html += '<div class="dm-pc-section dm-cons-box"><h4>약점</h4><ul class="dm-pc-list">';
    (r.cons || '없음').split(', ').forEach(function(c) {
      if (c) html += '<li>' + esc(c) + '</li>';
    });
    html += '</ul></div></div>';

    // 논쟁 분석
    if (r.controversy) {
      html += '<div class="dm-note-box">';
      html += '<div class="dm-note-label">⚡ 논쟁 식당 (페르소나 편차 ≥ 15점)</div>';
      html += '<div class="dm-note-text">';
      var maxP = r.scores[0] >= r.scores[1] && r.scores[0] >= r.scores[2] ? 'A\'\'\' 동선 미식가' :
                 r.scores[1] >= r.scores[2] ? 'B\'\'\' 미식 큐레이터' : 'C\'\'\' 리뷰 검증자';
      var minP = r.scores[0] <= r.scores[1] && r.scores[0] <= r.scores[2] ? 'A\'\'\' 동선 미식가' :
                 r.scores[1] <= r.scores[2] ? 'B\'\'\' 미식 큐레이터' : 'C\'\'\' 리뷰 검증자';
      html += maxP + '가 가장 높게(' + Math.max(r.scores[0],r.scores[1],r.scores[2]).toFixed(1) + '), ' +
              minP + '가 가장 낮게(' + Math.min(r.scores[0],r.scores[1],r.scores[2]).toFixed(1) + ') 평가. ' +
              '편차 ' + spread.toFixed(1) + '점.';
      html += '</div></div>';
    }

    // 노트
    if (r.note) {
      html += '<div class="dm-note-box">';
      html += '<div class="dm-note-label">참고</div>';
      html += '<div class="dm-note-text">' + esc(r.note) + '</div></div>';
    }

    document.getElementById('dineModalBody').innerHTML = html;
    document.getElementById('dineModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function infoCell(label, value, cls) {
    return '<div class="dm-info-cell"><div class="dm-label">' + label +
      '</div><div class="dm-value ' + (cls || '') + '">' + value + '</div></div>';
  }

  function personaCard(key, name, score) {
    var pct = Math.min(score, 100);
    return '<div class="dm-persona-card dm-p' + key + '">' +
      '<div class="dm-pname">' + name + '</div>' +
      '<div class="dm-pscore">' + score.toFixed(1) + '</div>' +
      '<div class="dm-pbar"><div class="dm-pbar-fill" style="width:' + pct + '%"></div></div></div>';
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ══════════════════════════════════════════
     실행
     ══════════════════════════════════════════ */
  // 데이터를 fetch로 로드한 후 초기화
  var base = (window.__BASE_URL__ || '').replace(/\/+$/, '');
  fetch(base + '/data/dining/dining_data.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      STOPS = data.stops;
      SCENARIOS = data.scenarios || [];
      /* subtitle 동적 생성 */
      var totalRestaurants = STOPS.reduce(function(s, st) { return s + st.restaurants.length; }, 0);
      var sub = document.getElementById('subtitle');
      if (sub) sub.textContent = '6조 루트 · ' + STOPS.length + '개 거점 · ' + totalRestaurants + '개 CRITIC 채점 · 3명 페르소나(동선 미식가 / 미식 큐레이터 / 리뷰 검증자) · 2026년 5월 기준';
      try {
        init();
        console.log('dining.js init OK, cards:', document.querySelectorAll('.dine-card').length);
      } catch(e) {
        console.error('dining.js init error:', e);
        document.getElementById('diningGrid').innerHTML = '<div style="color:red;padding:20px">JS 오류: ' + e.message + '</div>';
      }
    })
    .catch(function(err) { console.error('dining 데이터 로드 실패:', err); });
})();
