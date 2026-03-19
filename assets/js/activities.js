/**
 * 액티비티 후보 페이지
 * 10개 지역의 체험 활동을 카드 그리드로 표시하고, 마크다운 원문에서 상세 정보를 모달로 제공
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

    /* ── 지역 지도 ── */
    '#activityMap { height: 340px; border-radius: 10px; border: 1px solid #e1e4e8; margin-bottom: 1.2em; z-index: 0; }',
    '.region-marker { background: #fff; border: 2px solid #157878; border-radius: 16px; padding: 4px 12px; font-size: 0.82em; font-weight: 700; color: #157878; white-space: nowrap; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.15); text-align: center; transform: translate(-50%, -50%); }',
    '.region-marker:hover { background: #157878; color: #fff; z-index: 9000 !important; }',
    '.region-marker.active { background: #157878; color: #fff; box-shadow: 0 2px 8px rgba(21,120,120,.35); z-index: 8000 !important; }',
    '.region-marker .marker-count { display: block; font-size: 0.75em; font-weight: 400; opacity: .8; margin-top: 1px; }',

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

    /* ── 모달 상단: 구조화된 헤더 ── */
    '.am-header { margin-bottom: 20px; }',
    '.am-title { font-size: 1.3em; font-weight: 700; color: #24292e; margin: 0 0 2px; padding-right: 2em; display: flex; align-items: center; gap: 8px; }',
    '.am-title-icon { font-size: 1.4em; }',
    '.am-subtitle { font-size: 0.88em; color: #586069; margin: 0 0 12px; }',
    '.am-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px; }',
    '.am-info-cell { background: #f6f8fa; border-radius: 8px; padding: 10px 12px; text-align: center; }',
    '.am-info-label { font-size: 0.72em; font-weight: 600; color: #586069; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }',
    '.am-info-value { font-size: 1.05em; font-weight: 700; color: #24292e; }',
    '.am-info-value.am-highlight { color: #157878; font-size: 1.15em; }',
    '.am-note-box { background: #f0f7f7; border: 1px solid #d0e8e8; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }',
    '.am-note-box .am-note-label { font-size: 0.78em; font-weight: 700; color: #157878; margin-bottom: 4px; }',
    '.am-note-box .am-note-text { font-size: 0.9em; color: #24292e; line-height: 1.5; }',
    '.am-gmaps-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 6px; background: #f6f8fa; border: 1px solid #d1d5da; color: #24292e; font-size: 0.85em; font-weight: 600; text-decoration: none; transition: all .15s; }',
    '.am-gmaps-btn:hover { background: #e1e4e8; text-decoration: none; }',

    /* ── 모달 하단: 상세 리서치 ── */
    '.am-detail-body { padding: 0; margin-top: 8px; border-top: 1px solid #e1e4e8; padding-top: 16px; line-height: 1.7; }',

    '.am-detail-body h3 { color: #157878; margin-top: 1.2em; border-bottom: 1px solid #e1e4e8; padding-bottom: .3em; }',
    '.am-detail-body h4 { color: #24292e; margin-top: 1em; }',
    '.am-detail-body h5 { color: #586069; margin: .6em 0 .3em; font-size: .95em; }',
    '.am-detail-body table { width: 100%; border-collapse: collapse; margin: .8em 0; font-size: .88em; }',
    '.am-detail-body td, .am-detail-body th { padding: 6px 10px; border: 1px solid #e1e4e8; text-align: left; }',
    '.am-detail-body tr:nth-child(even) { background: #f6f8fa; }',
    '.am-detail-body thead tr { background: #f0f7f7 !important; }',
    '.am-detail-body thead th { font-weight: 600; padding: 8px 10px; border: 1px solid #e1e4e8; text-align: left; font-size: 0.88em; }',
    '.am-detail-body blockquote { border-left: 3px solid #157878; margin: .8em 0; padding: .4em .8em; color: #586069; background: #f6f8fa; border-radius: 0 6px 6px 0; }',
    '.am-detail-body ul { padding-left: 1.4em; }',
    '.am-detail-body li { margin: .3em 0; }',
    '.am-detail-body a { color: #0366d6; text-decoration: none; }',
    '.am-detail-body a:hover { text-decoration: underline; }',

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
    '  .am-info-grid { grid-template-columns: repeat(2, 1fr); }',
    '}'
  ].join('\n');
  document.head.appendChild(css);

  /* ══════════════════════════════════════════
     데이터
     ══════════════════════════════════════════ */
  var REGIONS = [
    {
      id: 'gold-coast',
      name: '골드코스트',
      center: [-28.06, 153.33],
      file: 'research/claude-research/activities/골드코스트-액티비티-리서치.md',
      summary: '서핑·반딧불이·힌터랜드 폭포·열기구. 5월 비수기라 관광객 적고 예약 수월. 은하수 촬영 조건 우수.',
      activities: [
        { name: '서핑 / 수상 액티비티', icon: '🏄', cost: '$35~59', duration: '2h', booking: '권장', may: 'optimal', mayLabel: '5월 최적', note: '5월 수온 22~25°C, 겨울이 오히려 서핑 배우기 최적. Currumbin Alley $35~', section: 1 },
        { name: '스카이다이빙 / 어드벤처', icon: '🪂', cost: '$46~495', duration: '1~4h', booking: '필수', may: 'good', mayLabel: '연중 운영', note: 'Skydive $495(12,000ft, Kirra Beach 착지). 제트보트 $46~, 헬리콥터 $65~', section: 2 },
        { name: '고래 관찰', icon: '🐋', cost: '$79~', duration: '2~3h', booking: '필수', may: 'limited', mayLabel: '5/30 개시', note: 'Sea World Cruises 2026 시즌 5/30 개시. 시즌 첫 주와 겹칠 가능성', section: 3 },
        { name: '반딧불이 야간 투어', icon: '✨', cost: '무료~$80', duration: '1.5~2h', booking: '투어 권장', may: 'good', mayLabel: '연중 가능', note: '스프링브룩 Natural Bridge 5월에도 관찰 가능(여름 대비 약함). 셀프 방문 무료', section: 4 },
        { name: '힌터랜드 하이킹/폭포', icon: '🥾', cost: '무료~$8', duration: '2~3h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Twin Falls Circuit(2h, 폭포 뒤 걷기) 1순위. Purlingbrook Falls, O\'Reilly\'s Tree Top Walk', section: 5 },
        { name: '마켓 / 로컬 체험', icon: '🛍', cost: '무료', duration: '2~3h', booking: '불필요', may: 'optimal', mayLabel: '커플 필수', note: 'Miami Marketta(수~토 5pm, 무료, 스트릿푸드+라이브 음악). Gallery Walk 탬버린', section: 6 },
        { name: '야경 / 별 관찰', icon: '🌌', cost: '$97~', duration: '자유', booking: '클라임 필수', may: 'good', mayLabel: '야경 양호', note: 'SkyPoint 트와일라잇 클라임 $97. 스프링브룩 Best of All Lookout. 여행 기간 달 밝기 58~99%로 은하수 촬영 불가', section: 7 },
        { name: '테마파크', icon: '🎢', cost: '$50~100+', duration: '반나절+', booking: '온라인', may: 'good', mayLabel: '연중 운영', note: 'Dreamworld Winterfest 외 커플에겐 비추. 관심 있으면 참고', section: 8 },
        { name: '숨은 명소', icon: '🗺', cost: '무료~$55', duration: '자유', booking: '도예 예약', may: 'good', mayLabel: '연중 개방', note: 'Burleigh Hill 일몰 피크닉(무료), Crockd Studios 도예 체험($55)', section: 9 },
        { name: '커플 특별 체험', icon: '💑', cost: '$149~390', duration: '2~4h', booking: '필수', may: 'good', mayLabel: '연중 운영', note: '열기구 $299~390/인(일출+와이너리 조식). 코알라 인카운터 $149/인', section: 10 }
      ]
    },
    {
      id: 'byron-bay',
      name: '바이런베이',
      center: [-28.71, 153.60],
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
      center: [-32.81, 151.93],
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
      center: [-30.33, 153.03],
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
      center: [-31.47, 152.90],
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
      center: [-33.77, 150.70],
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
    },
    {
      id: 'central-coast',
      name: '센트럴코스트',
      center: [-33.45, 151.36],
      file: 'research/claude-research/activities/센트럴코스트-액티비티-리서치.md',
      summary: 'Bouddi 해안 트레킹·Somersby 폭포·Reptile Park·펠리컨 먹이주기. 무료 액티비티만으로 1~2일 충실.',
      activities: [
        { name: '해안 하이킹/트레킹', icon: '🥾', cost: '무료~$12', duration: '2~3h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Bouddi Coastal Walk(Putty Beach~Maitland Bay 추천). The Skillion 전망대, Wyrrabalong NP', section: 1 },
        { name: '수상 액티비티', icon: '🚣', cost: '$25~60', duration: '1~3h', booking: '권장', may: 'limited', mayLabel: '수온 20~22°C', note: 'Avoca Lake SUP/카약, Terrigal Lagoon. 5월 수온 20~22°C, 호수/라군 추천', section: 2 },
        { name: '야생동물 체험', icon: '🦎', cost: '무료~$50', duration: '1~3h', booking: '불필요', may: 'good', mayLabel: '연중 운영', note: 'Australian Reptile Park $50/인. The Entrance 펠리컨 먹이주기(매일 3:30pm, 무료)', section: 3 },
        { name: '폭포 탐방', icon: '💧', cost: '무료', duration: '30min~1h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Somersby Falls(800m 왕복 30분, 무료). Reptile Park과 5분 거리 콤보', section: 4 },
        { name: '마켓/로컬 체험', icon: '🛍', cost: '무료', duration: '1~2h', booking: '불필요', may: 'good', mayLabel: '주말 운영', note: 'Avoca Beachside(4째 일요일), Terrigal Beach(1째 토), Gosford Farmers(매주 일)', section: 5 },
        { name: '별 관찰', icon: '🌌', cost: '무료', duration: '자유', booking: '불필요', may: 'limited', mayLabel: '달 밝음', note: 'Putty Beach/Norah Head Lighthouse. 빛 공해 최소 구역이나 여행 기간 달 밝기 58~99%로 은하수 촬영 불가', section: 6 },
        { name: '숨은 명소', icon: '🗺', cost: '무료~$10', duration: '자유', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Patonga Beach(페리 체험), Pearl Beach(록풀+카페), Norah Head Lighthouse 투어 $10', section: 7 },
        { name: '맛집/카페', icon: '☕', cost: '식비', duration: '자유', booking: '고급 예약', may: 'good', mayLabel: '연중 운영', note: 'Terrigal 파인다이닝(2026 Chef Hat), Distillery Botanica 칵테일 클래스 $95/인', section: 8 },
        { name: '기타 아웃도어', icon: '🚴', cost: '$30~95', duration: '2~4h', booking: '권장', may: 'good', mayLabel: '연중 운영', note: 'Glenworth Valley 승마/카약, Firescreek 무료 와인 테이스팅', section: 9 }
      ]
    },
    {
      id: 'wollongong-kiama',
      name: '울릉공·키아마·GPD',
      center: [-34.43, 150.95],
      file: 'research/claude-research/activities/울릉공-키아마-그랜드퍼시픽-액티비티-리서치.md',
      summary: 'Grand Pacific Drive 해안 드라이브·스카이다이빙·Kiama Blowhole(5~9월 최적!)·Minnamurra 열대우림. Bombo Quarry 은하수 명소.',
      activities: [
        { name: 'Grand Pacific Drive', icon: '🚗', cost: '무료', duration: '반나절+', booking: '불필요', may: 'good', mayLabel: '연중 운영', note: '140km 해안 드라이브. Sea Cliff Bridge 포함 7개 주요 정차 포인트', section: 1 },
        { name: '스카이다이빙/패러글라이딩', icon: '🪂', cost: '$249~349', duration: '2~4h', booking: '필수', may: 'good', mayLabel: '연중 운영', note: 'Stanwell Tops/Bald Hill. 탠덤 패러글라이딩 ~$350, 스카이다이빙 $349~', section: 2 },
        { name: '하이킹/트레킹', icon: '🥾', cost: '무료~$8', duration: '2~3h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Minnamurra Rainforest(커플 최적 2h). Wedding Cake Rock, Kiama Coast Walk', section: 3 },
        { name: '수상 액티비티', icon: '🏄', cost: '무료~$90', duration: '1~2h', booking: '레슨 예약', may: 'limited', mayLabel: '웻수트 필수', note: '5월 수온 18~20°C. 서핑 레슨 ~$90, 오션풀 4곳(무료)', section: 4 },
        { name: 'Symbio Wildlife Park', icon: '🐨', cost: '$49~109', duration: '2~3h', booking: '인카운터 권장', may: 'good', mayLabel: '연중 운영', note: '입장 ~$49, 코알라 인카운터 ~$60 추가', section: 5 },
        { name: 'Kiama Blowhole / 지질 명소', icon: '💨', cost: '무료', duration: '1~2h', booking: '불필요', may: 'optimal', mayLabel: '5~9월 최적!', note: 'Kiama Blowhole 5~9월 최적기! Cathedral Rocks & Bombo Quarry', section: 6 },
        { name: 'Nan Tien Temple', icon: '🛕', cost: '무료', duration: '1~2h', booking: '불필요', may: 'good', mayLabel: '화~일 운영', note: '남반구 최대 불교 사찰. 무료 입장, Tea House, 명상 체험. Pilgrim Lodge 숙박 가능', section: 7 },
        { name: '마켓', icon: '🛍', cost: '무료', duration: '1~2h', booking: '불필요', may: 'good', mayLabel: '주중/주말', note: 'Kiama Farmers(매주 수), Seaside Markets(셋째 일), Nan Tien(첫째 토)', section: 8 },
        { name: '별 관찰 / 지질 야경', icon: '🌌', cost: '무료', duration: '자유', booking: '불필요', may: 'limited', mayLabel: '달 밝음', note: 'Bombo Quarry 지질 야경 스팟. 여행 기간 달 밝기 58~99%로 은하수 촬영 불가. 지질 사진은 가능', section: 9 },
        { name: '숨은 명소/맛집', icon: '🗺', cost: '무료~식비', duration: '자유', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Brokers Nose, Austinmer. Kiama 맛집 8곳, Wollongong 6곳', section: 10 },
        { name: 'Illawarra Fly Treetop', icon: '🌳', cost: '$22.50~67.50', duration: '1~2h', booking: '온라인 권장', may: 'good', mayLabel: '연중 운영', note: 'Treetop Walk $22.50, Zipline $67.50. 해발 710m 열대우림 캐노피', section: 12 }
      ]
    },
    {
      id: 'southern-highlands',
      name: '서던하이랜드·저비스베이',
      center: [-34.78, 150.61],
      file: 'research/claude-research/activities/서던하이랜드-저비스베이-액티비티-리서치.md',
      summary: '세계에서 가장 하얀 모래(Hyams Beach)·Fitzroy Falls·5월 단풍 절정·Jervis Bay 돌핀/별 관찰. Mushroom Tunnel 독특 체험.',
      activities: [
        { name: '돌핀/고래 크루즈', icon: '🐬', cost: '$35~69', duration: '1.5~2h', booking: '필수', may: 'good', mayLabel: '돌핀 연중', note: 'Dolphin Watch $35/인. 100마리+ 돌핀 상주. 5월 중순부터 고래 시즌 개시', section: 1 },
        { name: '하이킹', icon: '🥾', cost: '무료', duration: '1~3h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'White Sands Walk(2~5km), Fitzroy Falls West Rim(3.8km, 2h), Drawing Room Rocks', section: 2 },
        { name: '카약/SUP', icon: '🚣', cost: '$30~145', duration: '1~3h', booking: '권장', may: 'limited', mayLabel: '웻수트 필요', note: '5월 수온 ~20°C. 가이드 시카약 $145/인, 셀프 렌탈 $30~60', section: 3 },
        { name: '야생동물', icon: '🦘', cost: '무료', duration: '자유', booking: '불필요', may: 'good', mayLabel: '거의 확실', note: 'Green Patch 캥거루 거의 확실. 에키드나 관찰 가능', section: 4 },
        { name: '마을 탐방 (Bowral·Berry)', icon: '🏘', cost: '무료+식비', duration: '반나절', booking: '불필요', may: 'optimal', mayLabel: '5월 단풍', note: 'Bowral(갤러리+단풍), Berrima(1830년대 헤리티지), Berry(카페+부티크)', section: 5 },
        { name: '와이너리/맛집', icon: '🍷', cost: '무료~$40', duration: '1~2h', booking: '권장', may: 'good', mayLabel: '연중 운영', note: 'Centennial Vineyards, Tractorless, Dawning Day. 쿨클라임 와인', section: 6 },
        { name: '별 관찰 (Jervis Bay)', icon: '🌌', cost: '$85', duration: '2h', booking: '필수', may: 'good', mayLabel: '가이드 투어', note: 'Jervis Bay Stargazing $85/인, 천체물리학 박사 가이드. 은하수 골든윈도우(5/11~21)는 여행 전 종료. 별자리 관찰은 가능', section: 7 },
        { name: '가을 단풍', icon: '🍂', cost: '무료', duration: '자유', booking: '불필요', may: 'optimal', mayLabel: '5월 절정!', note: 'Retford Park, Corbett Gardens, Berrima가 5월 절정기', section: 8 },
        { name: '숨은 명소', icon: '🗺', cost: '무료~$40', duration: '자유', booking: '터널 예약', may: 'good', mayLabel: '연중 개방', note: 'Mittagong Mushroom Tunnel $40/인(6월 중순 휴업 전 마지막 기회!). Chinamans Beach', section: 9 }
      ]
    },
    {
      id: 'forster-swr-yamba',
      name: '포스터·SWR·야마',
      center: [-30.50, 153.00],
      file: 'research/claude-research/activities/포스터-SWR-야마-액티비티-리서치.md',
      subRegions: [
        { label: '포스터/해링턴 (Forster)', start: 0, end: 4 },
        { label: '사우스웨스트록스 (SWR)', start: 4, end: 8 },
        { label: '야마/그래프턴 (Yamba)', start: 8, end: 12 }
      ],
      summary: 'Smoky Cape 등대 트레킹·Trial Bay Gaol 은하수·Yamba 돌고래 카약·Angourie Blue Pool. 빛 공해 적은 별 관찰 명소.',
      activities: [
        /* 포스터/해링턴 */
        { name: '해안 하이킹', icon: '🥾', cost: '무료', duration: '1~3h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Cape Hawke Lookout(420계단), Crowdy Bay Diamond Head Loop(4.7km)', section: 1, sectionKey: 'Part 1' },
        { name: '수상 액티비티', icon: '🐬', cost: '$35~70', duration: '1.5~3h', booking: '권장', may: 'good', mayLabel: '연중 운영', note: '고래/돌고래 투어(Epic Surf, FreeSpirit). 카약(Lazy Paddles). One Mile Beach 서핑', section: 2, sectionKey: 'Part 1' },
        { name: '마켓/맛집', icon: '🛍', cost: '무료+식비', duration: '1~2h', booking: '불필요', may: 'good', mayLabel: '5/23 토 운영', note: 'Forster Farmers Market 셋째 토요일 5/23 방문 가능. Thirty Three Degrees 오이스터 바', section: 5, sectionKey: 'Part 1' },
        { name: '별 관찰', icon: '🌌', cost: '무료', duration: '자유', booking: '불필요', may: 'limited', mayLabel: '달 밝음', note: 'Crowdy Bay NP Diamond Head — 빛 공해 최소 구역이나 여행 기간 달 밝기 58~99%로 은하수 촬영 불가', section: 6, sectionKey: 'Part 1' },
        /* SWR */
        { name: 'Smoky Cape 등대 트레킹', icon: '🏔', cost: '무료', duration: '2~3h', booking: '불필요', may: 'good', mayLabel: '연중 개방', note: 'Smoky Cape Range Walking Track 5.5km 편도. NSW 최고 높이 등대 종착점', section: 1, sectionKey: 'Part 2' },
        { name: 'Trial Bay Gaol', icon: '🏛', cost: '$11', duration: '1~1.5h', booking: '불필요', may: 'good', mayLabel: '연중 운영', note: '셀프가이드 투어 성인 $11. 폐허 전경으로 은하수 촬영 드라마틱 구도', section: 4, sectionKey: 'Part 2' },
        { name: '다이빙 (Fish Rock Cave)', icon: '🤿', cost: '$260', duration: '1일', booking: '필수', may: 'good', mayLabel: '연중 운영', note: '호주 유일 해양 동굴 다이빙. 1일 2다이브 $260. Grey Nurse Shark', section: 2, sectionKey: 'Part 2' },
        { name: '야생 캥거루 (Little Bay)', icon: '🦘', cost: '무료', duration: '자유', booking: '불필요', may: 'good', mayLabel: '연중 가능', note: 'Little Bay에서 야생 캥거루 조우 가능', section: 3, sectionKey: 'Part 2' },
        /* 야마 */
        { name: '돌고래 카약 투어', icon: '🐬', cost: '$70', duration: '3h', booking: '필수', may: 'good', mayLabel: '연중 운영', note: 'Yamba Kayak 돌고래 카약 $70/인 — 이 지역 최고 커플 체험', section: 2, sectionKey: 'Part 3' },
        { name: 'Angourie Blue Pool', icon: '🏊', cost: '무료', duration: '1~2h', booking: '불필요', may: 'limited', mayLabel: '5월 서늘', note: '채석장 변신 천연 담수 수영장. 무료. Angourie Walking Track 10km 연결', section: 1, sectionKey: 'Part 3' },
        { name: '마켓/문화', icon: '🛍', cost: '무료+식비', duration: '반나절', booking: '불필요', may: 'good', mayLabel: '수요일 운영', note: 'Yamba Farmers Market 매주 수 7~11am. Grafton Heritage Trail + Gallery', section: 5, sectionKey: 'Part 3' },
        { name: '맛집', icon: '🍽', cost: '식비', duration: '자유', booking: '고급 예약', may: 'good', mayLabel: '연중 운영', note: 'Karrikin 파인다이닝, Sandbar 해산물. 맛집 11곳', section: 8, sectionKey: 'Part 3' }
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
  var regionMarkers = {};

  /* ══════════════════════════════════════════
     초기화
     ══════════════════════════════════════════ */
  var actMap = initMap();
  bindTabs();
  bindFullResearch();
  selectRegion(activeRegion);

  /* ══════════════════════════════════════════
     지도 초기화
     ══════════════════════════════════════════ */
  function initMap() {
    var mapEl = document.getElementById('activityMap');
    if (!mapEl || typeof L === 'undefined') return null;

    // 모든 지역 좌표로 bounds 계산
    var bounds = [];
    REGIONS.forEach(function (r) { if (r.center) bounds.push(r.center); });
    if (!bounds.length) return null;

    var map = L.map('activityMap', {
      scrollWheelZoom: false,
      zoomControl: true
    });

    // NSW 해안에 딱 맞게 fitBounds (여백 포함)
    map.fitBounds(bounds, { padding: [30, 30] });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18
    }).addTo(map);

    // 각 지역에 커스텀 마커(버튼) 생성
    REGIONS.forEach(function (r) {
      if (!r.center) return;
      var icon = L.divIcon({
        className: '',
        html: '<div class="region-marker' + (r.id === activeRegion ? ' active' : '') + '" data-region="' + r.id + '">' +
              r.name.split('·')[0] +
              '<span class="marker-count">' + r.activities.length + '개</span>' +
              '</div>',
        iconSize: null,
        iconAnchor: [0, 0]
      });
      var marker = L.marker(r.center, { icon: icon }).addTo(map);
      marker.on('click', function () { selectRegion(r.id); });
      regionMarkers[r.id] = marker;
    });

    return map;
  }

  /* ══════════════════════════════════════════
     지역 선택 (지도 + 탭 동기화)
     ══════════════════════════════════════════ */
  function selectRegion(regionId) {
    activeRegion = regionId;

    // 탭 동기화
    var tabs = document.querySelectorAll('.region-tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-region') === regionId) {
        tabs[i].classList.add('active');
      } else {
        tabs[i].classList.remove('active');
      }
    }

    // 지도 마커 동기화 + 선택 지역으로 줌
    var selectedCenter = null;
    REGIONS.forEach(function (r) {
      var m = regionMarkers[r.id];
      if (!m) return;
      var el = m.getElement();
      if (!el) return;
      var markerDiv = el.querySelector('.region-marker');
      if (!markerDiv) return;
      if (r.id === regionId) {
        markerDiv.classList.add('active');
        selectedCenter = r.center;
      } else {
        markerDiv.classList.remove('active');
      }
    });

    if (selectedCenter && actMap) {
      actMap.setView(selectedCenter, 10, { animate: true });
    }

    renderRegion(regionId);
  }

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
        selectRegion(this.getAttribute('data-region'));
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
    var region = REGIONS.filter(function (r) { return r.id === regionId; })[0];
    var regionName = region ? region.name : '';

    // 구조화된 상단 헤더 빌드
    var html = '';
    html += '<div class="am-header">';
    html += '<h2 class="am-title"><span class="am-title-icon">' + act.icon + '</span>' + act.name + '</h2>';
    html += '<p class="am-subtitle">' + regionName + ' · 2026년 5월 하순</p>';

    // Google Maps 링크
    html += '<div style="margin-bottom:14px"><a class="am-gmaps-btn" href="https://www.google.com/maps/search/' +
      encodeURIComponent(act.name + ' ' + regionName + ' NSW Australia') +
      '" target="_blank" rel="noopener">📍 Google Maps에서 보기</a></div>';

    // 정보 그리드
    html += '<div class="am-info-grid">';
    html += '<div class="am-info-cell"><div class="am-info-label">비용</div><div class="am-info-value am-highlight">' + act.cost + '</div></div>';
    html += '<div class="am-info-cell"><div class="am-info-label">소요시간</div><div class="am-info-value">' + act.duration + '</div></div>';
    html += '<div class="am-info-cell"><div class="am-info-label">예약</div><div class="am-info-value">' + act.booking + '</div></div>';
    html += '<div class="am-info-cell"><div class="am-info-label">5월 적합도</div><div class="am-info-value"><span class="may-badge may-' + act.may + '">' + mayDot(act.may) + ' ' + act.mayLabel + '</span></div></div>';
    html += '</div>';

    // 요약 노트
    if (act.note) {
      html += '<div class="am-note-box"><div class="am-note-label">요약</div><div class="am-note-text">' + act.note + '</div></div>';
    }
    html += '</div>';

    // 상세 리서치 (마크다운)
    html += '<div class="am-detail-body" id="amDetailBody"><p style="color:#586069">로딩 중...</p></div>';

    modalBody.innerHTML = html;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // 상세 리서치 즉시 로딩
    var detailBody = document.getElementById('amDetailBody');
    fetchMd(regionId, function (md) {
      var section = extractSection(md, act.section, act.sectionKey);
      if (section) {
        var cleaned = section.replace(/^#{1,3} \d+\.\s+.+$/m, '').trim();
        detailBody.innerHTML = simpleMarkdown(cleaned);
      } else {
        detailBody.innerHTML = '<p style="color:#586069">상세 리서치가 없습니다.</p>';
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
    // 테이블을 먼저 블록 단위로 처리 (구분선 깨짐 방지)
    var result = md.replace(/(^\|.+$\n?)+/gm, function (block) {
      var lines = block.trim().split('\n');
      var rows = [];
      lines.forEach(function (line) {
        var cells = line.split('|').filter(function (c) { return c.trim(); });
        // 구분선(|---|---|) 건너뛰기
        if (cells.every(function (c) { return /^[\s\-:]+$/.test(c); })) return;
        var tag = rows.length === 0 ? 'th' : 'td';
        var row = cells.map(function (c) { return '<' + tag + '>' + c.trim() + '</' + tag + '>'; }).join('');
        rows.push('<tr>' + row + '</tr>');
      });
      if (!rows.length) return '';
      var thead = '<thead>' + rows[0] + '</thead>';
      var tbody = rows.length > 1 ? '<tbody>' + rows.slice(1).join('') + '</tbody>' : '';
      return '<table>' + thead + tbody + '</table>';
    });

    result = result
      .replace(/^#### (.+)$/gm, '<h5>$1</h5>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h3>$1</h3>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '\n');
    return result;
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
