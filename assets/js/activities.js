/**
 * 액티비티 후보 페이지
 * 5개 지역의 체험 활동을 카드 그리드로 표시하고, 마크다운 원문에서 상세 정보를 모달로 제공
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════
     CSS 주입
     ══════════════════════════════════════════ */
  var css = document.createElement('style');
  css.textContent = [
    /* ── 페이지 레이아웃 ── */
    '.activities-page { max-width: 1100px; margin: 0 auto; }',
    '.activities-subtitle { color: #586069; margin-bottom: 1.2em; }',

    /* ── 지역 탭 ── */
    '.region-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.2em; }',
    '.region-tab { padding: 8px 16px; border: 2px solid #d1d5da; border-radius: 20px; background: #fff; color: #24292e; font-size: 0.9em; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; }',
    '.region-tab:hover { border-color: #157878; color: #157878; }',
    '.region-tab.active { background: #157878; border-color: #157878; color: #fff; }',

    /* ── 지역 요약 ── */
    '.region-summary { background: #f6f8fa; border-radius: 8px; padding: 14px 18px; margin-bottom: 1.2em; font-size: 0.92em; line-height: 1.6; }',
    '.region-summary .stat-row { display: flex; flex-wrap: wrap; gap: 16px; }',
    '.region-summary .stat { display: inline-flex; align-items: center; gap: 4px; }',
    '.region-summary .stat-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }',

    /* ── 카드 그리드 ── */
    '.activity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 1.5em; }',
    '.sub-region-label { grid-column: 1 / -1; margin: 0.8em 0 0.2em; padding: 6px 0; border-bottom: 2px solid #157878; font-size: 1.05em; font-weight: 700; color: #157878; }',
    '.sub-region-label:first-child { margin-top: 0; }',

    /* ── 카드 ── */
    '.act-card { background: #fff; border: 1px solid #e1e4e8; border-radius: 10px; padding: 16px; cursor: pointer; transition: all .15s; position: relative; }',
    '.act-card:hover { border-color: #157878; box-shadow: 0 2px 12px rgba(21,120,120,.12); transform: translateY(-2px); }',
    '.act-card-icon { font-size: 1.8em; margin-bottom: 4px; line-height: 1; }',
    '.act-card-name { font-size: 1.05em; font-weight: 700; color: #24292e; margin-bottom: 8px; }',
    '.act-card-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 0.85em; color: #586069; margin-bottom: 8px; }',
    '.act-card-meta span { display: inline-flex; align-items: center; gap: 3px; }',
    '.act-card-note { font-size: 0.82em; color: #6a737d; line-height: 1.4; border-top: 1px solid #f0f0f0; padding-top: 8px; margin-top: 4px; }',
    '.may-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.82em; font-weight: 600; padding: 2px 8px; border-radius: 10px; }',
    '.may-optimal { background: #dcffe4; color: #22863a; }',
    '.may-good { background: #e1f0ff; color: #0366d6; }',
    '.may-limited { background: #fff8c5; color: #b08800; }',
    '.may-warning { background: #ffeef0; color: #d73a49; }',

    /* ── 모달 ── */
    '.act-modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.5); z-index: 1000; justify-content: center; align-items: flex-start; padding: 40px 16px; overflow-y: auto; }',
    '.act-modal-overlay.open { display: flex; }',
    '.act-modal-content { background: #fff; border-radius: 12px; max-width: 720px; width: 100%; max-height: calc(100vh - 80px); overflow-y: auto; padding: 28px 32px; position: relative; box-shadow: 0 8px 32px rgba(0,0,0,.2); }',
    '.act-modal-close { position: sticky; top: 0; float: right; background: #f6f8fa; border: none; font-size: 1.5em; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 1; color: #586069; }',
    '.act-modal-close:hover { background: #e1e4e8; }',
    '.act-modal-body { line-height: 1.7; }',
    '.act-modal-body h3 { color: #157878; margin-top: 1.2em; border-bottom: 1px solid #e1e4e8; padding-bottom: .3em; }',
    '.act-modal-body h4 { color: #24292e; margin-top: 1em; }',
    '.act-modal-body table { width: 100%; border-collapse: collapse; margin: .8em 0; font-size: .9em; }',
    '.act-modal-body td, .act-modal-body th { padding: 6px 10px; border: 1px solid #e1e4e8; text-align: left; }',
    '.act-modal-body tr:nth-child(even) { background: #f6f8fa; }',
    '.act-modal-body blockquote { border-left: 3px solid #157878; margin: .8em 0; padding: .4em .8em; color: #586069; background: #f6f8fa; }',
    '.act-modal-body ul { padding-left: 1.4em; }',
    '.act-modal-body li { margin: .3em 0; }',
    '.act-modal-body a { color: #0366d6; text-decoration: none; }',
    '.act-modal-body a:hover { text-decoration: underline; }',

    /* ── 전체 리서치 ── */
    '.full-research { margin-top: 2em; border: 1px solid #e1e4e8; border-radius: 8px; }',
    '.full-research summary { padding: 12px 16px; cursor: pointer; font-size: .95em; color: #157878; }',
    '.full-research summary:hover { background: #f6f8fa; }',
    '.research-content { padding: 16px; line-height: 1.7; }',
    '.research-content h3 { color: #157878; border-bottom: 1px solid #e1e4e8; padding-bottom: .3em; }',
    '.research-content table { width: 100%; border-collapse: collapse; margin: .8em 0; font-size: .9em; }',
    '.research-content td, .research-content th { padding: 6px 10px; border: 1px solid #e1e4e8; }',
    '.research-content tr:nth-child(even) { background: #f6f8fa; }',
    '.research-content ul { padding-left: 1.4em; }',
    '.research-content a { color: #0366d6; }',
    '.research-content blockquote { border-left: 3px solid #157878; margin: .8em 0; padding: .4em .8em; color: #586069; background: #f6f8fa; }',

    /* ── 반응형 ── */
    '@media (max-width: 600px) {',
    '  .activity-grid { grid-template-columns: 1fr; }',
    '  .region-tabs { gap: 4px; }',
    '  .region-tab { padding: 6px 12px; font-size: 0.82em; }',
    '  .act-modal-content { padding: 20px 16px; }',
    '}'
  ].join('\n');
  document.head.appendChild(css);

  /* ══════════════════════════════════════════
     데이터
     ══════════════════════════════════════════ */
  var REGIONS = [
    {
      id: 'byron-bay',
      name: '바이런베이',
      file: 'research/claude-research/activities/바이런베이-액티비티-리서치.md',
      summary: '서핑·카약·스카이다이빙부터 농장 브런치·원주민 문화까지. 5월은 바람이 연중 가장 적어 수상 스포츠 최적.',
      activities: [
        { name: '서핑', icon: '🏄', cost: '$49~65', duration: '2~2.5h', booking: '권장', may: 'optimal', mayLabel: '5월 최적', note: '5월은 연중 풍속 가장 낮아 초보 서핑에 최적. 수온 23.5°C', section: 1 },
        { name: '스카이다이빙 / 행글라이딩', icon: '🪂', cost: '$145~369', duration: '3~4h', booking: '필수', may: 'good', mayLabel: '연중 운영', note: '15,000ft 스카이다이빙 $369 (겨울 할인 $294~). 행글라이딩 탠덤 $145~200', section: 2 },
        { name: '고래 관찰', icon: '🐋', cost: '무료~$139', duration: '2~3h', booking: '보트 필수', may: 'limited', mayLabel: '시즌 초기', note: '5월 하순 = 시즌 초기. 보트 투어 100% 보장은 6/1부터. 등대 육상 관찰 무료', section: 3 },
        { name: '카약 / SUP', icon: '🚣', cost: '문의', duration: '2~2.5h', booking: '필수', may: 'optimal', mayLabel: '5월 최적', note: '5월이 연중 가장 잔잔 — 카약/SUP 최적. 돌핀 카약 투어 인기', section: 4 },
        { name: 'The Farm Byron Bay', icon: '🌿', cost: '무료 입장', duration: '2h+', booking: '식사 권장', may: 'good', mayLabel: '연중 운영', note: '80에이커 농장. 10AM 동물 먹이주기(무료) → Three Blue Ducks 브런치', section: 5 },
        { name: 'Crystal Castle', icon: '🔮', cost: '$22~33', duration: '2~3h', booking: '불필요', may: 'good', mayLabel: '연중 운영', note: '세계 최대급 수정, 크리스탈 사운드 힐링(12PM/3PM), 샴발라 정원', section: 6 },
        { name: '바이런 마켓', icon: '🛍', cost: '무료', duration: '반나절', booking: '불필요', may: 'warning', mayLabel: '5/25 없음', note: '커뮤니티 마켓 5/25(월) 없음. 대안: 5/24 Bangalow Market, 5/22 Farmers Market', section: 7 },
        { name: '야간 체험 (Night Vision)', icon: '🌙', cost: '$164', duration: '4h', booking: '필수', may: 'limited', mayLabel: '겨울 감소', note: '군용 야간투시경으로 야생동물 관찰. 겨울이라 동물 수 감소. 반딧불이 시즌 아님', section: 8 },
        { name: '원주민 문화 체험', icon: '🪃', cost: '문의', duration: '1.5h', booking: '필수', may: 'good', mayLabel: '화/수/토', note: 'Arakwal Bundjalung 여성 장로 직접 안내. 부시터커 시식, 전통 도구 체험', section: 9 },
        { name: '숨은 명소', icon: '🗺', cost: '무료', duration: '자유', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Killen Falls(폭포 뒤 동굴), Whites Beach(비밀 해변), Lighthouse Walk(돌고래)', section: 10 }
      ]
    },
    {
      id: 'port-stephens',
      name: '포트스테판스·뉴캐슬',
      file: 'research/claude-research/activities/포트스테판스-뉴캐슬-액티비티-리서치.md',
      summary: '사막 샌드보딩·돌고래 크루즈·낙타 라이드 등 어드벤처 집중. 대부분 연중 운영으로 5월 방문 안정적.',
      activities: [
        { name: '스톡턴 사막 샌드보딩', icon: '🏜', cost: '$27~40', duration: '2~3h', booking: '워크인 가능', may: 'optimal', mayLabel: '5월 최적', note: '비/서늘한 날이 오히려 최적 — 젖은 모래가 매끄러워 속도 UP. 무제한 타기', section: 1 },
        { name: '돌고래 크루즈', icon: '🐬', cost: '~$35', duration: '1.5h', booking: '온라인 권장', may: 'good', mayLabel: '99% 목격', note: '상주 160마리 큰돌고래. 99% 발견 보장, 못 보면 무료 재탑승', section: 2 },
        { name: '고래 관찰 크루즈', icon: '🐋', cost: '$65~80', duration: '2.5h', booking: '온라인 권장', may: 'limited', mayLabel: '시즌 초기', note: '40,000마리 혹등고래 이동 경로. 5월 하순은 시즌 초기', section: 3 },
        { name: '낙타 라이드', icon: '🐫', cost: '$45~120', duration: '20min', booking: 'Day 워크인', may: 'good', mayLabel: '연중 운영', note: 'Day Ride $45 워크인, Sunset Ride $120 예약 필수(금·토). 수요일 휴무', section: 4 },
        { name: '쿼드바이크', icon: '🏍', cost: '$110~119', duration: '1h', booking: '온라인 권장', may: 'good', mayLabel: '연중 운영', note: '400cc 바이크로 사구 질주. 초보 가능. 16세 이상', section: 5 },
        { name: 'Irukandji 상어 체험', icon: '🦈', cost: '$41~231', duration: '1.5~2h', booking: '온라인 가능', may: 'good', mayLabel: '실내, 무관', note: '실내 시설로 날씨 무관. 상어·가오리 먹이주기·쓰다듬기. 골드패스 $231', section: 6 },
        { name: '뉴캐슬 카페 (Darby St)', icon: '☕', cost: '식비', duration: '1~1.5h', booking: '불필요', may: 'good', mayLabel: '연중 운영', note: 'Three Monkeys(20년+), Goldbergs(1995~), Autumn Rooms 등 카페 거리', section: 7 },
        { name: 'Bathers Way 해안 산책', icon: '🚶', cost: '무료', duration: '2.5~3h', booking: '불필요', may: 'good', mayLabel: '고래 시즌', note: '6km, 6개 비치 경유. 5~11월 고래 관찰 시즌 — 워크 중 육안 목격 가능', section: 8 },
        { name: '야생 코알라 관찰', icon: '🐨', cost: '무료', duration: '1~1.5h', booking: '불필요', may: 'good', mayLabel: '연중 가능', note: 'Tilligerry Habitat Reserve. 자원봉사자가 매일 코알라 위치 지도 업데이트', section: 9 },
        { name: 'Tomaree Head 일출/일몰', icon: '🌅', cost: '무료', duration: '0.5~1h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: '왕복 2.1km 트레일. 5월 일출 ~6:30am. 정상에서 고래 이동 관측 가능', section: 10 }
      ]
    },
    {
      id: 'coffs-harbour',
      name: '콥스하버·도리고·벨링겐',
      file: 'research/claude-research/activities/콥스하버-도리고-벨링겐-액티비티-리서치.md',
      summary: '해양(다이빙·스노클링) + 열대우림(Waterfall Way·반딧불이) + 보헤미안 마을(벨링겐). Grey Nurse Shark 관찰 최적기.',
      activities: [
        { name: 'Solitary Islands 스노클링/다이빙', icon: '🤿', cost: '$100~220', duration: '반나절', booking: '필요', may: 'good', mayLabel: '연중 운영', note: '열대+아열대 어종 만남. 5~6월 Grey Nurse Shark 최적기. 수온 20~22°C', section: 1 },
        { name: '고래 관찰', icon: '🐋', cost: '무료~$90', duration: '자유/2~3h', booking: '보트 확인', may: 'limited', mayLabel: '시즌 초입', note: '머튼버드 아일랜드(무료, 도보). 보트 투어 통상 6~10월 → 5월 말 확인 필수', section: 2 },
        { name: '벨링겐 마을', icon: '🎨', cost: '무료+식비', duration: '1~2h', booking: '불필요', may: 'good', mayLabel: '연중 운영', note: '보헤미안 분위기. Old Butter Factory 갤러리. Three Blue Ducks 팜투테이블', section: 3 },
        { name: '도리고 열대우림 야간/반딧불이', icon: '✨', cost: '무료~$50', duration: '1.5~2h', booking: '확인 필요', may: 'limited', mayLabel: '투어 미확인', note: '반딧불이 서식 확인됨. 상설 야간 투어는 미확인 → 레인포레스트 센터 문의', section: 4 },
        { name: 'Jetty Dive 다이빙', icon: '🐠', cost: '$100~220', duration: '반나절', booking: '필요', may: 'good', mayLabel: '연중 매일', note: 'PADI 5 Star. 30년+ 운영. 겨울철 Grey Nurse Shark + 좋은 시야', section: 5 },
        { name: '지역 맛집', icon: '🦞', cost: '$15~70/인', duration: '자유', booking: '고급 예약', may: 'good', mayLabel: '연중 운영', note: 'Latitude 30(마리나 오션뷰 해산물), 벨링겐 Three Blue Ducks', section: 6 },
        { name: '원주민 문화 체험 (Gumbaynggirr)', icon: '🪃', cost: '$40~60', duration: '2h', booking: '권장', may: 'warning', mayLabel: '5/9만 운영', note: 'Giingan 투어 매월 둘째 토요일만(5/9). 5월 하순엔 일정 안 맞을 수 있음', section: 7 },
        { name: '야생 캥거루/코알라 관찰', icon: '🦘', cost: '무료', duration: '30min~1.5h', booking: '불필요', may: 'good', mayLabel: '연중 가능', note: 'Look At Me Now Headland(캥거루), 벨링겐 인근(코알라). 이른 아침/오후 최적', section: 8 },
        { name: '숨은 폭포/해변', icon: '💧', cost: '무료', duration: '30min~1.5h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Scouts Falls(수영 웅덩이), Serenity Beach(캥거루와 함께), Coffs Creek Walk', section: 9 },
        { name: 'Waterfall Way 드라이브', icon: '🚗', cost: '주차 $8', duration: '반나절+', booking: '불필요', may: 'good', mayLabel: '연중 운영', note: '185km 열대우림 드라이브. Dorrigo Skywalk(무료), Crystal Falls, Ebor Falls', section: 10 }
      ]
    },
    {
      id: 'port-macquarie',
      name: '포트맥쿼리',
      file: 'research/claude-research/activities/포트맥쿼리-액티비티-리서치.md',
      summary: '코알라 병원·동물원·딸기농장 등 부드러운 체험이 많고 비용도 저렴. 5월 서핑은 연중 최적.',
      activities: [
        { name: '코알라 병원 (Guulabaa)', icon: '🐨', cost: '$12.50', duration: '1~1.5h', booking: '불필요', may: 'good', mayLabel: '364일 운영', note: '임시 이전 운영 중(Guulabaa). 수의 클리닉 관람, 보존 전시. 카페·숲 산책로', section: 1 },
        { name: 'Billabong Zoo + 코알라', icon: '🦘', cost: '$47+$65', duration: '2~3h', booking: '인카운터 권장', may: 'good', mayLabel: '연중 운영', note: '코알라 쓰다듬기+먹이주기 인카운터 $65 추가. NSW는 코알라 안기 불가', section: 2 },
        { name: 'Sea Acres 열대우림', icon: '🌴', cost: '$10', duration: '30~45min', booking: '불필요', may: 'good', mayLabel: '연중 운영', note: '1.3km 배리어프리 캐노피 보드워크. 원주민 가이드 투어도 운영', section: 3 },
        { name: '낙타 사파리', icon: '🐪', cost: '$40', duration: '20min', booking: '불필요', may: 'good', mayLabel: '매일(기상)', note: 'Lighthouse Beach 해변 낙타 라이딩. 5월 9:30am~1pm. 선착순 워크인', section: 4 },
        { name: '서핑', icon: '🏄', cost: '$20~90', duration: '2h', booking: '레슨 예약', may: 'optimal', mayLabel: '5월 최적!', note: '가을~겨울이 포맥 서핑 최적. Town Beach 클린 파도 확률 62%', section: 5 },
        { name: '고래 관찰', icon: '🐋', cost: '무료~$85', duration: '30min~90min', booking: '크루즈 필수', may: 'limited', mayLabel: '시즌 초반', note: 'Tacking Point Lighthouse 육상 관찰(무료). 크루즈 $85~ (선라이즈/선셋 한정석)', section: 6 },
        { name: '카약 / SUP', icon: '🚣', cost: '$20/h', duration: '3h+', booking: '필수', may: 'limited', mayLabel: '평일 확인', note: 'Hastings River에서 패들링. 수온 20~22°C. 평일 운영 여부 직접 확인 필요', section: 7 },
        { name: '와인/크래프트 맥주', icon: '🍷', cost: '$15~25 추정', duration: '1~1.5h', booking: '투어 예약', may: 'good', mayLabel: '수~일 운영', note: 'Cassegrain Wines(수~일), Black Duck Brewery, Maria River Distillery', section: 8 },
        { name: 'Coastal Walk 해안 산책', icon: '🚶', cost: '무료', duration: '1~4h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: '편도 9km, 4구간. Sea Acres 열대우림 보드워크 연결 가능. Tacking Point Lighthouse', section: 9 },
        { name: '딸기 따기 (Ricardoes)', icon: '🍓', cost: '무료 입장', duration: '30min~1h', booking: '불필요', may: 'good', mayLabel: '연중 운영', note: '실내 수경재배 → 비·계절 무관. 5종 딸기 3만 그루. 카페 스콘 추천', section: 10 }
      ]
    },
    {
      id: 'blue-mountains-sydney',
      name: '블루마운틴·시드니',
      file: 'research/claude-research/activities/블루마운틴-시드니-이색체험-리서치.md',
      subRegions: [
        { label: '블루마운틴', start: 0, end: 8 },
        { label: '시드니 (5/30, 차량 없음)', start: 8, end: 18 }
      ],
      summary: '블루마운틴: 시닉월드·글로우웜·캐니언링·승마. 시드니(5/30): Vivid Sydney 2026 기간! 라이트워크 + 오페라하우스 + 브릿지클라임.',
      activities: [
        /* 블루마운틴 */
        { name: 'Scenic World', icon: '🚠', cost: '$55', duration: '2~3h', booking: '온라인 권장', may: 'good', mayLabel: '연중무휴', note: '세계 최급경사 52도 레일웨이, 270m 상공 스카이웨이. Discovery Pass 무제한', section: 1, sectionKey: 'Scenic World' },
        { name: 'Glow Worm Tunnel', icon: '🪱', cost: '무료', duration: '3h', booking: '불필요', may: 'good', mayLabel: '건기 양호', note: 'Lithgow 셀프 하이킹. 5월 건기라 반딧불이 밀도 양호. 4WD 권장, 헤드램프 필수', section: 2, sectionKey: 'Lithgow Glow Worm' },
        { name: 'Jenolan Caves', icon: '🦇', cost: 'TBD', duration: 'TBD', booking: 'TBD', may: 'warning', mayLabel: '재개장 불확실', note: '2024 폭우 후 폐쇄 중. "2026년 중반" 목표이나 5월인지 불확실. 직전 확인 필수', section: 3, sectionKey: 'Jenolan Caves' },
        { name: '캐니언링 / 어브세일링', icon: '🧗', cost: '$195~250', duration: '6~8h', booking: '필수', may: 'good', mayLabel: '윈터 시즌', note: '5~8월 윈터 캐니언링 — 물에 안 젖는 드라이 캐니언 위주. 초보 코스 있음', section: 4, sectionKey: '캐니언링' },
        { name: 'Megalong Valley 승마', icon: '🐎', cost: '$80~195', duration: '1~2h', booking: '권장', may: 'good', mayLabel: '연중 운영', note: '30분 $80 ~ 2시간 $195. 와이너리 치즈보드+와인 포함 패키지도', section: 5, sectionKey: 'Megalong Valley' },
        { name: 'Blue Mountains YHA', icon: '🏠', cost: '$35~100/박', duration: '-', booking: '온라인 권장', may: 'good', mayLabel: '연중 운영', note: '국가유산 건물. 겨울 벽난로 분위기. 도미토리 $35~, 개인실 $85~', section: 6, sectionKey: 'Blue Mountains YHA' },
        { name: '카툼바/레우라 카페', icon: '☕', cost: '식비', duration: '자유', booking: '인기점 예약', may: 'good', mayLabel: '연중 운영', note: 'Cafe Lurline(2025 골드 어워드), Wayzgoose(플라워팟 스콘), Station Bar(화덕피자)', section: 7, sectionKey: '카툼바/레우라' },
        { name: 'Three Sisters 야간', icon: '🌃', cost: '무료', duration: '30min~1h', booking: '불필요', may: 'good', mayLabel: '매일 투광', note: '일몰~23:00 투광 조명. 5월 밤 5~8°C 방풍재킷 필수. 주차장→전망대 5분', section: 8, sectionKey: '에코포인트 야간' },
        /* 시드니 */
        { name: 'Vivid Sydney 2026', icon: '🌈', cost: '무료(80%)', duration: '자유', booking: '불필요', may: 'optimal', mayLabel: '5/30 포함!', note: '5/22~6/13. 6.5km 라이트워크(무료), 드론쇼, Vivid Music. 5/30(토) 최고 인파', section: 1, sectionKey: 'Vivid Sydney' },
        { name: '오페라하우스 투어', icon: '🎭', cost: '$43', duration: '1h', booking: '2~3일 전', may: 'good', mayLabel: '연중 운영', note: '가이드 투어 $43(한국어 가능). 백스테이지 투어, 투어+런치 옵션도', section: 2, sectionKey: '오페라하우스 투어' },
        { name: 'BridgeClimb', icon: '🌉', cost: '$200~400+', duration: '2.5~3.5h', booking: '필수', may: 'optimal', mayLabel: 'Vivid 할인', note: 'Vivid 기간 야간 클라이밍 강추. VIVID2026 코드 20% 할인. Twilight/Night 추천', section: 3, sectionKey: '하버 브릿지 클라이밍' },
        { name: 'Bondi to Bronte', icon: '🏖', cost: '무료', duration: '1h', booking: '불필요', may: 'good', mayLabel: '고래 시즌', note: '편도 2.5km 해안 워크. 5~11월 고래 목격 가능. 쾌적한 16~19°C', section: 4, sectionKey: 'Bondi to Bronte' },
        { name: 'Taronga Zoo + 페리', icon: '🦁', cost: '$75~79', duration: '3~4h', booking: '온라인 할인', may: 'good', mayLabel: '비수기 쾌적', note: '페리 12분(Circular Quay→동물원). Zoo Express 콤보 $75~79', section: 5, sectionKey: 'Taronga Zoo' },
        { name: 'The Rocks 마켓', icon: '🛍', cost: '무료', duration: '1~2h', booking: '불필요', may: 'good', mayLabel: '5/30 토 운영', note: '토·일 10~17시. Vivid Light Walk 바로 인접 → 오후 마켓→저녁 Vivid 동선', section: 6, sectionKey: 'The Rocks 마켓' },
        { name: 'Barangaroo 디너', icon: '🍽', cost: '$50~150+/인', duration: '2h', booking: 'Vivid 필수', may: 'good', mayLabel: '연중 운영', note: 'Woodcut(파인다이닝), Callao(닛케이), Rekodo(일식 바이닐 바). Vivid 토요일 필수 예약', section: 7, sectionKey: 'Barangaroo' },
        { name: '고래 관찰 크루즈', icon: '🐋', cost: '$95~119', duration: '2~3h', booking: '온라인 예약', may: 'limited', mayLabel: '시즌 초반', note: '5/30 시즌 초반이나 운영 중. 대부분 미목격 시 무료 재탑승 보증', section: 8, sectionKey: '고래 관찰 크루즈' },
        { name: '시드니 하버 카약', icon: '🚣', cost: '$80~120', duration: '2~3h', booking: '필요', may: 'limited', mayLabel: '바람 주의', note: '수온 18~20°C 웻수트 권장. 15노트+ 풍속 시 취소. 달링하버 출발 추천', section: 9, sectionKey: '시드니 하버 카약' },
        { name: '원주민 문화 체험', icon: '🪃', cost: '$35~70', duration: '1~2h', booking: '필수', may: 'good', mayLabel: '연중 운영', note: 'The Rocks Dreaming Tour → 마켓 → Vivid 동선 결합 추천. Burrawa BridgeClimb도', section: 10, sectionKey: '원주민 문화 체험 (Aboriginal' }
      ]
    }
  ];

  var FILES = {};
  REGIONS.forEach(function (r) { FILES[r.id] = r.file; });

  /* ══════════════════════════════════════════
     상태
     ══════════════════════════════════════════ */
  var activeRegion = REGIONS[0].id;
  var mdCache = {};

  /* ══════════════════════════════════════════
     초기화
     ══════════════════════════════════════════ */
  bindTabs();
  bindFullResearch();
  renderRegion(activeRegion);

  /* ══════════════════════════════════════════
     전체 리서치 toggle 바인딩 (한 번만)
     ══════════════════════════════════════════ */
  function bindFullResearch() {
    var details = document.getElementById('fullResearch');
    var content = document.getElementById('researchContent');
    details.addEventListener('toggle', function () {
      if (!details.open || content.dataset.loaded === activeRegion) return;
      loadFullResearch(activeRegion, content);
    });
  }

  /* ══════════════════════════════════════════
     탭 바인딩
     ══════════════════════════════════════════ */
  function bindTabs() {
    var tabs = document.querySelectorAll('.region-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
        this.classList.add('active');
        activeRegion = this.getAttribute('data-region');
        renderRegion(activeRegion);
      });
    }
  }

  /* ══════════════════════════════════════════
     지역 렌더링
     ══════════════════════════════════════════ */
  function renderRegion(regionId) {
    var region = REGIONS.filter(function (r) { return r.id === regionId; })[0];
    if (!region) return;

    // 요약
    var summaryEl = document.getElementById('regionSummary');
    var mayCount = { optimal: 0, good: 0, limited: 0, warning: 0 };
    region.activities.forEach(function (a) { mayCount[a.may] = (mayCount[a.may] || 0) + 1; });

    summaryEl.innerHTML =
      '<div style="margin-bottom:8px"><strong>' + region.name + '</strong> — ' + region.summary + '</div>' +
      '<div class="stat-row">' +
      '<span class="stat">' + region.activities.length + '개 액티비티</span>' +
      (mayCount.optimal ? '<span class="stat"><span class="stat-dot" style="background:#34c759"></span> 5월 최적 ' + mayCount.optimal + '</span>' : '') +
      (mayCount.good ? '<span class="stat"><span class="stat-dot" style="background:#007aff"></span> 정상 운영 ' + mayCount.good + '</span>' : '') +
      (mayCount.limited ? '<span class="stat"><span class="stat-dot" style="background:#ff9500"></span> 조건부 ' + mayCount.limited + '</span>' : '') +
      (mayCount.warning ? '<span class="stat"><span class="stat-dot" style="background:#d73a49"></span> 확인 필요 ' + mayCount.warning + '</span>' : '') +
      '</div>';

    // 카드 그리드
    var grid = document.getElementById('activityGrid');
    grid.innerHTML = '';

    var activities = region.activities;

    if (region.subRegions) {
      region.subRegions.forEach(function (sub) {
        var label = document.createElement('div');
        label.className = 'sub-region-label';
        label.textContent = sub.label;
        grid.appendChild(label);

        for (var i = sub.start; i < sub.end; i++) {
          grid.appendChild(createCard(activities[i], regionId, i));
        }
      });
    } else {
      activities.forEach(function (act, idx) {
        grid.appendChild(createCard(act, regionId, idx));
      });
    }

    // 전체 리서치 리셋
    var details = document.getElementById('fullResearch');
    details.removeAttribute('open');
    var content = document.getElementById('researchContent');
    content.innerHTML = '로딩 중...';
    content.dataset.loaded = '';
  }

  /* ══════════════════════════════════════════
     카드 생성
     ══════════════════════════════════════════ */
  function createCard(act, regionId, idx) {
    var card = document.createElement('div');
    card.className = 'act-card';
    card.setAttribute('data-idx', idx);

    var mayClass = 'may-' + act.may;

    card.innerHTML =
      '<div class="act-card-icon">' + act.icon + '</div>' +
      '<div class="act-card-name">' + act.name + '</div>' +
      '<div class="act-card-meta">' +
      '<span>💰 ' + act.cost + '</span>' +
      '<span>⏱ ' + act.duration + '</span>' +
      '<span>📋 ' + act.booking + '</span>' +
      '</div>' +
      '<div><span class="may-badge ' + mayClass + '">' + mayDot(act.may) + ' ' + act.mayLabel + '</span></div>' +
      '<div class="act-card-note">' + act.note + '</div>';

    card.addEventListener('click', function () {
      openModal(regionId, act);
    });

    return card;
  }

  function mayDot(status) {
    var colors = { optimal: '#34c759', good: '#007aff', limited: '#ff9500', warning: '#d73a49' };
    return '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (colors[status] || '#888') + '"></span>';
  }

  /* ══════════════════════════════════════════
     모달
     ══════════════════════════════════════════ */
  var modal = document.getElementById('actModal');
  var modalBody = document.getElementById('actModalBody');

  document.getElementById('actModalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  function openModal(regionId, act) {
    modalBody.innerHTML = '<p style="color:#586069">로딩 중...</p>';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    fetchMd(regionId, function (md) {
      var section = extractSection(md, act.section, act.sectionKey);
      if (section) {
        modalBody.innerHTML =
          '<div style="margin-bottom:12px"><span class="may-badge may-' + act.may + '">' + mayDot(act.may) + ' ' + act.mayLabel + '</span></div>' +
          simpleMarkdown(section);
      } else {
        modalBody.innerHTML = '<p style="color:#d73a49">섹션을 찾을 수 없습니다.</p>';
      }
    });
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ══════════════════════════════════════════
     마크다운 처리
     ══════════════════════════════════════════ */
  function fetchMd(regionId, cb) {
    if (mdCache[regionId]) { cb(mdCache[regionId]); return; }
    var base = window.__BASE_URL__ || '';
    var url = base + '/' + FILES[regionId];
    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (text) {
        mdCache[regionId] = text;
        cb(text);
      })
      .catch(function () { cb(''); });
  }

  function extractSection(md, sectionNum, sectionKey) {
    // Try both ## N. and ### N. header styles
    // Use sectionKey (unique title fragment) for files with duplicate numbering
    var start = -1;
    var headerLen = 0;

    if (sectionKey) {
      var keyIdx = md.indexOf(sectionKey);
      if (keyIdx >= 0) {
        // Find the start of the line containing the key
        var lineStart = md.lastIndexOf('\n', keyIdx);
        start = lineStart >= 0 ? lineStart + 1 : 0;
        headerLen = md.indexOf('\n', keyIdx) - start + 1;
      }
    }

    if (start < 0) {
      // Fallback: match by section number (## N. or ### N.)
      var patterns = [
        new RegExp('^## ' + sectionNum + '\\. ', 'm'),
        new RegExp('^### ' + sectionNum + '\\. ', 'm')
      ];
      for (var p = 0; p < patterns.length; p++) {
        var m = md.match(patterns[p]);
        if (m) {
          start = md.indexOf(m[0]);
          headerLen = m[0].length;
          break;
        }
      }
    }

    if (start < 0) return null;

    var rest = md.substring(start + headerLen);
    // Find next section header (## N. or ### N.) or --- or 종합
    var nextSection = rest.search(/^#{2,3} \d+\. /m);
    var nextHr = rest.search(/^---$/m);
    var nextSummary = rest.search(/^#{2,3} 종합/m);
    var nextMajorSection = rest.search(/^## [^\d]/m); // e.g. "## 시드니"

    var boundaries = [nextSection, nextHr, nextSummary, nextMajorSection].filter(function (b) { return b > 0; });
    var end = boundaries.length > 0 ? Math.min.apply(null, boundaries) : rest.length;

    return md.substring(start, start + headerLen + end).trim();
  }

  function simpleMarkdown(md) {
    return md
      .replace(/^#### (.+)$/gm, '<h5 style="color:#586069;margin:.6em 0 .3em">$1</h5>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h3>$1</h3>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^\| (.+)$/gm, function (match) {
        var cells = match.split('|').filter(function (c) { return c.trim(); });
        // Skip separator rows (|---|---|)
        if (cells.every(function (c) { return /^[\s-:]+$/.test(c); })) return '';
        var row = cells.map(function (c) { return '<td>' + c.trim() + '</td>'; }).join('');
        return '<tr>' + row + '</tr>';
      })
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '\n');
  }

  /* ══════════════════════════════════════════
     전체 리서치 로드
     ══════════════════════════════════════════ */
  function loadFullResearch(regionId, container) {
    fetchMd(regionId, function (md) {
      if (md) {
        container.innerHTML = simpleMarkdown(md);
        container.dataset.loaded = regionId;
      } else {
        container.innerHTML = '<p style="color:#d73a49">파일을 불러올 수 없습니다.</p>';
      }
    });
  }

})();
