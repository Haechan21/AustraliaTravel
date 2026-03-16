#!/usr/bin/env python3
"""
루트 파일의 장소 점수/등급을 attraction_scored.json과 동기화.

may_adjusted_score를 기준 점수로 사용하고, grade를 기준 등급으로 사용한다.
장소명이 포함된 줄에서 점수(숫자)와 등급(S/A/B/C/D)을 찾아 교정한다.

Usage:
    python scripts/update_route_scores.py              # 불일치 리포트만 (dry-run)
    python scripts/update_route_scores.py --fix        # 실제 수정
    python scripts/update_route_scores.py --fix --verbose  # 수정 + 상세 로그
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCORED_PATH = ROOT / "data" / "scores" / "attraction_scored.json"
ROUTE_DIR = ROOT / "research" / "route-plans"


def load_score_map():
    """attraction_scored.json에서 장소별 점수/등급 맵 생성."""
    with open(SCORED_PATH, encoding="utf-8") as f:
        data = json.load(f)

    place_map = {}
    for s in data["scores"]:
        correct_score = s.get("may_adjusted_score", s["average_score"])
        # average_score도 알아야 구 점수를 찾아 교체할 수 있음
        place_map[s["name_ko"]] = {
            "correct_score": correct_score,
            "average_score": s["average_score"],
            "grade": s["grade"],
        }
    return place_map


def build_search_names(name):
    """장소명에서 검색용 키워드 리스트 생성 (긴 것부터)."""
    names = [name]
    # 괄호 제거 버전
    short = re.sub(r"\s*\(.*?\)\s*", "", name).strip()
    if short and short != name:
        names.append(short)
    return names


def score_str(val):
    """숫자를 소수점 1자리 문자열로."""
    return f"{val:.1f}"


def find_place_on_line(line, place_map):
    """한 줄에서 언급된 장소들을 찾아 반환."""
    found = []
    for name, info in place_map.items():
        for search_name in build_search_names(name):
            if search_name in line:
                found.append((name, info))
                break
    return found


def process_file(content, place_map, verbose=False):
    """파일 내용에서 장소 점수와 등급을 업데이트."""
    lines = content.split("\n")
    changes = []

    for i, line in enumerate(lines):
        places_on_line = find_place_on_line(line, place_map)
        if not places_on_line:
            continue

        new_line = line
        for name, info in places_on_line:
            correct_s = score_str(info["correct_score"])
            avg_s = score_str(info["average_score"])
            correct_grade = info["grade"]

            # 1) 점수 교정: average_score(구 점수)가 있으면 correct_score로 교체
            if avg_s != correct_s and avg_s in new_line:
                new_line = new_line.replace(avg_s, correct_s, 1)
                changes.append({
                    "line": i + 1,
                    "type": "score",
                    "name": name,
                    "old": avg_s,
                    "new": correct_s,
                })

            # 2) 등급 교정: (X, 또는 (X등급 패턴에서 등급 불일치 수정
            #    패턴: (S, 85.3) 또는 **S등급** 등
            for search_name in build_search_names(name):
                if search_name not in line:
                    continue
                # 장소명 근처의 등급 표기 찾기
                for grade_char in ["S", "A", "B", "C", "D"]:
                    if grade_char == correct_grade:
                        continue
                    # (X, score) 패턴
                    old_pattern = f"({grade_char}, {correct_s})"
                    new_pattern = f"({correct_grade}, {correct_s})"
                    if old_pattern in new_line:
                        new_line = new_line.replace(old_pattern, new_pattern, 1)
                        changes.append({
                            "line": i + 1,
                            "type": "grade",
                            "name": name,
                            "old": grade_char,
                            "new": correct_grade,
                        })
                        break
                    # (X, old_score) 패턴도 체크 (점수가 아직 안 바뀐 경우)
                    old_pattern2 = f"({grade_char}, {avg_s})"
                    new_pattern2 = f"({correct_grade}, {correct_s})"
                    if old_pattern2 in new_line:
                        new_line = new_line.replace(old_pattern2, new_pattern2, 1)
                        changes.append({
                            "line": i + 1,
                            "type": "grade+score",
                            "name": name,
                            "old": f"{grade_char}/{avg_s}",
                            "new": f"{correct_grade}/{correct_s}",
                        })
                        break
                break

        lines[i] = new_line

    return "\n".join(lines), changes


def main():
    fix = "--fix" in sys.argv
    verbose = "--verbose" in sys.argv

    place_map = load_score_map()

    print(f"장소 데이터: {len(place_map)}개")
    print(f"{'=' * 60}")

    route_files = sorted(ROUTE_DIR.glob("*.md"))
    if not route_files:
        print("❌ 루트 파일을 찾을 수 없습니다.")
        return

    total_changes = 0

    for fpath in route_files:
        content = fpath.read_text(encoding="utf-8")
        new_content, changes = process_file(content, place_map, verbose)

        if changes:
            print(f"\n📄 {fpath.name} — {len(changes)}건 {'수정' if fix else '불일치'}")
            for c in changes:
                print(f"  L{c['line']:4d} [{c['type']:>11s}]: {c['name'][:25]:25s} {c['old']}→{c['new']}")
            total_changes += len(changes)

            if fix:
                fpath.write_text(new_content, encoding="utf-8")
        else:
            print(f"  ✅ {fpath.name} — 불일치 없음")

    print(f"\n{'=' * 60}")
    print(f"총 {total_changes}건 {'수정 완료 ✅' if fix else '불일치 발견'}")
    if not fix and total_changes > 0:
        print("→ 수정하려면: python scripts/update_route_scores.py --fix")


if __name__ == "__main__":
    main()
