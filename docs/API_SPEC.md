# API_SPEC — 쉼(休)마루 프록시 API 초안

> 실제 코드(`api/*.ts`, `frontend/src/api/*.ts`) 기준으로 작성한 MVP 초안.
> `feature/backend` 취합 시 엔드포인트 추가/변경 여부를 확인하고 갱신할 것.

## 1. 구조 개요
프론트는 외부 공공 API를 직접 호출하지 않는다. 모든 요청은 Vercel Edge Function(`api/`)을 경유해 `serviceKey`를 서버 측에서 주입한다.

```
frontend/src/api/*.ts  →  /api/<proxy>?...  →  api/<proxy>.ts (Edge Function)  →  외부 API
```

## 2. 프록시 엔드포인트 목록

### 2.1 `GET /api/tour`
- **역할**: 한국관광공사 TourAPI(B551011) 전 서비스 공용 프록시.
- **쿼리**: `path` (필수, 예: `KorService2/areaBasedList2`), 그 외 원본 쿼리 그대로 전달.
- **내부 포워딩**: `https://apis.data.go.kr/B551011/<path>?...&serviceKey=<TOUR_API_KEY>`
- **캐시**: `s-maxage=300, stale-while-revalidate=600`
- **하위 서비스 예상 경로**:
  - `KorService2/*` — 관광정보(장소·검색·주변·상세·갤러리), 4개 언어
  - `KorWithService2/*` — 무장애 여행(접근성 코스)
  - `KorPetTourService/*` — 반려동물 동반여행
  - `TarRlteService1/areaBasedList1` — 연관 추천("함께 찾은 곳")
  - `DataLabService/locgoRegnVisitrDDList` — 시군구 방문자 통계(인사이트)
- **환경변수**: `TOUR_API_KEY`
- **에러 처리**: 업스트림 실패 시 `502 { error, message }`. 미신청 서비스는 원문 에러("Unexpected errors"/"Forbidden")를 그대로 반환 → 클라이언트가 `not-subscribed` 상태로 분류.

### 2.2 `GET /api/weather`
- **역할**: 기상청 단기예보(VilageFcstInfoService_2.0) 프록시.
- **쿼리**: `base_date`, `base_time`, `nx`, `ny`, `numOfRows` 등.
- **내부 포워딩**: `.../VilageFcstInfoService_2.0/getVilageFcst?...&dataType=JSON&serviceKey=<WEATHER_API_KEY ?? TOUR_API_KEY>`
- **캐시**: `s-maxage=1800, stale-while-revalidate=3600`
- **환경변수**: `WEATHER_API_KEY`(없으면 `TOUR_API_KEY` 재사용)
- **폴백**: 미신청 시 클라이언트가 평년값으로 graceful 폴백(가짜 데이터 아님, 명시적 평년값 사용).

### 2.3 `GET /api/festival-std`
- **역할**: 행안부 전국문화축제 표준데이터 프록시.
- **쿼리**: `type=json`, `numOfRows`, `pageNo`.
- **내부 포워딩**: `https://api.data.go.kr/openapi/tn_pubr_public_cltur_fstvl_api?...&serviceKey=<FESTIVAL_STD_API_KEY ?? TOUR_API_KEY>`
- **캐시**: `s-maxage=86400, stale-while-revalidate=604800` (분기 갱신 데이터)
- **환경변수**: `FESTIVAL_STD_API_KEY`(없으면 `TOUR_API_KEY` 재사용)

### 2.4 `GET /api/templestay`
- **역할**: templestay.com HTML 프록시(사찰 체험 프로그램 목록).
- **쿼리**: `path`(필수, 예: `fe/MI00.../prgList.do`), 그 외 쿼리 전달.
- **내부 포워딩**: `https://www.templestay.com/<path>?...` (브라우저 UA 위장 — 403 차단 회피)
- **응답**: HTML 원본 → 클라이언트(`frontend/src/api/templestay.ts`)가 `select#templeId option` 파싱.
- **캐시**: `s-maxage=3600, stale-while-revalidate=86400`

### 2.5 `GET /api/og-image` (코드 확인 완료)
- **역할**: 행안부 표준데이터 축제 응답에 이미지 필드가 없을 때, 해당 축제의 `homepageUrl` HTML에서 `og:image`/`twitter:image`/본문 첫 `<img>`를 스크래핑해 대표 이미지를 보강하는 SSRF-safe 프록시.
- **요청**: `GET /api/og-image?url=<encoded_url>`
- **응답**: `{ image: string | null }` — 실패해도 항상 `200 { image: null }`(클라이언트가 무이미지로 graceful 처리, 4xx는 `url` 파라미터 누락/형식 오류 시만).
- **보안**: http/https만 허용, localhost·사설 IP(RFC1918)·link-local 차단(SSRF 방어), 8초 타임아웃, https 실패 시 http 폴백(지자체 사이트 인증서 미배포 대응).
- **이미지 필터링**: placeholder/로고/아이콘/svg/에러 이미지 패턴 제외, 상대경로→절대경로 정규화, http→https 강제.
- **캐시**: `s-maxage=86400, stale-while-revalidate=604800`.
- **근거**: `api/og-image.ts`.

