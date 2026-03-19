/**
 * 여행 준비 페이지
 * 7개 주제의 실용 가이드를 탭으로 전환하며 마크다운 렌더링
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════
     CSS 주입
     ══════════════════════════════════════════ */
  var css = document.createElement('style');
  css.textContent = [
    /* ── 페이지 레이아웃 ── */
    '.essentials-page { max-width: 900px; margin: 0 auto; }',
    '.ess-subtitle { color: #586069; margin-bottom: 1.2em; }',

    /* ── 탭 ── */
    '.ess-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1.4em; }',
    '.ess-tab { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border: 2px solid #d1d5da; border-radius: 10px; background: #fff; color: #24292e; font-size: 0.92em; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap; }',
    '.ess-tab:hover { border-color: #157878; color: #157878; }',
    '.ess-tab.active { background: #157878; border-color: #157878; color: #fff; }',
    '.ess-tab-icon { font-size: 1.15em; }',

    /* ── 헤더 카드 ── */
    '.ess-header { background: linear-gradient(135deg, #f0f7f7 0%, #f6f8fa 100%); border: 1px solid #d0e8e8; border-radius: 12px; padding: 20px 24px; margin-bottom: 1.4em; }',
    '.ess-header-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }',
    '.ess-header-icon { font-size: 2em; }',
    '.ess-header-title { font-size: 1.3em; font-weight: 700; color: #24292e; }',
    '.ess-header-desc { font-size: 0.92em; color: #586069; line-height: 1.6; margin-bottom: 14px; }',
    '.ess-header-tags { display: flex; flex-wrap: wrap; gap: 8px; }',
    '.ess-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 16px; font-size: 0.82em; font-weight: 600; }',
    '.ess-tag-info { background: #e1f0ff; color: #0366d6; }',
    '.ess-tag-warn { background: #fff8c5; color: #b08800; }',
    '.ess-tag-tip { background: #dcffe4; color: #22863a; }',

    /* ── 마크다운 콘텐츠 ── */
    '.ess-content { line-height: 1.8; }',
    '.ess-content h1 { font-size: 1.3em; color: #157878; border-bottom: 2px solid #157878; padding-bottom: .3em; margin-top: 1.6em; }',
    '.ess-content h2 { font-size: 1.15em; color: #157878; border-bottom: 1px solid #e1e4e8; padding-bottom: .3em; margin-top: 1.4em; }',
    '.ess-content h3 { font-size: 1.05em; color: #24292e; margin-top: 1.2em; }',
    '.ess-content h4 { font-size: 0.95em; color: #586069; margin-top: 1em; }',
    '.ess-content table { width: 100%; border-collapse: collapse; margin: .8em 0; font-size: .88em; }',
    '.ess-content thead tr { background: #f0f7f7 !important; }',
    '.ess-content thead th { font-weight: 600; padding: 8px 10px; border: 1px solid #e1e4e8; text-align: left; }',
    '.ess-content td { padding: 6px 10px; border: 1px solid #e1e4e8; text-align: left; }',
    '.ess-content tr:nth-child(even) { background: #f6f8fa; }',
    '.ess-content blockquote { border-left: 3px solid #157878; margin: .8em 0; padding: .6em 1em; color: #586069; background: #f6f8fa; border-radius: 0 6px 6px 0; font-size: 0.92em; }',
    '.ess-content ul { padding-left: 1.4em; }',
    '.ess-content ol { padding-left: 1.4em; }',
    '.ess-content li { margin: .3em 0; }',
    '.ess-content ul ul { margin: .2em 0 .2em 1em; }',
    '.ess-content a { color: #0366d6; text-decoration: none; }',
    '.ess-content a:hover { text-decoration: underline; }',
    '.ess-content code { background: #f0f0f0; padding: 1px 6px; border-radius: 4px; font-size: 0.9em; }',
    '.ess-content hr { border: none; border-top: 1px solid #e1e4e8; margin: 1.5em 0; }',
    '.ess-content img { max-width: 100%; border-radius: 8px; }',

    /* ── 로딩 ── */
    '.ess-loading { text-align: center; padding: 3em 0; color: #586069; }',
    '.ess-loading-spinner { display: inline-block; width: 24px; height: 24px; border: 3px solid #e1e4e8; border-top-color: #157878; border-radius: 50%; animation: ess-spin .8s linear infinite; margin-right: 8px; vertical-align: middle; }',
    '@keyframes ess-spin { to { transform: rotate(360deg); } }',

    /* ── 반응형 ── */
    '@media (max-width: 600px) {',
    '  .ess-tabs { gap: 6px; }',
    '  .ess-tab { padding: 8px 12px; font-size: 0.82em; }',
    '  .ess-header { padding: 16px; }',
    '  .ess-header-icon { font-size: 1.5em; }',
    '  .ess-header-title { font-size: 1.1em; }',
    '  .ess-content table { font-size: 0.82em; }',
    '}'
  ].join('\n');
  document.head.appendChild(css);

  /* ══════════════════════════════════════════
     데이터
     ══════════════════════════════════════════ */
  var TOPICS = [
    {
      id: 'visa',
      icon: '🛂',
      name: '비자·입국',
      file: 'research/claude-research/travel-essentials/비자-입국.md',
      desc: 'ETA 전자여행허가, 입국 심사 절차, 검역·반입 금지 물품, TRS 면세 환급까지.',
      tags: [
        { text: 'ETA 필수', type: 'warn' },
        { text: '검역 매우 엄격', type: 'warn' },
        { text: 'TRS 환급 가능', type: 'tip' }
      ]
    },
    {
      id: 'driving',
      icon: '🚗',
      name: '운전·교통',
      file: 'research/claude-research/travel-essentials/운전-교통규칙.md',
      desc: '좌측통행 핵심 차이, 라운드어바웃 진입법, 속도 제한·과속 벌금, 톨비, 주유, 피로운전 방지.',
      tags: [
        { text: '좌측통행', type: 'warn' },
        { text: '국제면허 필수', type: 'info' },
        { text: '라운드어바웃', type: 'info' }
      ]
    },
    {
      id: 'safety',
      icon: '🛡',
      name: '안전·주의',
      file: 'research/claude-research/travel-essentials/안전-주의사항.md',
      desc: '야생동물 충돌, UV 자외선, 해양 위험, 범죄 예방, 응급 연락처, 문화 에티켓.',
      tags: [
        { text: '야생동물 주의', type: 'warn' },
        { text: 'UV 지수 높음', type: 'warn' },
        { text: '응급 000', type: 'info' }
      ]
    },
    {
      id: 'money',
      icon: '💳',
      name: '환전·결제',
      file: 'research/claude-research/travel-essentials/환전-결제.md',
      desc: '환전 방법 비교, 트래블 체크카드 추천, ATM·EFTPOS, DCC 주의, 팁 문화.',
      tags: [
        { text: '1 AUD ≈ 1,030원', type: 'info' },
        { text: '카드 중심 사회', type: 'tip' },
        { text: 'DCC 거절', type: 'warn' }
      ]
    },
    {
      id: 'insurance',
      icon: '🏥',
      name: '보험·의료',
      file: 'research/claude-research/travel-essentials/보험-의료.md',
      desc: '여행자 보험 비교, 호주 의료비 현실, 약국 이용, 렌터카 보험, 응급 대처.',
      tags: [
        { text: '의료비 한국의 2~5배', type: 'warn' },
        { text: '여행보험 필수', type: 'warn' },
        { text: '약국 Chemist', type: 'info' }
      ]
    },
    {
      id: 'packing',
      icon: '🧳',
      name: '짐·패킹',
      file: 'research/claude-research/travel-essentials/짐-패킹리스트.md',
      desc: '수하물 규정, 반입 금지 물품, 레이어링 전략, 전자기기, 차량 준비물, 150+ 체크리스트.',
      tags: [
        { text: '150+ 체크리스트', type: 'tip' },
        { text: '레이어링 필수', type: 'info' },
        { text: '5월 10~22°C', type: 'info' }
      ]
    },
    {
      id: 'telecom',
      icon: '📱',
      name: '통신·eSIM',
      file: 'research/claude-research/travel-essentials/통신-eSIM.md',
      desc: 'eSIM 3사 비교(Airalo·Holafly·aloSIM), 포켓 WiFi, 네트워크 커버리지, 오프라인 지도.',
      tags: [
        { text: 'eSIM 추천', type: 'tip' },
        { text: 'Telstra 커버리지 최고', type: 'info' },
        { text: '오프라인맵 필수', type: 'warn' }
      ]
    }
  ];

  /* ══════════════════════════════════════════
     상태
     ══════════════════════════════════════════ */
  var activeTopic = TOPICS[0].id;
  var mdCache = {};

  /* ══════════════════════════════════════════
     초기화
     ══════════════════════════════════════════ */
  renderTabs();
  selectTopic(activeTopic);

  /* ══════════════════════════════════════════
     탭 렌더링
     ══════════════════════════════════════════ */
  function renderTabs() {
    var container = document.getElementById('essTabs');
    TOPICS.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'ess-tab' + (t.id === activeTopic ? ' active' : '');
      btn.setAttribute('data-topic', t.id);
      btn.innerHTML = '<span class="ess-tab-icon">' + t.icon + '</span>' + t.name;
      btn.addEventListener('click', function () {
        selectTopic(t.id);
      });
      container.appendChild(btn);
    });
  }

  /* ══════════════════════════════════════════
     주제 선택
     ══════════════════════════════════════════ */
  function selectTopic(topicId) {
    activeTopic = topicId;

    // 탭 동기화
    var tabs = document.querySelectorAll('.ess-tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-topic') === topicId) {
        tabs[i].classList.add('active');
      } else {
        tabs[i].classList.remove('active');
      }
    }

    var topic = TOPICS.filter(function (t) { return t.id === topicId; })[0];
    if (!topic) return;

    // 헤더 카드
    renderHeader(topic);

    // 콘텐츠 로딩
    var content = document.getElementById('essContent');
    content.innerHTML = '<div class="ess-loading"><span class="ess-loading-spinner"></span>로딩 중...</div>';

    fetchMd(topic.file, function (md) {
      if (md) {
        // 첫 줄 제목(# ...) 제거 (헤더 카드에 이미 표시)
        var cleaned = md.replace(/^#\s+.+$/m, '').trim();
        // 상단 메타 blockquote 블록 제거 (> **대상**: ... / > **여행 조건**: ... / > **조사일**: ... 등)
        cleaned = cleaned.replace(/^(?:>\s*.+\n?)+/m, '').trim();
        // 첫 --- 구분선도 제거
        cleaned = cleaned.replace(/^---\s*$/m, '').trim();
        content.innerHTML = renderMarkdown(cleaned);
      } else {
        content.innerHTML = '<p style="color:#d73a49">파일을 불러올 수 없습니다.</p>';
      }
    });
  }

  /* ══════════════════════════════════════════
     헤더 카드 렌더링
     ══════════════════════════════════════════ */
  function renderHeader(topic) {
    var header = document.getElementById('essHeader');
    var tagsHtml = '';
    if (topic.tags) {
      tagsHtml = '<div class="ess-header-tags">';
      topic.tags.forEach(function (tag) {
        tagsHtml += '<span class="ess-tag ess-tag-' + tag.type + '">' + tag.text + '</span>';
      });
      tagsHtml += '</div>';
    }

    header.innerHTML =
      '<div class="ess-header-top">' +
        '<span class="ess-header-icon">' + topic.icon + '</span>' +
        '<span class="ess-header-title">' + topic.name + '</span>' +
      '</div>' +
      '<div class="ess-header-desc">' + topic.desc + '</div>' +
      tagsHtml;
  }

  /* ══════════════════════════════════════════
     마크다운 fetch
     ══════════════════════════════════════════ */
  function fetchMd(file, cb) {
    if (mdCache[file]) { cb(mdCache[file]); return; }
    var base = window.__BASE_URL__ || '';
    var url = base + '/' + file;
    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (text) {
        mdCache[file] = text;
        cb(text);
      })
      .catch(function () { cb(''); });
  }

  /* ══════════════════════════════════════════
     마크다운 → HTML 변환
     ══════════════════════════════════════════ */
  function renderMarkdown(md) {
    // 코드 블록(```) 처리 — 테이블/인라인 처리 전에 먼저 보호
    var codeBlocks = [];
    md = md.replace(/```[\s\S]*?```/g, function (match) {
      var code = match.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      codeBlocks.push('<pre style="background:#f6f8fa;padding:12px 16px;border-radius:6px;font-size:0.88em;overflow-x:auto;line-height:1.6"><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>');
      return '\x00CODE' + (codeBlocks.length - 1) + '\x00';
    });

    // 테이블을 블록 단위로 먼저 처리
    var result = md.replace(/(^\|.+$\n?)+/gm, function (block) {
      var lines = block.trim().split('\n');
      var rows = [];
      lines.forEach(function (line) {
        var cells = line.split('|').filter(function (c) { return c.trim(); });
        if (cells.every(function (c) { return /^[\s\-:]+$/.test(c); })) return;
        var tag = rows.length === 0 ? 'th' : 'td';
        var row = cells.map(function (c) {
          var content = c.trim()
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
          return '<' + tag + '>' + content + '</' + tag + '>';
        }).join('');
        rows.push('<tr>' + row + '</tr>');
      });
      if (!rows.length) return '';
      var thead = '<thead>' + rows[0] + '</thead>';
      var tbody = rows.length > 1 ? '<tbody>' + rows.slice(1).join('') + '</tbody>' : '';
      return '<table>' + thead + tbody + '</table>';
    });

    result = result
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^\d+\.\s+(.+)$/gm, '<li class="ess-ol">$1</li>')
      .replace(/^  - (.+)$/gm, '<li class="ess-nested">$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/((?:<li class="ess-ol">.*<\/li>\n?)+)/g, '<ol>$1</ol>')
      .replace(/((?:<li class="ess-nested">.*<\/li>\n?)+)/g, '<ul class="ess-sub">$1</ul>')
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '\n');

    // ol 안의 li에서 ess-ol 클래스 제거
    result = result.replace(/class="ess-ol"/g, '');
    // nested li에서 ess-nested 클래스 제거
    result = result.replace(/class="ess-nested"/g, '');
    // ess-sub 클래스 제거
    result = result.replace(/ class="ess-sub"/g, '');

    // 코드 블록 복원
    result = result.replace(/\x00CODE(\d+)\x00/g, function (_, i) {
      return codeBlocks[parseInt(i)];
    });

    return result;
  }

})();
