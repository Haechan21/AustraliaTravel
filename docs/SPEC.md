# 호주여행 플래너 - 프로젝트 SPEC

> **이 문서는**: 코드베이스의 기술 설계서. 데이터 스키마, 워크플로우 구조, 평가 기준 등 **구현에 필요한 모든 기술적 명세**를 정의한다.
> 여행 일정, 항공, 렌터카, 제약 조건 등 **여행 자체에 대한 정보**는 [`META.md`](./META.md)를 참조.

## 1. 프로젝트 목적

구글맵에서 내보낸 여행 후보지 데이터를 기반으로:

1. 각 장소의 리뷰와 상세 정보를 **조사·수집**한다.
2. 커스텀 기준으로 **평가/등급**을 부여한다.
3. 등급과 지리 정보를 기반으로 **최적 여행 일정**을 생성한다.

핵심 가치: 수백 개의 후보지를 사람이 일일이 비교하는 대신, AI가 정보를 모아 판단 근거를 제공하고, 최종 결정은 사람이 한다.

---

## 2. 시스템 아키텍처

### 2.1 전체 흐름

```
[입력]                    [처리]                      [출력]
GoogleMaps/*.json ──→ Phase 1: 전처리 ──→ data/places/
                      Phase 2: 정보 수집 ──→ data/places/ (enriched)
                                            research/claude-research/
                      Phase 3: 평가/등급 ──→ data/scores/
                      Phase 4: 일정 생성 ──→ ITINERARY.md (확정 일정)
                      Phase 5: 일정 리뷰 ──→ ITINERARY.md (리뷰 요약 + 상세)
                                            research/claude-research/
```

각 Phase는 개념적 단계 구분이다. 실제 작업은 대부분 **Claude Code와의 대화**로 수행되며, 각 Phase를 반드시 순서대로 거칠 필요는 없다. 예를 들어, Phase 2(정보 수집)와 Phase 4(일정 생성)를 대화 중에 동시에 진행할 수 있다.

### 2.2 실행 방식: 대화형 주도 + 선택적 자동화

이 프로젝트는 **Claude Code 대화형 작업이 주된 실행 방식**이다. Python 스크립트는 반복적 연산이 필요할 때 선택적으로 활용한다.

| 방식 | 용도 | 장점 |
|------|------|------|
| **Claude Code 대화형** (주) | 정보 수집, 리뷰 분석, 평가 판단, 일정 생성/조정, 리뷰 | 유연성, 맥락 이해, 즉시 반영 |
| **Python 스크립트** (보조) | 변경 감지, 좌표 계산, 지역 할당, 중복 탐지 등 반복 가능한 연산 | 재현성, 자동화 |

일정 생성(Phase 4)은 사용자와 Claude Code의 대화를 통해 이루어졌으며, 결과는 `ITINERARY.md`에 직접 기록된다. 전처리(Phase 1)와 같은 반복 연산은 스크립트로 자동화할 수 있다.

---

## 3. 데이터 설계

### 3.1 입력: GoogleMaps/

구글맵 "내 장소 목록"에서 내보낸 GeoJSON 파일. **날짜 기반 파일명**으로 단일 파일 관리한다.

```
GoogleMaps/
├── 2026-03-11.json       # 내보내기 날짜 기준
├── 2026-03-20.json       # 이후 추가 내보내기
└── ...
```

하나의 JSON 파일 안에 관광지, 음식점, 숙소 등 **모든 카테고리가 혼합**되어 있다. 카테고리 구분은 `properties.name` 필드로 한다.

**GeoJSON 원본 구조**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [lng, lat] },
      "properties": {
        "name": "(카테고리를 나타내는 리스트명)",
        "address": "(장소명 + 상세주소가 혼합된 문자열)"
      }
    }
  ]
}
```

**`name` 필드 → 카테고리 매핑 규칙**:

| `properties.name` 값 | 카테고리 | 설명 |
|----------------------|----------|------|
| `"호주여행"` | `attraction` | 관광지, 여행지 |
| `"호주음식"` | `restaurant` | 음식점, 카페 |
| `"호주숙소"` | `accommodation` | 숙소 |

> **현재 상태**: GoogleMaps 데이터에는 `"호주여행"` (관광지, 110개 — 중복 2개 제거 + 도리고 스카이워크 수동 추가)만 존재한다. `"호주음식"`, `"호주숙소"` 데이터는 향후 추가 예정이며, 관광지도 계속 늘어날 수 있다.

> 새 카테고리가 필요하면 구글맵에서 새 리스트명으로 저장하고, 매핑 규칙을 추가한다.

> **설계 고려사항**: `name` 필드는 장소명이 아닌 카테고리 식별자다. 실제 장소명은 Phase 2에서 좌표 기반 웹검색으로 확인한다.

### 3.2 가공 데이터: data/

> **현재 상태**: `data/places/attraction/`에 110개 JSON이 생성되어 있다 (좌표, address 원문, 지역 할당 완료). Phase 2 완료로 `name`, `name_ko`, `collected_data`가 모두 채워진 상태. 중복 2개 제거됨: `669a240e`(코알라 병원 — `642731d5`와 Google Place ID 동일), `7a922fd8`(스탠웰 탑스 근처 빈 stub). 도리고 스카이워크(`5fad89b9`) 수동 추가.

#### 장소 정보 (`data/places/{category}/{id}.json`)

전처리 후 생성되는 장소별 단일 파일. 수집 단계를 거치며 점진적으로 필드가 채워진다.

```json
{
  "id": "string (좌표 해시 8자, Phase 2 이후 slug로 교체 가능)",
  "name": "string (영문 또는 현지어, Phase 2에서 채움)",
  "name_ko": "string (한국어, Phase 2에서 채움)",
  "category": "attraction | restaurant | accommodation",
  "source_file": "2026-03-11.json",
  "address_raw": "string (GoogleMaps address 필드 원문 보존)",
  "google_maps_url": "string (구글맵 URL, Phase 2에서 채움)",

  "location": {
    "coordinates": { "lng": 0.0, "lat": 0.0 },
    "address": "string (Phase 2에서 정리된 주소)",
    "region": "string (좌표 기반 지역 할당)"
  },

  "collected_data": {
    "rating": null,
    "total_reviews": null,
    "price_level": null,
    "opening_hours": null,
    "review_summary": {
      "same_month_last_year": {
        "period": null,
        "count": 0,
        "positive": [],
        "negative": [],
        "seasonal_notes": null
      },
      "recent_6_months": {
        "period": null,
        "count": 0,
        "positive": [],
        "negative": [],
        "status_notes": null
      },
      "tips": []
    },
    "collected_at": null,
    "logistics": {
      "parking": null,
      "road_condition": null,
      "nearby_attractions": [],
      "peak_times": null,
      "public_transport": null
    },
    "experience": {
      "photo_spots": [],          // string[] (배열 통일)
      "golden_hour": null,
      "seasonal_beauty": null,
      "hidden_gems": [],          // string[] (배열 통일)
      "sensory_notes": null
    },
    "risk_check": {
      "negative_review_patterns": [],  // string[] (배열 통일)
      "may_operation": null,
      "safety_issues": null,
      "weather_impact": null,
      "quality_trend": null
    }
  },

  "metadata": {
    "estimated_visit_duration_min": null,
    "cost_aud": null,
    "best_time": null,
    "weather_dependent": null,
    "reservation_required": null
  }
}
```

**`nearby_attractions` 필드 형식** (선택적 필드):

배열 형식으로 통일. 각 원소는 객체이며, `name`만 필수이고 나머지는 선택적이다.

```json
"nearby_attractions": [
  {"name": "장소명", "distance_km": 5, "drive_min": 10},
  {"name": "장소명", "walk_min": 15},
  {"name": "장소명"}
]
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | O | 인근 장소명 (한국어명 사용) |
| `distance_km` | number | - | 거리 (km). 같은 위치면 0 |
| `drive_min` | number | - | 차량 이동 시간 (분) |
| `walk_min` | number | - | 도보 이동 시간 (분) |
| `ferry_min` | number | - | 페리 이동 시간 (분) |

