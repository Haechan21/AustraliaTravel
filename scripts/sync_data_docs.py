#!/usr/bin/env python3
"""
숙소/식당/액티비티 종합 문서 ↔ data/ JSON 동기화 CLI.

Usage:
    python scripts/sync_data_docs.py              # dry-run: 불일치 리포트
    python scripts/sync_data_docs.py --fix        # 마커 값 교체
    python scripts/sync_data_docs.py --check-only # CI용: 불일치 시 exit 1
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sync_engine import DataDocsRegistry, SyncEngine, ROOT

# 동기화 대상 문서
DOC_FILES = [
    ROOT / "research" / "claude-research" / "accommodation" / "숙소_종합비교.md",
    ROOT / "research" / "claude-research" / "dining" / "식당_종합가이드.md",
    ROOT / "research" / "claude-research" / "activities" / "액티비티_종합가이드.md",
]


def run_check(registry: DataDocsRegistry, fix: bool = False) -> int:
    """마커 값 검사/교체. 불일치 수 반환."""
    total_mismatches = 0

    for fpath in DOC_FILES:
        if not fpath.exists():
            print(f"⚠️  파일 없음: {fpath.name}")
            continue

        content = fpath.read_text(encoding="utf-8")
        markers = SyncEngine.parse_markers(content)
        if not markers:
            print(f"📄 {fpath.name} — 마커 없음 (스킵)")
            continue

        if fix:
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
                print(f"📄 {fpath.name} — 마커 {len(markers)}개, 불일치 없음 ✅")
        else:
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
            else:
                print(f"📄 {fpath.name} — 마커 {len(markers)}개, 정합 ✅")

    return total_mismatches


def main():
    args = set(sys.argv[1:])
    fix = "--fix" in args
    check_only = "--check-only" in args

    print("=== 데이터 문서 동기화 리포트 ===\n")

    registry = DataDocsRegistry()
    total = run_check(registry, fix=fix)

    print(f"\n{'=' * 40}")
    if total == 0:
        print("불일치 없음 ✅")
    elif fix:
        print(f"총 {total}건 수정 완료 ✅")
    else:
        print(f"총 {total}건 불일치")
        if not check_only:
            print("→ 수정하려면: python scripts/sync_data_docs.py --fix")

    if check_only and total > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
