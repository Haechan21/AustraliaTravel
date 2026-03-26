#!/usr/bin/env python3
"""sydney_route_data.json에 경유지 간 이동수단/시간 정보를 추가한다."""
import json, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(os.path.dirname(SCRIPT_DIR), "data", "routes", "sydney_route_data.json")

# transit_mode: walk, train, bus, ferry, mixed, taxi
# transit_min: 소요시간(분)
# transit_detail: 간략 설명
# 첫 stop(출발지)에는 transit 없음 — idx>0 인 stop만 해당

TRANSIT = {
    "1": {
        6: [  # Day 6 stops (idx 1~)
            {"transit_mode": "train", "transit_min": 18, "transit_detail": "T8 전철 12분 + 도보 5분"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "CQ 워터프론트 도보"},
            {"transit_mode": "train", "transit_min": 16, "transit_detail": "도보 CQ역 5분 + T8 전철 12분"},
        ],
        7: [  # Day 7 stops (idx 1~)
            {"transit_mode": "walk", "transit_min": 60, "transit_detail": "코스털워크 3km"},
            {"transit_mode": "taxi", "transit_min": 15, "transit_detail": "Uber 직행 (버스 환승 시 45분)"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "해안 절벽 도보"},
            {"transit_mode": "ferry", "transit_min": 18, "transit_detail": "F9 페리 Watsons Bay→CQ"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "CQ에서 도보"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "오페라하우스 경유 도보"},
            {"transit_mode": "walk", "transit_min": 15, "transit_detail": "정원 산책로"},
            {"transit_mode": "mixed", "transit_min": 25, "transit_detail": "도보 CQ역 15분 + T8 전철 10분"},
            {"transit_mode": "walk", "transit_min": 20, "transit_detail": "도보 워터프론트"},
            {"transit_mode": "walk", "transit_min": 18, "transit_detail": "하버사이드 프롬나드"},
            {"transit_mode": "train", "transit_min": 18, "transit_detail": "도보 Town Hall역 8분 + T8 전철 10분"},
        ],
    },
    "2": {
        6: [
            {"transit_mode": "train", "transit_min": 22, "transit_detail": "T8 전철 12분 + 도보 10분"},
            {"transit_mode": "walk", "transit_min": 2, "transit_detail": "Cumberland St 도보"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "CQ 방면 도보"},
            {"transit_mode": "train", "transit_min": 15, "transit_detail": "T8 전철 CQ→Green Square"},
        ],
        7: [
            {"transit_mode": "mixed", "transit_min": 30, "transit_detail": "L1 라이트레일 + Central 환승 T4→CQ + 도보"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "정원 산책로"},
            {"transit_mode": "walk", "transit_min": 15, "transit_detail": "보타닉가든 관통 도보"},
            {"transit_mode": "walk", "transit_min": 20, "transit_detail": "도보 또는 버스 311"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "Munn St 방면 도보"},
            {"transit_mode": "bus", "transit_min": 45, "transit_detail": "CQ 도보 5분 + 버스 333 본다이행 40분"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "비치 사우스 끝 도보"},
            {"transit_mode": "bus", "transit_min": 40, "transit_detail": "버스 333 시내행 35분 + 도보 5분"},
            {"transit_mode": "walk", "transit_min": 15, "transit_detail": "도보 Cockle Bay"},
            {"transit_mode": "walk", "transit_min": 20, "transit_detail": "Vivid Light Walk 도보"},
            {"transit_mode": "train", "transit_min": 15, "transit_detail": "CQ역 T8 전철"},
        ],
    },
    "3": {
        6: [
            {"transit_mode": "train", "transit_min": 15, "transit_detail": "T8 전철 8분 + 도보 7분"},
            {"transit_mode": "walk", "transit_min": 12, "transit_detail": "도보 Cockle Bay"},
            {"transit_mode": "train", "transit_min": 18, "transit_detail": "도보 Town Hall역 8분 + T8 전철 10분"},
        ],
        7: [
            {"transit_mode": "mixed", "transit_min": 27, "transit_detail": "L1 라이트레일 + Central 환승 T4→CQ"},
            {"transit_mode": "ferry", "transit_min": 12, "transit_detail": "F2 페리 CQ→Taronga"},
            {"transit_mode": "ferry", "transit_min": 12, "transit_detail": "F2 페리 Taronga→CQ"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "CQ에서 도보"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "Munn St 방면 도보"},
            {"transit_mode": "walk", "transit_min": 8, "transit_detail": "The Rocks 도보"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "오페라하우스 방면 도보"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "Vivid 설치물 산책"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "The Rocks 경유 계단"},
            {"transit_mode": "walk", "transit_min": 15, "transit_detail": "브릿지 북쪽 하산 도보"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "인접 도보"},
            {"transit_mode": "walk", "transit_min": 3, "transit_detail": "Luna Park 선착장 도보"},
            {"transit_mode": "train", "transit_min": 25, "transit_detail": "T1 전철 Milsons Pt→Town Hall + T8 환승"},
        ],
    },
    "4": {
        6: [
            {"transit_mode": "train", "transit_min": 20, "transit_detail": "T8 전철 10분 + 도보 Cockle Bay 10분"},
            {"transit_mode": "walk", "transit_min": 18, "transit_detail": "워터프론트 프롬나드 도보"},
            {"transit_mode": "train", "transit_min": 22, "transit_detail": "도보 Wynyard역 12분 + T8 전철 10분"},
        ],
        7: [
            {"transit_mode": "walk", "transit_min": 30, "transit_detail": "코스털워크 1.6km"},
            {"transit_mode": "bus", "transit_min": 45, "transit_detail": "버스 333 Bondi Jct 환승 T4 시내행"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "Cumberland St 입구 도보"},
            {"transit_mode": "walk", "transit_min": 20, "transit_detail": "하버브릿지 1.6km 도보 횡단"},
            {"transit_mode": "train", "transit_min": 20, "transit_detail": "T1 전철 + T8 환승"},
            {"transit_mode": "train", "transit_min": 18, "transit_detail": "T8 전철 12분 + 도보 5분"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "인접 도보"},
            {"transit_mode": "walk", "transit_min": 20, "transit_detail": "도보 Botanic Garden 경유"},
            {"transit_mode": "mixed", "transit_min": 25, "transit_detail": "택시 $20~30 또는 도보 CQ역 + T8"},
        ],
    },
    "5": {
        6: [
            {"transit_mode": "train", "transit_min": 20, "transit_detail": "T8 전철 10분 + 도보 Cockle Bay 10분"},
            {"transit_mode": "walk", "transit_min": 18, "transit_detail": "워터프론트 프롬나드 도보"},
            {"transit_mode": "walk", "transit_min": 12, "transit_detail": "워터프론트 도보"},
            {"transit_mode": "train", "transit_min": 15, "transit_detail": "CQ역 T8 전철"},
        ],
        7: [
            {"transit_mode": "mixed", "transit_min": 28, "transit_detail": "Metro Waterloo역 도보 4분 + M2 + T4 환승"},
            {"transit_mode": "walk", "transit_min": 7, "transit_detail": "인접 도보"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "정원 산책로"},
            {"transit_mode": "walk", "transit_min": 10, "transit_detail": "Bennelong Point 도보"},
            {"transit_mode": "walk", "transit_min": 8, "transit_detail": "CQ → George St 도보"},
            {"transit_mode": "bus", "transit_min": 18, "transit_detail": "버스 333 또는 389 Paddington행"},
            {"transit_mode": "walk", "transit_min": 2, "transit_detail": "인접 도보"},
            {"transit_mode": "bus", "transit_min": 25, "transit_detail": "버스 333 시내행 + T1 전철 Milsons Pt"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "인접 도보"},
            {"transit_mode": "walk", "transit_min": 8, "transit_detail": "해안 도보"},
            {"transit_mode": "walk", "transit_min": 3, "transit_detail": "선착장 도보"},
            {"transit_mode": "ferry", "transit_min": 10, "transit_detail": "F4 페리 McMahons Pt→CQ"},
            {"transit_mode": "walk", "transit_min": 8, "transit_detail": "Cumberland St 입구 도보"},
            {"transit_mode": "walk", "transit_min": 8, "transit_detail": "Vivid 설치물 도보"},
            {"transit_mode": "walk", "transit_min": 5, "transit_detail": "The Rocks 도보"},
            {"transit_mode": "train", "transit_min": 18, "transit_detail": "도보 CQ역 5분 + T8 전철 12분"},
        ],
    },
}


def main():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    for route_key, route in data["routes"].items():
        if route_key not in TRANSIT:
            continue
        for day_data in route["days"]:
            day_num = day_data["day"]
            if day_num not in TRANSIT[route_key]:
                continue
            transit_list = TRANSIT[route_key][day_num]
            stops = day_data["stops"]
            # stops[0]은 출발지 — transit 없음
            for i in range(1, len(stops)):
                if i - 1 < len(transit_list):
                    t = transit_list[i - 1]
                    stops[i]["transit_mode"] = t["transit_mode"]
                    stops[i]["transit_min"] = t["transit_min"]
                    stops[i]["transit_detail"] = t["transit_detail"]

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print("✅ 이동수단 데이터 추가 완료")


if __name__ == "__main__":
    main()