**설계 원칙**:
- `collected_data`가 `null`이면 아직 수집되지 않은 장소 (Phase 2 미완료)
- `collected_at` 타임스탬프로 데이터 신선도 판단. 수집 후 일정 기간 경과 시 재수집 가능
- `source_file` 필드로 데이터 원본 파일을 추적

#### 평가 결과 (`data/scores/{category}_scored.json`)

카테고리별 전체 장소의 점수와 등급을 담은 단일 파일.

```json
{
  "generated_at": "2026-03-13",
  "category": "attraction",
  "total_places": 110,
  "grading_method": "percentile",
  "grading_note": "grade는 may_adjusted_score(5월 계절 보정) 기준 퍼센타일 등급",
  "grading_cutoffs": { "S": "1~6위", "A": "7~28위", "B": "29~66위", "C": "67~99위", "D": "100~110위" },
  "grade_distribution": { "S": 6, "A": 22, "B": 38, "C": 33, "D": 11 },
  "controversial_count": 37,
  "scores": [
    {
      "id": "string",
      "name_ko": "string",
      "region": "string",
      "scores": { "A": 75.0, "B": 95.5, "C": 86.0 },
      "average_score": 85.5,
      "spread": 20.5,
      "controversial": true,
      "grade": "S",
      "seasonal_adjustment": 5,
      "may_adjusted_score": 90.5
    }
  ]
}
```

> **등급 기준**: `grade`는 `may_adjusted_score`(5월 계절 보정 후) 기준 퍼센타일 등급. 프로젝트 전체에서 이 단일 등급을 사용한다. 보정 전 원점수는 `average_score`에 보존되어 있으며, 보정값은 `seasonal_adjustment` 필드로 추적 가능.

#### 개별 평가자 결과 (`data/scores/scorer_{A,B,C}.json`)

페르소나별 독립 채점 결과. 항목별 점수와 판단 근거를 포함한다.

```json
{
  "scorer": "A",
  "persona": "효율 전략가 김도현",
  "weights": { "google_rating": 0.15, "review_count": 0.15, "scenery": 0.10, "accessibility": 0.25, "value_for_money": 0.05, "time_efficiency": 0.25, "uniqueness": 0.05 },
  "scores": [
    {
      "id": "string",
      "name_ko": "string",
      "region": "string",
      "raw_scores": {
        "google_rating": { "score": 8, "reason": "string" },
        "review_count": { "score": 7, "reason": "string" }
      },
      "total_score": 75.0
    }
  ]
}
```

**설계 원칙**:
- `raw_scores`에 항목별 점수와 **판단 근거(reason)**를 반드시 포함. 블랙박스 평가를 방지한다.
- 각 scorer의 `weights`는 해당 페르소나의 개별 가중치(비율, 합계 1.0)를 사용하며, `config/scoring.json`의 기본 가중치와 다를 수 있다. 3명 가중치의 산술 평균은 기본 가중치와 일치하도록 설계되어 있다.
- 평가 기준이 변경되면 전체 재평가. 등급은 퍼센타일 기반으로 `config/scoring.json`에서 관리.

#### 프론트엔드 데이터 (`assets/data/place_data.json`)

`scripts/generate_frontend.py`가 평가 결과를 종합하여 생성하는 프론트엔드용 JSON. `rankings.html` 페이지에서 fetch하여 사용한다.

```json
{
  "generated_at": "2026-03-13",
  "total": 110,
  "grade_distribution": { "S": 6, "A": 22, "B": 38, "C": 33, "D": 11 },
  "grading_method": "percentile",
  "grading_cutoffs": { "S": "1~6위", "A": "7~28위", ... },
  "controversial_count": 37,
  "personas": {
    "A": { "name": "효율 전략가", "full_name": "김도현", "focus": "접근성·시간효율" },
    "B": { ... },
    "C": { ... }
  },
  "weights": {
    "A": { "google_rating": 0.15, "review_count": 0.15, "scenery": 0.10, ... },
    "B": { ... },
    "C": { ... }
  },
  "places": {
    "{place_id}": {
      "id": "string (8자 해시)",
      "name_ko": "string",
      "name": "string (영문명)",
      "region": "string",
      "grade": "S | A | B | C | D",
      "may_adjusted_score": 90.5,
      "scores": { "A": 75.0, "B": 95.5, "C": 86.0 },
      "spread": 20.5,
      "controversial": true,
      "breakdown": {
        "{criterion}": {
          "avg": 9.3,
          "A": 9, "B": 10, "C": 9,
          "reasons": { "A": "string", "B": "string", "C": "string" }
        }
      },
      "coords": { "lat": -28.638, "lng": 153.636 },
      "google_maps_url": "string"
    }
  },
  "ranked_ids": ["213ea17d", "e16a2fe5", ...]
}
```

| 필드 | 설명 |
|------|------|
| `personas` | 3명 평가 페르소나의 이름·역할. UI 표시용 |
| `weights` | 페르소나별 기준 가중치 (합계 1.0) |
| `places` | place_id를 키로 한 장소 객체 맵 |
| `places.*.breakdown` | 7개 기준별 페르소나 점수 + 판단 근거. 기준: `scenery`, `uniqueness`, `google_rating`, `accessibility`, `review_count`, `value_for_money`, `time_efficiency` |
| `places.*.may_adjusted_score` | 5월 계절 보정 후 최종 점수. 등급(`grade`) 산정 기준 |
| `ranked_ids` | 점수 내림차순으로 정렬된 place_id 배열 |

