#!/usr/bin/env python3
"""
인라인 마커 기반 데이터 동기화 엔진.

마커 문법: <!-- sync:NAMESPACE:KEY -->값<!-- /sync -->

루트 네임스페이스 (SSOTRegistry):
- route: 거리 (route_data.json 기반). 키: {루트}:total_km, {루트}:d{일차}:day_km
- score: 관광지 점수/등급 (attraction_scored.json). 키: {place_id}:grade, {place_id}:score
- grade_count: 등급 집계. 키: {루트}:S, {루트}:A 등
- eval: 루트 평가 점수 (루트 MD v7 섹션). 키: {루트}:total, {루트}:A, {루트}:B, {루트}:C

데이터 문서 네임스페이스 (DataDocsRegistry):
- lodging: 숙소 집계. 키: total, basic_total, invest_total, basic:{stop_id}, invest:{stop_id}
- dining: 식당 집계. 키: total, count:{stop_id}, label:{라벨}, label:{stop_id}:{라벨}, controversy_total, controversy:{stop_id}
- activities: 액티비티 집계. 키: total, count:{region_id}, may:{level}, may:{region_id}:{level}
"""

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
SCORED_PATH = ROOT / "data" / "scores" / "attraction_scored.json"
ROUTE_DATA_PATH = ROOT / "data" / "routes" / "route_data.json"
ROUTE_DIR = ROOT / "research" / "route-plans"
LODGING_PATH = ROOT / "data" / "lodging" / "lodging_data.json"
DINING_PATH = ROOT / "data" / "dining" / "dining_data.json"
ACTIVITIES_PATH = ROOT / "data" / "activities" / "activities_data.json"


# ──────────────────────────────────────────────
# SyncMarker
# ──────────────────────────────────────────────

@dataclass
class SyncMarker:
    """마커 하나를 나타내는 데이터 클래스."""
    namespace: str
    key: str
    current_value: str
    line_number: int
    full_match: str


@dataclass
class Mismatch:
    """불일치 항목."""
    marker: SyncMarker
    expected: str
    file_path: Optional[str] = None


@dataclass
class Change:
    """변경 항목."""
    marker: SyncMarker
    old_value: str
    new_value: str
    file_path: Optional[str] = None


# ──────────────────────────────────────────────
# 유틸리티
# ──────────────────────────────────────────────

def _normalize_num(val: str) -> str:
    """숫자 비교 시 콤마를 제거하여 정규화. '2,240' == '2240'."""
    return val.replace(",", "").strip()


# ──────────────────────────────────────────────
# SSOTRegistry
# ──────────────────────────────────────────────

def _build_search_names(name: str) -> list[str]:
    """장소명에서 검색용 키워드 리스트 생성 (긴 것부터)."""
    names = [name]
    short = re.sub(r"\s*\(.*?\)\s*", "", name).strip()
    if short and short != name:
        names.append(short)
    return names


