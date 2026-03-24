# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

호주 시드니↔NSW 북부 해안 로드트립(2026년 5월) 여행 플래너. 구글맵에서 내보낸 후보지 데이터를 전처리하고, AI가 정보 수집·평가·일정 생성·리뷰를 수행한다. 대부분의 작업은 Claude Code 대화형으로 진행되며, Python 스크립트는 반복 연산 보조용.

## 핵심 문서 역할

- **`docs/META.md`**: 여행 전제 조건 (항공, 렌터카, 일정 프레임, 제약 조건). 고정된 사실.
- **`docs/SPEC.md`**: 기술 설계서 (데이터 스키마, Phase별 워크플로우, 평가 기준). 구현 명세.
- **`docs/ITINERARY.md`**: 확정 일정의 **Single Source of Truth**. 일정 변경은 반드시 여기에 반영.
- **`config/trip.json`**: 일정 생성 설정 (여행 스타일, 우선순위, 필수 포함/제외 장소).
- **`config/scoring.json`**: 카테고리별 평가 기준 및 가중치.
- **`config/exchange_rate.json`**: 환율의 **Single Source of Truth**. 현재 1 AUD ≈ 1,030원 (2026-03-19 기준). 환율 변경 시 이 파일을 먼저 수정하고, `affected_files` 목록의 파일들을 동기화할 것.
- **`docs/CRITIC.md`**: 평가 페르소나 3명(효율 전략가/감성 탐험가/현실주의 비평가)의 정의와 페르소나별 가중치. 평가 워크플로우(리서치 분업→통합→해석 분화→가중합), 기준별 채점 가이드라인 포함.
- **`docs/CRITIC_ROUTE.md`**: 루트 후보 평가 전용 페르소나 및 기준. CRITIC.md의 루트 버전으로, 설계/감성/실행 3관점 평가 프레임워크 정의.
- **`docs/CRITIC_LODGING.md`**: 숙소 평가 전용 페르소나(가성비 전략가/감성 큐레이터/실용 검증자) 및 7개 기준(L1~L7). 거점별 상대 순위 방식.
- **`research/claude-research/accommodation/숙소_종합비교.md`**: 숙소 수치의 **Single Source of Truth(SSOT)**. 리서치·채점·비선정 수, 거점별 TOP 순위, 예산 시뮬레이션. 숙소 숫자 변경 시 이 파일을 먼저 갱신하고 다른 문서에 반영.
- **`research/claude-research/dining/식당_종합가이드.md`**: 식당 수치의 **Single Source of Truth(SSOT)**. 리서치·채점·라벨·논쟁 수, 거점별 TOP 순위, 예산 시나리오, 일별 식사 계획. 식당 숫자 변경 시 이 파일을 먼저 갱신하고 다른 문서에 반영.
- **`research/claude-research/activities/액티비티_종합가이드.md`**: 액티비티 수치의 **Single Source of Truth(SSOT)**. 10개 지역 109개 액티비티 리서치 현황, 5월 적합도 분포, 6조 루트 기준 지역별 핵심 액티비티, 주제별 횡단 가이드(고래·은하수·서핑·커플), 비용 시뮬레이션. 액티비티 숫자 변경 시 이 파일을 먼저 갱신하고 다른 문서에 반영.
- **`docs/TRAVELER_PROFILE.md`**: 여행자 프로필 및 선호도 설문 결과. 운전 내성, 여행 스타일, 예산 범위 등 개인 선호 정의.

## 워크플로우 (4 Phase)

1. **전처리**: `GoogleMaps/*.json` → `data/places/{category}/{id}.json` stub 생성 + `data/regions.json`
2. **정보 수집**: 웹검색으로 장소별 상세정보·리뷰 수집 → place JSON의 `collected_data` 채움, `research/claude-research/`에 리서치 저장
3. **평가/등급**: 수집 데이터 기반 S~D 등급 부여 → `data/scores/{category}_scored.json`
4. **일정 생성**: 대화형으로 일정 구성 → `docs/ITINERARY.md`에 직접 기록

