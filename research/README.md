---
layout: default
title: "research/"
---

# research/

> 리서치 자료를 보관하는 폴더.

## 구조

```
research/
├── README.md                # 이 문서
├── deep-research/           # ChatGPT, Gemini 등 외부 AI 딥 리서치 결과
│   ├── {주제}_{출처}.md     # 예: 시드니-골드코스트-로드트립-일정_chatgpt.md
│   └── ...
├── claude-research/         # Claude Code가 직접 조사한 리서치 결과
│   ├── {주제}.md            # 예: 호주-5월-여행환경.md
│   ├── places/              # 지역별 장소 리서치 요약 (Phase 2 결과)
│   │   └── {지역명}.md      # 예: 시드니.md, 블루마운틴.md
│   ├── weather/             # 지역별 날씨 조사
│   │   └── {번호}_{지역명}.md  # 예: 01_시드니.md
│   ├── activities/          # 액티비티 리서치
│   │   └── {지역명}-액티비티-리서치.md  # 예: 바이런베이-액티비티-리서치.md
│   └── ...
├── route-plans/             # 로드트립 루트 후보 상세 일정 (1~9조)
│   ├── README.md            # 종합 순위표
│   ├── 1조_GC직행_남하해안.md
│   ├── ...
│   └── 9조_GC포함_밸런스.md
└── sydney-plans/            # 시드니 Day 7 세부 일정 계획
```

## 파일 작성 규칙

### deep-research/
- **ChatGPT, Gemini 등 외부 AI**로 딥 리서치한 결과를 저장
- 파일명: `{주제}_{출처}.md` (예: `골드코스트-맛집_gemini.md`)
- 상단에 출처, 검색일, 프롬프트 요약을 기록

```markdown
---
출처: ChatGPT / Gemini 등
검색일: 2026-03-12
프롬프트: (어떤 질문을 했는지 간략 요약)
---
(내용)
```

### claude-research/
- **Claude Code**가 WebSearch/WebFetch 등으로 직접 조사한 결과를 저장
- 파일명: `{주제}.md` (예: `호주-5월-여행환경.md`)
- 상단에 작성일, 조사 목적을 기록

```markdown
---
작성일: 2026-03-12
목적: (무엇을 조사했는지 간략 요약)
---
(내용)
```