> **생성**: `python scripts/generate_frontend.py --data` (또는 플래그 없이 전체 생성). 입력 소스: `data/scores/scorer_{A,B,C}.json` + `data/scores/attraction_scored.json` + `data/places/attraction/*.json`

#### 프론트엔드 데이터 (`data/routes/route_data.json`)

루트 비교 페이지(`routes.html`)에서 사용하는 경유지·좌표 데이터. 수동 작성.

```json
{
  "routes": {
    "{route_id}": {
      "name": "string (예: '1조: GC직행 + 남하해안')",
      "color": "string (hex, 예: '#e74c3c')",
      "total_km": 2177,
      "score": 59.3,
      "days": [
        {
          "day": 1,
          "date": "5/24",
          "label": "string (일별 요약)",
          "day_km": 865,
          "stops": [
            {
              "name": "string",
              "lng": 151.1772,
              "lat": -33.9461,
              "type": "start | waypoint | attraction | stay | end",
              "grade": "S | A | B | C | D",
              "distance_km": 0
            }
          ]
        }
      ]
    }
  }
}
```

| 필드 | 설명 |
|------|------|
| `routes` | route_id(숫자 문자열 `"1"`~`"9"`)를 키로 한 루트 객체 맵 |
| `color` | 지도에서 루트를 구분하는 hex 색상 코드 |
| `total_km` | 루트 전체 주행 거리 (OSRM 기반) |
| `score` | CRITIC_ROUTE.md 기준 루트 종합 점수 |
| `days[].stops[].type` | `start`: 출발지, `waypoint`: 경유지(비관광), `attraction`: 관광 명소, `stay`: 숙박지, `end`: 종료지(렌터카 반납 등) |
| `days[].stops[].grade` | `type`이 `attraction`인 경우에만 존재 (선택). 해당 장소의 평가 등급 |
| `days[].stops[].distance_km` | 직전 stop으로부터의 도로 거리. 첫 stop은 0 |

> **작성 방법**: `route_data.json`은 자동 생성되지 않으며, 루트 후보 작성 시 수동으로 관리한다.

#### 루트 도로 geometry (`data/routes/route_geometry.json`)

루트 비교 지도에서 실제 도로 경로를 렌더링하기 위한 geometry 데이터. `scripts/fetch_route_geometry.py`로 OSRM API에서 자동 생성.

```json
{
  "generated_at": "ISO8601",
  "osrm_server": "https://router.project-osrm.org",
  "simplify_tolerance": 0.0005,
  "geometries": {
    "R1D1": "encoded polyline string...",
    "R1D2": "encoded polyline string...",
    "..."
  },
  "aliases": {
    "R3D1": "R1D1",
    "..."
  },
  "legs": {
    "R1D1": [
      {
        "distance_km": 175.9,
        "duration_min": 143,
        "roads": [
          {"name": "Pacific Motorway", "ref": "M1", "km": 89.2},
          "..."
        ]
      },
      "..."
    ],
    "..."
  }
}
```

| 필드 | 설명 |
|------|------|
| `geometries` | `R{루트}D{일차}` 키로 된 encoded polyline 문자열 맵. 유니크한 day만 저장 |
| `aliases` | 동일 경로를 공유하는 day의 참조. 예: 3조 Day1이 1조 Day1과 같으면 `"R3D1": "R1D1"` |
| `legs` | 구간별 메타데이터. `geometries`와 동일한 키 구조. 각 leg은 `distance_km`(거리), `duration_min`(소요시간), `roads[]`(주요 도로 목록: `name`, `ref`, `km`) 포함 |
| `simplify_tolerance` | Douglas-Peucker 간소화 허용 오차 (도 단위, ~50m) |

> **생성**: `python scripts/fetch_route_geometry.py`. 입력: `route_data.json`의 stop 좌표 → OSRM `/route/v1/driving` API → encoded polyline + Douglas-Peucker 간소화. 빌드 타임 전용 (런타임 API 호출 없음).

#### 지역 분류 (`data/regions.json`)

좌표 기반 지역 할당 결과. 단일 파일로 관리.

```json
{
  "generated_at": "ISO8601",
  "regions": [
    {
      "id": "string (한국어 지역명, 예: 블루마운틴, 시드니)",
      "name_ko": "string",
      "center": { "lng": 0.0, "lat": 0.0 },
      "radius_km": 0,
      "place_count": 0,
      "place_ids": []
    }
  ]
}
```

---

## 4. Phase별 상세 설계

### Phase 1: 전처리 (`scripts/parse_googlemaps.py`)

**입력**: `GoogleMaps/*.json`
**출력**: `data/places/{category}/{id}.json` (stub), `data/regions.json`, 터미널 변경 감지 리포트

GoogleMaps 원본 데이터를 좌표 기반으로 처리한다. **장소명 확인은 하지 않는다** — `address` 필드의 원문만 보존하고, 실제 장소명은 Phase 2에서 Claude Code 웹검색으로 확인한다.

| 작업 | 설명 |
|------|------|
| ID 생성 | 좌표 해시 기반 고유 ID (8자). 웹검색으로 장소명 확인 후 slug ID로 교체 가능 |
| 카테고리 매핑 | `properties.name` 필드에서 카테고리 분류 ("호주여행" → `attraction`, "호주음식" → `restaurant`, "호주숙소" → `accommodation`) |
| 최신 파일 기준 | 여러 날짜의 JSON 파일이 있을 경우 **최신 파일을 전체 리스트(authoritative source)**로 사용. 이전 파일은 diff 비교용 |
| **변경 감지** | 이전 내보내기 대비 추가/삭제된 장소를 리포트. 신규 장소는 stub 자동 생성 + Phase 2 웹검색 필요 표시 |
| **삭제 정리** | 최신 내보내기에 없는 장소의 파일을 정리. 빈 stub은 자동 삭제, `collected_data`가 채워진 파일은 보존 후 경고 |
| 중복 탐지 | 반경 100m 이내 → 중복 후보로 리포트 (자동 삭제는 하지 않음) |
| 지역 할당 | 좌표를 알려진 지역(시드니, 센트럴코스트, 뉴캐슬 등)에 할당. `data/regions.json`에 저장 |

> **설계 결정**: `address` 필드는 한국어명+영문명+주소가 혼합된 비정형 문자열이므로, 프로그래밍으로 장소명을 정확히 파싱하기 어렵다. 좌표를 기반으로 웹검색하여 확인하는 것이 더 정확하다.