## 현재 진행 상황

- Phase 1 (전처리): ✅ 완료 — 110개 attraction (중복 2개 제거 + 도리고 스카이워크 신규: `5fad89b9`)
- Phase 2 (정보 수집): ✅ 완료 — 110개 장소 collected_data 채움, 15개 지역 분류, 주제별·지역별 리서치 30건+
- Phase 3 (평가/등급): ✅ 완료 — CRITIC.md 페르소나 기반 110곳 평가. 퍼센타일 등급: S:6 A:22 B:38 C:33 D:11 (may_adjusted_score 기준 단일 `grade`). 논쟁 장소 37곳
- Phase 4 (일정 생성): ✅ 완료 — **6조 확정** (바이런직행+블루마운틴, v7 1위 78.0점). ITINERARY.md 이동일정 전일 작성 완료 (숙소·식당은 미확정). 9개 루트 후보 비교 → CRITIC_ROUTE v7 재평가 → 6조 최종 선택 (2026-03-20)
- 액티비티 리서치: ✅ 완료 — 10개 지역 109개 체험 활동 조사 (5개 신규 + 5개 보강: 은하수·우천대안·커플체험 추가)
- 숙소 평가 프레임워크: ✅ 완료 — CRITIC_LODGING.md 작성 완료 (3명 페르소나 A''/B''/C'', 7개 기준 L1~L7, 거점별 상대 순위 방식). 6조 기준 6개 거점 맥락 정의, scoring.json 동기화 완료
- 숙소 리서치: ✅ 완료 — 6개 거점 62개 기본후보 + 33개 투자후보 조사, 복수 플랫폼(Booking/TA/Google/공식사이트) 가격·리뷰 수집. 상세는 종합비교.md 참조
- 숙소 평가: ✅ 완료 — CRITIC_LODGING.md 기반 기본평가 44개 + 투자평가 33개 = 총 77개 CRITIC 채점(비선정 18개 별도). 3명 페르소나 독립 채점, 웹 추가 조사(Google/Booking/TA/공식사이트/블로그), 일정 맥락(도착시간·뷰 활용가능성·체크인 방식) 반영. **기본평가/투자평가 탭 분리 완료** — lodging.html에서 평가 완료 **77개 전체** 표시(프레임별 탭 전환: 기본 44개 $150~300 / 투자 33개 $300~900). 이중평가 숙소(Marina Resort 등)는 두 탭에 각 프레임 점수로 표시. 상세 수치는 종합비교.md(SSOT) 참조
- 식당 평가 프레임워크: ✅ 완료 — CRITIC_DINING.md 작성 완료 (3명 페르소나 A''' 동선 미식가 / B''' 미식 큐레이터 / C''' 리뷰 검증자, 6개 기준 F1~F6, 지역별+식사유형별 상대 순위 방식). scoring.json 동기화 완료
- 식당 리서치: ✅ 완료 — 6개 거점 + 10개 경유지 140개+ 식당/체험 조사 (1차 7팀 + 2차 5팀 병렬 리서치). 호주 공원 BBQ 가이드, 파머스마켓 일정, 호주 고유 음식 체험 포함
- 식당 평가: ✅ 완료 — CRITIC_DINING.md 프레임워크 기반 6개 거점 126개 식당 3명 페르소나 독립 채점. 거점별 식사유형별 추천/차선/가능/비추 라벨 부여(추천 35·차선 30·가능 47·비추 14). 논쟁 식당 56곳(44%) 식별. 상세 수치는 식당_종합가이드.md(SSOT) 참조
- 숙소 예약: ✅ 5박 확정 — Discovery Parks(바이런), Park Beach Resort(콥스), Surf Beach Motel(포트맥쿼리), Hotel Nelson(넬슨베이), Farm Tiny Home(블루마운틴). 시드니 2박 미확정
- 시드니 숙소 추가 리서치: ✅ 완료 (2026-03-23) — 4개 팀 병렬 리서치로 **37개 신규 옵션** 발굴 (뷰 호텔 7 + 에어비앤비 11 + 가성비 12 + 부티크 7). 2박 조합 전략 4가지 분석 (뷰+공항/가성비+뷰/동일숙소/에어비앤비+공항). 3개 시나리오 최종 추천. 상세는 `research/claude-research/accommodation/시드니_추가리서치_2박전략.md`
- 시드니 특별 체험 리서치: ✅ 완료 (2026-03-23) — 3개 팀 병렬 리서치 + 팩트체크(9/9 확인). Vivid 2026 확정 프로그램(드론쇼 Star-Bound, Fire Kitchen, Saltbush&Starlight), 유니크 체험(BridgeClimb Vivid, 원주민 투어, Icebergs, 피쉬마켓 신축), 호주 특색 음식(록 오이스터, 캥거루 피자, Midden). 3개 시나리오 일정 편입안. 상세는 `research/claude-research/activities/시드니_특별체험_종합가이드.md`, 음식 상세는 `research/claude-research/dining/시드니_호주특색음식_체험_리서치.md`
- 향후: 시드니 숙소 확정 + 식당 확정 → ITINERARY.md 통합

## 에이전트 작업 체크리스트

> Phase 3 재평가나 계절 보정 변경 시 수행해야 할 작업. 자동화 가능한 부분은 스크립트로, 나머지는 에이전트가 수동 처리.

### 재평가 후 루트 파일 동기화
1. `python scripts/update_route_scores.py --fix` — 점수 일괄 업데이트 (자동)
2. `python scripts/sync_route_docs.py --fix` — 거리·등급집계·마커 값 자동 동기화
3. 이 파일(`CLAUDE.md`) 진행 상황 갱신

### v7 재평가 완료 (2026-03-18)
- [x] CRITIC_ROUTE v7 식사 시간 보완 + 전면 재평가 (전 루트)
- [x] 9개 루트 파일 v7 재평가 섹션 추가
- [x] README.md 종합 순위표 v7 업데이트
- [x] route_data.json 프론트엔드 데이터 동기화
- [x] CLAUDE.md 진행 상황 갱신

### SSOT 리팩토링 완료 (2026-03-20)
- [x] v5/v6 과거 평가 기록 삭제 (9개 루트 + README, v7만 유지)
- [x] SSOT 폴더 구조 생성 (`data/routes/`, `data/lodging/`, `data/dining/`, `data/activities/`)
- [x] JS 하드코딩 데이터 → JSON 분리 (lodging 77개, dining 126개, activities 109개)
- [x] JS fetch 전환 (lodging/dining/activities/routes)
- [x] route_data.json 거리 정합 (day_km = stops 합산, 17건 수정)
- [x] 인라인 마커 시스템 구축 (`sync_engine.py` + `sync_route_docs.py`)
- [x] 마커 삽입 Phase 1: 헤더/종합표 51건 마커 삽입
- [x] 숙소/식당/액티비티 SSOT 리팩토링: JS 하드코딩 완전 제거 (INVEST_NAMES, BUDGET_PICKS, SCENARIOS → JSON)
- [x] 숙소/식당/액티비티 종합 문서 마커 삽입 (`sync_data_docs.py`, 108건: 숙소 18 + 식당 43 + 액티비티 47)

### 남은 작업
- [x] 9개 루트 중 최종 선택 → 6조 확정 (2026-03-20), `docs/ITINERARY.md`에 이동일정 반영 완료
- [x] 숙소 5박 확정 → ITINERARY.md 통합 (2026-03-23)
- [ ] 시드니 숙소 2박 + 식당 확정 → ITINERARY.md 통합

## 스크립트 실행

```bash
# Phase 1: GoogleMaps 전처리 (stub 생성, 지역 할당, 중복 탐지)
python scripts/parse_googlemaps.py

# 변경 감지 리포트만 (파일 생성 없이)
python scripts/parse_googlemaps.py --diff-only

# Phase 3 이후: 프론트엔드 데이터 + RANKINGS.md 생성
python scripts/generate_frontend.py            # 전체 (재채점 + RANKINGS + place_data)
python scripts/generate_frontend.py --rescore  # 등급 재계산만
python scripts/generate_frontend.py --rank     # RANKINGS.md만
python scripts/generate_frontend.py --data     # place_data.json만

# 인라인 마커 기반 데이터 동기화 (SSOT → 루트 MD + README + route_data.json)
python scripts/sync_route_docs.py              # dry-run: 불일치 리포트
python scripts/sync_route_docs.py --fix        # 마커 값 교체 + route_data.json 자동 정합
python scripts/sync_route_docs.py --init       # 기존 문서에 마커 삽입 (dry-run)
python scripts/sync_route_docs.py --init --fix # 마커 실제 삽입
python scripts/sync_route_docs.py --check-only # CI용: 불일치 시 exit 1

# 숙소/식당/액티비티 종합 문서 ↔ data/ JSON 동기화
python scripts/sync_data_docs.py              # dry-run: 불일치 리포트
python scripts/sync_data_docs.py --fix        # 마커 값 교체
python scripts/sync_data_docs.py --check-only # CI용: 불일치 시 exit 1

# 루트 도로 geometry 생성 (OSRM API → encoded polyline)
python scripts/fetch_route_geometry.py           # data/routes/route_geometry.json 생성 (~2분, 빌드 타임 전용)
```

외부 의존성 없음. Python 3.11+ 표준 라이브러리만 사용.

## 데이터 규칙

- **`GoogleMaps/`는 읽기 전용** — 원본 GeoJSON 절대 수정 금지
- 장소 ID는 좌표 SHA-256 해시 앞 8자 (예: `b484de1d`)
- `collected_data`가 `null`이면 미수집 장소 (Phase 2 필요)
- 리뷰 수집은 **작년 동월**(`same_month_last_year`)과 **최근 6개월**(`recent_6_months`) 2구간으로 분리
- 좌표 형식: `[lng, lat]` (GeoJSON 표준)
- **등급은 단일 `grade`**: `may_adjusted_score`(5월 계절 보정 후) 기준 퍼센타일 등급. 프로젝트 전체에서 이 등급만 사용
- **이동거리는 실제 도로 거리**: OSRM API로 산출한 실제 도로 주행 거리를 사용. 직선거리나 근사값(~) 사용 금지
- **거리 SSOT 체계**: `stops[].distance_km`(구간별) → `day_km`(일별 합산) → `total_km`(전체 합산) 단방향 집계. `day_km`과 `total_km`은 자동 계산 (`sync_route_docs.py --fix`)
- **인라인 마커**: 루트 MD/README의 동기화 대상 숫자에 `<!-- sync:NS:KEY -->값<!-- /sync -->` 마커 사용. SSOT 변경 시 `sync_route_docs.py --fix`로 자동 갱신

## SSOT 데이터 구조

```
data/
  scores/attraction_scored.json    ← 관광지 점수·등급 SSOT
  routes/route_data.json           ← 루트 거리·stops SSOT
  routes/route_geometry.json       ← OSRM 경로 geometry
  lodging/lodging_data.json        ← 숙소 데이터 SSOT (77개: 기본 44 + 투자 33)
  lodging/bookings.json            ← 확정 예약 정보 (5박, 시설·주변관광·조치사항 포함)
  dining/dining_data.json          ← 식당 데이터 SSOT (126개, 예산 시나리오 포함)
  activities/activities_data.json  ← 액티비티 데이터 SSOT (109개, 10개 지역)
  regions.json                     ← 지역 분류
  places/attraction/               ← 110개 관광지 raw 데이터
```

### 데이터 흐름

```
data/ JSON (SSOT 원본)
  │
  ├─→ 프론트엔드 (JS fetch, 자동)
  │     lodging.js, dining.js, activities.js, routes.js, rankings.js
  │     → HTML에서 수치·카드·지도 자동 렌더링
  │
  ├─→ research/ 종합 문서 (sync_data_docs.py --fix, 자동)
  │     숙소_종합비교.md, 식당_종합가이드.md, 액티비티_종합가이드.md
  │     → 인라인 마커 값 자동 교체 (108개 마커)
  │
  └─→ 루트 MD + README (sync_route_docs.py --fix, 자동)
        research/route-plans/*.md
        → 거리·등급·점수 마커 값 자동 교체
```

**수동 관리 대상**: `README.md`·`index.md`의 배지/등급표, `CLAUDE.md` 진행 상황, `docs/SPEC.md` 설계서 수치. 이들은 프로젝트 소개/설계 문서 성격이므로 큰 변경 시에만 갱신.

## 리서치 파일 구조

- `research/deep-research/`: 외부 AI(ChatGPT, Gemini) 딥 리서치. 파일명 `{주제}_{출처}.md`
- `research/claude-research/`: Claude Code 직접 조사. 파일명 `{주제}.md`
  - `places/`: 지역별 장소 리서치 요약
  - `weather/`: 지역별 날씨 조사
  - `activities/`: 지역별 액티비티 리서치
  - 루트(root): 여행환경·계절보정, 루트평가·운전패턴, 장소 심층리뷰, UI 리서치 등
- `research/route-plans/`: 루트 후보 상세 일정 (1~9조) + 종합 순위표(README.md)

## 프론트엔드 구조 (Jekyll + GitHub Pages)

Jekyll 기반 정적 사이트로 데이터를 시각화한다. `_config.yml`에서 `jekyll-theme-cayman` 테마 사용.

| 페이지 | 파일 | JS | 데이터 소스 |
|--------|------|----|-------------|
| 메인 | `index.md` | — | — |
| 관광지 랭킹 | `rankings.html` | `assets/js/rankings.js` | `assets/data/place_data.json` |
| 루트 비교 | `routes.html` | `assets/js/routes.js` | `data/routes/route_data.json` + `data/routes/route_geometry.json` |
| 액티비티 후보 | `activities.html` | `assets/js/activities.js` | `data/activities/activities_data.json` |
| 숙소 후보 | `lodging.html` | `assets/js/lodging.js` | `data/lodging/lodging_data.json` |
| 식당 후보 | `dining.html` | `assets/js/dining.js` | `data/dining/dining_data.json` |
| 루트 상세 (리다이렉트) | `route-plans.html` | — | — → `routes.html`로 리다이렉트 |

- `place_data.json`은 `scripts/generate_frontend.py`로 자동 생성, `route_data.json`은 수동 작성/관리 (거리 자동 정합: `sync_route_docs.py --fix`), `route_geometry.json`은 `scripts/fetch_route_geometry.py`로 OSRM에서 자동 생성
- 숙소/식당/액티비티 데이터는 `data/` 아래 JSON으로 분리 관리, JS는 fetch로 로드
- 외부 라이브러리: Leaflet.js 1.9.4 (CDN, `routes.html`에서 지도 렌더링용)
- 레이아웃: `_layouts/default.html`, 스타일: `assets/css/style.scss`

## 주요 설계 원칙

- AI 평가 시 점수와 **판단 근거(reason)**를 반드시 함께 기록
- 리뷰 시 긍정·비판을 동등 비중으로 조사 (확증 편향 방지)
- 최종 결정은 사용자가 한다 — AI는 정보 수집과 초안 제안까지

## 언어

프로젝트 전체가 한국어로 작성됨. 응답과 파일 작성 시 한국어 사용.
