---
layout: default
title: "여행 일정 + 지도 비교 UI/UX 레이아웃 리서치"
---

# 여행 일정 + 지도 비교 UI/UX 레이아웃 리서치

> 조사일: 2026-03-15
> 목적: 여행 루트를 지도 + Day별 경유지로 비교하는 페이지의 레이아웃 개선 참고자료
> **참고**: 이 리서치는 5개 루트 기준으로 작성되었으나, 이후 6조가 추가되어 현재 6개 루트가 존재한다. UI 패턴 분석 내용은 루트 수와 무관하게 유효하다.

---

## 1. 지도 + 일정 배치 패턴 (5가지 유형)

### 패턴 A: Sticky Map + Scrollable Sidebar (가장 보편적)
- **사례**: Airbnb, Wanderlog, Roadtrippers, Google Maps 검색결과
- **구조**: 화면을 좌우 분할. 한쪽(보통 우측)에 지도를 `position: sticky`로 고정, 반대쪽에 일정/리스트를 스크롤
- **Airbnb**: 좌측 리스트 + 우측 지도 분할. 리스트 항목에 hover하면 지도 핀이 하이라이트됨
- **Wanderlog**: 좌측에 day-by-day 일정, 우측에 지도. 지도에서 day별 핀 필터링 가능
- **장점**: 지도가 항상 보이므로 공간 감각 유지. 리스트를 스크롤해도 지도 컨텍스트 유지
- **단점**: 사이드바가 지도보다 훨씬 길어지면 비대칭적 (현재 우리 프로젝트의 문제와 동일)
- **해결법**: CSS `position: sticky` + `top: 0` + `height: 100vh`로 지도 고정. 사이드바만 스크롤

### 패턴 B: 지도 전체화면 + 하단 Sheet/Drawer (모바일 우선)
- **사례**: Google Maps 앱, Uber, 대부분의 모바일 지도앱
- **구조**: 지도가 전체 화면. 하단에서 올라오는 Bottom Sheet에 일정/리스트 표시
- **장점**: 지도 최대한 활용, 모바일에 최적
- **단점**: 데스크톱에서는 정보 밀도가 낮음. 긴 리스트 탐색이 불편

### 패턴 C: 지도 + 오버레이 패널 (토글 가능)
- **사례**: Komoot (H키로 사이드바 숨기기/보이기), Furkot
- **구조**: 지도 위에 반투명 또는 접을 수 있는 패널이 겹침
- **Komoot**: 사이드바를 H키로 숨겨 지도에 집중 가능
- **장점**: 지도 영역을 최대화할 수 있음. 필요할 때만 일정 표시
- **단점**: 오버레이가 지도 일부를 가림. 동시 참조가 어려움

### 패턴 D: 탭 전환 (Map View / List View)
- **사례**: TripAdvisor, Yelp, 많은 부동산/여행 사이트
- **구조**: "지도 보기" / "리스트 보기" 탭으로 전환. 한 번에 하나만 표시
- **장점**: 각 뷰에 전체 화면 활용. 구현 간단
- **단점**: 지도와 리스트를 동시에 볼 수 없음. 컨텍스트 전환 비용

### 패턴 E: 지도 상단 + 일정 하단 (수직 분할)
- **사례**: 일부 블로그형 여행 일정 페이지
- **구조**: 페이지 상단에 지도 (고정 높이), 하단에 Day별 일정 스크롤
- **장점**: 좌우 비대칭 문제 없음. 모바일과 데스크톱 동일 레이아웃
- **단점**: 스크롤하면 지도가 사라짐 (sticky로 부분 해결 가능)

---

## 2. Day가 여러 개일 때 표현 방법

### 2-1. Day 탭 (Horizontal Tabs)
- **사례**: 많은 여행 플래너 앱
- **구조**: Day 1 | Day 2 | Day 3 ... 가로 탭. 클릭하면 해당 Day 경유지만 표시
- **장점**: 한 번에 하나의 Day만 보여 정보 과부하 방지. 지도에도 해당 Day 핀만 표시 가능
- **단점**: Day 수가 많으면 탭이 넘침 (스크롤 탭 또는 드롭다운 필요)
- **우리 프로젝트에 적합도**: 매우 높음. 6 Day면 탭이 넘치지 않음

### 2-2. 아코디언 (Accordion)
- **사례**: Furkot, 일부 Figma 여행 UI Kit
- **구조**: Day별로 접고 펼 수 있는 섹션. 클릭하면 해당 Day 펼침
- **장점**: 전체 Day 목록을 한눈에 조망 가능. 모바일에서 수평 공간 절약
- **단점**: 여러 Day를 동시에 펼치면 결국 길어짐
- **우리 프로젝트에 적합도**: 높음. 특히 루트 비교 시 특정 Day만 펼쳐서 비교 가능

