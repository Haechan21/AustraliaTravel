#!/usr/bin/env python3
"""
평가 결과 → 프론트엔드 데이터 + RANKINGS.md 생성 스크립트.

사용법:
    python scripts/generate_frontend.py            # 전체 생성 (재채점 + RANKINGS + place_data)
    python scripts/generate_frontend.py --rescore  # 등급 재계산만
    python scripts/generate_frontend.py --rank     # RANKINGS.md만
    python scripts/generate_frontend.py --data     # place_data.json만

입력:
    data/scores/scorer_A.json
    data/scores/scorer_B.json
    data/scores/scorer_C.json
    data/scores/attraction_scored.json
    data/places/attraction/*.json

출력:
    data/scores/RANKINGS.md
    assets/data/place_data.json
"""

import argparse
import glob
import json
import math
import os
import urllib.parse
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# ── 입출력 경로 ──
SCORED_FILE = PROJECT_ROOT / "data" / "scores" / "attraction_scored.json"
SCORER_FILES = {
    s: PROJECT_ROOT / "data" / "scores" / f"scorer_{s}.json"
    for s in ["A", "B", "C"]
}
PLACES_DIR = PROJECT_ROOT / "data" / "places" / "attraction"
RANKINGS_OUT = PROJECT_ROOT / "data" / "scores" / "RANKINGS.md"
PLACE_DATA_OUT = PROJECT_ROOT / "assets" / "data" / "place_data.json"

# ── 퍼센타일 등급 기준 ──
GRADE_PERCENTILES = [
    ("S", 0.05),   # 상위 ~5%
    ("A", 0.25),   # 상위 5~25%
    ("B", 0.60),   # 상위 25~60%
    ("C", 0.90),   # 상위 60~90%
    ("D", 1.00),   # 하위 10%
]

