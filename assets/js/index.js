/**
 * 메인 페이지 (index.md)
 * D-day 카운터 + 숙소 예약 카드 렌더링
 */
(function () {
  'use strict';

  var DEPARTURE_DATE = '2026-05-23';
  var DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

  // CSS는 style.scss에서 관리 (인라인 주입 없음)

  /* ══════════════════════════════════════════
     D-day 카운터
     ══════════════════════════════════════════ */
  function updateDday() {
    var el = document.getElementById('dday-count');
    if (!el) return;

    // KST 기준 오늘 날짜 (UTC+9)
    var now = new Date();
    var kstOffset = 9 * 60; // minutes
    var kstMs = now.getTime() + (now.getTimezoneOffset() + kstOffset) * 60000;
    var kstToday = new Date(kstMs);
    var todayStr = kstToday.getFullYear() + '-' +
      String(kstToday.getMonth() + 1).padStart(2, '0') + '-' +
      String(kstToday.getDate()).padStart(2, '0');

    // 날짜만 비교 (시간 무시)
    var departure = new Date(DEPARTURE_DATE + 'T00:00:00');
    var today = new Date(todayStr + 'T00:00:00');
    var diffDays = Math.round((departure - today) / 86400000);

    if (diffDays > 0) {
      el.textContent = 'D-' + diffDays;
    } else if (diffDays === 0) {
      el.textContent = 'D-Day!';
    } else if (diffDays >= -8) {
      el.textContent = '여행 중!';
    } else {
      el.textContent = '여행 완료';
    }
  }

  /* ══════════════════════════════════════════
     날짜 포맷 헬퍼
     ══════════════════════════════════════════ */
  function formatDate(dateStr) {
    // "2026-05-24" → "5/24 일"
    var d = new Date(dateStr + 'T00:00:00');
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var dow = DAY_NAMES[d.getDay()];
    return month + '/' + day + ' ' + dow;
  }

  function extractTime(checkInStr) {
    // "2026-05-24 14:00~18:00" → "14:00~18:00"
    if (!checkInStr) return '';
    var parts = checkInStr.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : checkInStr;
  }

  function maskConfirmation(no) {
    if (!no) return '';
    var str = String(no);
    return str.length > 6 ? str.slice(0, 6) + '...' : str;
  }

  function formatPrice(krw) {
    return '\u20A9' + Number(krw).toLocaleString('ko-KR');
  }

  /* ══════════════════════════════════════════
     숙소 예약 카드 렌더링
     ══════════════════════════════════════════ */
  function renderBookings() {
    var container = document.getElementById('booking-cards');
    var totalEl = document.getElementById('booking-total');
    if (!container) return;

    var base = (window.__BASE_URL__ || '').replace(/\/+$/, '');

    fetch(base + '/data/lodging/bookings.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var bookings = data.bookings || [];
        var meta = data.meta || {};

        // 로딩 텍스트 제거 후 카드를 컨테이너에 직접 추가
        container.innerHTML = '';

        bookings.forEach(function (b) {
          var card = document.createElement('div');
          card.className = 'booking-card';

          var res = b.reservation || {};
          var cancel = res.cancellation || {};

          card.innerHTML = [
            '<div class="booking-day">' + escHtml(b.day) + ' · ' + escHtml(formatDate(b.date)) + ' · ' + escHtml(b.destination) + '</div>',
            '<div class="booking-name">' + escHtml(b.property.name) + '</div>',
            '<div class="booking-price">' + escHtml(formatPrice(res.price_krw)) + '</div>',
            '<div class="booking-meta">' + escHtml(res.platform || '') + ' / 체크인 ' + escHtml(extractTime(res.check_in)) + '</div>',
            cancel.free_before ? '<div class="booking-cancel">무료취소 ' + escHtml(cancel.free_before) + '</div>' : ''
          ].join('\n');

          container.appendChild(card);
        });

        // 총액
        if (totalEl && meta.total_cost_krw) {
          totalEl.textContent = meta.total_nights + '박 합계 ' + formatPrice(meta.total_cost_krw);
        }
      })
      .catch(function (err) {
        console.error('[index.js] bookings fetch failed:', err);
      });
  }

  /* ══════════════════════════════════════════
     HTML 이스케이프
     ══════════════════════════════════════════ */
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ══════════════════════════════════════════
     초기화
     ══════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    updateDday();
    renderBookings();
  });
})();