> **현재 상태**: GoogleMaps에는 `"호주여행"` (관광지, 110개 — GoogleMaps 109 + 수동 추가 1) 데이터가 있다. `"호주음식"`, `"호주숙소"` 데이터는 사용자가 구글맵에 장소를 추가한 후 내보내면 처리할 수 있다.

### Phase 2: 정보 수집

**입력**: `data/places/` (Phase 1 결과) 또는 ITINERARY.md의 장소 목록, `research/` (참고 자료)
**출력**: `data/places/` (collected_data 필드 채움), `research/claude-research/` (조사 결과)

Claude Code가 대화형으로 장소별 정보를 웹 검색하고, 결과를 JSON 또는 리서치 파일에 저장한다. 조사 과정에서 생산한 리서치 결과는 `research/claude-research/`에, 외부 AI 딥 리서치(`research/deep-research/`)도 참고 소스로 활용한다.

> **현재 상태**: ✅ Phase 2 완료. `data/places/attraction/` 110개 장소에 `collected_data`가 채워짐. `research/claude-research/places/`에 7개 지역별 리서치 요약 생성 완료. 날씨 조사(지역별 7개 파일), 로드트립 경로 리서치, 여행 환경 조사 등도 `research/claude-research/`에 완료되어 있다.

#### 리뷰 수집 전략: 시기 기반 2구간

모든 리뷰를 수집하는 대신, **여행 시기와 관련된 리뷰만** 타겟팅하여 효율적으로 수집한다.

| 구간 | 범위 | 목적 |
|------|------|------|
| **작년 동월 리뷰** | 여행 예정월의 전년도 동월 (예: 2026년 5월 여행 → 2025년 5월 리뷰) | 해당 시기의 날씨, 혼잡도, 계절 특성, 운영 상태 파악 |
| **최근 6개월 리뷰** | 현재 시점 기준 최근 6개월 | 현재 운영 상태 확인 (폐업, 공사, 가격 변동, 품질 변화) |

> 두 구간을 분리 수집하는 이유: 작년 동월 리뷰는 "그 시기에 가면 어떤지"를, 최근 리뷰는 "지금도 괜찮은지"를 판단하는 데 각각 쓰인다. Phase 3 평가 시에도 두 구간의 리뷰를 구분하여 분석한다.

#### 수집 항목

| 항목 | 필수 | 수집 방법 |
|------|------|-----------|
| 평점 (rating) | O | 웹검색 (구글맵 페이지, 여행 블로그) |
| 리뷰 수 | O | 웹검색 |
| 작년 동월 리뷰 요약 | O | 웹검색 → AI 분석 |
| 최근 6개월 리뷰 요약 | O | 웹검색 → AI 분석 |
| 비용 | - | 공식사이트, 웹검색 |
| 예상 체류시간 | O | 리뷰 분석, AI 추정 |
| 영업시간 | - | 공식사이트, 웹검색 |
| 가격대 (price_level) | 음식점/숙소만 필수 | 웹검색 |

#### 리뷰 요약 저장 스키마

```json
"review_summary": {
  "same_month_last_year": {
    "period": "2025-05",
    "count": 0,
    "positive": [],
    "negative": [],
    "seasonal_notes": "(계절 특이사항: 날씨, 혼잡도, 시즌 이벤트 등)"
  },
  "recent_6_months": {
    "period": "2025-09 ~ 2026-03",
    "count": 0,
    "positive": [],
    "negative": [],
    "status_notes": "(운영 상태 변화: 공사, 가격 변동, 품질 변화 등)"
  },
  "tips": []
}
```

> **수집되지 않은 장소 처리**: `collected_data`가 null인 장소는 Phase 3에서 "미평가(UNRATED)"로 분류. 평가에서 제외하되 일정에는 수동으로 추가 가능.

### Phase 3: 평가 및 등급

**입력**: `data/places/` (수집 완료된 장소)
**출력**: `data/scores/{category}_scored.json`

후보 장소가 많아 체계적 비교가 필요할 때 사용한다. 현재 여행의 확정 일정(ITINERARY.md)은 이미 대화를 통해 결정되었으므로, 이 Phase는 주로 **대안 장소 평가**, **백업 옵션 비교**, 또는 **미확정 일정(5/30 시드니)의 장소 선별** 등에 활용된다.

#### 등급 체계 (전 카테고리 공통)

| 등급 | 퍼센타일 | 의미 |
|------|----------|------|
| **S** | 상위 ~5% | 반드시 가야 할 곳. 일정의 핵심 |
| **A** | 상위 5~25% | 강력 추천. 가능하면 포함 |
| **B** | 상위 25~60% | 선택적 |
| **C** | 상위 60~90% | 스킵 권장 |
| **D** | 하위 ~10% | 비추천 |

#### 카테고리별 평가 기준

평가 기준은 카테고리마다 다르게 적용한다. 가중치는 필요 시 `config/scoring.json`으로 관리하며 언제든 조정 가능.

**관광지 (attraction)**

| 기준 | 가중치 | 평가 방법 |
|------|--------|-----------|
| 구글 평점 | 15% | 정량 (4.5+ → 만점) |
| 리뷰 수 / 인기도 | 10% | 정량 (로그 스케일 정규화) |
| 경치 / 포토스팟 | 20% | AI 리뷰 분석 (경치, 뷰, 사진 관련 언급 빈도) |
| 접근성 | 15% | AI 리뷰 분석 (주차, 도보 난이도 등) |
| 비용 대비 만족도 | 10% | 무료=가산, 유료=리뷰 만족도 대비 |
| 체류 시간 효율 | 10% | 예상 체류시간 대비 만족도 |
| 유니크함 | 20% | AI 판단 (호주 고유 경험, 희소성) |

**음식점 (restaurant)**

| 기준 | 가중치 | 평가 방법 |
|------|--------|-----------|
| 구글 평점 | 20% | 정량 |
| 리뷰 수 | 10% | 정량 |
| 음식 퀄리티 | 25% | AI 리뷰 분석 (맛, 신선도, 플레이팅) |
| 가성비 | 20% | 가격대 vs 리뷰 만족도 |
| 분위기 / 뷰 | 15% | AI 리뷰 분석 |
| 위치 편의성 | 10% | 관광지/숙소와의 거리 |

