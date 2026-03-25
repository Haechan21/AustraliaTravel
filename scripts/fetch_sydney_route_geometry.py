#!/usr/bin/env python3
"""
sydney_route_data.json → OSRM API (foot) → sydney_route_geometry.json

시드니 코스의 도보 경로를 OSRM foot 프로필로 가져온다.
페리 구간(바다)은 OSRM이 처리 못하므로 직선 polyline으로 대체한다.

사용법:
    python scripts/fetch_sydney_route_geometry.py

출력: data/routes/sydney_route_geometry.json
"""

import json
import math
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

# ─── 설정 ───────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

INPUT_PATH = os.path.join(PROJECT_ROOT, "data", "routes", "sydney_route_data.json")
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "data", "routes", "sydney_route_geometry.json")

OSRM_SERVER = "https://router.project-osrm.org"
SIMPLIFY_TOLERANCE = 0.0003  # ~30m (시드니는 도보라 더 정밀하게)
RATE_LIMIT_SEC = 1.5
MAX_RETRIES = 3
BACKOFF_BASE = 2

# 페리 구간 정의: (출발좌표, 도착좌표) — 바다를 건너는 구간
# 좌표는 (lng, lat) 형식
FERRY_SEGMENTS = [
    # Watsons Bay → Circular Quay (1조 Day 7)
    ((151.2826, -33.8439), (151.2111, -33.8612)),
    # Circular Quay → Taronga Zoo (3조 Day 7)
    ((151.2111, -33.8612), (151.2414, -33.8430)),
    # Taronga Zoo → Circular Quay (3조 Day 7 return)
    ((151.2414, -33.8430), (151.2111, -33.8612)),
    # McMahons Point Ferry → Circular Quay (5조 Day 7)
    ((151.2034, -33.8445), (151.2111, -33.8612)),
]

# 페리 구간 매칭 허용 거리 (도 단위, 약 200m)
FERRY_MATCH_TOLERANCE = 0.003


# ─── Douglas-Peucker 간소화 ─────────────────────────────
def _perpendicular_distance(point, line_start, line_end):
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
    """좌표 리스트 [[lng, lat], ...] → Google encoded polyline 문자열."""
    encoded = []
    prev_lat = 0
    prev_lng = 0
    for lng, lat in coords:
        encoded.append(_encode_value(lat - prev_lat))
        encoded.append(_encode_value(lng - prev_lng))
        prev_lat = lat
        prev_lng = lng
    return "".join(encoded)


# ─── 페리 구간 판별 ──────────────────────────────────────
def is_ferry_segment(coord_from, coord_to):
    """두 좌표가 페리 구간인지 판별."""
    for ferry_from, ferry_to in FERRY_SEGMENTS:
        dist_from = math.hypot(coord_from[0] - ferry_from[0], coord_from[1] - ferry_from[1])
        dist_to = math.hypot(coord_to[0] - ferry_to[0], coord_to[1] - ferry_to[1])
        if dist_from < FERRY_MATCH_TOLERANCE and dist_to < FERRY_MATCH_TOLERANCE:
            return True
    return False


# ─── OSRM API 호출 (foot 프로필) ────────────────────────
def fetch_osrm_foot_route(coords_lnglat):
    """OSRM foot 프로필로 도보 경로를 가져온다."""
    coord_str = ";".join(f"{lng},{lat}" for lng, lat in coords_lnglat)
    url = f"{OSRM_SERVER}/route/v1/foot/{coord_str}?overview=full&geometries=geojson"

    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AusTripPlanner/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            if data.get("code") != "Ok":
                raise RuntimeError(f"OSRM error: {data.get('code')} — {data.get('message', '')}")

            route = data["routes"][0]
            geometry_coords = route["geometry"]["coordinates"]
            return geometry_coords

        except (urllib.error.URLError, urllib.error.HTTPError, OSError, RuntimeError) as e:
            if attempt < MAX_RETRIES - 1:
                wait = BACKOFF_BASE ** (attempt + 1)
                print(f"  ⚠ 재시도 {attempt + 1}/{MAX_RETRIES} ({wait}s 후): {e}")
                time.sleep(wait)
            else:
                raise RuntimeError(f"OSRM API 실패 (재시도 {MAX_RETRIES}회 소진): {e}") from e


