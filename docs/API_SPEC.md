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

### 2.5 `GET/POST /api/og-image`
- **역할**: OG 커버 이미지 생성/서빙 (코스 공유 시 소셜 미리보기용으로 추정).
- **상세 스펙**: `feature/backend` 또는 `feature/design` 취합 시 실제 파라미터 확인 필요.

## 3. 프론트 API 클라이언트 (`frontend/src/api/`)
| 파일 | 역할 |
|------|------|
| `tour.ts` | TourAPI 클라이언트 (장소 검색/상세 등) |
| `bigdata.ts` | 연관추천(TarRlteService) + 데이터랩(DataLabService) 클라이언트, `not-subscribed`/`empty`/`error`/`ok` 상태 구분 |
| `weather.ts` | 기상청 단기예보 클라이언트 + 평년값 폴백 |
| `standardFestival.ts` | 축제 표준데이터 클라이언트 |
| `templestay.ts` | 템플스테이 HTML 파싱 클라이언트 |

## 4. 코스 생성 관련 API (미확인 — 취합 필요)
- 코스 자동 생성 엔진(카테고리 가중치 × 거점 반경 × 숨은지역 보너스 × 동반자 가중치 × 강수 경향 → 2-opt 최적화)이 **프론트 로직인지 서버 API인지** 확인 필요.
- 현재까지 확인된 바로는 별도 `/api/course` 류 엔드포인트가 존재하지 않음 → 프론트 단독 계산으로 추정.
- `feature/ui-frontend`, `feature/backend` 보고서에서 확정 필요.

## 5. 공유/참여 플로우 (미확인 — 취합 필요)
- `/course/shared/:payload`, `/join/:code` 라우트 존재.
- 서버 저장(DB) 없이 payload를 URL에 인코딩하는 방식인지, 별도 저장소가 있는지 확인 필요.

## 6. 인증/보안
- 로그인 없음(MVP 기준). 사용자 식별 없음.
- 외부 API 키는 전부 Vercel 서버 환경변수로만 관리, 클라이언트 번들 미포함.
- Kakao Map JS SDK 키만 브라우저에 노출되며 도메인 화이트리스트로 보호.

## 7. 미결 사항
- [ ] `/api/og-image` 정확한 요청/응답 스펙.
- [ ] 코스 생성 로직 위치(프론트/백엔드) 확정.
- [ ] 공유 링크(`/course/shared`, `/join`) 저장 방식 확정.
- [ ] `feature/backend` 브랜치가 새 엔드포인트를 추가하는지 확인 후 본 문서에 반영.