> 음식점 전용 페르소나(A''' 동선 미식가 / B''' 미식 큐레이터 / C''' 리뷰 검증자), 페르소나별 가중치, 채점 가이드, 식사 유형별 맥락 적용 등 상세는 [`CRITIC_DINING.md`](./CRITIC_DINING.md) 참조. 음식점은 S~D 퍼센타일 등급 대신 **지역별+식사 유형별 상대 순위**(추천/차선/가능/비추)를 부여한다.

**액티비티 (activities)** — 별도 데이터 구조

> 액티비티는 GoogleMaps 데이터에서 파생되지 않으며, `data/places/` JSON 스키마를 사용하지 않는다. 대신 Claude Code 리서치 기반 **마크다운 문서**로 관리한다.
>
> | 항목 | 내용 |
> |------|------|
> | **데이터 저장소** | `research/claude-research/activities/` (10개 지역별 .md 파일) |
> | **SSOT** | `research/claude-research/activities/액티비티_종합가이드.md` |
> | **평가 방식** | CRITIC 평가 미적용. 리서치 기반 **5월 적합도 4단계 분류**(optimal/good/limited/warning) |
> | **프론트엔드** | `activities.html` + `assets/js/activities.js` (`data/activities/activities_data.json` fetch) |
> | **규모** | 10개 지역 109개 액티비티 (4,180줄) |
>
> 액티비티는 관광지·식당·숙소와 달리 **구조화된 점수 기반 평가를 수행하지 않는다**. 개별 체험 활동의 성격이 매우 다양(서핑, 하이킹, 크루즈, 마켓 등)하여 단일 평가 기준을 적용하기 어렵기 때문이다. 대신 5월 여행 조건에서의 적합도를 4단계로 분류하여 일정 편성 시 참고한다.

**숙소 (accommodation)**

| 기준 | 가중치 | 평가 방법 |
|------|--------|-----------|
| 가성비 (L1) | 20% | 1박 가격 vs 제공 가치, 동급 숙소 대비 상대 비교 |
| 청결/시설 (L2) | 20% | 리노베이션 여부, 리뷰 일관성, 보안 |
| 뷰/분위기 (L3) | 15% | 객실 뷰, 커플 감성, 벽난로/발코니, 건축 매력 |
| 위치 적합도 (L4) | 15% | 다음날 일정 연계, 주변 식당/편의시설 |
| 주차/체크인 (L5) | 10% | 무료/보안 주차, 늦은 체크인 대응 |
| 리뷰 신뢰도 (L6) | 10% | 복수 플랫폼 평점, 리뷰 수, 부정 패턴 부재 |
| 부가가치 (L7) | 10% | 조식, 키친넷, 수영장, 자전거 대여 등 |

> **Gate 조건 (필수 조건 미충족 시 자동 비추)**: 아래 조건에 해당하면 점수와 무관하게 "비추" 처리한다.
> - 주차 불가 (시드니 제외) — 렌터카 로드트립이므로 주차는 필수
> - 청결 부정 리뷰 반복 패턴 — 복수 플랫폼에서 청결 불만이 반복되는 경우
> - 5월 운영 미확인 — 비수기 시즌 축소·휴업 가능성이 해소되지 않은 경우
>
> 상세 페르소나(A'' 가성비 전략가 / B'' 감성 큐레이터 / C'' 실용 검증자), 페르소나별 가중치, 채점 가이드, 거점별 맥락 적용 등은 [`CRITIC_LODGING.md`](./CRITIC_LODGING.md) 참조. 숙소는 S~D 퍼센타일 등급 대신 **거점별 상대 순위**(추천/차선/가능/비추)를 부여한다.
>
> **이중 평가 프레임**: 숙소는 가격대에 따라 두 프레임으로 나누어 평가한다.
> - **기본평가** ($150~300/박): 가성비 중심, 전 거점 공통
> - **투자평가** ($300~900/박): 프리미엄 체험 가치 중심, 블루마운틴·시드니 등 투자 가치가 높은 거점에서 활용
>
> 프레임별 평가 기준(L1~L7)과 페르소나는 동일하되, 가격 기대치가 다르므로 L1(가성비) 해석이 달라진다. 일부 숙소는 두 프레임 모두에서 평가되어 프레임별 점수를 병기한다(**이중평가**). 상세는 CRITIC_LODGING.md §2 참조. 숙소 수치의 SSOT는 `research/claude-research/accommodation/숙소_종합비교.md`.

#### 평가 방식: 3인 분업 평가 (CRITIC.md 기반)

3명의 평가 페르소나가 독립적으로 채점하고, 가중 평균으로 종합 점수를 산출한다. 페르소나 정의, 개별 가중치, 채점 가이드의 상세 내용은 [`docs/CRITIC.md`](./CRITIC.md)에 정의되어 있다.

| 페르소나 | 역할 |
|----------|------|
| **효율 전략가 (A)** | 시간 대비 효율, 접근성, 비용 중심 평가 |
| **감성 탐험가 (B)** | 경치, 유니크함, 감성적 가치 중심 평가 |
| **현실주의 비평가 (C)** | 리뷰 분석, 실제 만족도, 리스크 중심 평가 |

**4단계 워크플로우** (관광지 — 퍼센타일 등급):

1. **리서치 분업**: 각 페르소나가 자신의 관점에서 수집 데이터를 분석
2. **해석 (독립 채점)**: 각 페르소나가 독립적으로 0-10점 채점 + 근거 서술 → `data/scores/scorer_{A,B,C}.json`
3. **가중합**: 페르소나별 가중치로 항목 점수를 합산하여 개인 총점 산출
4. **종합**: 3명 평균 → 퍼센타일 기반 등급 부여 → `data/scores/attraction_scored.json`

> **숙소·음식점은 다른 등급 방식을 사용**: 워크플로우(리서치→해석→가중합→종합)는 동일하나, 4단계에서 퍼센타일 등급(S~D) 대신 **거점별 상대 순위**(추천/차선/가능/비추)를 부여한다. 숙소는 이중 평가 프레임(기본/투자)도 적용 — 동일 숙소를 두 가격 기대치로 각각 채점할 수 있다(예: Marina Resort 기본 79.3 / 투자 83.2). 상세는 CRITIC_LODGING.md, CRITIC_DINING.md 참조.

**논쟁 장소**: 3명 간 점수 차이(spread)가 15점 이상인 장소는 `controversial`로 표시. 해당 장소는 일정 편성 시 추가 검토가 필요하다.

**출력 파일**:
- `data/scores/scorer_{A,B,C}.json`: 개별 평가자 결과
- `data/scores/attraction_scored.json`: 종합 결과 (3명 평균 + 등급)
- `data/scores/RANKINGS.md`: 사람이 읽을 수 있는 랭킹 문서 (자동 생성)
- `assets/data/place_data.json`: 프론트엔드용 장소 데이터 (자동 생성, 스키마는 3.2절 참조)

**프론트엔드 데이터 생성 스크립트** (`scripts/generate_frontend.py`):

```bash
python scripts/generate_frontend.py            # 전체 (재채점 + RANKINGS + place_data)
python scripts/generate_frontend.py --rescore  # scorer 파일로부터 등급 재계산만
python scripts/generate_frontend.py --rank     # RANKINGS.md만
python scripts/generate_frontend.py --data     # place_data.json만
```

스크립트는 3단계로 동작한다: (1) scorer 파일들로부터 `attraction_scored.json` 재생성 (등급 재계산), (2) `RANKINGS.md` 생성, (3) `place_data.json` 생성. 플래그로 원하는 단계만 선택 실행할 수 있다.

> **재현성 보장**: 모든 채점에 `reason` 필드로 판단 근거를 기록하므로, 나중에 기준을 조정하거나 재평가할 때 참고할 수 있다.

> **현재 상태**: ✅ Phase 3 완료. `data/scores/attraction_scored.json`에 110곳 평가 완료. CRITIC.md 페르소나 기반 3인 독립 평가 + 퍼센타일 등급 + 5월 계절 보정 적용. 등급 분포: S:6 A:22 B:38 C:33 D:11 (`may_adjusted_score` 기준 단일 `grade`). 논쟁 장소 37곳. `data/scores/RANKINGS.md`에 랭킹 문서 자동 생성 (`scripts/generate_frontend.py`).

### Phase 4: 여행 일정 생성

**입력**: Phase 2~3 결과, `research/` 리서치 자료, META.md의 제약 조건
**출력**: `ITINERARY.md` (확정 일정)

여행 일정은 **사용자와 Claude Code의 대화**를 통해 생성된다. 리서치 자료, 평가 결과, 지리적 제약, 사용자 선호를 종합하여 일정을 구성하고, 결과를 `ITINERARY.md`에 직접 기록한다.

> **현재 상태**: ✅ Phase 4 완료. **6조 확정** (바이런직행+블루마운틴, v7 1위 78.0점, 2026-03-20). ITINERARY.md 이동일정 전일 작성 완료 (숙소·식당 미확정). 9개 루트 후보 비교 → CRITIC_ROUTE v7 재평가 → 최종 선택.

#### 루트 파일 점수 정합성 유지

루트 파일(`research/route-plans/*.md`)에는 각 장소의 등급과 점수가 포함된다. Phase 3에서 계절 보정이나 재평가가 발생하면 루트 파일의 점수가 `attraction_scored.json`과 불일치할 수 있다.

**검증/수정 스크립트** (인라인 마커 기반):
```bash
# 루트 문서 동기화 (점수·등급·거리 일괄)
python scripts/sync_route_docs.py              # dry-run: 불일치 리포트
python scripts/sync_route_docs.py --fix        # 마커 값 교체 + route_data.json 정합

# 숙소/식당/액티비티 종합 문서 동기화
python scripts/sync_data_docs.py               # dry-run: 불일치 리포트
python scripts/sync_data_docs.py --fix         # 마커 값 교체
```

**자동화 범위**: `<!-- sync:NS:KEY -->값<!-- /sync -->` 인라인 마커가 삽입된 모든 수치를 SSOT JSON에서 자동 교체한다. 점수, 등급, 거리, 개수 집계(S등급 수, 라벨 분포 등)가 모두 포함된다.

**재평가 후 체크리스트** (에이전트 작업):
1. `python scripts/sync_route_docs.py --fix` 실행 → 루트 MD + README 점수·거리·등급 일괄 동기화
2. `python scripts/sync_data_docs.py --fix` 실행 → 종합 문서 수치 동기화
3. `CLAUDE.md` 진행 상황 갱신

#### 일정 생성 시 고려사항

1. **필터링**: 등급 기준 이상의 장소만 후보로 선택 (기본: B등급 이상)
2. **지역 그룹핑**: 같은 지역 장소를 하루에 묶어 이동 최소화
3. **지역 순서 결정**: 지역 간 이동거리를 최소화하는 순서 결정
4. **일별 배분**: 하루 활동 가능 시간 내에서 장소 배치
   - 이동거리: OSRM API 기반 실제 도로 주행 거리 사용 (직선거리·근사값 금지)
   - 체류시간 (`estimated_visit_duration_min`)
   - 식사 시간 슬롯 (점심/저녁)
5. **매칭**: 각 일정에 가까운 고평가 음식점/숙소를 연결
6. **대안 생성**: 우천 시 실내 대안, 시간 부족 시 축소 일정

#### 일정 설정 (`config/trip.json`)

> `META.md`의 확정 정보(여행 기간, 렌터카 일정, 제약 조건 등)를 기반으로 설정한다.
> `config/` 디렉토리에 scoring.json, trip.json이 생성되어 있다.

```json
{
  "total_days": 7,
  "start_date": "2026-05-24",
  "start_location": "시드니공항 (SYD)",
  "end_location": "시드니공항 (SYD)",
  "daily_start_time": "08:00",
  "daily_end_time": "20:00",
  "car_available": {
    "2026-05-24": true,
    "2026-05-25": true,
    "2026-05-26": true,
    "2026-05-27": true,
    "2026-05-28": true,
    "2026-05-29": true,
    "2026-05-30": false
  },
  "return_deadline": { "date": "2026-05-29", "time": "21:00" },
  "min_grade": "B",
  "must_include": [],
  "must_exclude": [],
  "priorities": ["nature", "photo_spot"],
  "budget_per_day_aud": null,
  "travel_style": "balanced"
}
```

- `start_date`: 여행 시작일. Phase 2에서 리뷰 수집 구간을 결정하는 데 사용 (작년 동월 = start_date의 월 - 1년, 최근 6개월 = 현재 기준)
- `car_available`: 날짜별 차량 보유 여부. 5/30은 렌터카 반납 후이므로 도보/대중교통만 가능
- `must_include` / `must_exclude`: 등급과 무관하게 일정에 반드시 포함/제외할 장소 ID
- `priorities`: 같은 등급 내에서 어떤 유형을 우선할지
- `travel_style`: `"relaxed"` (하루 2-3곳) / `"balanced"` (3-4곳) / `"intensive"` (5+곳)

### Phase 5: 일정 리뷰

**입력**: `ITINERARY.md` (확정/초안 일정), `META.md` (제약 조건), `research/deep-research/` + `research/claude-research/` (참고 자료)
**출력**: `research/claude-research/{날짜}_{주제}.md` (근거 자료), `ITINERARY.md` (리뷰 요약 + 상세)

일정이 확정되거나 초안이 작성될 때마다, AI가 해당 일정을 리서치하고 비판적으로 검토하여 리뷰를 제공한다.

> **현재 상태**: 🔄 Phase 5 시작 가능. 6조 확정(2026-03-20), ITINERARY.md 이동일정 반영 완료. 숙소·식당 통합 후 리뷰 진행 예정. 숙소 평가(77개 CRITIC 채점), 식당 평가(126개 CRITIC 평가) 완료 상태.

#### 리뷰 프로세스 (3단계)

```
Step 1: 리서치          Step 2: 의견 정리          Step 3: 리뷰 작성
(정보 수집)             (파일별 정리)              (ITINERARY.md 반영)
     │                       │                          │
     ▼                       ▼                          ▼
웹 검색/딥 리서치 →  claude-research/{날짜}_*.md  →  ITINERARY.md 리뷰 섹션
참고 자료 확인         긍정 + 비판 분리             요약 + 상세
```

**Step 1: 리서치 (정보 수집)**

해당 날짜의 일정에 대해 근거 자료를 수집한다.

| 수집 대상 | 방법 | 예시 |
|-----------|------|------|
| 이동 경로 실현 가능성 | 웹검색 (거리, 소요시간, 도로 상태) | "시드니→골드코스트 M1 야간 운전 주의사항" |
| 장소별 실제 후기 | 웹검색 (블로그, 리뷰) | "5월 포트맥쿼리 날씨 및 관광 후기" |
| 시간 배분 적절성 | 리뷰/공식사이트 (영업시간, 체류시간) | "Sixt 시드니공항 일요일 오픈 시간" |
| 기존 리서치 | `research/deep-research/`, `research/claude-research/` 참조 | 외부 AI 및 기존 조사 결과와 비교 |

**Step 2: 의견 정리 (claude-research/ 파일 생성)**

수집한 정보를 날짜별로 **긍정적 의견**과 **비판적 의견**으로 분리하여 파일로 정리한다.

파일명: `research/claude-research/{날짜}_{주제}.md`

```markdown
---
대상: ITINERARY.md 5월 24일
작성일: 2026-03-12
---

## 긍정적 의견
- (근거와 함께 이 일정이 잘 짜여진 점)
- (시간 배분이 합리적인 이유)
- ...

## 비판적 의견
- (리스크나 문제점, 근거 포함)
- (시간이 부족하거나 비현실적인 부분)
- ...

## 참고 자료
- (검색한 URL, 출처)
```

> **원칙**: 긍정과 비판을 동등한 비중으로 조사한다. 확증 편향을 방지하기 위해 "이 일정이 왜 좋은지"와 "이 일정이 왜 위험한지"를 각각 독립적으로 리서치한다.

**Step 3: 리뷰 작성 (ITINERARY.md 반영)**

claude-research/ 파일들을 종합하여 ITINERARY.md에 리뷰를 작성한다.

- **리뷰 요약** (일정표 바로 아래, 5줄 이내): 핵심 포인트만 요약. 상세 링크 포함
- **리뷰 상세** (하단 섹션): 구체적 근거, 대안 제시, 리스크 분석

#### 리뷰 관점 체크리스트

리뷰 시 반드시 아래 관점을 점검한다.

| 관점 | 확인 사항 |
|------|-----------|
| **시간 실현성** | 이동시간 + 체류시간 + 휴식이 하루 안에 가능한가? 버퍼가 있는가? |
| **체력/피로** | 전날 일정 대비 무리하지 않는가? 장거리 운전 후 관광이 현실적인가? |
| **제약 조건 충돌** | META.md의 제약 조건(렌터카 반납, 차량 유무 등)과 충돌하지 않는가? |
| **계절/날씨** | 5월 호주 가을 기준으로 일몰 시간, 기온, 우기 등 고려했는가? |
| **비용** | 입장료, 주유, 숙박비 등이 합리적인가? |
| **대안 유무** | 우천, 지연 등 변수 발생 시 B플랜이 있는가? |
| **동선 효율** | 불필요한 역주행이나 비효율적 이동이 없는가? |
| **기존 리서치 대조** | deep-research, claude-research 결과와 비교하여 놓친 포인트가 없는가? |

#### 리뷰 등급

각 날짜 일정에 대해 종합 판단을 내린다.

| 등급 | 의미 |
|------|------|
| **안전** | 큰 리스크 없음. 계획대로 진행 가능 |
| **주의** | 일부 리스크 존재. 대안 준비 권장 |
| **경고** | 실현 가능성 의문. 수정 강력 권장 |

---

## 5. 프로젝트 디렉토리 구조

```
호주여행/
├── docs/
│   ├── SPEC.md                 # 기술 설계서 (이 문서)
│   ├── CRITIC.md               # 평가 페르소나 3명 정의 및 채점 가이드
│   ├── CRITIC_ROUTE.md         # 루트 후보 평가 페르소나 및 기준 (CRITIC.md의 루트 버전)
│   ├── CRITIC_LODGING.md       # 숙소 평가 전용 페르소나(A''/B''/C'') 및 기준(L1~L7)
│   ├── CRITIC_DINING.md        # 식당 평가 전용 페르소나(A'''/B'''/C''') 및 기준(F1~F6)
│   ├── META.md                 # 여행 전제 조건 (항공, 렌터카, 로드트립 방향, 제약 조건)
│   ├── ITINERARY.md            # 날짜별 확정 일정 + AI 리뷰 (Single Source of Truth)
│   └── TRAVELER_PROFILE.md     # 여행자 프로필 & 선호도 설문 (운전 내성, 여행 스타일 등)
├── CLAUDE.md                   # Claude Code 작업 가이드
├── .gitignore
│
├── _config.yml                  # Jekyll 사이트 설정
├── _layouts/                   # Jekyll 레이아웃 템플릿
│   └── default.html
├── rankings.html               # 관광지 랭킹 페이지 (GitHub Pages)
├── routes.html                 # 루트 비교 페이지 (지도 + 상세 평가)
├── activities.html             # 액티비티 후보 페이지
├── lodging.html               # 숙소 후보 페이지 (기본평가/투자평가 탭 분리, CRITIC_LODGING 평가 기반)
├── index.md                    # 사이트 인덱스
├── assets/
│   ├── css/style.scss          #   스타일시트
│   ├── js/rankings.js          #   랭킹 페이지 인터랙션
│   ├── js/routes.js            #   루트 비교 페이지 인터랙션 (Leaflet.js)
│   ├── js/activities.js        #   액티비티 페이지 인터랙션 (data/activities/ JSON fetch)
│   ├── js/lodging.js           #   숙소 후보 페이지 인터랙션 (data/lodging/ JSON fetch)
│   ├── js/dining.js            #   식당 후보 페이지 인터랙션 (data/dining/ JSON fetch)
│   └── data/
│       └── place_data.json     #   프론트엔드용 장소 데이터 (자동 생성)
│
├── research/                   # 리서치 자료 및 AI 리뷰 근거
│   ├── deep-research/          #   ChatGPT, Gemini 등 외부 AI 딥 리서치 결과
│   ├── claude-research/        #   Claude Code가 직접 조사한 리서치 결과
│   │   ├── weather/            #     지역별 날씨 조사 (시드니, 센트럴코스트, 포트맥쿼리 등 7개)
│   │   ├── places/             #     지역별 장소 리서치 요약
│   │   ├── activities/         #     액티비티 리서치
│   │   ├── 6일-로드트립-리서치.md
│   │   ├── 호주-5월-여행환경.md
│   │   └── ...
│   └── route-plans/            #   9개 루트 후보 상세 일정 + CRITIC 토론 문서
│
├── GoogleMaps/                 # 구글맵 내보내기 원본 (입력, 수정 금지)
│   └── {YYYY-MM-DD}.json      # 날짜 기반 파일명, 모든 카테고리 혼합
│
├── config/                     # 설정
│   ├── scoring.json            #   카테고리별 평가 기준 & 가중치 + 퍼센타일 등급 커트라인
│   └── trip.json               #   여행 일정 생성 설정
│
├── data/                       # 수집/분석 데이터
│   ├── places/
│   │   └── {category}/{id}.json  # Phase 1에서 stub 생성, Phase 2에서 정보 채움
│   ├── scores/
│   │   ├── {category}_scored.json  # 종합 평가 결과 (3명 평균 + 등급)
│   │   ├── scorer_A.json, scorer_B.json, scorer_C.json  # 개별 평가자 결과
│   │   └── RANKINGS.md         #   사람이 읽을 수 있는 랭킹 문서 (자동 생성)
│   ├── routes/
│   │   ├── route_data.json    # 루트 거리·경유지 SSOT (sync_route_docs.py 관리)
│   │   └── route_geometry.json # 루트 도로 geometry (OSRM 자동 생성)
│   ├── lodging/
│   │   └── lodging_data.json  # 숙소 데이터 SSOT (77개: 기본 44 + 투자 33)
│   ├── dining/
│   │   └── dining_data.json   # 식당 데이터 SSOT (126개, 예산 시나리오 포함)
│   ├── activities/
│   │   └── activities_data.json # 액티비티 데이터 SSOT (109개, 10개 지역)
│   └── regions.json            # 좌표 기반 지역 할당 결과
│
└── scripts/                    # 자동화 스크립트
    ├── parse_googlemaps.py     #   Phase 1: GoogleMaps 변경 감지 + 좌표 기반 처리
    ├── generate_frontend.py    #   평가 결과 → 등급 재계산 + RANKINGS.md + place_data.json 생성
    ├── sync_engine.py          #   인라인 마커 동기화 엔진 (공용 라이브러리)
    ├── sync_route_docs.py      #   루트 MD + README ↔ route_data.json 동기화
    ├── sync_data_docs.py       #   숙소/식당/액티비티 종합 문서 ↔ data/ JSON 동기화
    ├── fetch_route_geometry.py #   OSRM API → route_geometry.json 생성
    └── utils/
        ├── __init__.py
        └── geo.py              #   좌표/거리 계산, 지역 할당, 중복 탐지
