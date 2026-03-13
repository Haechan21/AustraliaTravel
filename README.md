<div align="center">

# 호주 로드트립 플래너

**2026년 5월 · 시드니↔골드코스트 해안 로드트립 · AI 기반 여행 계획**

구글맵 후보지를 전처리하고, Claude Code가 정보 수집 · 평가 · 일정 생성 · 리뷰를 수행한다.

![Status](https://img.shields.io/badge/Phase_4-일정_생성_중-yellow?style=for-the-badge)
![Places](https://img.shields.io/badge/관광지-109곳_평가_완료-blue?style=for-the-badge)
![Duration](https://img.shields.io/badge/기간-9일_(활동_7일)-green?style=for-the-badge)

[**GitHub Pages에서 보기**](https://haechan21.github.io/australia-travel/)

</div>

---

## 기술 스택

| 구분 | 기술 |
|:-----|:-----|
| 사이트 | Jekyll + GitHub Pages (jekyll-theme-cayman) |
| 프론트엔드 | Vanilla JS · SCSS · JSON fetch |
| 데이터 처리 | Python 3.11+ (표준 라이브러리만) |
| AI | Claude Code (주 작업), ChatGPT/Gemini (딥 리서치 보조) |

---

## 프로젝트 구조

```
호주여행/
├── _layouts/                  # Jekyll 레이아웃
├── assets/
│   ├── css/style.scss         #   커스텀 스타일 (모달, 랭킹 테이블 등)
│   ├── js/rankings.js         #   랭킹 페이지 인터랙션 (필터, 정렬, 모달)
│   └── data/place_data.json   #   프론트엔드용 통합 데이터 (자동 생성)
├── index.md                   # GitHub Pages 메인
├── rankings.html              # 관광지 랭킹 (동적 페이지)
├── CLAUDE.md                  # Claude Code 작업 가이드
├── docs/
│   ├── SPEC.md                #   기술 설계서 (데이터 스키마, 워크플로우)
│   ├── CRITIC.md              #   평가 페르소나 3명 정의 · 채점 가이드라인
│   ├── META.md                #   여행 전제 조건 (항공, 렌터카, 제약)
│   └── ITINERARY.md           #   확정 일정 (Single Source of Truth)
├── GoogleMaps/                # 구글맵 내보내기 원본 (읽기 전용)
├── config/
│   ├── scoring.json           #   카테고리별 평가 기준·가중치
│   └── trip.json              #   여행 일정 설정
├── data/
│   ├── places/attraction/     #   장소별 상세 JSON (110개, 중복 1개)
│   ├── scores/
│   │   ├── attraction_scored.json  # 종합 평가 결과
│   │   ├── scorer_A/B/C.json      # 개별 평가자 결과
│   │   └── RANKINGS.md            # 랭킹 (정적 마크다운 버전)
│   └── regions.json           #   좌표 기반 지역 분류 (14개 지역)
├── research/
│   ├── deep-research/         #   외부 AI 딥 리서치
│   ├── claude-research/       #   Claude Code 직접 조사
│   └── ai-review/             #   일정 리뷰 근거
└── scripts/
    └── parse_googlemaps.py    #   Phase 1 전처리
```

---

## 워크플로우 (5 Phase)

| Phase | 작업 | 상태 |
|:------|:-----|:----:|
| 1. 전처리 | GoogleMaps → 장소 stub + 지역 분류 + 중복 탐지 | ✅ |
| 2. 정보 수집 | 웹검색으로 리뷰·운영정보 수집 | ✅ |
| 3. 평가/등급 | 3명 페르소나 독립 평가 → 퍼센타일 등급 (S~D) | ✅ |
| 4. 일정 생성 | 등급·지리·제약 기반 일정 구성 | 🔄 |
| 5. 일정 리뷰 | 확정 일정 비판적 검토 | ⬜ |

### 평가 시스템

3명의 AI 평가자가 [CRITIC.md](docs/CRITIC.md)에 정의된 페르소나로 독립 채점:

| 평가자 | 핵심 관점 | 가중치 특징 |
|:-------|:----------|:-----------|
| ①효율 전략가 | 접근성·시간효율 중시 | accessibility 25%, time_efficiency 25% |
| ②감성 탐험가 | 경치·유니크함 중시 | uniqueness 35%, scenery 30% |
| ③현실주의 비평가 | 구글평점·리스크 중시 | google_rating 25%, time_efficiency 0% |

3명 평균이 config/scoring.json 기본 가중치와 정확히 일치하도록 설계.

---

## 스크립트

```bash
# Phase 1: GoogleMaps 전처리
python scripts/parse_googlemaps.py

# 변경 감지만 (파일 생성 없이)
python scripts/parse_googlemaps.py --diff-only

# Phase 3 이후: 프론트엔드 데이터 + RANKINGS.md 생성
python scripts/generate_frontend.py            # 전체 (재채점 + RANKINGS + place_data)
python scripts/generate_frontend.py --rescore  # 등급 재계산만
python scripts/generate_frontend.py --rank     # RANKINGS.md만
python scripts/generate_frontend.py --data     # place_data.json만
```

Python 3.11+ 표준 라이브러리만 사용. 외부 의존성 없음.

### 로컬 개발

```bash
bundle exec jekyll serve
# → http://localhost:4000/australia-travel/
```

---

<div align="center">

Built mainly with <img src="https://img.shields.io/badge/Claude_Code-191919?style=flat&logo=anthropic&logoColor=white" alt="Claude Code" valign="middle" />
<br/>
Supported by <img src="https://img.shields.io/badge/Gemini-4285F4?style=flat&logo=google&logoColor=white" alt="Gemini" valign="middle" /> <img src="https://img.shields.io/badge/ChatGPT-74aa9c?style=flat&logo=openai&logoColor=white" alt="ChatGPT" valign="middle" />

</div>
