(function () {
  "use strict";

  var DATA = null;
  var currentGrade = "all";
  var currentRegion = "all";
  var currentSort = "rank";
  var controversyOnly = false;

  var criteriaInfo = {
    scenery: { name: "경치/포토스팟", icon: "🏞" },
    uniqueness: { name: "유니크함", icon: "✨" },
    google_rating: { name: "구글 평점", icon: "⭐" },
    accessibility: { name: "접근성", icon: "🚗" },
    review_count: { name: "리뷰 수", icon: "💬" },
    value_for_money: { name: "가성비", icon: "💰" },
    time_efficiency: { name: "시간효율", icon: "⏱" },
  };

  var criteriaOrder = [
    "scenery",
    "uniqueness",
    "google_rating",
    "accessibility",
    "review_count",
    "value_for_money",
    "time_efficiency",
  ];

  // ── Data loading ──
  function loadData() {
    var base = window.__BASE_URL__ || "";
    var dataUrl = base + "/assets/data/place_data.json";

    fetch(dataUrl)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (d) {
        DATA = d;
        init();
      })
      .catch(function () {
        document.getElementById("subtitle").textContent = "데이터 로딩 실패";
      });
  }

  // ── Init ──
  function init() {
    var dist = DATA.grade_distribution;
    var subtitle = document.getElementById("subtitle");
    subtitle.textContent =
      DATA.total + "곳 · 퍼센타일 등급 · " +
      "S등급:" + (dist.S || 0) + " A등급:" + (dist.A || 0) +
      " B등급:" + (dist.B || 0) + " C등급:" + (dist.C || 0) +
      " D등급:" + (dist.D || 0) +
      " · 논쟁 " + DATA.controversial_count + "곳";

    // Update grade button counts
    var btns = document.querySelectorAll(".grade-btn[data-grade]");
    for (var i = 0; i < btns.length; i++) {
      var g = btns[i].getAttribute("data-grade");
      if (g !== "all" && dist[g] !== undefined) {
        btns[i].textContent = g + "등급 (" + dist[g] + ")";
      } else if (g === "all") {
        btns[i].textContent = "전체등급 (" + DATA.total + ")";
      }
    }

    // Populate regions
    var regionSet = {};
    for (var id in DATA.places) {
      var r = DATA.places[id].region;
      regionSet[r] = (regionSet[r] || 0) + 1;
    }
    var regionSel = document.getElementById("regionFilter");
    var regions = Object.keys(regionSet).sort();
    for (var j = 0; j < regions.length; j++) {
      var opt = document.createElement("option");
      opt.value = regions[j];
      opt.textContent = regions[j] + " (" + regionSet[regions[j]] + ")";
      regionSel.appendChild(opt);
    }

    // Setup event listeners
    setupFilters();
    setupModal();
    render();
  }

  // ── Filters ──
  function setupFilters() {
    var gradeBtns = document.querySelectorAll(".grade-btn");
    for (var i = 0; i < gradeBtns.length; i++) {
      gradeBtns[i].addEventListener("click", function () {
        for (var j = 0; j < gradeBtns.length; j++) gradeBtns[j].classList.remove("active");
        this.classList.add("active");
        currentGrade = this.getAttribute("data-grade");
        render();
      });
    }

    document.getElementById("regionFilter").addEventListener("change", function () {
      currentRegion = this.value;
      render();
    });

    document.getElementById("controversyFilter").addEventListener("change", function () {
      controversyOnly = this.checked;
      render();
    });

    var sortBtns = document.querySelectorAll(".sort-btn");
    for (var k = 0; k < sortBtns.length; k++) {
      sortBtns[k].addEventListener("click", function () {
        for (var j = 0; j < sortBtns.length; j++) sortBtns[j].classList.remove("active");
        this.classList.add("active");
        currentSort = this.getAttribute("data-sort");
        render();
      });
    }
  }

  // ── Render table ──
  function render() {
    var ids = DATA.ranked_ids.slice();

    // Filter
    var filtered = [];
    for (var i = 0; i < ids.length; i++) {
      var p = DATA.places[ids[i]];
      if (currentGrade !== "all" && p.grade !== currentGrade) continue;
      if (currentRegion !== "all" && p.region !== currentRegion) continue;
      if (controversyOnly && !p.controversial) continue;
      filtered.push(p);
    }

    // Sort
    if (currentSort === "A") {
      filtered.sort(function (a, b) { return b.scores.A - a.scores.A; });
    } else if (currentSort === "B") {
      filtered.sort(function (a, b) { return b.scores.B - a.scores.B; });
    } else if (currentSort === "C") {
      filtered.sort(function (a, b) { return b.scores.C - a.scores.C; });
    } else if (currentSort === "spread") {
      filtered.sort(function (a, b) { return b.spread - a.spread; });
    }
    // "rank" uses default order

    var tbody = document.getElementById("rankingsBody");
    var html = "";
    for (var j = 0; j < filtered.length; j++) {
      var p = filtered[j];
      var rank = currentSort === "rank" ? DATA.ranked_ids.indexOf(p.id) + 1 : j + 1;
      var controv = p.controversial ? ' <span class="controversy-badge" title="논쟁 장소 (편차 ' + p.spread.toFixed(1) + ')">⚡</span>' : "";

      html +=
        '<tr data-place-id="' + p.id + '">' +
        '<td class="col-rank">' + rank + "</td>" +
        '<td class="col-grade"><span class="grade-badge grade-' + p.grade + '">' + p.grade + "</span></td>" +
        '<td class="col-score">' + p.average_score.toFixed(1) + "</td>" +
        '<td class="col-abc scorer-a" title="평가자1: 효율 전략가">' + p.scores.A.toFixed(1) + "</td>" +
        '<td class="col-abc scorer-b" title="평가자2: 감성 탐험가">' + p.scores.B.toFixed(1) + "</td>" +
        '<td class="col-abc scorer-c" title="평가자3: 현실주의 비평가">' + p.scores.C.toFixed(1) + "</td>" +
        '<td class="col-name">' + p.name_ko + controv + "</td>" +
        '<td class="col-region">' + p.region + "</td>" +
        "</tr>";
    }
    tbody.innerHTML = html;

    // Re-attach click handlers
    var rows = tbody.querySelectorAll("tr[data-place-id]");
    for (var k = 0; k < rows.length; k++) {
      rows[k].addEventListener("click", function () {
        openModal(this.getAttribute("data-place-id"));
      });
    }
  }

  // ── Modal ──
  var overlay;

  function setupModal() {
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML =
      '<div class="modal-content">' +
      '<button class="modal-close">&times;</button>' +
      '<div class="modal-body"></div>' +
      "</div>";
    document.body.appendChild(overlay);

    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function closeModal() {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  function barColor(score) {
    if (score >= 9) return "linear-gradient(90deg, #159957, #1ecf7a)";
    if (score >= 7) return "linear-gradient(90deg, #1890ff, #69c0ff)";
    if (score >= 5) return "linear-gradient(90deg, #faad14, #ffd666)";
    return "linear-gradient(90deg, #ff4d4f, #ff7875)";
  }

  function fmt(n) {
    return typeof n === "number" ? n.toFixed(1) : n;
  }

  function openModal(id) {
    var p = DATA.places[id];
    if (!p) return;

    var mapsLink = p.google_maps_url
      ? '<a href="' + p.google_maps_url + '" target="_blank" rel="noopener" class="modal-map-link">Google Maps에서 보기</a>'
      : "";

    var controvBadge = p.controversial
      ? '<span class="modal-controversy">⚡ 논쟁 장소 (편차 ' + p.spread.toFixed(1) + "점)</span>"
      : "";

    var html =
      '<h2 class="modal-title">' + p.name_ko + "</h2>" +
      (p.name && p.name !== p.name_ko ? '<p class="modal-name-en">' + p.name + "</p>" : "") +
      (mapsLink ? '<div class="modal-map-wrap">' + mapsLink + "</div>" : "") +
      '<div class="modal-meta">' +
      '<span class="modal-grade grade-' + p.grade + '">' + p.grade + "등급</span>" +
      "<span><strong>" + fmt(p.average_score) + "점</strong></span>" +
      '<span>📍 ' + p.region + "</span>" +
      controvBadge +
      "</div>";

    // 3 Persona scores
    html += '<div class="modal-scorers">';
    var personas = DATA.personas;
    var scorerLabels = ["A", "B", "C"];
    var scorerNums = ["①", "②", "③"];
    for (var i = 0; i < scorerLabels.length; i++) {
      var s = scorerLabels[i];
      var persona = personas[s];
      html +=
        '<div class="scorer-card">' +
        '<div class="scorer-label">' + scorerNums[i] + " " + persona.name + "</div>" +
        '<div class="scorer-score">' + fmt(p.scores[s]) + "</div>" +
        '<div class="scorer-focus">' + persona.focus + "</div>" +
        "</div>";
    }
    html += "</div>";

    // Criterion breakdown
    html += '<div class="modal-breakdown">';
    for (var j = 0; j < criteriaOrder.length; j++) {
      var key = criteriaOrder[j];
      var bd = p.breakdown[key];
      if (!bd) continue;
      var ci = criteriaInfo[key];

      // Weights for each persona
      var wA = DATA.weights.A[key] || 0;
      var wB = DATA.weights.B[key] || 0;
      var wC = DATA.weights.C[key] || 0;

      var avgPct = (bd.avg / 10) * 100;
      var criSpread = Math.max(bd.A, bd.B, bd.C) - Math.min(bd.A, bd.B, bd.C);
      var criControv = criSpread >= 3;
      var controvTag = criControv
        ? ' <span class="criterion-controversy" title="평가자 간 편차 ' + criSpread + '점">⚡편차 ' + criSpread + '</span>'
        : "";

      html +=
        '<div class="breakdown-row' + (criControv ? " breakdown-controversial" : "") + '">' +
        '<div class="breakdown-header">' +
        '<span class="breakdown-label">' + ci.icon + " " + ci.name + controvTag + "</span>" +
        '<span class="breakdown-avg">' + fmt(bd.avg) + "</span>" +
        "</div>" +
        '<div class="breakdown-bar-wrap">' +
        '<div class="breakdown-bar-track">' +
        '<div class="breakdown-bar" style="width:' + avgPct + "%;background:" + barColor(bd.avg) + '"></div>' +
        "</div>" +
        "</div>" +
        '<div class="breakdown-abc">' +
        '<span class="abc-score abc-a" title="가중치 ' + (wA * 100).toFixed(0) + '%">①효율 전략가:' + bd.A + "</span>" +
        '<span class="abc-score abc-b" title="가중치 ' + (wB * 100).toFixed(0) + '%">②감성 탐험가:' + bd.B + "</span>" +
        '<span class="abc-score abc-c" title="가중치 ' + (wC * 100).toFixed(0) + '%">③현실 비평가:' + bd.C + "</span>" +
        "</div>" +
        '<details class="breakdown-reasons">' +
        "<summary>평가 근거</summary>" +
        '<div class="reason-list">' +
        '<div class="reason-item"><strong>①효율 전략가:</strong> ' + (bd.reasons.A || "-") + "</div>" +
        '<div class="reason-item"><strong>②감성 탐험가:</strong> ' + (bd.reasons.B || "-") + "</div>" +
        '<div class="reason-item"><strong>③현실주의 비평가:</strong> ' + (bd.reasons.C || "-") + "</div>" +
        "</div>" +
        "</details>" +
        "</div>";
    }
    html += "</div>";

    overlay.querySelector(".modal-body").innerHTML = html;
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // ── Start ──
  document.addEventListener("DOMContentLoaded", loadData);
})();