GRADE_DESC = {
    "S": "반드시 가야 할 곳",
    "A": "강력 추천",
    "B": "선택적",
    "C": "스킵 권장",
    "D": "비추천",
}


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(path.parent, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_all_data():
    """모든 원본 데이터 로드."""
    scored = load_json(SCORED_FILE)
    scorers = {s: load_json(p) for s, p in SCORER_FILES.items()}

    # Place files (중복 제외)
    place_files = {}
    for f in sorted(glob.glob(str(PLACES_DIR / "*.json"))):
        d = load_json(f)
        if not d.get("duplicate_of"):
            place_files[d["id"]] = d

    return scored, scorers, place_files


def get_score(item):
    """장소의 대표 점수 반환 (may_adjusted_score 우선)."""
    return item.get("may_adjusted_score", item["average_score"])


def get_grade(item):
    """장소의 등급 반환."""
    return item["grade"]


def build_scored(scored, scorers):
    """scorer 파일들로부터 attraction_scored.json 재생성.

    기존 scored 파일에 seasonal_adjustment가 있으면 보존하고,
    may_adjusted_score 기준으로 등급을 부여한다.
    """
    scorer_by_id = {
        s: {p["id"]: p for p in data["scores"]}
        for s, data in scorers.items()
    }

    # 기존 계절 보정 데이터 보존
    seasonal_map = {}
    for s in scored.get("scores", []):
        if "seasonal_adjustment" in s:
            seasonal_map[s["id"]] = s["seasonal_adjustment"]

    combined = []
    for s_key in ["A", "B", "C"]:
        if not combined:
            # A의 목록으로 초기화
            for place in scorers[s_key]["scores"]:
                combined.append({"id": place["id"], "name_ko": place["name_ko"], "region": place["region"]})

    for item in combined:
        pid = item["id"]
        totals = {s: scorer_by_id[s][pid]["total_score"] for s in ["A", "B", "C"]}
        avg = round(sum(totals.values()) / 3, 1)
        spread = round(max(totals.values()) - min(totals.values()), 1)

        item["scores"] = totals
        item["average_score"] = avg
        item["spread"] = spread
        item["controversial"] = spread >= 15

        # 계절 보정 적용
        adj = seasonal_map.get(pid, 0)
        item["seasonal_adjustment"] = adj
        item["may_adjusted_score"] = round(avg + adj, 1)

    # may_adjusted_score 내림차순 정렬
    combined.sort(key=lambda x: x["may_adjusted_score"], reverse=True)

    # 퍼센타일 등급 부여 (may_adjusted_score 기준)
    n = len(combined)
    cutoffs = []
    for grade, pct in GRADE_PERCENTILES:
        cutoffs.append((grade, math.ceil(n * pct)))

    for i, item in enumerate(combined):
        rank = i + 1
        for grade, cut in cutoffs:
            if rank <= cut:
                item["grade"] = grade
                break

    # 등급 분포
    grade_dist = {}
    for item in combined:
        g = item["grade"]
        grade_dist[g] = grade_dist.get(g, 0) + 1

    cutoff_desc = {}
    prev = 0
    for grade, pct in GRADE_PERCENTILES:
        cut = math.ceil(n * pct)
        cutoff_desc[grade] = f"{prev + 1}~{cut}위"
        prev = cut

    result = {
        "generated_at": scored.get("generated_at", ""),
        "category": "attraction",
        "total_places": len(combined),
        "grading_method": "percentile",
        "grading_note": "grade는 may_adjusted_score(5월 계절 보정) 기준 퍼센타일 등급",
        "grading_cutoffs": cutoff_desc,
        "grade_distribution": grade_dist,
        "controversial_count": sum(1 for c in combined if c["controversial"]),
        "scores": combined,
    }

    # 저장
    save_json(SCORED_FILE, result)
    print(f"  attraction_scored.json 저장 ({len(combined)}곳)")
    return result


def generate_rankings(scored):
    """RANKINGS.md 생성."""
    scores = scored["scores"]
    lines = []
    lines.append("# 관광지 랭킹 (Attraction Rankings)")
    lines.append("")
    lines.append(f"> 생성일: {scored['generated_at']} | 평가 대상: {scored['total_places']}곳 | 등급: 퍼센타일 기반")
    lines.append(f"> 논쟁 장소: {scored['controversial_count']}곳 (3명 간 점수 차이 ≥ 15점)")
    lines.append("")

    lines.append("## 등급 기준 (퍼센타일)")
    lines.append("")
    for g, desc in scored.get("grading_cutoffs", {}).items():
        lines.append(f"- **{g}등급**: {desc}")
    lines.append("")

    lines.append("## 등급 분포")
    lines.append("")
    for g in ["S", "A", "B", "C", "D"]:
        cnt = scored["grade_distribution"].get(g, 0)
        lines.append(f"- **{g}등급**: {cnt}곳")
    lines.append("")

    # 등급별 테이블
    for g in ["S", "A", "B", "C", "D"]:
        places = [s for s in scores if s["grade"] == g]
        if not places:
            continue
        lines.append(f"## {g}등급 — {GRADE_DESC[g]} ({len(places)}곳)")
        lines.append("")
        lines.append("| 순위 | 점수 | ①효율 | ②감성 | ③현실 | 장소 | 지역 | 비고 |")
        lines.append("|------|------|-------|-------|-------|------|------|------|")
        for p in places:
            rank = scores.index(p) + 1
            flag = "논쟁" if p["controversial"] else ""
            lines.append(
                f"| {rank} | {get_score(p):.1f} | {p['scores']['A']:.1f} "
                f"| {p['scores']['B']:.1f} | {p['scores']['C']:.1f} "
                f"| {p['name_ko']} | {p['region']} | {flag} |"
            )
        lines.append("")

    # 논쟁 장소
    controvs = sorted([s for s in scores if s["controversial"]], key=lambda x: -x["spread"])
    if controvs:
        lines.append("## 논쟁 장소 상세")
        lines.append("")
        lines.append("> 3명의 평가자 간 점수 차이가 15점 이상인 장소.")
        lines.append("")
        lines.append("| 편차 | 장소 | ①효율 | ②감성 | ③현실 | 평균 | 등급 |")
        lines.append("|------|------|-------|-------|-------|------|------|")
        for p in controvs:
            lines.append(
                f"| {p['spread']:.1f} | {p['name_ko']} | {p['scores']['A']:.1f} "
                f"| {p['scores']['B']:.1f} | {p['scores']['C']:.1f} "
                f"| {get_score(p):.1f} | {get_grade(p)}등급 |"
            )
        lines.append("")

    # 지역별
    regions = {}
    for s in scores:
        regions.setdefault(s["region"], []).append(s)

    lines.append("## 지역별 랭킹")
    lines.append("")
    for region, places in sorted(regions.items(), key=lambda x: -max(p.get("may_adjusted_score", p["average_score"]) for p in x[1])):
        places.sort(key=lambda x: -x.get("may_adjusted_score", x["average_score"]))
        lines.append(f"### {region} ({len(places)}곳)")
        lines.append("")
        for p in places:
            flag = " *" if p["controversial"] else ""
            lines.append(f"- **{get_grade(p)}등급** {get_score(p):.1f} — {p['name_ko']}{flag}")
        lines.append("")

    with open(RANKINGS_OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"  RANKINGS.md 저장 ({len(lines)}줄)")


def generate_place_data(scored, scorers, place_files):
    """프론트엔드용 place_data.json 생성."""
    scorer_by_id = {
        s: {p["id"]: p for p in data["scores"]}
        for s, data in scorers.items()
    }

    places = {}
    for item in scored["scores"]:
        pid = item["id"]
        place = place_files.get(pid, {})
        loc = place.get("location", {})
        coords = loc.get("coordinates", {})

        # 기준별 breakdown
        breakdown = {}
        for key in ["scenery", "uniqueness", "google_rating", "accessibility",
                     "review_count", "value_for_money", "time_efficiency"]:
            abc_scores = []
            reasons = {}
            for s in ["A", "B", "C"]:
                raw = scorer_by_id[s][pid]["raw_scores"].get(key, {})
                abc_scores.append(raw.get("score", 0))
                reasons[s] = raw.get("reason", "")
            breakdown[key] = {
                "avg": round(sum(abc_scores) / 3, 1),
                "A": abc_scores[0],
                "B": abc_scores[1],
                "C": abc_scores[2],
                "reasons": reasons,
            }

        # Google Maps URL (영문명 기반 검색)
        name_en = place.get("name", "") or item["name_ko"]
        lat = coords.get("lat", 0)
        lng = coords.get("lng", 0)
        query = urllib.parse.quote(name_en + " Australia")
        maps_url = f"https://www.google.com/maps/search/?api=1&query={query}&center={lat},{lng}" if lat else ""

        places[pid] = {
            "id": pid,
            "name_ko": item["name_ko"],
            "name": place.get("name", ""),
            "region": item["region"],
            "grade": get_grade(item),
            "average_score": get_score(item),
            "scores": item["scores"],
            "spread": item["spread"],
            "controversial": item["controversial"],
            "breakdown": breakdown,
            "coords": {"lat": lat, "lng": lng},
            "google_maps_url": maps_url,
        }

    output = {
        "generated_at": scored["generated_at"],
        "total": scored["total_places"],
        "grade_distribution": scored["grade_distribution"],
        "grading_method": scored.get("grading_method", "percentile"),
        "grading_cutoffs": scored.get("grading_cutoffs", {}),
        "controversial_count": scored["controversial_count"],
        "personas": {
            "A": {"name": "효율 전략가", "full_name": "김도현", "focus": "접근성·시간효율"},
            "B": {"name": "감성 탐험가", "full_name": "이서아", "focus": "경치·유니크함"},
            "C": {"name": "현실주의 비평가", "full_name": "박지우", "focus": "평점·리스크"},
        },
        "weights": {s: data["weights"] for s, data in scorers.items()},
        "places": places,
        "ranked_ids": [item["id"] for item in scored["scores"]],
    }

    save_json(PLACE_DATA_OUT, output)
    size_kb = os.path.getsize(PLACE_DATA_OUT) / 1024
    print(f"  place_data.json 저장 ({len(places)}곳, {size_kb:.0f}KB)")


def main():
    parser = argparse.ArgumentParser(description="평가 결과 → 프론트엔드 데이터 + RANKINGS.md 생성")
    parser.add_argument("--rank", action="store_true", help="RANKINGS.md만 생성")
    parser.add_argument("--data", action="store_true", help="place_data.json만 생성")
    parser.add_argument("--rescore", action="store_true", help="scorer 파일로부터 attraction_scored.json 재생성 (등급 재계산)")
    args = parser.parse_args()

    # 둘 다 안 주면 전부 생성
    do_all = not args.rank and not args.data and not args.rescore

    print("데이터 로드 중...")
    scored, scorers, place_files = load_all_data()
    print(f"  {len(place_files)}곳 로드 완료")

    if args.rescore or do_all:
        print("\n[1/3] attraction_scored.json 재생성...")
        scored = build_scored(scored, scorers)

    if args.rank or do_all:
        print("\n[2/3] RANKINGS.md 생성...")
        generate_rankings(scored)

    if args.data or do_all:
        print("\n[3/3] place_data.json 생성...")
        generate_place_data(scored, scorers, place_files)

    print("\n완료!")


if __name__ == "__main__":
    main()
