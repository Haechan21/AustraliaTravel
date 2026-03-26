#!/usr/bin/env python3
"""
인라인 마커 기반 루트 문서 동기화 CLI.

로드트립 루트: 마커 기반 동기화 (route_data.json ↔ route-plans/ MD)
시드니 루트: 내부 정합성 검증 (sydney_route_data.json + routes.html 점수)

Usage:
    python scripts/sync_route_docs.py              # dry-run: 불일치 리포트
    python scripts/sync_route_docs.py --fix        # 마커 값 교체 + route_data.json 정합
    python scripts/sync_route_docs.py --init       # 마커 삽입 dry-run
    python scripts/sync_route_docs.py --init --fix # 마커 실제 삽입
    python scripts/sync_route_docs.py --check-only # CI용: 불일치 시 exit 1
"""

import json
import re
import sys
from pathlib import Path

# 같은 디렉토리의 sync_engine 임포트
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sync_engine import (
    SSOTRegistry,
    SyncEngine,
    MarkerInserter,
    ROUTE_DIR,
    SYDNEY_ROUTE_DATA_PATH,
    ROOT,
)


def get_route_num(fpath: Path) -> str | None:
    """파일명에서 루트 번호 추출: 'N조_...' 패턴."""
    m = re.match(r"(\d+)조_", fpath.name)
    return m.group(1) if m else None


def run_check(registry: SSOTRegistry, fix: bool = False) -> int:
    """마커 값 검사/교체. 불일치 수 반환."""
    md_files = sorted(ROUTE_DIR.glob("*.md"))
    total_mismatches = 0

    # 1) route_data.json 정합 보정
    route_changes = registry.get_route_data_changes()
    if route_changes:
        print(f"\n📄 route_data.json")
        for c in route_changes:
            print(c)
        if fix:
            registry.save_route_data()
            print(f"  → 저장 완료")
        total_mismatches += len(route_changes)

    # 2) MD 파일 마커 검사/교체
    for fpath in md_files:
        content = fpath.read_text(encoding="utf-8")
        markers = SyncEngine.parse_markers(content)
        if not markers:
            continue

        if fix:
            # fix 모드: 값이 다르면 (포맷 포함) 교체
            new_content, changes = SyncEngine.fix(content, registry)
            if changes:
                total_mismatches += len(changes)
                print(f"\n📄 {fpath.name} — {len(changes)}건 수정")
                for ch in changes:
                    print(
                        f"  L{ch.marker.line_number} "
                        f"[{ch.marker.namespace}:{ch.marker.key}] "
                        f"{ch.old_value} → {ch.new_value}"
                    )
                fpath.write_text(new_content, encoding="utf-8")
        else:
            # check 모드: 정규화 비교 (콤마 차이는 무시)
            mismatches = SyncEngine.check(content, registry)
            if mismatches:
                total_mismatches += len(mismatches)
                print(f"\n📄 {fpath.name} — {len(mismatches)}건 불일치")
                for mm in mismatches:
                    print(
                        f"  L{mm.marker.line_number} "
                        f"[{mm.marker.namespace}:{mm.marker.key}] "
                        f"{mm.marker.current_value} → {mm.expected}"
                    )

    return total_mismatches


def run_init(fix: bool = False) -> int:
    """마커 삽입. 변경 건수 반환."""
    md_files = sorted(ROUTE_DIR.glob("*.md"))
    total_changes = 0

    for fpath in md_files:
        content = fpath.read_text(encoding="utf-8")
        all_changes: list[str] = []

        if fpath.name == "README.md":
            new_content, changes = MarkerInserter.insert_readme_markers(content)
            all_changes.extend(changes)
        else:
            route_num = get_route_num(fpath)
            if not route_num:
                continue

            # 헤더 마커 삽입
            new_content, changes = MarkerInserter.insert_route_header_markers(
                content, route_num
            )
            all_changes.extend(changes)

            # Day별 이동거리 마커 삽입
            new_content, changes = MarkerInserter.insert_day_km_markers(
                new_content, route_num
            )
            all_changes.extend(changes)

        if not all_changes:
            continue

        total_changes += len(all_changes)
        action = "삽입" if fix else "삽입 예정"
        print(f"\n📄 {fpath.name} — {len(all_changes)}건 {action}")
        for c in all_changes:
            print(c)

        if fix:
            fpath.write_text(new_content, encoding="utf-8")

    return total_changes