## 3. 프론트 API 클라이언트 (`frontend/src/api/`)
| 파일 | 역할 |
|------|------|
| `tour.ts` | TourAPI 클라이언트 (장소 검색/상세 등) |
| `bigdata.ts` | 연관추천(TarRlteService) + 데이터랩(DataLabService) 클라이언트, `not-subscribed`/`empty`/`error`/`ok` 상태 구분 |
| `weather.ts` | 기상청 단기예보 클라이언트 + 평년값 폴백 |
| `standardFestival.ts` | 축제 표준데이터 클라이언트 |
| `templestay.ts` | 템플스테이 HTML 파싱 클라이언트 |

## 4. 코스 생성 로직 — `POST /api/course` (v1 구현 완료, 2026-07-14)

### 4.1 현재 상태
- **서버 엔드포인트 구현 완료.** `api/course.ts` (Edge Function) + `api/_lib/`(ktoApi/normalizeTourData/courseGenerator/types)로 배치 완료. 외부 npm 의존성 없음 — 기존 `api/*.ts`와 동일 컨벤션.
- 프론트는 아직 이 엔드포인트를 호출하지 않는다 — **`frontend/src/lib/courseEngine.ts`(클라이언트 엔진)가 계속 서비스 중**이며, `feature/ui-frontend`가 호출부를 전환하기 전까지 무중단 유지.
- v1은 지역 후보 자동 조회(`KorService2/areaBasedList2`) + 카테고리/동반자/강수/숨은지역/거리 가중치 + 2-opt 동선까지만 커버한다. `courseEngine.ts`가 이미 가진 축제 연계·찜(favorites) 가중치·다중 프로필(`profiles`)은 v1 범위 밖(§4.3 참고).

### 4.2 요청/응답 (구현된 v1 계약)
- **엔드포인트**: `POST /api/course`
- **인증/키**: 기존 `TOUR_API_KEY` 환경변수 재사용. 호출자가 키를 넘길 필요/방법 없음(서버가 주입).
- **요청 바디**:
  ```json
  {
    "areaCode": 47,
    "sigunguCode": 170,
    "origin": { "lat": 36.568, "lng": 128.729 },
    "durationDays": 2,
    "preferredCategories": ["hanok", "market"],
    "companions": ["friends"],
    "rainProbability": 0.3,
    "hiddenAreaWeight": 1,
    "maxStopsPerDay": 4,
    "numOfRows": 100
  }
  ```
  - `areaCode`/`sigunguCode`는 **TourAPI 지역 코드(숫자)** — 사용자 친화적 지역명이 아님. 프론트는 `frontend/src/constants/sigungu.ts`의 `findSigungu`로 지역명을 코드로 변환해서 보내야 한다(현재 서버에는 이 매핑이 없음, §4.3).
  - 필수: `areaCode`, `origin.lat`, `origin.lng`, `durationDays`(양수). 누락 시 `400 { error: 'missing-required-fields', required: [...] }`.
- **응답 (성공)**: `200 { status: 'ok', course: GeneratedCourse, issues: NormalizeIssue[] }`
  - `GeneratedCourse.days[]`: `{ day, stops: [{ place, order, score, distanceFromPreviousKm }], distanceKm }`
  - `GeneratedCourse.totalDistanceKm`, `GeneratedCourse.meta: { candidateCount, selectedCount, rainAdjusted, hiddenAreaAdjusted }`
  - `place`는 `NormalizedTourPlace`(id/category/name/address/position/thumbnail/tel/homepage/overview/openHours/...) — 프론트 `Place` 타입과 필드 의미는 맞췄으나 1:1 매핑 검증은 아직 안 됨.
- **응답 (미신청 서비스)**: `200 { status: 'not-subscribed', message }` — 가짜 데이터 대체 없이 명시적 안내(기존 `bigdata.ts` 패턴과 동일 원칙).
- **응답 (오류)**: `400`(요청 오류) / `405`(GET 등 다른 메서드) / `500`(서버 키 미설정) / `502`(TourAPI 업스트림 실패, `{ error: 'upstream-failed', message }`).
- **캐시**: `Cache-Control: no-store`(사용자별 입력이 매번 다름).