### 2-3. 세로 스크롤 타임라인
- **사례**: Wanderlog (기본 뷰), Google My Maps 레이어
- **구조**: Day 1 경유지 → Day 2 경유지 → ... 연속 스크롤
- **장점**: 전체 여정 흐름을 한눈에 파악. 드래그앤드롭으로 순서 변경 용이
- **단점**: 전체 길이가 매우 길어짐 (현재 우리의 문제)

### 2-4. 스텝퍼/프로그레스 바
- **사례**: 예약 흐름 UI에서 차용
- **구조**: Day 1 → Day 2 → Day 3 진행 표시줄. 클릭하면 해당 Day로 이동
- **장점**: 진행 상황 시각화. 컴팩트
- **단점**: 각 Day 내용 전환이 필요 (탭과 유사)

### 2-5. Compact View (Wanderlog)
- **사례**: Wanderlog 웹 버전
- **구조**: 사진/설명 없이 장소명만 리스트로 압축 표시
- **장점**: 수직 공간 대폭 절약
- **단점**: 정보량 감소

---

## 3. 경유지 표시 방법

### 3-1. 번호 매긴 리스트 (Numbered List)
- **사례**: Roadtrippers, Furkot
- **구조**: 1. 장소A → 2. 장소B → 3. 장소C (이동시간/거리 포함)
- **장점**: 순서가 명확. 컴팩트. 지도 핀 번호와 매칭
- **Roadtrippers**: 사이드바에서 드래그로 순서 변경, 각 경유지 간 거리/시간 표시

### 3-2. 카드 (Cards)
- **사례**: Wanderlog, Airbnb
- **구조**: 각 경유지를 사진 + 이름 + 설명 + 평점이 담긴 카드로 표시
- **장점**: 시각적으로 풍부. 정보 밀도 높음
- **단점**: 공간을 많이 차지. 리스트가 길어지는 주원인

### 3-3. 타임라인 (Timeline)
- **사례**: 항공/기차 예약 확인 페이지, 일부 여행 플래너
- **구조**: 세로선 좌우에 시간대별 경유지 배치
- **장점**: 시간 흐름 직관적. 이동 구간과 체류 구간 구분 명확
- **단점**: 구현 복잡. 시간이 정해지지 않은 경유지에는 부적합

### 3-4. 칩/태그 (Chips)
- **사례**: Google Maps 레이어, Mappr
- **구조**: 경유지를 작은 칩으로 한 줄에 여러 개 배치
- **장점**: 매우 컴팩트. 카테고리 색상 구분 가능
- **단점**: 상세 정보 표시 불가 (클릭하면 팝업으로 보충)

---

## 4. 지도와 일정의 상호작용 패턴

### 4-1. Hover/Click 하이라이트 연동
- **Airbnb 패턴**: 리스트 항목에 hover → 지도 핀 색상 변경/확대
- **양방향**: 지도 핀 클릭 → 사이드바에서 해당 항목으로 스크롤
- **가장 기본적이면서 효과적인 상호작용**

### 4-2. Day별 필터링
- **Wanderlog**: Day 탭 선택 시 지도에 해당 Day 핀만 표시, 나머지 흐리게
- **Google My Maps**: 레이어 on/off로 Day별 핀 토글
- **루트 색상 구분**: Furkot는 Day별로 다른 색상의 루트 라인 표시

### 4-3. 지도 이동 시 리스트 필터링
- **Airbnb**: 지도를 팬/줌하면 보이는 영역의 리스트만 표시
- **여행 일정에는 부적합** (전체 일정을 봐야 하므로)

### 4-4. 경유지 순서 드래그앤드롭
- **Roadtrippers**: 사이드바에서 경유지 드래그 → 지도 루트 실시간 업데이트
- **편집 모드에서 유용하지만, 비교/열람 모드에서는 불필요**

---

## 5. 모바일 대응 전략

### 5-1. 리스트 기본 + 지도 토글 (가장 일반적)
- 모바일 기본 화면: 리스트/일정 표시
- 플로팅 버튼 또는 상단 토글로 "지도 보기" 전환
- **Airbnb, Yelp, TripAdvisor** 모두 이 패턴 사용
- **NNGroup 권장**: 모바일에서는 리스트가 기본이어야 함 (정보 밀도가 높으므로)

### 5-2. 하단 시트 (Bottom Sheet)
- 지도 전체화면 + 하단에서 위로 스와이프하여 리스트 표시
- **Google Maps 앱** 스타일
- 지도 중심 경험에 적합

### 5-3. 수직 스택
- 데스크톱의 좌우 분할 → 모바일에서 상하 스택
- 지도를 상단에 작게, 일정을 하단에 스크롤
- 구현 간단하지만 지도가 작아져 효용이 떨어짐

---

## 6. 실제 앱별 상세 레이아웃 정리