def validate_sydney_routes(fix: bool = False) -> int:
    """sydney_route_data.json 내부 정합성 검증 (+ --fix 시 자동 보정).

    검증 항목:
    1. stops distance_km 합산 == day_km
    2. day_km 합산 == total_km
    3. (score_a + score_b + score_c) / 3 ≈ score
    """
    if not SYDNEY_ROUTE_DATA_PATH.exists():
        return 0

    with open(SYDNEY_ROUTE_DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)

    issues = 0
    fixed = False

    for key in sorted(data["routes"]):
        route = data["routes"][key]

        # 1. stops distance_km 합산 == day_km, day_km 합산 == total_km
        recalc_total = 0.0
        for day in route["days"]:
            stops_sum = round(
                sum(s.get("distance_km", 0) for s in day["stops"]), 1
            )
            day_km = day["day_km"]
            if abs(stops_sum - day_km) > 0.05:
                print(
                    f"  [시드니] {key}조 Day {day['day']} "
                    f"stops 합산({stops_sum}) ≠ day_km({day_km})"
                )
                if fix:
                    day["day_km"] = stops_sum
                    print(f"    → day_km을 {stops_sum}으로 보정")
                    fixed = True
                issues += 1
            recalc_total += day["day_km"]

        recalc_total = round(recalc_total, 1)
        if abs(recalc_total - route["total_km"]) > 0.05:
            print(
                f"  [시드니] {key}조 "
                f"day_km 합산({recalc_total}) ≠ total_km({route['total_km']})"
            )
            if fix:
                route["total_km"] = recalc_total
                print(f"    → total_km을 {recalc_total}으로 보정")
                fixed = True
            issues += 1

        # 2. score == (score_a + score_b + score_c) / 3
        score_avg = round(
            (route["score_a"] + route["score_b"] + route["score_c"]) / 3, 1
        )
        if abs(score_avg - route["score"]) > 0.05:
            print(
                f"  [시드니] {key}조 "
                f"score 평균({score_avg}) ≠ score({route['score']})"
            )
            if fix:
                route["score"] = score_avg
                print(f"    → score를 {score_avg}으로 보정")
                fixed = True
            issues += 1

    # HTML 점수 바 하드코딩 검증
    routes_html = ROOT / "routes.html"
    if routes_html.exists():
        html = routes_html.read_text(encoding="utf-8")
        for key, route in data["routes"].items():
            # data-sydney-map="N" ... score-num">XX.X 패턴
            pattern = (
                rf'data-sydney-map="{key}".*?'
                rf'class="score-num">([\d.]+)<'
            )
            m = re.search(pattern, html, re.DOTALL)
            if m:
                html_score = float(m.group(1))
                json_score = route["score"]
                if abs(html_score - json_score) > 0.05:
                    print(
                        f"  [시드니 HTML] {key}조 지도탭 점수 "
                        f"HTML({html_score}) ≠ JSON({json_score})"
                    )
                    issues += 1

            # 상세탭: data-sydney="N"
            pattern2 = (
                rf'data-sydney="{key}".*?'
                rf'class="score-num">([\d.]+)<'
            )
            m2 = re.search(pattern2, html, re.DOTALL)
            if m2:
                html_score2 = float(m2.group(1))
                json_score = route["score"]
                if abs(html_score2 - json_score) > 0.05:
                    print(
                        f"  [시드니 HTML] {key}조 상세탭 점수 "
                        f"HTML({html_score2}) ≠ JSON({json_score})"
                    )
                    issues += 1

    if fix and fixed:
        with open(SYDNEY_ROUTE_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print("  → sydney_route_data.json 저장 완료")

    return issues


def main():
    args = set(sys.argv[1:])
    fix = "--fix" in args
    init = "--init" in args
    check_only = "--check-only" in args

    print("=== 데이터 동기화 리포트 ===\n")

    if init:
        # 마커 삽입 모드
        total = run_init(fix=fix)
        print(f"\n{'=' * 40}")
        if fix:
            print(f"총 {total}건 마커 삽입 완료")
        else:
            print(f"총 {total}건 마커 삽입 예정")
            if total > 0:
                print("→ 실제 삽입하려면: python scripts/sync_route_docs.py --init --fix")
    else:
        # 검사/교체 모드
        registry = SSOTRegistry()
        total = run_check(registry, fix=fix)

        # 시드니 루트 내부 정합성 검증
        print("\n--- 시드니 루트 검증 ---")
        sydney_issues = validate_sydney_routes(fix=fix)
        total += sydney_issues

        print(f"\n{'=' * 40}")
        if total == 0:
            print("불일치 없음 ✅")
        elif fix:
            print(f"총 {total}건 수정 완료 ✅")
        else:
            print(f"총 {total}건 불일치")
            if not check_only:
                print("→ 수정하려면: python scripts/sync_route_docs.py --fix")

        if check_only and total > 0:
            sys.exit(1)


if __name__ == "__main__":
    main()