class SSOTRegistry:
    """모든 SSOT를 로드하고 기대값을 반환."""

    def __init__(self):
        self._score_map: dict[str, dict] = {}       # id -> {grade, score}
        self._name_to_id: dict[str, str] = {}        # name_ko -> id
        self._route_data: dict = {}                   # route_data.json 전체
        self._route_km: dict[str, dict] = {}          # {루트: {total_km, d1_day_km, ...}}
        self._grade_counts: dict[str, dict] = {}      # {루트: {S: n, A: n, ...}}
        self._eval_scores: dict[str, dict] = {}       # {루트: {total, A, B, C}}

        self._load_scores()
        self._load_route_data()
        self._parse_eval_from_md()

    def _load_scores(self):
        """attraction_scored.json 로드."""
        with open(SCORED_PATH, encoding="utf-8") as f:
            data = json.load(f)

        for s in data["scores"]:
            pid = s["id"]
            score = s.get("may_adjusted_score", s["average_score"])
            self._score_map[pid] = {
                "grade": s["grade"],
                "score": score,
                "name_ko": s["name_ko"],
            }
            # 이름→ID 매핑 (정식 이름 + 괄호 제거 버전)
            for variant in _build_search_names(s["name_ko"]):
                self._name_to_id[variant] = pid

    def _find_place_id(self, stop_name: str) -> Optional[str]:
        """route_data의 stop name으로 scored.json의 place_id를 찾는다."""
        # 1) 정확한 이름 매칭
        if stop_name in self._name_to_id:
            return self._name_to_id[stop_name]
        # 2) 부분 매칭 (stop_name이 scored name에 포함되거나 그 반대)
        for scored_name, pid in self._name_to_id.items():
            if stop_name in scored_name or scored_name in stop_name:
                return pid
        # 3) 공백 제거 후 매칭 (룩앳미나우 vs 룩 앳 미 나우)
        stop_nospace = stop_name.replace(" ", "")
        for scored_name, pid in self._name_to_id.items():
            scored_nospace = scored_name.replace(" ", "")
            if stop_nospace in scored_nospace or scored_nospace in stop_nospace:
                return pid
        return None

    def _load_route_data(self):
        """route_data.json 로드 + day_km/total_km 재계산 + stops.grade 동기화."""
        with open(ROUTE_DATA_PATH, encoding="utf-8") as f:
            self._route_data = json.load(f)

        for route_num, route in self._route_data["routes"].items():
            grade_counter: dict[str, int] = {}
            recalc_total = 0

            for day_info in route["days"]:
                day_num = day_info["day"]
                # day_km 재계산: stops의 distance_km 합산
                recalc_day_km = sum(
                    s.get("distance_km", 0) for s in day_info["stops"]
                )

                # stops.grade를 scored.json 기준으로 동기화
                for stop in day_info["stops"]:
                    if stop.get("type") != "attraction":
                        continue
                    pid = stop.get("id") or self._find_place_id(stop["name"])
                    if pid and pid in self._score_map:
                        correct_grade = self._score_map[pid]["grade"]
                        stop["grade"] = correct_grade
                        # grade_count 집계
                        grade_counter[correct_grade] = grade_counter.get(correct_grade, 0) + 1

                # 저장
                key_prefix = route_num
                if key_prefix not in self._route_km:
                    self._route_km[key_prefix] = {}
                self._route_km[key_prefix][f"d{day_num}:day_km"] = str(recalc_day_km)
                day_info["day_km"] = recalc_day_km
                recalc_total += recalc_day_km

            self._route_km[route_num]["total_km"] = f"{recalc_total:,}"
            route["total_km"] = recalc_total
            self._grade_counts[route_num] = grade_counter

    def _parse_eval_from_md(self):
        """각 루트 MD 파일의 v7 재평가 섹션에서 eval 점수 파싱."""
        route_files = sorted(ROUTE_DIR.glob("*.md"))

        for fpath in route_files:
            if fpath.name == "README.md":
                continue
            # 파일명에서 루트 번호 추출: "N조_..." 패턴
            m = re.match(r"(\d+)조_", fpath.name)
            if not m:
                continue
            route_num = m.group(1)

            content = fpath.read_text(encoding="utf-8")
            self._parse_v7_eval(route_num, content)

    def _parse_v7_eval(self, route_num: str, content: str):
        """v7 재평가 테이블에서 종합, A', B', C' 점수를 추출."""
        # v7 재평가 섹션 찾기
        v7_match = re.search(r"###\s*v7\s*재평가", content)
        if not v7_match:
            return

        # v7 섹션 이후의 테이블만 파싱
        section = content[v7_match.start():]
        # 다음 ### 또는 --- 이전까지
        end = re.search(r"\n(?:###\s|---)", section[10:])
        if end:
            section = section[:end.start() + 10]

        eval_data: dict[str, str] = {}

        # 테이블 행 파싱: | A' (루트 설계자) | 77.5 |  또는  | **종합** | **78.0** |
        for line in section.split("\n"):
            line = line.strip()
            if not line.startswith("|"):
                continue
            cells = [c.strip() for c in line.split("|")]
            # cells: ['', 'A\' (루트 설계자)', '77.5', ''] 등
            if len(cells) < 3:
                continue

            label = cells[1].strip().replace("**", "")
            value = cells[2].strip().replace("**", "")

            # 숫자인지 확인
            try:
                float(value)
            except ValueError:
                continue

            if "종합" in label:
                eval_data["total"] = value
            elif label.startswith("A"):
                eval_data["A"] = value
            elif label.startswith("B"):
                eval_data["B"] = value
            elif label.startswith("C"):
                eval_data["C"] = value

        if eval_data:
            self._eval_scores[route_num] = eval_data

    def get(self, namespace: str, key: str) -> Optional[str]:
        """네임스페이스와 키로 SSOT 기대값을 반환."""
        if namespace == "route":
            # key: "6:total_km" 또는 "6:d3:day_km"
            parts = key.split(":", 1)
            route_num = parts[0]
            sub_key = parts[1] if len(parts) > 1 else ""
            if route_num in self._route_km:
                return self._route_km[route_num].get(sub_key)
            return None

        elif namespace == "score":
            # key: "{place_id}:grade" 또는 "{place_id}:score"
            parts = key.rsplit(":", 1)
            if len(parts) != 2:
                return None
            pid, field = parts
            if pid in self._score_map:
                if field == "grade":
                    return self._score_map[pid]["grade"]
                elif field == "score":
                    return str(self._score_map[pid]["score"])
            return None

        elif namespace == "grade_count":
            # key: "6:S" 또는 "6:A"
            parts = key.split(":", 1)
            if len(parts) != 2:
                return None
            route_num, grade = parts
            if route_num in self._grade_counts:
                count = self._grade_counts[route_num].get(grade, 0)
                return str(count)
            return None

        elif namespace == "eval":
            # key: "6:total", "6:A", "6:B", "6:C"
            parts = key.split(":", 1)
            if len(parts) != 2:
                return None
            route_num, field = parts
            if route_num in self._eval_scores:
                return self._eval_scores[route_num].get(field)
            return None

        return None

    def get_route_data(self) -> dict:
        """정합 보정된 route_data 딕셔너리를 반환."""
        return self._route_data

    def get_route_data_changes(self) -> list[str]:
        """route_data.json 정합 보정 내역 (원본과 비교)."""
        changes = []
        with open(ROUTE_DATA_PATH, encoding="utf-8") as f:
            original = json.load(f)

        for route_num, route in self._route_data["routes"].items():
            orig_route = original["routes"].get(route_num, {})

            # total_km 비교
            if route["total_km"] != orig_route.get("total_km"):
                changes.append(
                    f"  [fix] {route_num}조 total_km: "
                    f"{orig_route.get('total_km')} → {route['total_km']} (day_km 합산)"
                )

            for day_info in route["days"]:
                day_num = day_info["day"]
                orig_days = orig_route.get("days", [])
                orig_day = next(
                    (d for d in orig_days if d["day"] == day_num), {}
                )

                # day_km 비교
                if day_info["day_km"] != orig_day.get("day_km"):
                    changes.append(
                        f"  [fix] {route_num}조 Day {day_num} day_km: "
                        f"{orig_day.get('day_km')} → {day_info['day_km']} (stops 합산)"
                    )

                # stops.grade 비교
                orig_stops = orig_day.get("stops", [])
                for i, stop in enumerate(day_info["stops"]):
                    if stop.get("type") != "attraction":
                        continue
                    orig_stop = orig_stops[i] if i < len(orig_stops) else {}
                    if stop.get("grade") != orig_stop.get("grade"):
                        changes.append(
                            f"  [fix] {route_num}조 Day {day_num} "
                            f"{stop['name']}: grade {orig_stop.get('grade')} → {stop['grade']}"
                        )

        return changes

    def save_route_data(self):
        """정합 보정된 route_data.json을 저장."""
        with open(ROUTE_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(self._route_data, f, ensure_ascii=False, indent=2)
            f.write("\n")


# ──────────────────────────────────────────────
# DataDocsRegistry (숙소/식당/액티비티)
# ──────────────────────────────────────────────

class DataDocsRegistry:
    """숙소/식당/액티비티 JSON에서 집계 통계를 계산하고 기대값을 반환."""

    def __init__(self):
        self._values: dict[str, dict[str, str]] = {
            "lodging": {},
            "dining": {},
            "activities": {},
        }
        self._load_lodging()
        self._load_dining()
        self._load_activities()

    def _load_lodging(self):
        """lodging_data.json에서 기본/투자 집계."""
        with open(LODGING_PATH, encoding="utf-8") as f:
            data = json.load(f)

        total_basic = 0
        total_invest = 0
        v = self._values["lodging"]

        for stop in data["stops"]:
            sid = stop["id"]
            basic = sum(1 for l in stop["lodgings"] if l.get("track") != "invest")
            invest = sum(1 for l in stop["lodgings"] if l.get("track") == "invest")
            v[f"basic:{sid}"] = str(basic)
            v[f"invest:{sid}"] = str(invest)
            v[f"count:{sid}"] = str(len(stop["lodgings"]))
            total_basic += basic
            total_invest += invest

        v["basic_total"] = str(total_basic)
        v["invest_total"] = str(total_invest)
        v["total"] = str(total_basic + total_invest)

    def _load_dining(self):
        """dining_data.json에서 라벨/논쟁 집계."""
        with open(DINING_PATH, encoding="utf-8") as f:
            data = json.load(f)

        v = self._values["dining"]
        label_totals: dict[str, int] = {}
        controversy_total = 0
        grand_total = 0

        for stop in data["stops"]:
            sid = stop["id"]
            restaurants = stop["restaurants"]
            v[f"count:{sid}"] = str(len(restaurants))
            grand_total += len(restaurants)

            # 거점별 라벨 분포
            label_counts: dict[str, int] = {}
            controversy_count = 0
            for r in restaurants:
                label = r.get("label", "")
                label_counts[label] = label_counts.get(label, 0) + 1
                label_totals[label] = label_totals.get(label, 0) + 1
                if r.get("controversy"):
                    controversy_count += 1
                    controversy_total += 1

            for label, count in label_counts.items():
                v[f"label:{sid}:{label}"] = str(count)
            v[f"controversy:{sid}"] = str(controversy_count)

        v["total"] = str(grand_total)
        for label, count in label_totals.items():
            v[f"label:{label}"] = str(count)
        v["controversy_total"] = str(controversy_total)

    def _load_activities(self):
        """activities_data.json에서 지역별/적합도 집계."""
        with open(ACTIVITIES_PATH, encoding="utf-8") as f:
            data = json.load(f)

        v = self._values["activities"]
        may_totals: dict[str, int] = {}
        grand_total = 0

        for region in data["regions"]:
            rid = region["id"]
            activities = region["activities"]
            v[f"count:{rid}"] = str(len(activities))
            grand_total += len(activities)

            # 지역별 5월 적합도
            may_counts: dict[str, int] = {}
            for a in activities:
                may = a.get("may", "")
                may_counts[may] = may_counts.get(may, 0) + 1
                may_totals[may] = may_totals.get(may, 0) + 1

            for level, count in may_counts.items():
                v[f"may:{rid}:{level}"] = str(count)

        v["total"] = str(grand_total)
        for level, count in may_totals.items():
            v[f"may:{level}"] = str(count)

    def get(self, namespace: str, key: str) -> Optional[str]:
        """네임스페이스와 키로 기대값 반환."""
        ns_values = self._values.get(namespace)
        if ns_values is None:
            return None
        return ns_values.get(key)

    def dump_all(self) -> dict[str, dict[str, str]]:
        """디버깅용: 모든 값 출력."""
        return self._values


# ──────────────────────────────────────────────
# SyncEngine
# ──────────────────────────────────────────────

class SyncEngine:
    """마커 파싱/교체 엔진."""

    MARKER_RE = re.compile(
        r"(<!-- sync:(\w+):([\w:\-]+) -->)(.*?)(<!-- /sync -->)"
    )

    @classmethod
    def parse_markers(cls, content: str) -> list[SyncMarker]:
        """콘텐츠에서 모든 마커를 파싱."""
        markers = []
        for line_num, line in enumerate(content.split("\n"), start=1):
            for m in cls.MARKER_RE.finditer(line):
                markers.append(SyncMarker(
                    namespace=m.group(2),
                    key=m.group(3),
                    current_value=m.group(4),
                    line_number=line_num,
                    full_match=m.group(0),
                ))
        return markers

    @classmethod
    def check(cls, content: str, registry: SSOTRegistry) -> list[Mismatch]:
        """마커 값과 SSOT를 비교하여 불일치 목록 반환."""
        markers = cls.parse_markers(content)
        mismatches = []
        for marker in markers:
            expected = registry.get(marker.namespace, marker.key)
            if expected is not None and _normalize_num(marker.current_value) != _normalize_num(expected):
                mismatches.append(Mismatch(
                    marker=marker,
                    expected=expected,
                ))
        return mismatches

    @classmethod
    def fix(cls, content: str, registry: SSOTRegistry) -> tuple[str, list[Change]]:
        """마커 값을 SSOT 기준으로 교체. (수정된 content, 변경 목록) 반환."""
        changes: list[Change] = []

        def replacer(m: re.Match) -> str:
            ns = m.group(2)
            key = m.group(3)
            current = m.group(4)
            expected = registry.get(ns, key)
            if expected is not None and current != expected:
                # 줄 번호 계산
                pos = m.start()
                line_num = content[:pos].count("\n") + 1
                changes.append(Change(
                    marker=SyncMarker(
                        namespace=ns,
                        key=key,
                        current_value=current,
                        line_number=line_num,
                        full_match=m.group(0),
                    ),
                    old_value=current,
                    new_value=expected,
                ))
                return f"{m.group(1)}{expected}{m.group(5)}"
            return m.group(0)

        new_content = cls.MARKER_RE.sub(replacer, content)
        return new_content, changes


# ──────────────────────────────────────────────
# 마커 삽입 (--init)
# ──────────────────────────────────────────────

class MarkerInserter:
    """기존 MD 파일에 sync 마커를 삽입."""

    @staticmethod
    def insert_route_header_markers(content: str, route_num: str) -> tuple[str, list[str]]:
        """루트 파일 헤더의 총 이동거리, S등급 방문에 마커 삽입."""
        changes = []

        # 총 이동거리: 2,240km → 마커로 감싸기
        # 패턴: "총 이동거리": 또는 "총 이동거리: "
        def wrap_total_km(m: re.Match) -> str:
            prefix = m.group(1)
            value = m.group(2)
            suffix = m.group(3)
            # 이미 마커가 있으면 스킵
            if "<!-- sync:" in prefix:
                return m.group(0)
            marker = f"<!-- sync:route:{route_num}:total_km -->{value}<!-- /sync -->"
            changes.append(f"  총 이동거리 마커 삽입: {value}")
            return f"{prefix}{marker}{suffix}"

        # "총 이동거리": N,NNNkm 또는 N,NNN km
        content = re.sub(
            r"(총 이동거리[」\*]*:\s*)([\d,]+)\s*(km)",
            wrap_total_km,
            content,
            count=1,  # 헤더에서 첫 번째만
        )

        # S등급 방문: N곳 → grade_count 마커로 감싸기
        def wrap_s_count(m: re.Match) -> str:
            prefix = m.group(1)
            value = m.group(2)
            suffix = m.group(3)
            if "<!-- sync:" in prefix:
                return m.group(0)
            marker = f"<!-- sync:grade_count:{route_num}:S -->{value}<!-- /sync -->"
            changes.append(f"  S등급 방문 마커 삽입: {value}곳")
            return f"{prefix}{marker}{suffix}"

        content = re.sub(
            r"(S등급 방문[」\*]*:\s*)(\d+)(곳)",
            wrap_s_count,
            content,
            count=1,
        )

        return content, changes

    @staticmethod
    def insert_day_km_markers(content: str, route_num: str) -> tuple[str, list[str]]:
        """Day 요약의 "총 이동거리: NNNkm"에 마커 삽입."""
        changes = []
        lines = content.split("\n")
        current_day = None

        for i, line in enumerate(lines):
            # Day N 헤더 감지: ### Day N —
            day_match = re.match(r"###\s*Day\s*(\d+)", line)
            if day_match:
                current_day = day_match.group(1)
                continue

            # Day 섹션 종료 감지: --- 또는 Day가 아닌 ## / ### 헤더
            if current_day is not None:
                if line.strip() == "---":
                    current_day = None
                    continue
                if re.match(r"#{1,3}\s+(?!Day\s)", line):
                    current_day = None
                    continue

            if current_day is None:
                continue

            # Day 내 "총 이동거리": NNNkm (Day별 요약)
            # "- **총 이동거리**: 271km" 형태
            km_match = re.search(
                r"(\*\*총 이동거리\*\*:\s*)([\d,]+)\s*(km)",
                line,
            )
            if km_match and "<!-- sync:" not in line:
                old_val = km_match.group(2)
                marker = f"<!-- sync:route:{route_num}:d{current_day}:day_km -->{old_val}<!-- /sync -->"
                lines[i] = line.replace(
                    f"{km_match.group(1)}{km_match.group(2)}{km_match.group(3)}",
                    f"{km_match.group(1)}{marker}{km_match.group(3)}",
                )
                changes.append(f"  Day {current_day} 이동거리 마커 삽입: {old_val}km")

        return "\n".join(lines), changes

    @staticmethod
    def insert_readme_markers(content: str) -> tuple[str, list[str]]:
        """README 종합표 셀에 마커 삽입.

        종합표 형식:
        | 순위 | 안 | v7 점수 | A'(설계) | B'(감성) | C'(실행) | 이동거리 | S등급 | 비고 |
        | **1** | **6조** ... | **78.0** | 77.5 | 80.5 | 76.0 | 2,240km | 6곳 | ... |
        """
        changes = []
        lines = content.split("\n")
        in_v7_table = False

        for i, line in enumerate(lines):
            # v7 종합 순위 테이블 탐지
            if "v7 점수" in line and "A'(설계)" in line:
                in_v7_table = True
                continue
            # 구분선 스킵
            if in_v7_table and line.strip().startswith("|") and set(line.replace("|", "").replace("-", "").replace(":", "").strip()) == set():
                continue
            # 테이블 종료
            if in_v7_table and not line.strip().startswith("|"):
                in_v7_table = False
                continue

            if not in_v7_table:
                continue
            if "<!-- sync:" in line:
                continue

            # 셀 파싱
            cells = line.split("|")
            if len(cells) < 9:
                continue

            # 루트 번호 추출: "**6조**" 등
            route_match = re.search(r"\*\*(\d+)조\*\*", cells[2])
            if not route_match:
                continue
            rn = route_match.group(1)

            # cells[3] = v7 점수, cells[4] = A', cells[5] = B', cells[6] = C', cells[7] = 이동거리, cells[8] = S등급
            # v7 점수 (eval:total)
            score_m = re.search(r"\*\*([\d.]+)\*\*", cells[3])
            if score_m:
                val = score_m.group(1)
                cells[3] = cells[3].replace(
                    f"**{val}**",
                    f"**<!-- sync:eval:{rn}:total -->{val}<!-- /sync -->**",
                )

            # A' (eval:A)
            a_m = re.search(r"([\d.]+)", cells[4].strip())
            if a_m:
                val = a_m.group(1)
                cells[4] = cells[4].replace(val, f"<!-- sync:eval:{rn}:A -->{val}<!-- /sync -->", 1)

            # B' (eval:B)
            b_m = re.search(r"([\d.]+)", cells[5].strip())
            if b_m:
                val = b_m.group(1)
                cells[5] = cells[5].replace(val, f"<!-- sync:eval:{rn}:B -->{val}<!-- /sync -->", 1)

            # C' (eval:C)
            c_m = re.search(r"([\d.]+)", cells[6].strip())
            if c_m:
                val = c_m.group(1)
                cells[6] = cells[6].replace(val, f"<!-- sync:eval:{rn}:C -->{val}<!-- /sync -->", 1)

            # 이동거리 (route:total_km)
            km_m = re.search(r"([\d,]+)km", cells[7])
            if km_m:
                val = km_m.group(1)
                cells[7] = cells[7].replace(
                    f"{val}km",
                    f"<!-- sync:route:{rn}:total_km -->{val}<!-- /sync -->km",
                )

            # S등급 (grade_count:S)
            s_m = re.search(r"(\d+)곳", cells[8])
            if s_m:
                val = s_m.group(1)
                cells[8] = cells[8].replace(
                    f"{val}곳",
                    f"<!-- sync:grade_count:{rn}:S -->{val}<!-- /sync -->곳",
                )

            new_line = "|".join(cells)
            if new_line != line:
                lines[i] = new_line
                changes.append(f"  README {rn}조 행 마커 삽입")

        return "\n".join(lines), changes
