/**
 * 메인 페이지 (index.md)
 * D-day 카운터
 */
(function () {
  'use strict';

  var DEPARTURE_DATE = '2026-05-23';

  function updateDday() {
    var el = document.getElementById('dday-count');
    if (!el) return;

    // KST 기준 오늘 날짜 (UTC+9)
    var now = new Date();
    var kstOffset = 9 * 60;
    var kstMs = now.getTime() + (now.getTimezoneOffset() + kstOffset) * 60000;
    var kstToday = new Date(kstMs);
    var todayStr = kstToday.getFullYear() + '-' +
      String(kstToday.getMonth() + 1).padStart(2, '0') + '-' +
      String(kstToday.getDate()).padStart(2, '0');

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

  document.addEventListener('DOMContentLoaded', function () {
    updateDday();
  });
})();
