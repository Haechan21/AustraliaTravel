<div align="center">

# 호주 로드트립 플래너

**2026년 5월 · 시드니↔골드코스트 해안 로드트립 · AI 기반 여행 계획**

구글맵 후보지를 전처리하고, Claude Code가 정보 수집 · 평가 · 일정 생성 · 리뷰를 수행한다.

![Status](https://img.shields.io/badge/Phase_4-6조_확정_(바이런직행+블루마운틴)-green?style=for-the-badge)
![Places](https://img.shields.io/badge/관광지-110곳_평가_완료-blue?style=for-the-badge)
![Duration](https://img.shields.io/badge/기간-9일_(활동_7일)-green?style=for-the-badge)

[**GitHub Pages에서 보기**](https://haechan21.github.io/AustraliaTravel/)

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
├── _config.yml                   # Jekyll 사이트 설정
├── _layouts/                     # Jekyll 레이아웃
├── assets/
│   ├── css/style.scss            #   커스텀 스타일
│   ├── js/
│   │   ├── rankings.js           #   랭킹 페이지 인터랙션 (필터, 정렬, 모달)
│   │   ├── routes.js             #   루트 비교 페이지 (Leaflet.js 지도)
│   │   ├── activities.js         #   액티비티 페이지 인터랙션
│   │   ├── lodging.js            #   숙소 페이지 인터랙션
│   │   ├── dining.js             #   식당 페이지 인터랙션
│   │   └── essentials.js         #   여행 준비 가이드 인터랙션
│   └── data/
│       └── place_data.json       #   프론트엔드용 장소 데이터 (자동 생성)
├── index.md                      # GitHub Pages 메인
├── rankings.html                 # 관광지 랭킹 (동적 페이지)
├── routes.html                   # 루트 비교 (지도 + 상세 평가)
├── activities.html               # 액티비티 후보 페이지
├── lodging.html                  # 숙소 후보 페이지
├── dining.html                   # 식당 후보 페이지
├── essentials.html               # 여행 준비 가이드
├── route-plans.html              # 루트 상세 (→ routes.html 리다이렉트)
├── CLAUDE.md                     # Claude Code 작업 가이드
├── docs/
│   ├── SPEC.md                   #   기술 설계서 (데이터 스키마, 워크플로우)
│   ├── CRITIC.md                 #   관광지 평가 페르소나 · 채점 가이드라인
│   ├── CRITIC_ROUTE.md           #   루트 후보 평가 페르소나 및 기준
│   ├── CRITIC_LODGING.md         #   숙소 평가 페르소나 및 기준
│   ├── CRITIC_DINING.md          #   식당 평가 페르소나 및 기준
│   ├── META.md                   #   여행 전제 조건 (항공, 렌터카, 제약)
│   ├── ITINERARY.md              #   확정 일정 (Single Source of Truth)
│   └── TRAVELER_PROFILE.md       #   여행자 프로필 & 선호도
├── GoogleMaps/                   # 구글맵 내보내기 원본 (읽기 전용)
├── config/
│   ├── scoring.json              #   카테고리별 평가 기준·가중치
│   ├── exchange_rate.json        #   환율 SSOT (1 AUD ≈ 1,030원)
│   └── trip.json                 #   여행 일정 설정
├── data/
│   ├── places/attraction/        #   장소별 상세 JSON (110개)
│   ├── scores/
│   │   ├── attraction_scored.json    # 종합 평가 결과
│   │   ├── scorer_A/B/C.json        # 개별 평가자 결과
│   │   └── RANKINGS.md              # 랭킹 (정적 마크다운 버전)
│   ├── routes/
│   │   ├── route_data.json          # 루트 경유지·좌표·거리 SSOT
│   │   └── route_geometry.json      # OSRM 경로 geometry
│   ├── lodging/
│   │   └── lodging_data.json        # 숙소 데이터 SSOT (77개)
│   ├── dining/
│   │   └── dining_data.json         # 식당 데이터 SSOT (126개)
│   ├── activities/
│   │   └── activities_data.json     # 액티비티 데이터 SSOT (109개)
│   └── regions.json              #   좌표 기반 지역 분류 (15개 지역)
├── research/
│   ├── deep-research/            #   외부 AI 딥 리서치
│   ├── claude-research/          #   Claude Code 직접 조사
│   │   ├── accommodation/        #     숙소 리서치
│   │   ├── activities/           #     액티비티 리서치
│   │   ├── dining/               #     식당 리서치
│   │   ├── places/               #     지역별 장소 리서치
│   │   └── weather/              #     지역별 날씨 조사
│   ├── route-plans/              #   로드트립 루트 후보 상세 일정 (1~9조)
│   └── sydney-plans/             #   시드니 Day 6~7 세부 일정 계획 (5개 조)
└── scripts/
    ├── parse_googlemaps.py       #   Phase 1: GoogleMaps 전처리
    ├── generate_frontend.py      #   평가 결과 → RANKINGS.md + place_data.json
    ├── sync_engine.py            #   인라인 마커 동기화 엔진
    ├── sync_route_docs.py        #   루트 MD ↔ route_data.json 동기화
    ├── sync_data_docs.py         #   숙소/식당/액티비티 종합문서 ↔ JSON 동기화
    ├── fetch_route_geometry.py   #   OSRM API → 경로 geometry 생성
    └── utils/
        ├── __init__.py
        └── geo.py                #   좌표/거리 계산, 지역 할당
```

---

## 워크플로우 (4 Phase)

| Phase | 작업 | 상태 |
|:------|:-----|:----:|
| 1. 전처리 | GoogleMaps → 장소 stub + 지역 분류 + 중복 탐지 | ✅ |
| 2. 정보 수집 | 웹검색으로 리뷰·운영정보 수집 | ✅ |
| 3. 평가/등급 | 3명 페르소나 독립 평가 → 퍼센타일 등급 (S~D) | ✅ |
| 4. 일정 생성 | 등급·지리·제약 기반 일정 구성 | ✅ |

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

# 인라인 마커 기반 데이터 동기화 (SSOT → 루트 MD + README + route_data.json)
python scripts/sync_route_docs.py              # dry-run: 불일치 리포트
python scripts/sync_route_docs.py --fix        # 마커 값 교체 + route_data.json 자동 정합

# 숙소/식당/액티비티 종합 문서 ↔ data/ JSON 동기화
python scripts/sync_data_docs.py              # dry-run: 불일치 리포트
python scripts/sync_data_docs.py --fix        # 마커 값 교체

# 루트 도로 geometry 생성 (OSRM API)
python scripts/fetch_route_geometry.py        # data/routes/route_geometry.json 생성
```

Python 3.11+ 표준 라이브러리만 사용. 외부 의존성 없음.

### 로컬 개발

```bash
bundle exec jekyll serve
# → http://localhost:4000/AustraliaTravel/
```

---

## 시드니 Day 6~7 코스 순위

시드니 2일 코스 5개 안에 대한 [CRITIC_ROUTE](docs/CRITIC_ROUTE.md) 평가 결과 (3명 페르소나 독립 채점 평균):

| 순위 | 안 | 평균 | 설계(A') | 감성(B') | 실행(C') | 예산(2인) | 논쟁 |
|:----:|:---|:----:|:-------:|:-------:|:-------:|:---------:|:----:|
| 🥇 | 1조 클래식 하이라이트 | **77.7** | 75.5 | 80.5 | 77.0 | ₩36.5만 | |
| 🥈 | 5조 로컬 숨은보석 | **76.8** | 76.5 | 83.5 | 70.5 | ₩47.5만 | |
| 🥉 | 4조 Vivid 올인 | **74.3** | 74.5 | 82.0 | 66.5 | ₩41~51만 | O |
| 4 | 3조 호주정체성 탐험 | **72.5** | 71.0 | 78.0 | 68.5 | ₩60.7만 | |
| 5 | 2조 BridgeClimb 프리미엄 | **70.8** | 70.0 | 80.0 | 62.5 | ₩93.8만 | O |

> 상세 일정 및 평가 근거: [routes.html 시드니 탭](https://haechan.github.io/AustraliaTravel/routes.html) / `research/sydney-plans/`

---

<div align="center">

Built mainly with <img src="https://img.shields.io/badge/Claude_Code-191919?style=flat&logo=anthropic&logoColor=white" alt="Claude Code" valign="middle" />
<br/>
Supported by <img src="https://img.shields.io/badge/Gemini-4285F4?style=flat&logo=google&logoColor=white" alt="Gemini" valign="middle" /> <img src="https://img.shields.io/badge/ChatGPT-74aa9c?style=flat&logo=openai&logoColor=white" alt="ChatGPT" valign="middle" />

</div>