### Wanderlog (https://wanderlog.com)
- **데스크톱 레이아웃**: 좌측 사이드바(일정) + 우측 지도
- **4개 섹션**: Overview, Itinerary, Explore, Budget
- **Day 표현**: 세로 스크롤 (Day 1 → Day 2 → ...), Compact View 옵션으로 사진/설명 숨기기
- **지도 연동**: Day별 핀 필터링, 핀 클릭 시 상세정보 팝업, 경유지 순서대로 선으로 연결
- **장점**: 기능 풍부, Day별 색상 구분, 협업 지원
- **단점**: 세로 스크롤이 길어질 수 있음 (Compact View로 완화)

### Roadtrippers (https://roadtrippers.com)
- **데스크톱 레이아웃**: 좌측 좁은 사이드바(경유지 리스트) + 전체화면 지도
- **경유지 표현**: 최소한의 정보만 표시, 클릭하면 상세. 드래그로 순서 변경
- **지도 연동**: 루트 주변 POI 자동 표시 (30마일 범위 보라색 음영), 카테고리 필터
- **장점**: 깔끔하고 지도 중심. 정보 과부하 없음
- **단점**: 복잡한 멀티데이 비교에는 기능 부족

### Furkot (https://trips.furkot.com)
- **데스크톱 레이아웃**: 좌측에 Plan Drawer (Day 컬럼 + 경유지 리스트) + 우측 지도
- **Day 표현**: Day별 별도 컬럼. Day 클릭 시 해당 Day 설정 변경 가능
- **지도 연동**: Day별 다른 색상 루트, 거리/시간 누적 표시
- **장점**: Day 구조가 명확. 운전 시간 기반 자동 Day 분할
- **단점**: UI가 다소 복잡하고 구식

### Komoot (https://www.komoot.com)
- **데스크톱 레이아웃**: 좌측 사이드바 + 우측 지도 + 하단 고도 프로필
- **멀티데이**: 전체 투어를 개별 Daily Stage로 분할. 각 Stage 별도 저장
- **사이드바 토글**: H키로 숨기기/보이기
- **장점**: 고도/지형 정보 풍부. 아웃도어 특화
- **단점**: 여행 일정 비교보다는 단일 루트 계획에 초점

### Route4Me (https://route4me.com)
- **루트 비교 특화**: 여러 루트를 나란히 (side-by-side) 지도에 표시
- **Operation Matrix**: 선택한 루트들의 진행 상황을 색상 코딩된 지표로 비교
- **장점**: 유일하게 "복수 루트 비교"에 초점을 맞춘 UI
- **단점**: 물류/배송용이라 여행 맥락과 다름

### Mappr (https://www.mappr.co)
- **교통수단별 색상 코딩**: 비행(파란 점선), 기차(보라), 자동차(황갈색), 자전거(초록), 도보(빨간 점선)
- **번호 매긴 경유지**: 각 경유지에 순서 번호 표시
- **장점**: 교통수단 시각 구분이 명확
- **단점**: 비교 기능 없음

---

## 7. 우리 프로젝트에 대한 권장 레이아웃

### 현재 문제 분석
- 5개 루트의 Day 1~6 경유지를 한 번에 세로로 나열 → 지도보다 훨씬 긴 우측 패널
- 지도와 일정의 시각적 균형이 맞지 않음

### 권장 해결 방안

#### 방안 1: Day 탭 + Sticky Map (가장 권장)
```
[루트 선택 탭: 루트1 | 루트2 | 루트3 | 루트4 | 루트5]
┌──────────────────────┬──────────────────────┐
│ Day 탭               │                      │
│ [1][2][3][4][5][6]   │                      │
│                      │                      │
│ Day 3 경유지:        │    Sticky 지도        │
│ 1. 장소A  ★ S등급    │    (해당 Day 핀만     │
│   → 30분/25km        │     하이라이트)       │
│ 2. 장소B  ★ A등급    │                      │
│   → 45분/40km        │                      │
│ 3. 장소C  ★ B등급    │                      │
│                      │                      │
│ [총 이동: 2h 15min]  │                      │
└──────────────────────┴──────────────────────┘
```
- **Day 탭**으로 한 번에 하나의 Day만 표시 → 패널 길이 대폭 감소
- **지도를 sticky**로 고정 → 스크롤해도 지도 유지
- Day 탭 클릭 시 지도도 해당 Day 경유지로 자동 줌
- 6 Day면 탭이 딱 적당한 수

