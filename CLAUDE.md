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
- **`docs/CRITIC.md`**: 평가 페르소나 3명(효율 전략가/감성 탐험가/현실주의 비평가)의 정의와 페르소나별 가중치. 평가 워크플로우(리서치 분업→통합→해석 분화→가중합), 기준별 채점 가이드라인 포함.
- **`docs/CRITIC_ROUTE.md`**: 루트 후보 평가 전용 페르소나 및 기준. CRITIC.md의 루트 버전으로, 설계/감성/실행 3관점 평가 프레임워크 정의.
- **`docs/TRAVELER_PROFILE.md`**: 여행자 프로필 및 선호도 설문 결과. 운전 내성, 여행 스타일, 예산 범위 등 개인 선호 정의.

## 워크플로우 (5 Phase)

1. **전처리**: `GoogleMaps/*.json` → `data/places/{category}/{id}.json` stub 생성 + `data/regions.json`
2. **정보 수집**: 웹검색으로 장소별 상세정보·리뷰 수집 → place JSON의 `collected_data` 채움, `research/claude-research/`에 리서치 저장
3. **평가/등급**: 수집 데이터 기반 S~D 등급 부여 → `data/scores/{category}_scored.json`
4. **일정 생성**: 대화형으로 일정 구성 → `docs/ITINERARY.md`에 직접 기록
5. **일정 리뷰**: 확정 일정을 비판적으로 검토 → `research/claude-research/`에 근거 저장, `docs/ITINERARY.md`에 리뷰 반영

## 현재 진행 상황

- Phase 1 (전처리): ✅ 완료 — 109개 attraction (중복 2개 제거: `669a240e` 코알라 병원 중복, `7a922fd8` 스탠웰 탑스 빈 stub)
- Phase 2 (정보 수집): ✅ 완료 — 109개 장소 collected_data 채움, 15개 지역 분류, 주제별·지역별 리서치 30건+
- Phase 3 (평가/등급): ✅ 완료 — CRITIC.md 페르소나 기반 109곳 평가. 퍼센타일 등급: S:6 A:22 B:38 C:33 D:10 (may_adjusted_score 기준 단일 `grade`). 논쟁 장소 37곳
- Phase 4 (일정 생성): 🔄 진행 중 — 9개 루트 후보 완성 (1~9조), CRITIC_ROUTE v7 재평가 완료. 식사 시간 보완 + 전면 재평가로 순위 변동: 5조 7→5위(▲2), 7조 5→6위(▼1). 상위 3개 유지(6조→2조→8조). 최종 루트 선택 미결정, ITINERARY.md는 5/23~24일만 상세 작성
- Phase 5 (일정 리뷰): ⬜ 미시작
- 액티비티 리서치: ✅ 완료 — 10개 지역 100개+ 체험 활동 조사 (5개 신규 + 5개 보강: 은하수·우천대안·커플체험 추가)
- 향후: 음식점·숙소 데이터 수집 및 평가 예정, 관광지 추가도 가능

## 에이전트 작업 체크리스트

> Phase 3 재평가나 계절 보정 변경 시 수행해야 할 작업. 자동화 가능한 부분은 스크립트로, 나머지는 에이전트가 수동 처리.

### 재평가 후 루트 파일 동기화
1. `python scripts/update_route_scores.py --fix` — 점수 일괄 업데이트 (자동)
2. `grade` 변경 장소 확인 → 등급 레이블(S/A/B 등) 수동 수정 (에이전트)
3. 각 루트의 S등급 방문 수 재계산 → 헤더/요약/테이블 수정 (에이전트)
4. `research/route-plans/README.md` 종합 순위표 S등급 열 수정 (에이전트)
5. 이 파일(`CLAUDE.md`) 진행 상황 갱신

### v7 재평가 완료 (2026-03-18)
- [x] CRITIC_ROUTE v7 식사 시간 보완 + 전면 재평가 (전 루트)
- [x] 9개 루트 파일 v7 재평가 섹션 추가
- [x] README.md 종합 순위표 v7 업데이트
- [x] route_data.json 프론트엔드 데이터 동기화
- [x] CLAUDE.md 진행 상황 갱신

### v6 재평가 완료 (2026-03-17)
- [x] CRITIC_ROUTE v6 5월 보정 등급 기반 전 루트 재평가
- [x] 5개 루트 파일 수정 (1조, 3조, 4조, 8조, 9조)
- [x] README.md 종합 순위표 v6 업데이트
- [x] route_data.json 프론트엔드 데이터 동기화
- [x] CLAUDE.md 진행 상황 갱신

### Phase 4→5 전환 시
- [ ] 9개 루트 중 최종 선택 → `docs/ITINERARY.md`에 반영
- [ ] Phase 5 리뷰 시작 → `research/claude-research/` 근거 저장

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

# 루트 파일 점수 정합성 검증/수정
python scripts/update_route_scores.py            # 불일치 리포트만 (dry-run)
python scripts/update_route_scores.py --fix      # 실제 수정
python scripts/update_route_scores.py --fix --verbose  # 상세 로그 포함
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
| 루트 비교 | `routes.html` | `assets/js/routes.js` | `assets/data/route_data.json` |
| 액티비티 후보 | `activities.html` | `assets/js/activities.js` | — |
| 루트 상세 (리다이렉트) | `route-plans.html` | — | — → `routes.html`로 리다이렉트 |

- `place_data.json`은 `scripts/generate_frontend.py`로 자동 생성, `route_data.json`은 수동 작성/관리
- 외부 라이브러리: Leaflet.js 1.9.4 (CDN, `routes.html`에서 지도 렌더링용)
- 레이아웃: `_layouts/default.html`, 스타일: `assets/css/style.scss`

## 주요 설계 원칙

- AI 평가 시 점수와 **판단 근거(reason)**를 반드시 함께 기록
- 리뷰 시 긍정·비판을 동등 비중으로 조사 (확증 편향 방지)
- 최종 결정은 사용자가 한다 — AI는 정보 수집과 초안 제안까지

## 언어

프로젝트 전체가 한국어로 작성됨. 응답과 파일 작성 시 한국어 사용.
