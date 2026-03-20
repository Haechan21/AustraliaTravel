#!/usr/bin/env python3
"""
route_data.json → OSRM API → route_geometry.json

각 루트의 일별 경유지 좌표를 OSRM에 보내 실제 도로 geometry를 받아오고,
Douglas-Peucker로 간소화한 뒤 Google Encoded Polyline으로 압축 저장한다.
또한 각 leg(구간)의 거리·소요시간·주요 도로 정보를 추출한다.

사용법:
    python scripts/fetch_route_geometry.py

출력: data/routes/route_geometry.json
"""

import json
import math
import os
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone

# ─── 설정 ───────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

INPUT_PATH = os.path.join(PROJECT_ROOT, "data", "routes", "route_data.json")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "data", "routes", "route_geometry.json")

OSRM_SERVER = "https://router.project-osrm.org"
SIMPLIFY_TOLERANCE = 0.0005  # ~50m in degrees
RATE_LIMIT_SEC = 1.0
MAX_RETRIES = 3
BACKOFF_BASE = 2  # 초: 2, 4, 8

# OSRM 공용 서버가 호주 도로의 ref를 반환하지 않으므로, 도로명→ref 매핑으로 보완
ROAD_NAME_TO_REF = {
    "Pacific Motorway": "M1",
    "Pacific Motorway Onramp": "M1",
    "Hume Motorway": "M31",
    "Princes Motorway": "M1",
    "Western Motorway": "M4",
    "M2 Hills Motorway": "M2",
    "M8 Motorway Tunnel": "M8",
    "Warringah Freeway": "M1",
    "Pacific Highway": "A1",
    "Pacific Highway Onramp": "A1",
    "Princes Highway": "A1",
    "Princes Highway Exit": "A1",
    "Great Western Highway": "A32",
    "Gold Coast Highway": "A2",
    "Oxley Highway": "B56",
    "Illawarra Highway": "A48",
    "Cahill Expressway": "M1",
    "Eastern Distributor": "M1",
    "Cross City Tunnel": "M1",
    "Old Hume Highway": "A31",
}


# ─── Douglas-Peucker 간소화 ─────────────────────────────
def _perpendicular_distance(point, line_start, line_end):
    """점에서 선분까지의 수직 거리 (좌표 단위)."""
    dx = line_end[0] - line_start[0]
    dy = line_end[1] - line_start[1]
    if dx == 0 and dy == 0:
        return math.hypot(point[0] - line_start[0], point[1] - line_start[1])
    t = ((point[0] - line_start[0]) * dx + (point[1] - line_start[1]) * dy) / (dx * dx + dy * dy)
    t = max(0, min(1, t))
    proj_x = line_start[0] + t * dx
    proj_y = line_start[1] + t * dy
    return math.hypot(point[0] - proj_x, point[1] - proj_y)


def douglas_peucker(coords, tolerance):
    """Douglas-Peucker 알고리즘. coords: list of [lng, lat]."""
    if len(coords) <= 2:
        return coords

    max_dist = 0
    max_idx = 0
    for i in range(1, len(coords) - 1):
        d = _perpendicular_distance(coords[i], coords[0], coords[-1])
        if d > max_dist:
            max_dist = d
            max_idx = i

    if max_dist > tolerance:
        left = douglas_peucker(coords[: max_idx + 1], tolerance)
        right = douglas_peucker(coords[max_idx:], tolerance)
        return left[:-1] + right
    else:
        return [coords[0], coords[-1]]


# ─── Google Encoded Polyline 인코더 ─────────────────────
def _encode_value(value):
    """단일 정수값을 encoded polyline 문자열로."""
    value = round(value * 1e5)
    value = value << 1
    if value < 0:
        value = ~value
    chunks = []
    while value >= 0x20:
        chunks.append(chr((0x20 | (value & 0x1F)) + 63))
        value >>= 5
    chunks.append(chr(value + 63))
    return "".join(chunks)


def encode_polyline(coords):
    """좌표 리스트 [[lng, lat], ...] → Google encoded polyline 문자열.
    주의: polyline 형식은 (lat, lng) 순서로 인코딩."""
    encoded = []
    prev_lat = 0
    prev_lng = 0
    for lng, lat in coords:
        encoded.append(_encode_value(lat - prev_lat))
        encoded.append(_encode_value(lng - prev_lng))
        prev_lat = lat
        prev_lng = lng
    return "".join(encoded)


# ─── Leg 메타데이터 추출 ─────────────────────────────────
def extract_legs(route_data):
    """OSRM 응답의 routes[0].legs에서 leg 메타데이터를 추출한다.

    반환: list of {"distance_km", "duration_min", "roads"}
    """
    legs = route_data["routes"][0]["legs"]
    result = []

    for leg in legs:
        distance_km = round(leg["distance"] / 1000, 1)
        duration_min = round(leg["duration"] / 60)

        # 주요 도로 집계: (ref, name) → 총 거리(m)
        road_distances = defaultdict(float)
        for step in leg["steps"]:
            ref = step.get("ref", "")
            name = step.get("name", "")
            if not ref and not name:
                continue
            # OSRM이 ref를 반환하지 않으면 도로명으로 추론
            if not ref and name in ROAD_NAME_TO_REF:
                ref = ROAD_NAME_TO_REF[name]
            road_distances[(ref, name)] += step["distance"]

        # 거리 내림차순 정렬, 1km 이상 도로만 포함
        sorted_roads = sorted(road_distances.items(), key=lambda x: x[1], reverse=True)
        roads = []
        for (ref, name), dist_m in sorted_roads:
            km = round(dist_m / 1000, 1)
            if km < 1.0:
                break
            roads.append({
                "name": name,
                "ref": ref,
                "km": km,
            })

        result.append({
            "distance_km": distance_km,
            "duration_min": duration_min,
            "roads": roads,
        })

    return result