#### 방안 2: 아코디언 Day + Sticky Map
```
[루트 선택 탭: 루트1 | 루트2 | 루트3 | 루트4 | 루트5]
┌──────────────────────┬──────────────────────┐
│ ▶ Day 1: 시드니 출발  │                      │
│ ▼ Day 2: 블루마운틴   │                      │
│   1. Three Sisters   │    Sticky 지도        │
│   2. Scenic World    │    (펼친 Day 핀만     │
│   3. Echo Point      │     하이라이트)       │
│ ▶ Day 3: 해안도로    │                      │
│ ▶ Day 4: 코프스하버  │                      │
│ ▶ Day 5: 바이런베이  │                      │
│ ▶ Day 6: 골드코스트  │                      │
└──────────────────────┴──────────────────────┘
```
- 전체 Day 구조를 한눈에 조망 가능
- 관심 Day만 펼쳐서 상세 확인
- 여러 Day를 동시에 펼칠 수도 있음

#### 방안 3: 루트 비교 모드 (5개 루트 한눈에)
```
[비교 모드 | 상세 모드]
┌────────────────────────────────────────────┐
│              전체 지도 (5개 루트 색상별)      │
│    ── 루트1(빨강) ── 루트2(파랑) ── ...     │
├────────────────────────────────────────────┤
│ Day 탭: [1][2][3][4][5][6]                  │
├────┬────┬────┬────┬────┤
│루트1│루트2│루트3│루트4│루트5│
│장소A│장소D│장소G│장소J│장소M│
│장소B│장소E│장소H│장소K│장소N│
│장소C│장소F│장소I│장소L│장소O│
│2h30│3h00│2h45│3h15│2h50│
└────┴────┴────┴────┴────┘
```
- 지도 상단 + 비교 테이블 하단 (수직 분할)
- Day 탭으로 해당 Day만 비교
- 5개 루트를 가로로 나란히 배치 → 직접 비교 가능
- 좌우 비대칭 문제 자체가 없음

### 핵심 개선 포인트 요약

| 문제 | 해결책 | 참고 사례 |
|------|--------|-----------|
| 우측 패널이 너무 길다 | Day 탭/아코디언으로 콘텐츠 분할 | Wanderlog Day 필터, Furkot Day 컬럼 |
| 지도와 패널 비대칭 | 지도를 position: sticky로 고정 | Airbnb 검색결과, CSS sticky sidebar 패턴 |
| 5개 루트 동시 비교 어려움 | 상단 지도 + 하단 비교 테이블 (수직 분할) | Route4Me side-by-side |
| 모바일 대응 | 리스트 기본 + 지도 토글 버튼 | NNGroup 권장, Airbnb/Yelp 모바일 |
| 경유지 정보 과다 | Compact View 옵션 | Wanderlog compact view |

---

## Sources

- [Eleken - Map UI Design Best Practices](https://www.eleken.co/blog-posts/map-ui-design)
- [Pixso - Travel App UI Design Case Studies 2025](https://pixso.net/tips/travel-app-ui/)
- [Wanderlog](https://wanderlog.com/)
- [Wanderlog Compact View](https://help.wanderlog.com/hc/en-us/articles/13356092870427-Itinerary-compact-view)
- [Roadtrippers](https://roadtrippers.com/)
- [How to Use Roadtrippers](https://www.detailorientedtraveler.com/how-to-use-roadtrippers/)
- [Furkot](https://trips.furkot.com/)
- [Furkot Features](https://help.furkot.com/features.html)
- [Furkot Day Settings](https://help.furkot.com/features/day-details.html)
- [Komoot Multi-day Tours](https://support.komoot.com/hc/en-us/articles/4410595058202-Edit-multi-day-Tours)
- [Route4Me Compare Routes](https://support.route4me.com/compare-routes-side-by-side-routes-map/)
- [Mappr Travel Map Planner](https://www.mappr.co/travel-map-planner-visualize-multi-stop-trip-itineraries/)
- [Dribbble - Travel Map UI](https://dribbble.com/search/travel-map-ui)
- [Dribbble - Trip Planner](https://dribbble.com/tags/trip-planner)
- [Figma Trip Planner UI Kit](https://www.figma.com/community/file/1339623842259457307/trip-planner-app-ui-kit)
- [NNGroup - Maps and Location Finders on Mobile](https://www.nngroup.com/articles/mobile-maps-locations/)
- [Eleken - Tabs UX Best Practices](https://www.eleken.co/blog-posts/tabs-ux)
- [Cieden - Accordion UI Design](https://cieden.com/book/atoms/accordion/accordion-ui-design)
- [CSS-Tricks - Sticky Sidebar](https://css-tricks.com/a-dynamically-sized-sticky-sidebar-with-html-and-css/)
- [Medium - Yelp Map View UI](https://medium.com/adventures-in-consumer-technology/exploring-ui-of-map-view-in-yelp-like-apps-6641b3bf292a)
- [UX Case Study - Travel Planning](https://jacquelai-portfolio-befd09.webflow.io/project/travel-planning-app)
- [Medium - TraveLog UX Case Study](https://syjkktt.medium.com/ux-case-study-travelog-plan-your-trip-easier-bfad29bb8a80)
