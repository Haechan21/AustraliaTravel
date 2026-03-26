#!/usr/bin/env python3
"""
sydney_route_data.json의 distance_km 경유지에 실제 이동 거리를 채운다.

Haversine 직선거리 × 도시 보행계수(1.3)로 산출.
페리 구간(stop 이름에 Ferry 포함, 또는 하버 횡단 감지)은 직선거리 × 1.0.

OSRM foot 프로필은 시드니 보행자 전용구역(Circular Quay, Opera House 등)을
차량 우회 경로로 처리하여 비정상적 거리를 반환하므로 사용하지 않는다.

사용법:
    python scripts/fill_sydney_distances.py          # dry-run
    python scripts/fill_sydney_distances.py --fix     # 실제 수정
"""

import json
import math
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_PATH = os.path.join(PROJECT_ROOT, "data", "routes", "sydney_route_data.json")

# 도시 보행계수: 직선거리 → 실제 도보거리 보정
# 시드니 CBD는 격자형이 아닌 불규칙 도로망이므로 1.3 적용
WALK_FACTOR = 1.3

# 페리/수상 구간 감지 키워드
FERRY_KEYWORDS = ["ferry", "페리"]

# 하버 횡단 감지: 남쪽(lat < -33.855)에서 북쪽(lat > -33.855)으로 또는 반대
HARBOUR_LAT = -33.855


def haversine_km(lng1, lat1, lng2, lat2):
    """두 좌표 간 Haversine 직선거리 (km)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def is_ferry_segment(prev_stop, curr_stop):
    """페리/수상 구간인지 판별."""
    # 이름에 Ferry 키워드
    names = (prev_stop["name"].lower() + " " + curr_stop["name"].lower())
    if any(kw in names for kw in FERRY_KEYWORDS):
        return True
    # 하버 횡단 감지 (남↔북)
    prev_south = prev_stop["lat"] < HARBOUR_LAT
    curr_south = curr_stop["lat"] < HARBOUR_LAT
    if prev_south != curr_south:
        return True
    return False


def calc_distance(prev_stop, curr_stop):
    """두 경유지 간 이동거리 (km). 페리 구간은 직선, 일반은 ×1.3."""
    straight = haversine_km(prev_stop["lng"], prev_stop["lat"],
                            curr_stop["lng"], curr_stop["lat"])
    if is_ferry_segment(prev_stop, curr_stop):
        return round(straight, 1)
    return round(straight * WALK_FACTOR, 1)


def main():
    fix_mode = "--fix" in sys.argv

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    routes = data["routes"]
    changes = []

    for route_key in sorted(routes.keys()):
        route = routes[route_key]
        route_total_km = 0.0
        print(f"\n{'='*55}")
        print(f"  {route['name']}")
        print(f"{'='*55}")

        for day_data in route["days"]:
            day_num = day_data["day"]
            stops = day_data["stops"]
            day_km = 0.0

            print(f"\n  Day {day_num} ({day_data['date']}):")

            for i, stop in enumerate(stops):
                if i == 0:
                    old_val = stop["distance_km"]
                    if old_val != 0:
                        changes.append(f"  {route_key}조 Day{day_num} [{stop['name']}]: {old_val} → 0")
                    stop["distance_km"] = 0
                    print(f"    📍 {stop['name']} (출발)")
                    continue

                prev = stops[i - 1]
                dist = calc_distance(prev, stop)
                ferry = is_ferry_segment(prev, stop)
                tag = " 🚢" if ferry else ""

                old_val = stop["distance_km"]
                if dist != old_val:
                    changes.append(f"  {route_key}조 Day{day_num} [{stop['name']}]: {old_val} → {dist}")
                stop["distance_km"] = dist
                day_km += dist
                print(f"    → {stop['name']}: {dist}km{tag}")

            day_km = round(day_km, 1)
            old_day_km = day_data["day_km"]
            if day_km != old_day_km:
                changes.append(f"  {route_key}조 Day{day_num} day_km: {old_day_km} → {day_km}")
            day_data["day_km"] = day_km
            route_total_km += day_km
            print(f"  ── Day {day_num} 합계: {day_km}km")

        route_total_km = round(route_total_km, 1)
        old_total = route["total_km"]
        if route_total_km != old_total:
            changes.append(f"  {route_key}조 total_km: {old_total} → {route_total_km}")
        route["total_km"] = route_total_km
        print(f"  ══ {route['name']} 총합: {route_total_km}km")

    print(f"\n{'='*55}")
    print(f"  변경 사항: {len(changes)}건")
    for c in changes:
        print(c)

    if fix_mode:
        with open(DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"\n✅ {DATA_PATH} 저장 완료")
    else:
        print(f"\n📋 dry-run 모드. --fix 플래그로 실제 저장.")


if __name__ == "__main__":
    main()