# ─── OSRM API 호출 ─────────────────────────────────────
def fetch_osrm_route(coords_lnglat):
    """OSRM에서 도로 geometry와 leg 데이터를 가져온다.
    coords_lnglat: [[lng, lat], ...]
    반환: (GeoJSON coordinates [[lng, lat], ...], distance_m, legs_data)
    """
    coord_str = ";".join(f"{lng},{lat}" for lng, lat in coords_lnglat)
    url = f"{OSRM_SERVER}/route/v1/driving/{coord_str}?overview=full&geometries=geojson&steps=true"

    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AusTripPlanner/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            if data.get("code") != "Ok":
                raise RuntimeError(f"OSRM error: {data.get('code')} — {data.get('message', '')}")

            route = data["routes"][0]
            geometry_coords = route["geometry"]["coordinates"]
            distance_m = route["distance"]
            legs_data = extract_legs(data)
            return geometry_coords, distance_m, legs_data

        except (urllib.error.URLError, urllib.error.HTTPError, OSError, RuntimeError) as e:
            if attempt < MAX_RETRIES - 1:
                wait = BACKOFF_BASE ** (attempt + 1)
                print(f"  ⚠ 재시도 {attempt + 1}/{MAX_RETRIES} ({wait}s 후): {e}")
                time.sleep(wait)
            else:
                raise RuntimeError(f"OSRM API 실패 (재시도 {MAX_RETRIES}회 소진): {e}") from e


# ─── 메인 로직 ──────────────────────────────────────────
def main():
    # route_data.json 로드
    if not os.path.exists(INPUT_PATH):
        print(f"오류: {INPUT_PATH} 파일을 찾을 수 없습니다.")
        sys.exit(1)

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        route_data = json.load(f)

    routes = route_data["routes"]

    # 1단계: 모든 route-day의 좌표 시퀀스 수집
    day_coords = {}  # key: "R{id}D{day}" → [[lng, lat], ...]
    day_km = {}      # key: "R{id}D{day}" → day_km 값

    for route_id in sorted(routes.keys(), key=int):
        route = routes[route_id]
        for day_info in route["days"]:
            day_num = day_info["day"]
            key = f"R{route_id}D{day_num}"
            coords = [[stop["lng"], stop["lat"]] for stop in day_info["stops"]]
            day_coords[key] = coords
            day_km[key] = day_info.get("day_km", 0)

    # 2단계: 좌표 시퀀스 기준으로 중복 탐지 (앨리어스)
    coord_hash = {}  # tuple of coords → first key
    aliases = {}
    unique_keys = []

    for key in sorted(day_coords.keys(), key=lambda k: (int(k.split("D")[0][1:]), int(k.split("D")[1]))):
        coords_tuple = tuple(tuple(c) for c in day_coords[key])
        if coords_tuple in coord_hash:
            aliases[key] = coord_hash[coords_tuple]
        else:
            coord_hash[coords_tuple] = key
            unique_keys.append(key)

    print(f"총 {len(day_coords)}개 route-day 중 고유 {len(unique_keys)}개, 앨리어스 {len(aliases)}개")
    if aliases:
        for alias_key, orig_key in sorted(aliases.items()):
            print(f"  {alias_key} → {orig_key}")
    print()

    # 3단계: 고유 route-day에 대해 OSRM API 호출
    geometries = {}
    legs_map = {}
    fetch_count = 0
    total_legs = 0

    for key in unique_keys:
        coords = day_coords[key]
        num_stops = len(coords)
        km = day_km[key]

        print(f"Fetching {key} ({num_stops} stops, {km}km)...", end=" ", flush=True)

        if num_stops < 2:
            print("SKIP (1 stop)")
            geometries[key] = ""
            legs_map[key] = []
            continue

        if fetch_count > 0:
            time.sleep(RATE_LIMIT_SEC)

        try:
            raw_coords, distance_m, legs_data = fetch_osrm_route(coords)
            original_count = len(raw_coords)
            num_legs = len(legs_data)

            # Douglas-Peucker 간소화
            simplified = douglas_peucker(raw_coords, SIMPLIFY_TOLERANCE)
            simplified_count = len(simplified)

            # Google Encoded Polyline으로 인코딩
            encoded = encode_polyline(simplified)
            geometries[key] = encoded
            legs_map[key] = legs_data
            total_legs += num_legs

            print(f"OK ({original_count} → {simplified_count} points, {num_legs} legs)")
            fetch_count += 1

        except RuntimeError as e:
            print(f"FAIL: {e}")
            geometries[key] = ""
            legs_map[key] = []
            fetch_count += 1

    # 4단계: 결과 저장
    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "osrm_server": OSRM_SERVER,
        "simplify_tolerance": SIMPLIFY_TOLERANCE,
        "geometries": geometries,
        "legs": legs_map,
        "aliases": aliases,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    file_size = os.path.getsize(OUTPUT_PATH)
    size_str = f"{file_size / 1024:.1f}KB" if file_size < 1024 * 1024 else f"{file_size / 1024 / 1024:.1f}MB"

    print()
    print(f"=== 완료 ===")
    print(f"고유 route-day: {len(unique_keys)}개")
    print(f"앨리어스: {len(aliases)}개")
    print(f"총 legs: {total_legs}개")
    print(f"출력: {OUTPUT_PATH} ({size_str})")


if __name__ == "__main__":
    main()
