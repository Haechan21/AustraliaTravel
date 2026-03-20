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
  var REGIONS = []; // data/activities/activities_data.json에서 로드
  var FILES = {};
  var activeRegion = null;
  var mdCache = {};
  var regionMarkers = {};
  var actMap = null;

  // 데이터를 fetch로 로드한 후 초기화
  var base = (window.__BASE_URL__ || '').replace(/\/+$/, '');
  fetch(base + '/data/activities/activities_data.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      REGIONS = data.regions;
      REGIONS.forEach(function (r) { FILES[r.id] = r.file; });
      activeRegion = REGIONS[0].id;
      actMap = initMap();
      bindTabs();
      bindFullResearch();
      selectRegion(activeRegion);
    })
    .catch(function(err) { console.error('activities 데이터 로드 실패:', err); });

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
