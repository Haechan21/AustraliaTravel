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
    '.dine-card.budget-pick::after { content: attr(data-pick-label); position: absolute; top: -1px; right: -1px; background: #d4380d; color: #fff; font-size: 0.72em; font-weight: 700; padding: 2px 10px; border-radius: 0 10px 0 8px; pointer-events: none; }',

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
  var STOPS = [
    {
      id: 'byron', name: '바이런베이', day: 'Day 1~2', date: '5/24~25',
      role: 'first', roleLabel: '첫 거점',
      center: [-28.6474, 153.6020],
      summary: '783km 운전 후 20:30 도착. Day 1 레이트나이트 저녁, Day 2 아침 바이런 브런치 문화 체험 후 출발.',
      meals: [
        {type:'저녁', label:'Day 1 저녁', ctx:'20:30 도착, 레이트나이트 필수'},
        {type:'브런치', label:'Day 2 브런치', ctx:'07:00~09:30, 출발 전'},
        {type:'카페', label:'Day 2 카페·디저트', ctx:'경유 간식·디저트'}
      ],
      budgetPick: {economy:'$45~67', balance:'$230~320', premium:'$400+'},
      restaurants: [
        {name:'The Smoking Camel', cuisine:'중동 BBQ 쉐어', price:'$40~60', scores:[69,79,64], avg:70.7, label:'추천', controversy:false, day:'Day 1', meal:'저녁', pros:'레이트나이트 영업, 숯불BBQ 쉐어 커플 적합', cons:'가격대 높은 편'},
        {name:'Hunky Dory Fish & Chips', cuisine:'피시앤칩스', price:'$15~25', scores:[79,61,67.5], avg:69.2, label:'차선', controversy:true, day:'Day 1', meal:'저녁', pros:'최고 가성비, Jonson St 21시까지', cons:'분위기 없음'},
        {name:'Trattoria Basiloco', cuisine:'우드파이어 피자', price:'$22~30', scores:[69,72.5,65], avg:68.8, label:'차선', controversy:false, day:'Day 1', meal:'저녁', pros:'사르디니아 정통 우드파이어 피자', cons:'화~수 휴무 주의'},
        {name:'Raes Dining Room', cuisine:'파인다이닝 (2 Hat)', price:'$100~150', scores:[52,85,63], avg:66.7, label:'가능', controversy:true, day:'Day 1', meal:'저녁', pros:'2 Hat, 호주 부시터커 식재료', cons:'1인 $100~150+ 예산 3배 초과'},
        {name:'Balcony Bar & Oyster Co.', cuisine:'시푸드 파인다이닝', price:'$80~90', scores:[60,77.5,61.5], avg:66.3, label:'가능', controversy:true, day:'Day 1', meal:'저녁', pros:'셰프 숀 코놀리, 생굴+와인 로맨틱', cons:'2인 $160~180 예산 초과'},
        {name:'Light Years Asian Diner', cuisine:'아시안 퓨전', price:'$50~70', scores:[65.5,71.5,58], avg:65.0, label:'가능', controversy:false, day:'Day 1', meal:'저녁', pros:'타운 중심, 17시 이후 영업', cons:'가격 대비 경험 가치 의문'},
        {name:'Kura Byron Bay', cuisine:'이자카야', price:'$25~45', scores:[66.5,66.5,62], avg:65.0, label:'가능', controversy:false, day:'Day 1', meal:'저녁', pros:'Bay Lane 중심가, 합리적 가격', cons:'한국에서도 가능한 야키토리·라멘'},
        {name:'Beach Byron Bay', cuisine:'시푸드 파인다이닝', price:'$80~120', scores:[54.5,81.5,55.5], avg:63.8, label:'가능', controversy:true, day:'Day 1', meal:'저녁', pros:'바이런 최고 선셋 뷰, 시즈널 해산물', cons:'$80~120, 20:30 도착 시 선셋 불가'},
        {name:'The Beach Hotel', cuisine:'펍 미식', price:'$25~45', scores:[71,56.5,56], avg:61.2, label:'가능', controversy:true, day:'Day 1', meal:'저녁', pros:'Main Beach 바로 앞, 예약 불필요', cons:'음식 평균적'},
        {name:'Moonlight Hibachi Grill', cuisine:'모던 일식', price:'$50~70', scores:[60.5,68,51.5], avg:60.0, label:'가능', controversy:true, day:'Day 1', meal:'저녁', pros:'히바치 그릴 콘셉트 독특', cons:'데이터 부족'},
        {name:'Japonaise Kitchen', cuisine:'일식 캐주얼', price:'$15~30', scores:[68.5,52,58.5], avg:59.7, label:'가능', controversy:true, day:'Day 1', meal:'저녁', pros:'최고 가성비 $15~30', cons:'20:00 마감 리스크'},
        {name:'Fishheads', cuisine:'시푸드', price:'$30~50', scores:[61.5,58.5,47], avg:55.7, label:'비추', controversy:false, day:'Day 1', meal:'저녁', pros:'Main Beach 맞은편 위치', cons:'음식 일관성 문제'},
        {name:'Legend Pizza', cuisine:'테이크아웃 피자', price:'$20', scores:[69,43.5,54], avg:55.5, label:'비추', controversy:true, day:'Day 1', meal:'저녁', pros:'미디엄 $20, 늦은 밤 영업', cons:'테이크아웃 중심, 미식 경험 없음'},
        {name:'Bayleaf Cafe', cuisine:'호주 브런치', price:'$20~40', scores:[73.5,72.5,71], avg:72.3, label:'추천', controversy:false, day:'Day 2', meal:'브런치', pros:'07:00 오픈, 로컬 식재료, 바이런 브런치 문화 상징', cons:'없음'},
        {name:'Dip Cafe', cuisine:'프렌치 비스트로', price:'$20~40', scores:[71.5,74.5,64], avg:70.0, label:'차선', controversy:false, day:'Day 2', meal:'브런치', pros:'프렌치 감성, 에그 베네딕트 컬렉션', cons:'서비스 일관성 간헐적 불만'},
        {name:'Three Blue Ducks at The Farm', cuisine:'팜투테이블', price:'$40~70', scores:[60,83.5,63.5], avg:69.0, label:'차선', controversy:true, day:'Day 2', meal:'브런치', pros:'80에이커 농장 팜투테이블, 동물 농장 산책', cons:'1인 $40~70, 디너 금~일만'},
        {name:'Top Shop', cuisine:'아사이볼 카페', price:'$15~25', scores:[76.5,65,62.5], avg:68.0, label:'가능', controversy:false, day:'Day 2', meal:'브런치', pros:'최고 가성비, Clarkes Beach 바로 위', cons:'메뉴 간편식 위주'},
        {name:'Folk Byron Bay', cuisine:'비건 카페', price:'$20~40', scores:[57.5,69.5,62], avg:63.0, label:'가능', controversy:false, day:'Day 2', meal:'브런치', pros:'비건 전문, 최고 커피, 지속가능성', cons:'타운 외곽, 주차 어려움'},
        {name:'The Roadhouse Byron Bay', cuisine:'팜투테이블', price:'$20~40', scores:[50,64,45], avg:53.0, label:'비추', controversy:true, day:'Day 2', meal:'브런치', pros:'팜투테이블 콘셉트', cons:'Google 3.7, 가격 대비 양 부족'},
        {name:'In the Pink', cuisine:'이탈리안 젤라토', price:'$6~8', scores:[76.5,73,68], avg:72.5, label:'추천', controversy:false, day:'Day 2', meal:'카페', pros:'수제 젤라토, 밤 10시까지, 메인비치 도보 3분', cons:'없음'},
        {name:'Bella Rosa Gelateria', cuisine:'이탈리안 젤라토', price:'$6~8', scores:[76,70,67], avg:71.0, label:'차선', controversy:false, day:'Day 2', meal:'카페', pros:'25년 가족 운영, 정통 젤라또', cons:'없음'},
        {name:'Sunday Sustainable Bakery', cuisine:'아티잔 베이커리', price:'$10~15', scores:[76.5,68.5,65], avg:70.0, label:'추천', controversy:false, day:'Day 2', meal:'카페', pros:'06:00 오픈, 100% 유기농 베이커리', cons:'없음'},
        {name:'Stone & Wood Brewery', cuisine:'브루어리 펍', price:'$15~25', scores:[66,71,66], avg:67.7, label:'가능', controversy:false, day:'Day 2', meal:'카페', pros:'Pacific Ale 시그니처, 코리안 슈니첼', cons:'타운 외곽, 워크인만'},
        {name:'Espressohead Cafe', cuisine:'카페', price:'$15~25', scores:[63,51,50.5], avg:54.8, label:'비추', controversy:false, day:'Day 2', meal:'카페', pros:'06:30 오픈, 중심가', cons:'특색 부족, 데이터 부족'}
      ]
    },
    {
      id: 'coffs', name: '콥스하버', day: 'Day 2~3', date: '5/25~26',
      role: 'seafood', roleLabel: '어항 도시',
      center: [-30.2963, 153.1135],
      summary: 'Byron에서 3시간 이동 후 도착. 어부 조합 직영 시푸드와 카페 문화가 핵심. Sawtell 우회 시 +10분.',
      meals: [
        {type:'점심', label:'Day 2 점심', ctx:'~14:00 도착, 운전 후 가벼운 식사'},
        {type:'저녁', label:'Day 2 저녁', ctx:'Jetty Strip 또는 Sawtell'},
        {type:'아침', label:'Day 3 아침', ctx:'출발 전 카페 브런치'}
      ],
      budgetPick: {economy:'$45~67', balance:'$160~250', premium:'$300+'},
      restaurants: [
        {name:'Old John\'s', cuisine:'호주 카페', price:'$15~25', scores:[76.5,80.5,70], avg:75.7, label:'추천', controversy:false, day:'Day 3', meal:'아침', pros:'트러플 에그+사워도우, 호주 카페 문화 정수', cons:'없음'},
        {name:'Latitude 30', cuisine:'시푸드 파인다이닝', price:'$80~120', scores:[61.5,85.5,67.5], avg:71.5, label:'추천', controversy:true, day:'Day 2', meal:'저녁', pros:'마리나뷰 해산물, 여행 하이라이트 디너', cons:'1인 $80~120 비쌈'},
        {name:'Cafe Treeo (Sawtell)', cuisine:'호주 브런치', price:'$15~25', scores:[63.5,77,73.5], avg:71.3, label:'추천', controversy:false, day:'Day 2', meal:'점심', pros:'TA Sawtell #1, 무화과나무 알프레스코', cons:'동선 이탈 10분'},
        {name:'Fishermen\'s Co-operative', cuisine:'시푸드 테이크아웃', price:'$15~35', scores:[77,74.5,62], avg:71.2, label:'추천', controversy:true, day:'Day 2', meal:'점심', pros:'40명 어부 조합, 당일 어획 생선', cons:'Google 4.1 평점'},
        {name:'Donovan\'s Surf Club', cuisine:'호주 브런치', price:'$25~45', scores:[59.5,70.5,67.5], avg:65.8, label:'차선', controversy:false, day:'Day 3', meal:'아침', pros:'Park Beach 비치프런트, 버터스카치 팬케이크', cons:'예약 필수'},
        {name:'K\'Pane Artisan Bakery', cuisine:'아티잔 베이커리', price:'$8~15', scores:[75.5,61,58.5], avg:65.0, label:'차선', controversy:true, day:'Day 3', meal:'아침', pros:'최저 가격, 파인다이닝 셰프 운영', cons:'데이터 부족'},
        {name:'Stef & Co', cuisine:'이탈리안 복합', price:'$30~50', scores:[63.5,67.5,52], avg:61.0, label:'차선', controversy:true, day:'Day 2', meal:'저녁', pros:'워터프런트 복합 다이닝', cons:'신규 오픈 데이터 부족'},
        {name:'Twenty46', cuisine:'스페셜티 커피', price:'$20~40', scores:[67.5,56,58.5], avg:60.7, label:'가능', controversy:false, day:'Day 3', meal:'아침', pros:'평일 06:00 오픈, 이른 출발 가능', cons:'데이터 부족'},
        {name:'Lime Mexican (Sawtell)', cuisine:'멕시칸', price:'$15~25', scores:[58.5,61.5,61.5], avg:60.5, label:'차선', controversy:false, day:'Day 2', meal:'저녁', pros:'Google 4.4, 글루텐프리·비건 옵션', cons:'Sawtell 이동, 호주 고유 아님'},
        {name:'Tahruah Thai & Vietnamese', cuisine:'태국·베트남', price:'$20~35', scores:[69,54.5,54], avg:59.2, label:'가능', controversy:true, day:'Day 2', meal:'저녁', pros:'32년 운영, 합리적 가격', cons:'어항 도시에서 아시안 경험 가치 의문'},
        {name:'Sea Salt Jetty', cuisine:'피시앤칩스', price:'$12~25', scores:[75,47.5,55.5], avg:59.3, label:'가능', controversy:true, day:'Day 2', meal:'점심', pros:'Jetty Village 내 최저 가격', cons:'분위기 부재'},
        {name:'Jetty Beach House', cuisine:'모던 오스트레일리안', price:'$20~40', scores:[64,57.5,51], avg:57.5, label:'가능', controversy:false, day:'Day 2', meal:'저녁', pros:'Jetty Beach 앞, 라이브 음악', cons:'개인적이지 않은 분위기'},
        {name:'Supply Specialty Coffee', cuisine:'스페셜티 커피', price:'$15~30', scores:[60.5,63,44], avg:55.8, label:'가능', controversy:true, day:'Day 3', meal:'아침', pros:'자체 로스팅 싱글 오리진', cons:'평점·리뷰 미확인'},
        {name:'Fiasco Ristorante', cuisine:'이탈리안', price:'$20~45', scores:[59,59.5,43.5], avg:54.0, label:'가능', controversy:true, day:'Day 2', meal:'저녁', pros:'이탈리안 와인 셀렉션', cons:'월요일 휴무, 가성비 3.5/5'},
        {name:'The Pier Hotel', cuisine:'펍 비스트로', price:'$20~35', scores:[63,44.5,46], avg:51.2, label:'비추', controversy:true, day:'Day 2', meal:'저녁', pros:'Jetty Strip 내, 자체 주차장', cons:'식사 리뷰 부족, 펍 클래식만'}
      ]
    },
    {
      id: 'port', name: '포트맥쿼리', day: 'Day 3~4', date: '5/26~27',
      role: 'coastal', roleLabel: '해안 도시',
      center: [-31.4333, 152.9000],
      summary: 'Tacking Point 일몰 후 저녁 식사. BYO 가능 식당 다수. 다음날 250km 넬슨베이로 이동.',
      meals: [
        {type:'저녁', label:'Day 3 저녁', ctx:'일몰 후 시푸드 디너'},
        {type:'아침', label:'Day 4 아침', ctx:'출발 전 카페'}
      ],
      budgetPick: {economy:'$60~100', balance:'$100~170', premium:'$200+'},
      restaurants: [
        {name:'The Stunned Mullet', cuisine:'파인다이닝 시푸드', price:'$110~160', scores:[69,90,80], avg:79.7, label:'추천', controversy:true, day:'Day 3', meal:'저녁', pros:'Chef\'s Hat, 포트맥 미식 정점', cons:'1인 $110~160, A\'\'\' 가성비 낮게 평가'},
        {name:'Ichi', cuisine:'일식 퓨전', price:'$40~60', scores:[76,77,71.5], avg:74.8, label:'추천', controversy:false, day:'Day 3', meal:'저녁', pros:'모던 이자카야, 지역 해산물 퓨전', cons:'일식이므로 호주 고유 아님'},
        {name:'Bills Fishhouse + Bar', cuisine:'시푸드 BYO', price:'$30~50', scores:[77.5,71,69], avg:72.5, label:'차선', controversy:false, day:'Day 3', meal:'저녁', pros:'BYO 가능! 신선 시푸드, 가성비 우수', cons:'없음'},
        {name:'Salty Crew Kiosk', cuisine:'비치 테이크아웃', price:'$10~20', scores:[67.5,62,45], avg:58.2, label:'가능', controversy:true, day:'Day 4', meal:'아침', pros:'비치 바로 앞, 상쾌한 아침', cons:'테이크아웃 위주, TA 3.9'},
        {name:'Whalebone Wharf', cuisine:'시푸드 워터프런트', price:'$50~80', scores:[62.5,74.5,68.5], avg:68.5, label:'차선', controversy:false, day:'Day 3', meal:'저녁', pros:'워터프런트 뷰, 프리미엄 시푸드', cons:'가격대 높음'},
        {name:'Blue Whale Asian Eatery', cuisine:'아시안 퓨전', price:'$18~30', scores:[62,38.5,42], avg:47.5, label:'비추', controversy:true, day:'Day 3', meal:'저녁', pros:'다양한 아시안 퓨전', cons:'퓨전 아시안, 전문성 부재'},
        {name:'Seasalt Cafe', cuisine:'카페 브런치', price:'$15~25', scores:[71.5,71.5,62.5], avg:68.5, label:'추천', controversy:false, day:'Day 4', meal:'아침', pros:'마리나뷰, 06:00 오픈, 안정적 품질', cons:'없음'},
        {name:'Enzo Woodfired', cuisine:'이탈리안 피자', price:'$20~35', scores:[65.5,61,64], avg:63.5, label:'가능', controversy:false, day:'Day 3', meal:'저녁', pros:'우드파이어 피자', cons:'없음'},
        {name:'Mike\'s Seafood', cuisine:'시푸드 테이크아웨이', price:'$15~25', scores:[73.5,52.5,60], avg:62.0, label:'가능', controversy:true, day:'Day 3', meal:'저녁', pros:'피쉬앤칩스 최고 가성비', cons:'A\'\'\' 높고 B\'\'\' 낮음'},
        {name:'Social Grounds Coffee', cuisine:'프리미엄 카페', price:'$15~25', scores:[67.5,78,71], avg:72.2, label:'추천', controversy:false, day:'Day 4', meal:'아침', pros:'포트맥쿼리 최고 커피, 독창적 메뉴', cons:'서비스 느릴 수 있어 여유 필요'},
        {name:'Barcino Bread', cuisine:'아티잔 베이커리', price:'$8~15', scores:[63.5,63,58.5], avg:61.7, label:'가능', controversy:false, day:'Day 4', meal:'아침', pros:'아티잔 빵, 합리적 가격', cons:'없음'},
        {name:'Chop \'n Chill', cuisine:'그릴 캐주얼', price:'$20~35', scores:[67,50,62.5], avg:59.8, label:'가능', controversy:true, day:'Day 3', meal:'저녁', pros:'캐주얼 그릴', cons:'B\'\'\' 감성 부족'},
        {name:'Blackfish Coffee', cuisine:'카페', price:'$12~20', scores:[70.5,63.5,60.5], avg:64.8, label:'차선', controversy:false, day:'Day 4', meal:'아침', pros:'가성비 좋고 6시 오픈, 빠른 서비스', cons:'없음'},
        {name:'Rocksalt at the Marina', cuisine:'시푸드', price:'$25~50', scores:[0,0,0], avg:0, label:'비추', controversy:false, day:'Day 3', meal:'저녁', pros:'마리나 위치', cons:'목~일만 영업, Day 3 이용 불가', note:'화요일 휴무로 채점 제외'},
        {name:'The Grill', cuisine:'스테이크', price:'$40~70', scores:[58.5,54.5,38], avg:50.3, label:'비추', controversy:true, day:'Day 3', meal:'저녁', pros:'스테이크 전문', cons:'낮은 평점'},
        {name:'Zebu Bar & Restaurant', cuisine:'그릴 스테이크', price:'$40~70', scores:[54.5,53.5,37.5], avg:48.5, label:'비추', controversy:true, day:'Day 3', meal:'저녁', pros:'그릴 메뉴', cons:'전반적 평점 낮음'},
        {name:'Mekong Thai Lao', cuisine:'태국·라오스', price:'$20~35', scores:[66.5,49,43.5], avg:53.0, label:'비추', controversy:true, day:'Day 3', meal:'저녁', pros:'태국 음식', cons:'데이터 부족, 호주 고유 경험 아님'}
      ]
    },
    {
      id: 'nelson', name: '넬슨베이', day: 'Day 4~5', date: '5/27~28',
      role: 'nature', roleLabel: '자연 체험',
      center: [-32.7230, 152.1441],
      summary: '포트스티븐스 생태 체험 기지. 돌고래 크루즈, 모래언덕 체험 후 해산물 디너. Holbert\'s 굴팜 체험 추천.',
      meals: [
        {type:'점심', label:'Day 4 점심', ctx:'13:00~14:00 도착 후 해산물'},
        {type:'저녁', label:'Day 4 저녁', ctx:'돌고래 크루즈 후 디너'},
        {type:'아침', label:'Day 5 아침', ctx:'블루마운틴 이동 전'}
      ],
      budgetPick: {economy:'$80~130', balance:'$160~250', premium:'$300+'},
      restaurants: [
        {name:'Sandpipers Restaurant', cuisine:'모던 오스트레일리안', price:'$40~60', scores:[76,79,79], avg:78.0, label:'추천', controversy:false, day:'Day 4', meal:'저녁', pros:'3명 완벽 합의(편차 3.0), 최고 디너', cons:'없음'},
        {name:'The Little Nel Cafe', cuisine:'카페 브런치', price:'$15~25', scores:[79.5,78,76], avg:77.8, label:'추천', controversy:false, day:'Day 5', meal:'아침', pros:'이탈리안 봄볼리니, 3,308 리뷰', cons:'없음'},
        {name:'Holbert\'s Oyster Farm', cuisine:'굴팜 체험', price:'$20~40', scores:[74,79,67], avg:73.3, label:'추천', controversy:false, day:'Day 4', meal:'점심', pros:'호주 고유 체험, 당일 채취 생굴', cons:'예약 필요'},
        {name:'Sirena Seaside', cuisine:'이탈리안 시푸드', price:'$50~80', scores:[66,84.5,66], avg:72.2, label:'차선', controversy:true, day:'Day 4', meal:'저녁', pros:'마리나뷰, 이탈리안 시푸드', cons:'B\'\'\' 높고 나머지 보통'},
        {name:'Saltwater Fingal Bay', cuisine:'모던 시푸드', price:'$35~55', scores:[64.5,78,69], avg:70.5, label:'차선', controversy:false, day:'Day 4', meal:'점심', pros:'Fingal Bay 뷰', cons:'15분 우회 필요'},
        {name:'Fishermen\'s Wharf Seafoods', cuisine:'시푸드 테이크아웨이', price:'$15~30', scores:[73.5,74,62.5], avg:70.0, label:'추천', controversy:false, day:'Day 4', meal:'점심', pros:'생굴 직송, 합리적 가격', cons:'없음'},
        {name:'Nice Cafe', cuisine:'카페 브런치', price:'$15~25', scores:[68.5,72,68.5], avg:69.7, label:'차선', controversy:false, day:'Day 5', meal:'아침', pros:'좋은 커피, 편안한 분위기', cons:'없음'},
        {name:'Little Beach Boathouse', cuisine:'파인다이닝 시푸드', price:'$70~120', scores:[55,82,62.5], avg:66.5, label:'가능', controversy:true, day:'Day 4', meal:'저녁', pros:'수변 뷰 파인다이닝', cons:'폭탄 가격'},
        {name:'Bay Harbour Cafe', cuisine:'피쉬앤칩스 카페', price:'$15~35', scores:[74,60.5,59], avg:64.5, label:'차선', controversy:true, day:'Day 4', meal:'점심', pros:'가성비 F&C', cons:'A\'\'\' vs B\'\'\' 격차'},
        {name:'The Nelson Way', cuisine:'네팔 퓨전', price:'$30~50', scores:[65,62,53], avg:60.0, label:'가능', controversy:false, day:'Day 4', meal:'저녁', pros:'네팔 퓨전 독특', cons:'호주 고유 아님'},
        {name:'Crest Birubi Beach', cuisine:'비치 카페', price:'$15~25', scores:[70,58.5,47], avg:58.5, label:'가능', controversy:true, day:'Day 4', meal:'점심', pros:'비치 위치', cons:'식사 품질 불안정'},
        {name:'Little Mavs', cuisine:'해산물 캐주얼', price:'$15~30', scores:[64.5,55.5,44], avg:54.7, label:'가능', controversy:true, day:'Day 4', meal:'점심', pros:'캐주얼 해산물', cons:'낮은 C\'\'\' 평가'},
        {name:'Inner Light Tea Rooms', cuisine:'카페', price:'$20~30', scores:[45.5,68,48.5], avg:54.0, label:'가능', controversy:true, day:'Day 5', meal:'아침', pros:'등대 뷰 독특', cons:'B\'\'\' 빼고 낮은 평가'},
        {name:'Bub\'s Famous Fish & Chips', cuisine:'피쉬앤칩스', price:'$20~40', scores:[57.5,49,42], avg:49.5, label:'비추', controversy:true, day:'Day 4', meal:'점심', pros:'피쉬앤칩스 전문', cons:'과대포장, 가격 대비 불만'},
        {name:'Mavericks on the Bay', cuisine:'시푸드 캐주얼', price:'$40~70', scores:[51,53,36], avg:46.7, label:'비추', controversy:true, day:'Day 4', meal:'저녁', pros:'마리나 위치', cons:'서비스·품질 불만 다수'}
      ]
    },
    {
      id: 'bluemtn', name: '블루마운틴', day: 'Day 5~6', date: '5/28~29',
      role: 'mountain', roleLabel: '산악 감성',
      center: [-33.7150, 150.3120],
      summary: '5월 겨울 산악 감성. 벽난로 레스토랑, 초콜릿 카페, 크래프트 브루어리. Echo Point 일몰 + 디너가 클라이맥스.',
      meals: [
        {type:'점심', label:'Day 5 점심', ctx:'13:30 도착 후 첫 식사'},
        {type:'카페', label:'Day 5 카페·특별', ctx:'초콜릿 카페, 브루어리, 하이티'},
        {type:'저녁', label:'Day 5 저녁', ctx:'여행 클라이맥스 디너'},
        {type:'아침', label:'Day 6 아침', ctx:'Grand Canyon Track 전 또는 후'},
        {type:'점심2', label:'Day 6 점심', ctx:'하산 후 점심 (하이티 등)'}
      ],
      budgetPick: {economy:'$60~100', balance:'$140~210', premium:'$300+'},
      restaurants: [
        {name:'Josophan\'s Fine Chocolates', cuisine:'초콜릿 부티크', price:'$15~40', scores:[70.5,81,78.5], avg:76.7, label:'추천', controversy:false, day:'Day 5', meal:'카페', pros:'벨기에·프랑스 쿠버춰 핸드메이드 트러플', cons:'루라 경유 시에만 동선 부합'},
        {name:'Hominy Bakery', cuisine:'프렌치 아르티잔 베이커리', price:'$5~12', scores:[79,69.5,74.5], avg:74.3, label:'추천', controversy:false, day:'Day 6', meal:'아침', pros:'18년 사워도우, 전설적 포테이토 사워도우', cons:'없음'},
        {name:'Yellow Deli', cuisine:'델리 카페', price:'$20', scores:[76.5,75.5,73], avg:75.0, label:'추천', controversy:false, day:'Day 5', meal:'점심', pros:'거대 석조 벽난로, 수프+사워도우, 호빗의 집', cons:'없음'},
        {name:'Echoes Restaurant', cuisine:'절벽뷰 파인다이닝', price:'$95', scores:[66.5,83,67.5], avg:72.3, label:'추천', controversy:true, day:'Day 5', meal:'저녁', pros:'절벽 파노라마 코스 디너, 일몰 뷰', cons:'예산 초과'},
        {name:'Ateş (Blackheath)', cuisine:'터키 로스트', price:'$50', scores:[68.5,79,82.5], avg:76.7, label:'추천', controversy:false, day:'Day 5', meal:'저녁', pros:'150년 오븐 로스트 덕, Google 4.8', cons:'목요일 영업 확인 필수'},
        {name:'Mountain Culture Beer Co', cuisine:'크래프트 브루어리', price:'$20~35', scores:[72,71,73], avg:72.0, label:'추천', controversy:false, day:'Day 5', meal:'카페', pros:'호주 1위 브루어리, 1900년대 헤리티지 건물', cons:'없음'},
        {name:'Avalon', cuisine:'레스토랑 바', price:'$50', scores:[74.5,67,67], avg:69.5, label:'추천', controversy:false, day:'Day 5', meal:'저녁', pros:'아트데코+벽난로+100종 와인', cons:'없음'},
        {name:'Hounslow', cuisine:'카페 비스트로', price:'$15~30', scores:[68,65,65.5], avg:66.2, label:'차선', controversy:false, day:'Day 6', meal:'아침', pros:'아이언바크 훈제 베이컨 에그롤, 07:00 오픈', cons:'아침으로 약간 비쌈'},
        {name:'Hydro Majestic Wintergarden', cuisine:'프리미엄 하이 티', price:'$79', scores:[52,75.5,63.5], avg:63.7, label:'차선', controversy:true, day:'Day 6', meal:'점심2', pros:'에드워디안 유리 온실, 밸리 뷰, 1904년 호텔', cons:'가격, 동선 이탈'},
        {name:'Blue Mountains Chocolate Co', cuisine:'초콜릿 카페', price:'$8~15', scores:[69,63.5,55], avg:62.5, label:'가능', controversy:false, day:'Day 5', meal:'카페', pros:'DIY 핫초코 체험, 겨울 벽난로', cons:'시설 노후화'},
        {name:'8Things', cuisine:'세계 스트리트 푸드', price:'$16~22', scores:[68,55,62], avg:61.7, label:'가능', controversy:false, day:'Day 5', meal:'카페', pros:'BYO 가능, 8개국 스트리트 푸드', cons:'호주 고유 아님'},
        {name:'Conservation Hut Cafe', cuisine:'국립공원 카페', price:'$18~30', scores:[58,63,60], avg:60.3, label:'가능', controversy:false, day:'Day 5', meal:'카페', pros:'국립공원 내 자연 뷰', cons:'Wentworth Falls 경유 시에만'},
        {name:'Bygone Beautys', cuisine:'티팟 박물관 하이 티', price:'$20~80', scores:[48,68,57], avg:57.7, label:'가능', controversy:false, day:'Day 5', meal:'카페', pros:'11,000개 티팟 박물관, 은제 서비스', cons:'동선 이탈, 가격'},
        {name:'Old City Bank', cuisine:'호주 주식', price:'$40~60', scores:[68.5,47.5,55.5], avg:57.2, label:'비추', controversy:true, day:'Day 5', meal:'저녁', pros:'가성비 디너', cons:'감성 부족'},
        {name:'Blackheath Bakery', cuisine:'베이커리 파이', price:'$5~12', scores:[71.5,47,49.5], avg:56.0, label:'차선', controversy:true, day:'Day 6', meal:'아침', pros:'06:30 오픈, Grand Canyon Track 동선', cons:'동네 빵집, 미식 가치 낮음'},
        {name:'Boss Noodles', cuisine:'태국 누들', price:'$18~25', scores:[63,45,52], avg:53.3, label:'가능', controversy:false, day:'Day 5', meal:'저녁', pros:'저렴, 추위에 따뜻한 락사', cons:'호주 고유 아님'},
        {name:'슈퍼마켓 (전날 구매)', cuisine:'편의점 식품', price:'$8', scores:[65,35,55], avg:51.7, label:'가능', controversy:false, day:'Day 6', meal:'아침', pros:'최저 가격, 시간 절약', cons:'미식 가치 0'},
        {name:'Station Bar', cuisine:'캐주얼 이탈리안', price:'$35~50', scores:[63.5,43,47], avg:51.2, label:'비추', controversy:true, day:'Day 5', meal:'저녁', pros:'캐주얼 분위기', cons:'프리미엄 디너에 피자?'},
        {name:'The Lookout', cuisine:'카페', price:'$20~40', scores:[59.5,48.5,44], avg:50.7, label:'가능', controversy:true, day:'Day 5', meal:'카페', pros:'Echo Point 정상 위치', cons:'음식 미달'},
        /* 평가파일 기반 실제 CRITIC 채점 식당 */
        {name:'Miss Lilian', cuisine:'티하우스 카페', price:'$25~40', scores:[66,56,59.5], avg:60.5, label:'차선', controversy:false, day:'Day 5', meal:'점심', pros:'Echo Point 도보 5분, 포·딤섬', cons:'호주 고유 경험 아님'},
        {name:'Boiler House (Hydro Majestic)', cuisine:'모던 호주', price:'$40~60', scores:[62.5,71,69], avg:67.5, label:'차선', controversy:false, day:'Day 5', meal:'저녁', pros:'구 보일러실 리모델링, 메갈롱 밸리 파노라마', cons:'카툼바 10분 이동, 금~일 2코스 미니멈'},
        {name:'Palette Dining', cuisine:'컨템포러리', price:'$60~70', scores:[62,73.5,63], avg:66.2, label:'차선', controversy:false, day:'Day 5', meal:'저녁', pros:'우드파이어 오픈 키친, 로컬 식재료, 인티밋', cons:'예산 초과 A$60~70'},
        {name:'Pins on Lurline', cuisine:'모던 파인다이닝', price:'$80+', scores:[59.5,69.5,64.5], avg:64.5, label:'가능', controversy:false, day:'Day 5', meal:'저녁', pros:'높은 음식 퀄리티, 파인다이닝', cons:'벽난로/뷰 없음, 재오픈 품질 변동'},
        {name:'Embers Grill (Fairmont)', cuisine:'프리미엄 스테이크', price:'$50~80', scores:[61.5,66,52.5], avg:60.0, label:'가능', controversy:false, day:'Day 5', meal:'저녁', pros:'벽난로+밸리뷰 동시 보유, 프리미엄 스테이크', cons:'리뷰 데이터 부족, 리조트 레스토랑'},
        {name:'Bowery Kitchen & Bar', cuisine:'모던 호주 쉐어', price:'$30~50', scores:[64,58.5,56], avg:59.5, label:'가능', controversy:false, day:'Day 5', meal:'저녁', pros:'교회 개조 유니크 공간, 예산 내', cons:'음식 편차, 벽난로/뷰 없음'},
        {name:'Leura Gourmet Café', cuisine:'카페/델리', price:'$15~25', scores:[55.5,52,49], avg:52.2, label:'가능', controversy:false, day:'Day 5', meal:'점심', pros:'루라 마을 중심, 합리적 가격', cons:'데이터 부족, Yellow Deli 대비 열세'}
      ]
    },
    {
      id: 'sydney', name: '시드니', day: 'Day 6~7', date: '5/29~30',
      role: 'city', roleLabel: '대도시 피날레',
      center: [-33.8568, 151.2153],
      summary: 'Vivid Sydney 축제 첫 주말! 차량 없음(대중교통). Day 6 Vivid 뷰 디너, Day 7 Bondi~The Rocks 도보 미식 투어.',
      meals: [
        {type:'저녁', label:'Day 6 저녁', ctx:'17:00 도착, Vivid Sydney 라이트뷰'},
        {type:'아침', label:'Day 7 아침', ctx:'The Rocks~Circular Quay'},
        {type:'점심', label:'Day 7 점심', ctx:'Bondi~Bronte 코스탈워크'},
        {type:'간식', label:'Day 7 간식·체험', ctx:'마켓, 젤라토, 피시마켓'},
        {type:'저녁2', label:'Day 7 저녁', ctx:'여행 Grand Finale 디너'}
      ],
      budgetPick: {economy:'$100~150', balance:'$200~350', premium:'$500+'},
      restaurants: [
        {name:'Gelato Messina', cuisine:'호주 최고 젤라토', price:'$6~9', scores:[88.5,82.5,84], avg:85.0, label:'추천', controversy:false, day:'Day 7', meal:'간식', pros:'호주 최고, 40가지 맛+주간 스페셜, 2002년 전설', cons:'없음'},
        {name:'The Rocks Saturday Market', cuisine:'스트리트 푸드 마켓', price:'$8~20', scores:[84.5,78,71], avg:77.8, label:'추천', controversy:false, day:'Day 7', meal:'간식', pros:'하버브릿지 아래 라이브 음악, 스트리트 푸드+공예품', cons:'개별 스톨 편차'},
        {name:'Bennelong', cuisine:'파인다이닝 (오페라하우스 내)', price:'$225', scores:[66,90.5,68.5], avg:75.0, label:'추천', controversy:true, day:'Day 7', meal:'저녁2', pros:'오페라하우스 돛 내부 식사! Peter Gilmore, 파블로바', cons:'$225, 2주+ 사전 예약 필수'},
        {name:'Aria Restaurant', cuisine:'파인다이닝', price:'$90~220', scores:[71.5,83,69.5], avg:74.7, label:'추천', controversy:false, day:'Day 7', meal:'저녁2', pros:'Matt Moran, 와규 시를로인, 프리씨어터 $90 코스', cons:'Bennelong 대비 약간 약함'},
        {name:'Bills Bondi', cuisine:'호주 브런치 아이콘', price:'$25~45', scores:[71,80.5,68], avg:73.2, label:'추천', controversy:false, day:'Day 7', meal:'점심', pros:'리코타 핫케이크, 호주 브런치 문화 상징', cons:'토요일 대기 시간'},
        {name:'The Fine Food Store', cuisine:'호주 카페', price:'$15~25', scores:[77,71.5,67], avg:71.8, label:'추천', controversy:false, day:'Day 7', meal:'아침', pros:'The Rocks 10년+ 로컬, 스페셜티 커피+페이스트리', cons:'없음'},
        {name:'Bourke Street Bakery', cuisine:'파이 베이커리', price:'$8~12', scores:[74,69.5,66.5], avg:70.0, label:'추천', controversy:false, day:'Day 7', meal:'아침', pros:'2004년 전설, 비프 브리스킷 파이, 사워도우', cons:'없음'},
        {name:'Harry\'s Cafe de Wheels', cuisine:'호주 미트 파이', price:'$7~12', scores:[72,68,67.5], avg:69.2, label:'추천', controversy:false, day:'Day 7', meal:'간식', pros:'1945년 80년 역사, NSW National Trust 등재, Tiger Pie', cons:'맛은 "괜찮은" 수준'},
        {name:'시드니 피시마켓', cuisine:'시푸드 마켓', price:'다양', scores:[69.5,78,60.5], avg:69.3, label:'추천', controversy:true, day:'Day 7', meal:'간식', pros:'2026.1 신축, 남반구 최대, 3XN 건축물', cons:'오픈 4개월, 리뷰 축적 중'},
        {name:'Vivid Fire Kitchen', cuisine:'오픈파이어 팝업', price:'$10~35', scores:[67.5,74.5,50], avg:64.0, label:'추천', controversy:true, day:'Day 6', meal:'저녁', pros:'입장 무료, 호주 유명 셰프 오픈파이어', cons:'팝업 이벤트, 데이터 없음'},
        {name:'Captain Cook Vivid 크루즈', cuisine:'디너 크루즈', price:'$85~165', scores:[57.5,73.5,58], avg:63.0, label:'추천', controversy:true, day:'Day 6', meal:'저녁', pros:'움직이는 Vivid 뷰, 유니크한 경험', cons:'음식 퀄리티 보통, 시간 구속'},
        {name:'Doyles on the Beach', cuisine:'시푸드 아이콘', price:'$50~80', scores:[58,80.5,60], avg:66.2, label:'추천', controversy:true, day:'Day 7', meal:'점심', pros:'140년 시드니 아이콘, 해변 하버 뷰', cons:'페리 30분, 동선 이탈, 가격'},
        {name:'Cafe Sydney', cuisine:'컨템포러리 호주식', price:'$70~120', scores:[66.5,71.5,66], avg:68.0, label:'가능', controversy:false, day:'Day 7', meal:'저녁2', pros:'Customs House 5층, 루프탑 하버 뷰, 25년 운영', cons:'Bennelong/Aria 대안'},
        {name:'6HEAD Steakhouse', cuisine:'프리미엄 와규', price:'$200+', scores:[62,79,61.5], avg:67.5, label:'차선', controversy:true, day:'Day 6', meal:'저녁', pros:'드라이에이지 와규, Vivid 뷰', cons:'가격 극히 높음'},
        {name:'KOI Dessert Bar', cuisine:'예술 디저트', price:'$60~130', scores:[54,83.5,65], avg:67.5, label:'차선', controversy:true, day:'Day 7', meal:'간식', pros:'MasterChef Reynold, 무스 돔·미러 글레이즈', cons:'가격, 양 적음, 예약 2주+'},
        {name:'Soul Dining', cuisine:'컨템포러리 한식', price:'$55~110', scores:[63,71.5,65], avg:66.5, label:'가능', controversy:false, day:'Day 7', meal:'저녁2', pros:'Chef\'s Hat 유일 한식, 토스피쉬 떡볶이', cons:'마지막 밤에 호주적 경험 부족'},
        {name:'Opera Bar', cuisine:'와인 바 캐주얼', price:'$40~70', scores:[67.5,73.5,57.5], avg:66.2, label:'차선', controversy:true, day:'Day 6', meal:'저녁', pros:'오페라하우스+Vivid 뷰, 예약 불필요', cons:'Google 4.1, 서비스 느림·혼잡'},
        {name:'The Garden at The Collective', cuisine:'하버사이드 브런치', price:'$20~35', scores:[71,69,58], avg:66.0, label:'차선', controversy:false, day:'Day 7', meal:'아침', pros:'7am 오픈, 하버사이드 시즌 식재료', cons:'리뷰 부족'},
        {name:'Bogey Hole Cafe (Bronte)', cuisine:'호주 카페', price:'$15~25', scores:[72.5,66.5,59], avg:66.0, label:'가능', controversy:false, day:'Day 7', meal:'점심', pros:'코스탈워크 Bronte 종착점, 30년 역사', cons:'리뷰 제한적'},
        {name:'Speedos Cafe', cuisine:'호주 카페', price:'$20~35', scores:[66,70,61], avg:65.7, label:'가능', controversy:false, day:'Day 7', meal:'점심', pros:'Bondi 도보 5분, 인스타 감성', cons:'맛의 깊이 제한적'},
        {name:'Spice Alley', cuisine:'아시안 호커 골목', price:'$10~18', scores:[66,65.5,64.5], avg:65.3, label:'차선', controversy:false, day:'Day 7', meal:'저녁2', pros:'최고 가성비, Central역 도보 7분', cons:'호주적 경험 아님'},
        {name:'Icebergs Dining Room', cuisine:'파인다이닝', price:'$130~155', scores:[58.5,82.5,54], avg:65.0, label:'차선', controversy:true, day:'Day 7', meal:'점심', pros:'Bondi 절벽 아이코닉 뷰, World\'s 50 Best', cons:'점심 가격 과도, TA 3.9'},
        {name:'Harbourfront Seafood', cuisine:'시푸드', price:'$80~150', scores:[61,75,59], avg:65.0, label:'가능', controversy:true, day:'Day 6', meal:'저녁', pros:'1839년 헤리티지, 오페라하우스 뷰, 프리미엄 시푸드', cons:'포션 작음, 가격 대비 의문'},
        {name:'Pellegrino 2000', cuisine:'이탈리안', price:'$89~120', scores:[57.5,75.5,60], avg:64.3, label:'차선', controversy:true, day:'Day 7', meal:'저녁2', pros:'시드니 최고 파스타, 프라운 라비올리', cons:'Surry Hills 동선 이탈'},
        {name:'Whalebridge', cuisine:'프렌치 비스트로', price:'$60~100', scores:[68.5,69,54.5], avg:64.0, label:'가능', controversy:false, day:'Day 6', meal:'저녁', pros:'도보 2분, 시드니 록 오이스터', cons:'리뷰 부족, 검증 중'},
        {name:'Midden by Mark Olive', cuisine:'퍼스트 네이션스 요리', price:'$60~100', scores:[63.5,81.5,46], avg:63.7, label:'차선', controversy:true, day:'Day 7', meal:'저녁2', pros:'호주 원주민 부시터커, 다른 나라 절대 불가', cons:'리뷰 0, 품질 미검증'},
        {name:'Barangaroo House (Smoke)', cuisine:'루프탑 칵테일', price:'$22~45', scores:[58.5,74,54.5], avg:62.3, label:'가능', controversy:true, day:'Day 6', meal:'저녁', pros:'루프탑 Vivid 뷰, 칵테일', cons:'바 중심, 칵테일 가격 높음'},
        {name:'Gumshara Ramen', cuisine:'일본 라멘', price:'$12~28', scores:[71,53,62], avg:62.0, label:'가능', controversy:true, day:'Day 7', meal:'저녁2', pros:'시드니 라멘 #1, 5월 추위에 따뜻', cons:'푸드코트, 커플 데이트 부적합'},
        {name:'Pancakes On The Rocks', cuisine:'팬케이크', price:'$15~25', scores:[69.5,45,61], avg:58.5, label:'가능', controversy:true, day:'Day 7', meal:'아침', pros:'24시간 영업, 도보 5분', cons:'관광지 체인, 독창성 없음'}
      ]
    }
  ];

  var SCENARIOS = [
    {key:'economy', label:'절약형', total:'~$810', krw:'~83만원', desc:'카페/F&C 중심, BBQ 활용, 파인다이닝 생략'},
    {key:'balance', label:'밸런스', total:'$1,110~1,712', krw:'~114~176만원', desc:'하루 1끼 기억에 남는 식사 + 나머지 효율'},
    {key:'premium', label:'투자형', total:'~$2,720', krw:'~280만원', desc:'파인다이닝 복수 포함, 최고 경험 추구'}
  ];

  /* 시나리오별 추천 식당 (거점별) */
  var BUDGET_PICKS = {
    byron: {
      economy: ['Hunky Dory Fish & Chips','Top Shop','Sunday Sustainable Bakery'],
      balance: ['The Smoking Camel','Bayleaf Cafe','In the Pink'],
      premium: ['Raes Dining Room','Three Blue Ducks at The Farm','Bayleaf Cafe']
    },
    coffs: {
      economy: ['Fishermen\'s Co-operative','K\'Pane Artisan Bakery','Sea Salt Jetty'],
      balance: ['Fishermen\'s Co-operative','Latitude 30','Old John\'s'],
      premium: ['Latitude 30','Cafe Treeo (Sawtell)','Old John\'s']
    },
    port: {
      economy: ['Bills Fishhouse + Bar','Barcino Bread','Mike\'s Seafood'],
      balance: ['Bills Fishhouse + Bar','Ichi','Salty Crew Kiosk'],
      premium: ['The Stunned Mullet','Ichi','Seasalt Cafe']
    },
    nelson: {
      economy: ['Fishermen\'s Wharf Seafoods','The Little Nel Cafe','Bay Harbour Cafe'],
      balance: ['Sandpipers Restaurant','The Little Nel Cafe','Holbert\'s Oyster Farm'],
      premium: ['Sandpipers Restaurant','Sirena Seaside','Holbert\'s Oyster Farm']
    },
    bluemtn: {
      economy: ['Yellow Deli','Hominy Bakery','Mountain Culture Beer Co'],
      balance: ['Ateş (Blackheath)','Yellow Deli','Josophan\'s Fine Chocolates'],
      premium: ['Echoes Restaurant','Ateş (Blackheath)','Josophan\'s Fine Chocolates']
    },
    sydney: {
      economy: ['Bourke Street Bakery','Harry\'s Cafe de Wheels','Gelato Messina'],
      balance: ['Aria Restaurant','Bills Bondi','The Fine Food Store','Gelato Messina'],
      premium: ['Bennelong','Aria Restaurant','Bills Bondi','Gelato Messina']
    }
  };

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
  var activeStop = STOPS[0].id;
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
        applyBudgetHighlight();
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

    // 예산 바 숨김 (날짜 뷰에서는 거점 혼합)
    document.getElementById('budgetBar').style.display = 'none';

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

    // 날짜별 뷰에서는 예산 하이라이트 비적용 (거점 혼합이므로)
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
    var picks = BUDGET_PICKS[activeStop];
    if (!picks) return;
    var names = picks[activeScenario] || [];
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
  try {
    init();
    console.log('dining.js init OK, cards:', document.querySelectorAll('.dine-card').length);
  } catch(e) {
    console.error('dining.js init error:', e);
    document.getElementById('diningGrid').innerHTML = '<div style="color:red;padding:20px">JS 오류: ' + e.message + '</div>';
  }
})();