```

**디렉토리 규칙**:
- `GoogleMaps/`: 원본 데이터. 절대 스크립트가 수정하지 않음
- `research/`: 리서치 자료 및 리뷰 근거. 사람 또는 AI가 수집하여 저장
  - `deep-research/`: ChatGPT, Gemini 등 외부 AI 딥 리서치 결과. 파일명 `{주제}_{출처}.md`
  - `claude-research/`: Claude Code가 직접 조사한 리서치 결과. 파일명 `{주제}.md`. `weather/` 하위에 지역별 날씨 파일, `places/` 하위에 지역별 장소 리서치, `activities/` 하위에 액티비티 리서치, `accommodation/` 하위에 거점별 숙소 리서치·평가(95개 조사 → 77개 CRITIC 채점: 기본 44 + 투자 33, 비선정 18개. 이중평가 숙소는 양 프레임 점수 병기. 프론트엔드 77개 전체 표시. **수치의 SSOT는 종합비교.md**), `dining/` 하위에 거점별 식당 리서치·평가(140개+ 식당) + 종합가이드. Phase 5 리뷰 근거도 여기에 저장
- `ITINERARY.md`: 확정 일정의 Single Source of Truth. 일정 변경은 반드시 이 파일에 반영
- `config/`, `data/`, `scripts/`: 선택적 자동화 인프라. 필요 시 생성하여 사용

---

## 6. 기술 스택

| 구분 | 기술 | 용도 |
|------|------|------|
| AI (핵심) | Claude Code (대화형) | 정보 수집, 리뷰 분석, 평가, 일정 생성/조정, 리뷰 |
| 정보 수집 | Claude Code WebSearch / WebFetch | 시기 기반 리뷰 및 장소 상세정보 수집 |
| 자동화 (보조) | Python 3.11+ | 전처리, 좌표 계산 등 반복 연산 |
| 좌표 계산 | scripts/utils/geo.py (자체 구현) | 장소 간 거리 계산, 지역 할당 |
| 사이트 | Jekyll + GitHub Pages (jekyll-theme-cayman) | 관광지 랭킹 등 사용자 인터페이스 |
| 프론트엔드 | Vanilla JS · SCSS · JSON fetch | 랭킹 페이지 인터랙션 |
| 데이터 포맷 | JSON | 모든 구조화 데이터 |
| 버전 관리 | Git | 설정/일정 이력 관리 |

---

## 7. 설계 원칙

1. **ITINERARY.md가 Single Source of Truth**: 확정된 여행 일정은 `ITINERARY.md`에서 관리한다. 다른 어떤 파일(plans/, data/ 등)보다 이 문서가 우선한다.
2. **원본 불변**: `GoogleMaps/` 원본은 읽기 전용. 모든 가공은 `data/`에.
3. **대화형 우선**: 일정 생성과 조정은 Claude Code와의 대화로 수행한다. 스크립트는 반복 연산이 필요할 때만 보조적으로 사용한다.
4. **증분 처리**: 새 장소 추가 시 기존 수집/평가 데이터를 보존하고, 새 장소만 처리.
5. **판단 근거 기록**: AI 평가 시 점수뿐 아니라 이유를 반드시 남긴다.
6. **설정 분리**: 평가 기준, 여행 설정 등은 코드가 아닌 `config/` JSON으로 관리.
7. **사람이 최종 결정**: AI는 정보 수집과 초안 제안까지. 최종 일정 확정은 사용자.
