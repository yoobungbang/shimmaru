# PAGE_FLOW — 쉼(休)마루 화면 흐름 초안

> `frontend/src/routes.tsx` 기준으로 작성한 MVP 초안. 실제 화면 컴포넌트 세부 동작은 `feature/ui-frontend`, `feature/design` 취합 시 보강.

## 1. 라우트 맵
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | `Home` | 첫 화면. 챗봇형 질문(지역/기간/동반자/취향) 시작점. 즉시 로드(코드 스플리팅 제외). |
| `/course` | `CourseResult` | 코스 자동 생성 결과 리스트/요약. |
| `/course/map` | `CourseMap` | Kakao Map 기반 코스 동선 시각화. |
| `/course/edit` | `CourseEdit` | 코스 편집(장소 추가/삭제/순서 변경 추정). |
| `/course/shared/:payload` | `CourseShared` | 공유 링크로 진입 시 코스 미리보기. |
| `/join/:code` | `CourseJoin` | 초대 코드로 코스 참여(동행 기능 추정). |
| `/place/:id` | `PlaceDetail` | 장소 상세 정보. |
| `/explore` | `Explore` | 장소 탐색(카테고리/지역 필터 추정). |
| `/festivals` | `Festivals` | 축제 목록 — 캘린더/지도/리스트 토글. |
| `/festivals/:id` | `FestivalDetail` | 축제 상세. |
| `/insights` | `Insights` | 경북 데이터 인사이트 — 방문자 버블 지도 + 한적 랭킹 + 연관 추천. |
| `/favorites` | `Favorites` | 찜 목록(localStorage). |
| `/journal` | `Journal` | 여행 기록. |
| `/report` | `Report` | 쉼마루 Wrapped — 연말결산 스토리(풀스크린). |
| `/settings` | `Settings` | 설정(언어 등). |
| `/admin` | `Admin` | 운영 통계 — **개발 빌드 전용**, 운영 배포에서는 라우트 자체가 제외됨. |

- 모든 경로는 `AppShell`(공통 레이아웃) 하위. 라우트 로드 실패 시 `RouteError`가 처리.
- `Home` 제외 전 페이지는 `React.lazy` 코드 스플리팅 적용(초기 번들 경량화).

## 2. 핵심 사용자 흐름 (MVP 골든 패스)

### 2.1 코스 생성 흐름
```
Home (챗봇형 질문: 지역 → 기간 → 동반자 → 취향)
  → 코스 자동 생성 엔진 실행
  → CourseResult (결과 리스트)
  → CourseMap (지도로 동선 확인) ⇄ CourseEdit (편집)
  → 찜/저장 → Favorites
  → 공유 → CourseShared (상대방이 :payload 로 진입)
```

### 2.2 탐색/정보 흐름
```
Home 또는 Explore → PlaceDetail (장소 상세)
Festivals (목록) → FestivalDetail (상세)
Insights → (데이터랩 방문자 지도) → 숨은 시군 발견 → Home 코스 생성으로 유입
```

### 2.3 참여 흐름
```
공유받은 링크(/course/shared/:payload) 열람
  → 참여 코드로 진입(/join/:code) → 코스 공동 편집/열람 (동행 기능 추정)
```

### 2.4 기록/결산 흐름
```
여행 후 Journal 에 기록 → 연말 Report(Wrapped) 로 스토리 형태 결산
```

## 3. 내비게이션 구조 (추정 — 실 UI 확인 필요)
- 하단 탭 또는 상단 메뉴로 `Home / Explore / Festivals / Insights / Favorites / Journal / Settings` 접근 추정.
- `Course*`, `PlaceDetail`, `FestivalDetail`, `Report`, `join` 은 딥링크/플로우 진입 화면으로 별도 탭 없이 흐름 중 진입 추정.
- **실제 하단 탭 구성은 `feature/ui-frontend`/`feature/design` 보고서에서 확정 필요.**

## 4. 다국어 / PWA 고려사항
- 전 페이지 i18next 기반 4개 언어(한/영/일/중) 지원 대상.
- PWA 오프라인 폴백 화면 존재 여부 및 위치 확인 필요(라우트에 명시적 오프라인 페이지 없음 — Service Worker 레벨 처리 추정).

## 5. 미결 사항
- [ ] 실제 내비게이션 UI(탭바/메뉴) 구성 확인.
- [ ] `CourseEdit`의 구체적 편집 기능 범위(순서 변경/장소 교체/시간 조정 등) 확인.
- [ ] `CourseJoin`(동행 초대) 기능이 MVP 범위에 포함되는지 확인 — 서버 저장 없이 어떻게 동기화되는지도 함께 확인.
- [ ] 오프라인 폴백 화면/배너 존재 여부 확인.