# ─── 구간별 도보/페리 경로 조합 ──────────────────────────
def fetch_day_route(coords):
    """
    하루 동선의 좌표를 받아, 구간별로 도보(OSRM)/페리(직선)를 판별하여
    전체 geometry를 조합한다.

    반환: (all_coords [[lng, lat], ...], ferry_segments [(start_idx, end_idx), ...])
    """
    if len(coords) < 2:
        return coords, []

    all_coords = []
    ferry_indices = []  # 페리 구간의 시작 인덱스 목록
    fetch_count = 0

    # 연속된 도보 구간을 모아서 한 번에 OSRM 호출
    i = 0
    while i < len(coords) - 1:
        # 페리 구간 체크
        if is_ferry_segment(coords[i], coords[i + 1]):
            ferry_start = len(all_coords)
            all_coords.append(coords[i])
            all_coords.append(coords[i + 1])
            ferry_indices.append((ferry_start, len(all_coords) - 1))
            print(f"    🚢 페리 구간: {i}→{i+1}", flush=True)
            i += 1
            continue

        # 도보 구간: 연속된 비-페리 구간을 모은다
        walk_coords = [coords[i]]
        j = i + 1
        while j < len(coords):
            if j < len(coords) - 1 and is_ferry_segment(coords[j], coords[j + 1]):
                walk_coords.append(coords[j])
                break
            walk_coords.append(coords[j])
            if j == len(coords) - 1:
                break
            j += 1

        if len(walk_coords) >= 2:
            if fetch_count > 0:
                time.sleep(RATE_LIMIT_SEC)

            try:
                raw = fetch_osrm_foot_route(walk_coords)
                all_coords.extend(raw)
                fetch_count += 1
                print(f"    🚶 도보 구간: {i}→{j} ({len(walk_coords)} stops, {len(raw)} points)", flush=True)
            except RuntimeError as e:
                print(f"    ⚠ 도보 OSRM 실패, 직선 폴백: {e}", flush=True)
                all_coords.extend(walk_coords)

        i = j

    return all_coords, ferry_indices


# ─── 메인 로직 ──────────────────────────────────────────
def main():
    if not os.path.exists(INPUT_PATH):
        print(f"오류: {INPUT_PATH} 파일을 찾을 수 없습니다.")
        sys.exit(1)

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        route_data = json.load(f)

    routes = route_data["routes"]
    geometries = {}
    ferry_map = {}

    for route_id in sorted(routes.keys(), key=int):
        route = routes[route_id]
        print(f"\n{'='*50}")
        print(f"Route {route_id}: {route['name']}")
        print(f"{'='*50}")

        for day_info in route["days"]:
            day_num = day_info["day"]
            key = f"R{route_id}D{day_num}"
            coords = [[stop["lng"], stop["lat"]] for stop in day_info["stops"]]
            num_stops = len(coords)

            print(f"\n  {key} ({num_stops} stops):")

            if num_stops < 2:
                print("    SKIP (1 stop)")
                geometries[key] = ""
                continue

            try:
                all_coords, ferry_indices = fetch_day_route(coords)

                # 간소화
                simplified = douglas_peucker(all_coords, SIMPLIFY_TOLERANCE)
                encoded = encode_polyline(simplified)
                geometries[key] = encoded

                if ferry_indices:
                    ferry_map[key] = ferry_indices

                print(f"    OK ({len(all_coords)} → {len(simplified)} points"
                      f"{', 페리 ' + str(len(ferry_indices)) + '구간' if ferry_indices else ''})")

            except RuntimeError as e:
                print(f"    FAIL: {e}")
                geometries[key] = ""

    # 페리 구간 직선 geometry를 별도 저장 (프론트에서 대시 스타일 적용용)
    ferry_geometries = {}
    for key, indices in ferry_map.items():
        # 원본 좌표에서 페리 구간 추출
        route_id = key.split("D")[0][1:]
        day_num = int(key.split("D")[1])
        route = routes[route_id]
        for day_info in route["days"]:
            if day_info["day"] == day_num:
                coords = [[stop["lng"], stop["lat"]] for stop in day_info["stops"]]
                ferry_lines = []
                for i in range(len(coords) - 1):
                    if is_ferry_segment(coords[i], coords[i + 1]):
                        ferry_lines.append(encode_polyline([coords[i], coords[i + 1]]))
                if ferry_lines:
                    ferry_geometries[key] = ferry_lines
                break

    # 결과 저장
    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "osrm_server": OSRM_SERVER,
        "profile": "foot",
        "simplify_tolerance": SIMPLIFY_TOLERANCE,
        "geometries": geometries,
        "ferry_geometries": ferry_geometries,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    file_size = os.path.getsize(OUTPUT_PATH)
    size_str = f"{file_size / 1024:.1f}KB" if file_size < 1024 * 1024 else f"{file_size / 1024 / 1024:.1f}MB"

    print(f"\n{'='*50}")
    print(f"=== 완료 ===")
    print(f"총 route-day: {len(geometries)}개")
    print(f"페리 구간: {len(ferry_geometries)}개 route-day")
    print(f"출력: {OUTPUT_PATH} ({size_str})")


if __name__ == "__main__":
    main()
