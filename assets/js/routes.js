/**
 * 로드트립 루트 비교 지도
 * Leaflet.js + OpenStreetMap (API 키 불필요)
 */
(function () {
  'use strict';

  /* ── 동적 스타일 주입 ── */
  var styleEl = document.createElement('style');
  styleEl.textContent =
    '.stop-dist { color: #5b8cb5; font-size: 0.75em; font-weight: 600; }' +
    '.day-km { background: #1a73e8; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 0.78em; font-weight: 600; margin-left: 6px; vertical-align: middle; }' +
    '.connector-time { color: #6a737d; font-size: 0.72em; }' +
    '.connector-road { padding: 1px 6px; border-radius: 8px; font-size: 0.7em; font-weight: 600; }' +
    '.connector-road-m { background: #dafbe1; color: #1a7f37; }' +
    '.connector-road-a { background: #ddf4ff; color: #0969da; }' +
    '.connector-road-other { background: #eef2f7; color: #24292e; }' +
    '.day-drive-summary { background: linear-gradient(135deg, #f8f9fb 0%, #eef1f5 100%); border: 1px solid #d0d7de; border-radius: 10px; padding: 10px 14px; margin-bottom: 12px; font-size: 0.82em; }' +
    '.drive-stats-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 6px; }' +
    '.drive-stat { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #24292e; }' +
    '.drive-stat-icon { font-size: 1em; }' +
    '.drive-stat-val { color: #0969da; }' +
    '.drive-road-bar { height: 8px; border-radius: 4px; background: #e1e4e8; overflow: hidden; margin-bottom: 5px; display: flex; }' +
    '.drive-road-m { height: 100%; background: #1a7f37; transition: width 0.4s ease; }' +
    '.drive-road-a { height: 100%; background: #56d364; transition: width 0.4s ease; }' +
    '.drive-road-legend { font-size: 0.75em; color: #57606a; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }' +
    '.drive-road-chip { display: inline-flex; align-items: center; gap: 3px; }' +
    '.drive-road-dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }' +
    '.drive-road-dot-m { background: #1a7f37; }' +
    '.drive-road-dot-a { background: #56d364; }' +
    '.drive-road-dot-other { background: #e1e4e8; }';
  document.head.appendChild(styleEl);

  /* ── 색상/아이콘 설정 ── */
  const ROUTE_COLORS = {
    '1': '#e74c3c', '2': '#3498db', '3': '#2ecc71',
    '4': '#f1c40f', '5': '#9b59b6', '6': '#e67e22',
    '7': '#1abc9c', '8': '#16a085', '9': '#c0392b'
  };

  const GRADE_COLORS = {
    S: '#ff2d55', A: '#ff9500', B: '#007aff', C: '#8e8e93', stay: '#34c759'
  };

  /* ── Google Encoded Polyline 디코더 ── */
  function decodePolyline(encoded) {
    var points = [];
    var index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      var b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += (result & 1) ? ~(result >> 1) : (result >> 1);

      shift = 0; result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += (result & 1) ? ~(result >> 1) : (result >> 1);

      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  }

  /* ── 도로 지오메트리 조회 ── */
  var geometryData = null;

  function getGeometry(routeKey, dayNum) {
    if (!geometryData) return null;
    var key = 'R' + routeKey + 'D' + dayNum;
    var encoded = null;
    if (geometryData.geometries && geometryData.geometries[key]) {
      encoded = geometryData.geometries[key];
    } else if (geometryData.aliases && geometryData.aliases[key]) {
      var realKey = geometryData.aliases[key];
      if (geometryData.geometries && geometryData.geometries[realKey]) {
        encoded = geometryData.geometries[realKey];
      }
    }
    if (!encoded) return null;
    return decodePolyline(encoded);
  }

  /* ── OSRM 구간(leg) 데이터 조회 ── */
  function getLegData(routeKey, dayNum) {
    if (!geometryData || !geometryData.legs) return null;
    var key = 'R' + routeKey + 'D' + dayNum;
    if (geometryData.legs[key]) return geometryData.legs[key];
    if (geometryData.aliases && geometryData.aliases[key]) {
      var realKey = geometryData.aliases[key];
      return geometryData.legs[realKey] || null;
    }
    return null;
  }

  /* ── 시간 포맷 (분 → "Xh Ym") ── */
  function formatDuration(minutes) {
    if (!minutes && minutes !== 0) return '';
    var m = Math.round(minutes);
    if (m < 60) return m + 'm';
    var h = Math.floor(m / 60);
    var rm = m % 60;
    if (rm === 0) return h + 'h';
    return h + 'h ' + rm + 'm';
  }

  function makeIcon(color, size) {
    return L.divIcon({
      className: 'custom-marker',
      html: '<div style="' +
        'background:' + color + ';' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'border-radius:50%;border:2px solid #fff;' +
        'box-shadow:0 1px 4px rgba(0,0,0,.4);' +
        '"></div>',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }

  function markerIcon(stop) {
    if (stop.type === 'start' || stop.type === 'end') return makeIcon('#1a1a2e', 14);
    if (stop.type === 'stay') return makeIcon(GRADE_COLORS.stay, 11);
    if (stop.grade === 'S') return makeIcon(GRADE_COLORS.S, 14);
    if (stop.grade === 'A') return makeIcon(GRADE_COLORS.A, 12);
    if (stop.grade === 'B') return makeIcon(GRADE_COLORS.B, 10);
    return makeIcon(GRADE_COLORS.C || '#aaa', 9);
  }

  /* ── 지도를 외부에서 접근 가능하게 노출 ── */
  // (탭 전환 시 invalidateSize 호출 용도)

  /* ── 지도 초기화 ── */
  var map = L.map('map', {
    center: [-31.5, 152.0],
    zoom: 7,
    scrollWheelZoom: true
  });

  window._routeMap = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  /* ── 데이터 로드 ── */
  var routeData = null;
  var layers = {};        // routeKey → { lines: [], markers: [] }
  var activeRoute = 'all';
  var activeDay = 'all';

  var base = (window.__BASE_URL__ || '').replace(/\/+$/, '');

  Promise.all([
    fetch(base + '/assets/data/route_data.json').then(function (r) { return r.json(); }),
    fetch(base + '/assets/data/route_geometry.json').then(function (r) { return r.json(); }).catch(function () { return null; })
  ]).then(function (results) {
    routeData = results[0].routes;
    geometryData = results[1];
    buildLayers();
    showAll();
    bindControls();
    normalizeScoreBars();
  });

  /* ── 레이어 구축 ── */
  function buildLayers() {
    Object.keys(routeData).forEach(function (key) {
      var route = routeData[key];
      var color = ROUTE_COLORS[key];
      var routeLayers = { lines: [], markers: [], dayLines: {}, dayMarkers: {} };

      route.days.forEach(function (day) {
        var coords = [];
        var dayMarkers = [];

        day.stops.forEach(function (stop, i) {
          var ll = [stop.lat, stop.lng];
          coords.push(ll);

          var popupHtml = '<strong>' + stop.name + '</strong>';
          if (stop.grade) popupHtml += ' <span style="color:' + (GRADE_COLORS[stop.grade] || '#888') + ';font-weight:bold">' + stop.grade + '등급</span>';
          if (stop.type === 'stay') popupHtml += ' 🏨';
          popupHtml += '<br><small>' + key + '조 Day ' + day.day + ' (' + day.date + ')</small>';

          var marker = L.marker(ll, { icon: markerIcon(stop) }).bindPopup(popupHtml);
          dayMarkers.push(marker);
        });

        // Day polyline
        if (coords.length > 1) {
          var roadCoords = getGeometry(key, day.day);
          var lineCoords = roadCoords || coords;
          var line = L.polyline(lineCoords, {
            color: color,
            weight: 3,
            opacity: 0.8,
            dashArray: day.day > 1 ? null : '8 4'
          });
          routeLayers.lines.push(line);
          routeLayers.dayLines[day.day] = line;
        }

        routeLayers.markers = routeLayers.markers.concat(dayMarkers);
        routeLayers.dayMarkers[day.day] = dayMarkers;
      });

      layers[key] = routeLayers;
    });
  }

  /* ── 표시 함수 ── */
  function clearMap() {
    Object.keys(layers).forEach(function (key) {
      layers[key].lines.forEach(function (l) { map.removeLayer(l); });
      layers[key].markers.forEach(function (m) { map.removeLayer(m); });
    });
  }

  function showAll() {
    clearMap();
    var bounds = [];
    Object.keys(layers).forEach(function (key) {
      layers[key].lines.forEach(function (l) {
        l.setStyle({ weight: 2.5, opacity: 0.6 });
        l.addTo(map);
        bounds = bounds.concat(l.getLatLngs());
      });
      // Only show S-grade markers in "all" view to avoid clutter
      layers[key].markers.forEach(function (m) {
        var ll = m.getLatLng();
        bounds.push(ll);
      });
    });
    // Show only S-grade + start markers in overview, deduplicate by coords
    var shownCoords = {};
    Object.keys(layers).forEach(function (key) {
      var route = routeData[key];
      route.days.forEach(function (day) {
        day.stops.forEach(function (stop, i) {
          if (stop.grade === 'S' || stop.type === 'start' || stop.type === 'end') {
            var coordKey = stop.lat.toFixed(3) + ',' + stop.lng.toFixed(3);
            if (!shownCoords[coordKey]) {
              var dayMarkers = layers[key].dayMarkers[day.day];
              if (dayMarkers && dayMarkers[i]) dayMarkers[i].addTo(map);
              shownCoords[coordKey] = true;
            }
          }
        });
      });
    });
    if (bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.05));
  }

  function showRoute(key) {
    clearMap();
    var bounds = [];
    layers[key].lines.forEach(function (l) {
      l.setStyle({ weight: 4, opacity: 0.9 });
      l.addTo(map);
      bounds = bounds.concat(l.getLatLngs());
    });
    layers[key].markers.forEach(function (m) {
      m.addTo(map);
      bounds.push(m.getLatLng());
    });
    if (bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.08));
  }

  function showRouteDay(key, dayNum) {
    clearMap();
    var line = layers[key].dayLines[dayNum];
    var markers = layers[key].dayMarkers[dayNum];
    var bounds = [];
    if (line) {
      line.setStyle({ weight: 5, opacity: 1.0 });
      line.addTo(map);
      bounds = bounds.concat(line.getLatLngs());
    }
    if (markers) {
      markers.forEach(function (m) {
        m.addTo(map);
        bounds.push(m.getLatLng());
      });
    }
    if (bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.15));
  }

  /* ── 정보 패널 ── */
  function updateInfoPanel(key) {
    var panel = document.getElementById('routeInfo');
    if (!key || key === 'all') {
      panel.innerHTML = '<p class="info-placeholder">루트를 선택하면 일별 경유지를 확인할 수 있습니다.</p>';
      return;
    }
    var route = routeData[key];

    // 총 운전 시간 계산
    var totalDriveMin = 0;
    var hasDriveTime = false;
    route.days.forEach(function(day) {
      var legs = getLegData(key, day.day);
      if (legs && Array.isArray(legs)) {
        for (var i = 0; i < legs.length; i++) {
          if (legs[i].duration_min) {
            totalDriveMin += legs[i].duration_min;
            hasDriveTime = true;
          }
        }
      }
    });

    // 헤더
    var html = '<h3 style="color:' + ROUTE_COLORS[key] + '">' + route.name + '</h3>';
    html += '<div class="route-stats">';
    html += '<span>총 ' + route.total_km + 'km';
    if (hasDriveTime) html += ' · 약 ' + formatDuration(totalDriveMin);
    html += '</span>';
    html += '<span>평가 ' + route.score + '점</span>';
    html += '</div>';

    // Day 미니탭
    html += '<div class="day-mini-tabs" id="dayMiniTabs">';
    route.days.forEach(function(day) {
      var activeClass = day.day === 1 ? ' active' : '';
      html += '<button class="day-mini-tab' + activeClass + '" data-day="' + day.day + '">';
      html += 'D' + day.day;
      if (day.day_km) html += ' <small style="opacity:0.7">' + day.day_km + '</small>';
      html += '</button>';
    });
    html += '</div>';

    // Day 콘텐츠 컨테이너
    html += '<div id="dayContent"></div>';

    panel.innerHTML = html;

    // Day 미니탭 이벤트
    var currentRouteKey = key;
    panel.querySelectorAll('.day-mini-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        panel.querySelectorAll('.day-mini-tab').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        var dayNum = parseInt(this.getAttribute('data-day'));
        renderDayContent(currentRouteKey, dayNum);
        showRouteDay(currentRouteKey, dayNum);

        // 상단 Day 필터 동기화
        var dayBtns = document.querySelectorAll('#dayButtons .day-btn');
        dayBtns.forEach(function(b) { b.classList.remove('active'); });
        var matchBtn = document.querySelector('#dayButtons .day-btn[data-day="' + dayNum + '"]');
        if (matchBtn) matchBtn.classList.add('active');
      });
    });

    // 최초 Day 1 렌더링
    renderDayContent(key, 1);
  }

  function renderDayContent(routeKey, dayNum) {
    var container = document.getElementById('dayContent');
    if (!container) return;
    var route = routeData[routeKey];
    var day = null;
    for (var i = 0; i < route.days.length; i++) {
      if (route.days[i].day === dayNum) { day = route.days[i]; break; }
    }
    if (!day) { container.innerHTML = ''; return; }

    var html = '<div class="day-header">';
    html += 'Day ' + day.day + ' <small>(' + day.date + ')</small> — ' + day.label;
    if (day.day_km) html += ' <span class="day-km">' + day.day_km + 'km</span>';
    html += '</div>';

    // Day 운전 요약 바
    var legs = getLegData(routeKey, dayNum);
    if (legs && Array.isArray(legs) && legs.length > 0) {
      var dayTotalDist = 0;
      var dayTotalDur = 0;
      var mKm = 0;  // Motorway (M도로)
      var aKm = 0;  // National Highway (A도로)
      var roadAgg = {};
      for (var li = 0; li < legs.length; li++) {
        if (legs[li].distance_km) dayTotalDist += legs[li].distance_km;
        if (legs[li].duration_min) dayTotalDur += legs[li].duration_min;
        if (legs[li].roads && Array.isArray(legs[li].roads)) {
          for (var ri = 0; ri < legs[li].roads.length; ri++) {
            var rd = legs[li].roads[ri];
            var km = rd.km || 0;
            if (rd.ref) {
              if (/^M\d/.test(rd.ref)) mKm += km;
              else if (/^A\d/.test(rd.ref)) aKm += km;
            }
            var rKey = rd.ref ? rd.ref + ' ' + rd.name : rd.name;
            if (rKey) roadAgg[rKey] = (roadAgg[rKey] || 0) + km;
          }
        }
      }
      // 도로 집계 정렬 (상위 3개)
      var sortedRoads = Object.keys(roadAgg).sort(function(a,b) { return roadAgg[b] - roadAgg[a]; });
      var mPct = dayTotalDist > 0 ? Math.round(mKm / dayTotalDist * 100) : 0;
      var aPct = dayTotalDist > 0 ? Math.round(aKm / dayTotalDist * 100) : 0;
      var majorPct = mPct + aPct;
      var otherPct = 100 - majorPct;

      html += '<div class="day-drive-summary">';
      // 상단: 거리, 시간, 주요도로%
      html += '<div class="drive-stats-row">';
      html += '<span class="drive-stat"><span class="drive-stat-icon">\uD83D\uDE97</span> <span class="drive-stat-val">' + Math.round(dayTotalDist) + 'km</span></span>';
      html += '<span class="drive-stat"><span class="drive-stat-icon">\u23F1</span> <span class="drive-stat-val">\uC57D ' + formatDuration(dayTotalDur) + '</span></span>';
      html += '<span class="drive-stat">\uC8FC\uC694\uB3C4\uB85C <span class="drive-stat-val">' + majorPct + '%</span></span>';
      html += '</div>';
      // 2단 프로그레스 바: M(진녹) + A(연녹) + 기타(회색)
      html += '<div class="drive-road-bar">';
      if (mPct > 0) html += '<div class="drive-road-m" style="width:' + mPct + '%"></div>';
      if (aPct > 0) html += '<div class="drive-road-a" style="width:' + aPct + '%"></div>';
      html += '</div>';
      // 하단: 범례 + 상위 도로명
      html += '<div class="drive-road-legend">';
      if (mPct > 0) html += '<span class="drive-road-chip"><span class="drive-road-dot drive-road-dot-m"></span>\uACE0\uC18D\uB3C4\uB85C ' + mPct + '%</span>';
      if (aPct > 0) html += '<span class="drive-road-chip"><span class="drive-road-dot drive-road-dot-a"></span>\uAD6D\uB3C4 ' + aPct + '%</span>';
      if (otherPct > 0) html += '<span class="drive-road-chip"><span class="drive-road-dot drive-road-dot-other"></span>\uAE30\uD0C0 ' + otherPct + '%</span>';
      html += '</div>';
      // 상위 도로 목록
      var topCount = Math.min(sortedRoads.length, 3);
      for (var ti = 0; ti < topCount; ti++) {
        var rName = sortedRoads[ti];
        var rKm = Math.round(roadAgg[rName]);
        if (rKm < 5) break;
        html += '<div class="drive-road-legend" style="margin-top:1px">';
        // 도로 유형에 따른 dot 색상
        var dotClass = 'drive-road-dot-other';
        if (/^M\d/.test(rName)) dotClass = 'drive-road-dot-m';
        else if (/^A\d/.test(rName)) dotClass = 'drive-road-dot-a';
        html += '<span class="drive-road-chip"><span class="drive-road-dot ' + dotClass + '"></span>' + rName + ' <span style="color:#57606a">' + rKm + 'km</span></span>';
        html += '</div>';
      }
      html += '</div>';
    }

    html += '<div class="day-stops">';

    day.stops.forEach(function(stop, idx) {
      // 거리 커넥터
      if (idx > 0) {
        html += '<div class="stop-connector">';
        var leg = (legs && Array.isArray(legs)) ? legs[idx - 1] : null;
        if (leg) {
          // OSRM leg 데이터 사용
          var distKm = leg.distance_km ? Math.round(leg.distance_km) : (stop.distance_km || 0);
          html += '\u2193 <span class="connector-dist">' + distKm + 'km</span>';
          if (leg.duration_min) {
            html += ' <span class="connector-time">\u00B7 \uC57D ' + formatDuration(leg.duration_min) + '</span>';
          }
          if (leg.roads && Array.isArray(leg.roads) && leg.roads.length > 0) {
            var topRd = leg.roads[0];
            var rdLabel = topRd.ref ? topRd.ref + ' ' + topRd.name : topRd.name;
            if (rdLabel.length > 25) rdLabel = rdLabel.substring(0, 25) + '\u2026';
            if (rdLabel) {
              var rdClass = 'connector-road-other';
              if (topRd.ref && /^M\d/.test(topRd.ref)) rdClass = 'connector-road-m';
              else if (topRd.ref && /^A\d/.test(topRd.ref)) rdClass = 'connector-road-a';
              html += ' <span class="connector-road ' + rdClass + '">' + rdLabel + '</span>';
            }
          }
        } else {
          // 폴백: 기존 방식
          if (stop.distance_km && stop.distance_km > 0) {
            html += '\u2193 <span class="connector-dist">' + stop.distance_km + 'km</span>';
          } else {
            html += '\u2193';
          }
        }
        html += '</div>';
      }

      // Stop 행
      var badge = '';
      if (stop.grade) badge = '<span class="grade-badge grade-' + stop.grade + '">' + stop.grade + '</span> ';
      else if (stop.type === 'stay') badge = '<span class="grade-badge stay-badge">숙박</span> ';
      else if (stop.type === 'start' || stop.type === 'end') badge = '<span class="grade-badge start-badge">출발</span> ';

      var gradeAttr = stop.grade ? ' data-grade="' + stop.grade + '"' : '';
      var clickClass = stop.grade ? ' stop-clickable' : '';
      var clickAttr = stop.grade ? ' data-stop-name="' + stop.name + '"' : '';
      html += '<div class="stop-row' + clickClass + '"' + gradeAttr + clickAttr + '>' + badge + stop.name + '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // 등급 stop 클릭 → 모달
    container.querySelectorAll('.stop-clickable[data-stop-name]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var name = this.dataset.stopName;
        var place = findPlaceByName(name);
        if (place) openPlaceModal(place);
      });
    });
  }

  /* ── 일별 필터 버튼 ── */
  function buildDayButtons(key) {
    var container = document.getElementById('dayButtons');
    var wrapper = document.getElementById('dayFilter');
    if (!key || key === 'all') {
      wrapper.style.display = 'none';
      return;
    }
    wrapper.style.display = 'flex';
    var route = routeData[key];
    var html = '<button class="day-btn active" data-day="all">전체</button>';
    route.days.forEach(function (day) {
      html += '<button class="day-btn" data-day="' + day.day + '">Day ' + day.day + '</button>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.day-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.day-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        var d = this.getAttribute('data-day');
        if (d === 'all') {
          showRoute(key);
        } else {
          showRouteDay(key, parseInt(d));
        }
        // 패널 미니탭 동기화
        var miniTabs = document.querySelectorAll('#dayMiniTabs .day-mini-tab');
        miniTabs.forEach(function(t) { t.classList.remove('active'); });
        if (d !== 'all') {
          var matchMini = document.querySelector('#dayMiniTabs .day-mini-tab[data-day="' + d + '"]');
          if (matchMini) matchMini.classList.add('active');
          renderDayContent(activeRoute, parseInt(d));
        } else {
          // 전체 선택 시 Day 1 기본 표시
          var firstMini = document.querySelector('#dayMiniTabs .day-mini-tab[data-day="1"]');
          if (firstMini) firstMini.classList.add('active');
          renderDayContent(activeRoute, 1);
        }
      });
    });
  }

  /* ── 점수 바 정규화 (50점 이하 생략, 50~100 절대 스케일) ── */
  var SCORE_BASE = 50;
  var SCORE_MAX = 100;

  function normalizeScoreBars() {
    var container = document.getElementById('scoreBar');
    var items = Array.from(container.querySelectorAll('.score-item'));

    // JSON score 기준으로 재정렬
    items.sort(function (a, b) {
      var sa = routeData[a.getAttribute('data-route')].score;
      var sb = routeData[b.getAttribute('data-route')].score;
      return sb - sa;
    });

    // 헤더 이후에 정렬된 순서로 재삽입
    var header = container.querySelector('.score-bar-header');
    items.forEach(function (el) {
      container.appendChild(el);
    });

    // 너비 + 점수 텍스트 + 메달 동기화
    var medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
    items.forEach(function (el, idx) {
      var key = el.getAttribute('data-route');
      var score = routeData[key].score;
      var pct = ((score - SCORE_BASE) / (SCORE_MAX - SCORE_BASE)) * 100;
      el.querySelector('.score-fill').style.width = Math.max(pct, 1) + '%';
      var numEl = el.querySelector('.score-num');
      if (numEl) numEl.textContent = score.toFixed(1);
      var labelEl = el.querySelector('.score-label');
      if (labelEl) labelEl.textContent = (idx < 3 ? medals[idx] + ' ' : '') + key + '\uC870';
    });
  }

  /* ── 컨트롤 바인딩 ── */
  function bindControls() {
    document.querySelectorAll('.route-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.route-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        var key = this.getAttribute('data-route');
        activeRoute = key;
        activeDay = 'all';
        if (key === 'all') {
          showAll();
          updateInfoPanel(null);
          buildDayButtons(null);
        } else {
          showRoute(key);
          updateInfoPanel(key);
          buildDayButtons(key);
        }
      });
    });

    // Score bar click
    document.querySelectorAll('.score-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var key = this.getAttribute('data-route');
        activeRoute = key;
        activeDay = 'all';
        document.querySelectorAll('.route-btn').forEach(function (b) { b.classList.remove('active'); });
        var matchBtn = document.querySelector('.route-btn[data-route="' + key + '"]');
        if (matchBtn) matchBtn.classList.add('active');
        showRoute(key);
        updateInfoPanel(key);
        buildDayButtons(key);
      });
    });
  }

  /* ── place_data.json 로드 + 모달 ── */
  var placeData = null;
  fetch(base + '/assets/data/place_data.json')
    .then(function (r) { return r.json(); })
    .then(function (d) { placeData = d; });

  var criteriaInfo = {
    scenery: { name: '경치/포토스팟', icon: '\uD83C\uDFDE' },
    uniqueness: { name: '유니크함', icon: '\u2728' },
    google_rating: { name: '구글 평점', icon: '\u2B50' },
    accessibility: { name: '접근성', icon: '\uD83D\uDE97' },
    review_count: { name: '리뷰 수', icon: '\uD83D\uDCAC' },
    value_for_money: { name: '가성비', icon: '\uD83D\uDCB0' },
    time_efficiency: { name: '시간효율', icon: '\u23F1' }
  };
  var criteriaOrder = ['scenery','uniqueness','google_rating','accessibility','review_count','value_for_money','time_efficiency'];

  function findPlaceByName(stopName) {
    if (!placeData) return null;
    var sn = stopName.replace(/[()（）]/g, ' ').trim();
    var best = null;
    var bestScore = 0;
    for (var id in placeData.places) {
      var p = placeData.places[id];
      var pn = p.name_ko.replace(/[()（）]/g, ' ').trim();
      // exact match
      if (pn === sn) return p;
      // substring match
      if (sn.indexOf(pn) >= 0 || pn.indexOf(sn) >= 0) return p;
      // no-space match (룩앳미나우 vs 룩 앳 미 나우)
      var snNoSp = sn.replace(/\s+/g, '');
      var pnNoSp = pn.replace(/\s+/g, '');
      if (snNoSp.indexOf(pnNoSp) >= 0 || pnNoSp.indexOf(snNoSp) >= 0) return p;
      // word overlap: split by spaces and count matching words
      var sWords = sn.split(/\s+/);
      var pWords = pn.split(/\s+/);
      var overlap = 0;
      for (var i = 0; i < sWords.length; i++) {
        for (var j = 0; j < pWords.length; j++) {
          if (sWords[i].length >= 2 && sWords[i] === pWords[j]) overlap++;
        }
      }
      if (overlap > bestScore) {
        bestScore = overlap;
        best = p;
      }
    }
    return bestScore >= 2 ? best : null;
  }

  function barColor(score) {
    if (score >= 9) return 'linear-gradient(90deg, #159957, #1ecf7a)';
    if (score >= 7) return 'linear-gradient(90deg, #1890ff, #69c0ff)';
    if (score >= 5) return 'linear-gradient(90deg, #faad14, #ffd666)';
    return 'linear-gradient(90deg, #ff4d4f, #ff7875)';
  }

  function openPlaceModal(place) {
    var p = place;
    var overlay = document.getElementById('placeModal');

    var html = '<h2 class="modal-title">' + p.name_ko + '</h2>';
    if (p.name && p.name !== p.name_ko) html += '<p class="modal-name-en">' + p.name + '</p>';
    if (p.google_maps_url) html += '<div class="modal-map-wrap"><a href="' + p.google_maps_url + '" target="_blank" class="modal-map-link">Google Maps\uC5D0\uC11C \uBCF4\uAE30</a></div>';

    html += '<div class="modal-meta">';
    html += '<span class="modal-grade grade-' + p.grade + '">' + p.grade + '\uB4F1\uAE09</span>';
    html += '<span><strong>' + p.may_adjusted_score.toFixed(1) + '\uC810</strong></span>';
    html += '<span>\uD83D\uDCCD ' + p.region + '</span>';
    if (p.controversial) html += '<span class="modal-controversy">\u26A1 \uB17C\uC7C1 (\uD3B8\uCC28 ' + p.spread.toFixed(1) + ')</span>';
    html += '</div>';

    // 3인 점수 카드
    html += '<div class="modal-scorers">';
    var personas = placeData.personas;
    var labels = ['A','B','C'];
    var nums = ['\u2460','\u2461','\u2462'];
    for (var i = 0; i < 3; i++) {
      var s = labels[i];
      html += '<div class="scorer-card"><div class="scorer-label">' + nums[i] + ' ' + personas[s].name + '</div>';
      html += '<div class="scorer-score">' + p.scores[s].toFixed(1) + '</div>';
      html += '<div class="scorer-focus">' + personas[s].focus + '</div></div>';
    }
    html += '</div>';

    // 기준별 브레이크다운
    html += '<div class="modal-breakdown">';
    for (var j = 0; j < criteriaOrder.length; j++) {
      var key = criteriaOrder[j];
      var bd = p.breakdown[key];
      if (!bd) continue;
      var ci = criteriaInfo[key];
      var avgPct = (bd.avg / 10) * 100;
      var spread = Math.max(bd.A, bd.B, bd.C) - Math.min(bd.A, bd.B, bd.C);
      var criControv = spread >= 3;

      html += '<div class="breakdown-row' + (criControv ? ' breakdown-controversial' : '') + '">';
      html += '<div class="breakdown-header"><span class="breakdown-label">' + ci.icon + ' ' + ci.name;
      if (criControv) html += ' <span class="criterion-controversy">\u26A1\uD3B8\uCC28 ' + spread + '</span>';
      html += '</span><span class="breakdown-avg">' + bd.avg.toFixed(1) + '</span></div>';
      html += '<div class="breakdown-bar-wrap"><div class="breakdown-bar-track"><div class="breakdown-bar" style="width:' + avgPct + '%;background:' + barColor(bd.avg) + '"></div></div></div>';
      html += '<div class="breakdown-abc">';
      html += '<span class="abc-score abc-a">\u2460\uD6A8\uC728:' + bd.A + '</span>';
      html += '<span class="abc-score abc-b">\u2461\uAC10\uC131:' + bd.B + '</span>';
      html += '<span class="abc-score abc-c">\u2462\uD604\uC2E4:' + bd.C + '</span>';
      html += '</div>';
      html += '<details class="breakdown-reasons"><summary>\uD3C9\uAC00 \uADFC\uAC70</summary><div class="reason-list">';
      html += '<div class="reason-item"><strong>\u2460\uD6A8\uC728:</strong> ' + (bd.reasons.A || '-') + '</div>';
      html += '<div class="reason-item"><strong>\u2461\uAC10\uC131:</strong> ' + (bd.reasons.B || '-') + '</div>';
      html += '<div class="reason-item"><strong>\u2462\uD604\uC2E4:</strong> ' + (bd.reasons.C || '-') + '</div>';
      html += '</div></details></div>';
    }
    html += '</div>';

    overlay.querySelector('.modal-body').innerHTML = html;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // 모달 닫기 이벤트
  document.getElementById('placeModal').querySelector('.modal-close').addEventListener('click', function () {
    document.getElementById('placeModal').classList.remove('active');
    document.body.style.overflow = '';
  });
  document.getElementById('placeModal').addEventListener('click', function (e) {
    if (e.target === this) {
      this.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  /* ── 탭 전환 ── */
  document.querySelectorAll('.route-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.route-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
      if (this.dataset.tab === 'map') {
        setTimeout(function () { window._routeMap.invalidateSize(); }, 100);
      }
    });
  });

})();