### 4.3 미결 (프론트 전환 전 확정 필요)
- [ ] 지역명 → `areaCode`/`sigunguCode` 변환을 프론트에서만 할지, 서버에도 매핑을 이식할지(중복 방지 관점에서는 공유가 이상적이나 `api/_lib`가 `frontend/src/constants`를 import할 수 없어 별도 작업 필요).
- [ ] 축제 연계·찜 가중치·다중 프로필 — v1 범위 밖. 이 gap을 메운 뒤 전환할지, v1로 먼저 전환하고 점진 보강할지 결정 필요.
- [ ] 무장애(`KorWithService2`)·반려동물(`KorPetTourService2`)·숨은지역(`DataLabService` 방문자 수 → `visitorCount`) 실데이터 병합 — 현재 `api/course.ts`는 `areaBasedList2` 단일 호출만 수행, 이 세 서비스는 아직 후보에 병합되지 않음.
- [ ] `reoptimizeCourse`/`recomputeCourse`(편집 화면 재계산)도 서버로 옮길지, 최초 생성만 서버로 옮기고 편집 중 재계산은 클라이언트에 남길지.
- [ ] 응답 지연(TourAPI 다건 호출 + 2-opt 계산) 시 로딩 UX — 기존 클라이언트 엔진 대비 체감 속도 저하 가능성 검토.

## 5. 공유/참여 플로우 (코드 확인 완료 — 두 기능은 서로 다른 메커니즘)

### 5.1 공유 링크 — `/course/shared/:payload` (서버 없음)
- `frontend/src/lib/share.ts`의 `encodeShare`/`decodeShare`.
- 코스 JSON(장소는 `slimPlace`로 URL 크기 최적화된 최소 필드만) → UTF-8 안전 **base64url** 인코딩 → URL 파라미터에 담음.
- 열람 시 `decodeShare`가 최소 구조(`items` 배열, `id` 문자열) 검증 후 로컬 상태(`useCourses.setCurrent`)에 반영. 변조/구버전 payload는 `share.decodeFailed` 토스트 후 홈으로 리다이렉트.
- **읽기 전용 스냅샷** — 받는 쪽이 편집해도 원본과 동기화되지 않음.

### 5.2 실시간 참여 — `/join/:code` (Supabase 백엔드)
- `frontend/src/lib/supabase.ts` + `frontend/src/stores/collab.ts`.
- Supabase 프로젝트에 `shared_courses` 테이블(`code`, `course` JSON, `version`, `updated_at`), **RLS로 해당 테이블만 익명 접근 허용**. 로그인 없이 코스 키(방 코드, 예: `GB-XXXXX`)로 실시간 CRUD.
- 방 생성(`createRoom`)이 코드를 발급, 참여(`joinRoom`)는 코드로 서버 코스를 받아 로컬에 세팅 후 Supabase Realtime 채널 구독.
- 동시 편집 충돌은 **버전 기반 Last-Write-Wins**로 처리하되, 원격 코스에 내가 모르는 장소가 있으면 `mergeCourses`로 합쳐 손실 최소화.
- `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` 미설정 시 `isCollabConfigured()===false` → `/join` 진입 시 `collab.unconfigured` 안내 후 홈으로 리다이렉트(앱 전체가 깨지지 않음).
- `supabase-js`는 dynamic import — 초기 번들에 포함되지 않고 협업 기능을 실제로 켤 때만 로드.
- **참고**: `docs/PROJECT_SPEC.md` §7의 "DB 없음" 원칙에 대한 유일한 예외. 스키마 원본은 `frontend/supabase.sql`.

## 6. 인증/보안
- 로그인 없음(MVP 기준). 사용자 식별 없음(협업 기능도 기기별 익명 ID만 사용, `useCollab.me`).
- 외부 공공 API 키는 전부 Vercel 서버 환경변수로만 관리, 클라이언트 번들 미포함.
- Kakao Map JS SDK 키는 브라우저에 노출되며 도메인 화이트리스트로 보호.
- Supabase anon key는 브라우저 노출을 전제로 설계된 공개 키이며, RLS 정책으로 `shared_courses` 테이블 외 접근을 차단(운영 시 RLS 정책 실제 적용 여부는 `feature/backend`에서 확인 필요).
- **Supabase는 정식 채택 스택(2026-07-14 결정).**

## 7. 미결 사항
- [x] 코스 생성 서버 이전 여부 — **이전 결정 + `POST /api/course` v1 구현 완료**(§4 참고). 프론트 호출부 전환은 아직.
- [ ] `POST /api/course` 요청/응답 스키마 세부 gap 해소(§4.3 — 지역 코드 변환, 축제/찜/다중프로필, 무장애·반려동물·숨은지역 실데이터).
- [ ] Supabase 운영 프로젝트의 RLS 정책이 `frontend/supabase.sql` 스키마와 실제로 일치하는지(배포 환경 기준) 확인.
- [ ] 데이터랩·연관추천·무장애·반려동물 API 활용신청 상태(운영 키 기준) — `docs/PROJECT_SPEC.md` §8과 동일 항목.
