# 작업 보고서

## 1. 완료한 작업
- (이전 라운드) 코스 생성용 TypeScript 백엔드 모듈 구현 — KTO API 클라이언트, 관광 데이터 정규화, 가중치 추천 + 2-opt 동선 생성. 상세는 하단 "이전 완료 내역" 참고.
- **(이번 라운드, 2026-07-14 사용자 결정 반영)** helper-manager 지시에 따라 서버 이전 실행:
  - 저장소 루트 `lib/`, `types/`를 `api/_lib/`(`api/_lib/types/` 포함)로 이동 — Vercel이 언더스코어 폴더를 라우트로 취급하지 않아 기존 빌드 설정 변경 없이 배치.
  - 상대 경로 import 수정(`../types/*` → `./types/*`, `types` 폴더가 `_lib`의 하위 폴더가 되면서 깊이가 바뀜).
  - `api/course.ts` 신설 — `POST` 요청을 받아 `KorService2/areaBasedList2`로 지역 후보를 조회하고 `normalizeTourData` → `generateCourse` 파이프라인을 실행하는 Edge Function. 기존 `api/tour.ts`와 동일한 컨벤션(`export const config = { runtime: 'edge' }`) 사용.
  - `TOUR_API_KEY` 환경변수를 그대로 재사용(추가 환경변수 없음).

## 2. 수정한 파일
- `api/_lib/types/tour.ts`, `api/_lib/types/course.ts`, `api/_lib/types/index.ts` (루트 `types/`에서 이동)
- `api/_lib/ktoApi.ts`, `api/_lib/normalizeTourData.ts`, `api/_lib/courseGenerator.ts` (루트 `lib/`에서 이동, import 경로 수정)
- `api/course.ts` — 신규 엔드포인트
- `agent-reports/backend.md` — 본 문서

## 3. 아직 안 된 것
- **요청/응답 스키마가 v1 상태.** 현재 `POST /api/course` 요청 바디는 `{ areaCode, sigunguCode?, origin: {lat,lng}, durationDays, preferredCategories?, companions?, rainProbability?, hiddenAreaWeight?, maxStopsPerDay?, numOfRows? }`이며, TourAPI `areaCode`/`sigunguCode`(숫자 코드) 기준이다. 프론트가 갖고 있는 사용자 친화적 지역명 → 코드 변환(`frontend/src/constants/sigungu.ts`의 `findSigungu`)은 아직 서버에 포함하지 않았다 — 클라이언트가 변환해서 보내거나, 서버에 동일 매핑을 이식할지 결정 필요.
- **기존 프론트 `courseEngine.ts`와 필드/로직 완전 정합 안 됨.** 이번 `generateCourse`는 카테고리·동반자·강수·숨은지역·거리 가중치만 반영한 v1이며, `courseEngine.ts`가 이미 갖고 있는 축제 연계, 찜(favorites) 가중치, 다중 프로필(`profiles`) 지원은 아직 없다. 프론트 전환 전 이 gap을 메울지, 아니면 v1 범위로 먼저 붙이고 점진 보강할지 결정 필요.
- 운영 API 키로 실호출 테스트는 아직 안 함(환경변수 미제공). 로컬에서는 정규화·추천 로직만 Node 스모크 테스트로 검증(하단 참고).
- `KorWithService2`(무장애), `KorPetTourService2`(반려동물), `DataLabService`(방문자 수 → `visitorCount`) 연동은 `areaBasedList2` 단일 호출만으로는 안 되고, 후보 조회 후 개별 병합이 필요 — 아직 `api/course.ts`에 붙이지 않음(현재는 카테고리/거리/동반자 가중치만 적용, 무장애·반려동물·숨은지역 실데이터는 후속 작업).

## 4. 다른 담당자에게 필요한 것
- **feature/ui-frontend**: 지역 선택 UI가 지역명을 다루므로, `findSigungu` 결과(코드)를 `/api/course` 요청 바디의 `areaCode`/`sigunguCode`로 매핑해서 호출해야 한다. 호출 전 로딩/에러/빈 응답(`not-subscribed`) 상태 UI를 `bigdata.ts` 패턴과 일관되게 설계 요청.
- **helper-manager**: 위 3번의 두 gap(스키마 v1, courseEngine.ts와의 로직 정합)에 대한 우선순위 결정 필요 — 전체 정합 후 전환할지, v1로 먼저 전환하고 보강할지.

## 5. 충돌 가능성
- `api/course.ts`, `api/_lib/**`은 전부 신규 파일 — 기존 파일과 충돌 없음.
- `frontend/src/lib/courseEngine.ts`는 이번 라운드에도 손대지 않음 — ui-frontend가 전환 작업을 시작하면 그 시점에 이 파일의 거취(삭제/폴백 존치)가 논의 대상.
- 루트에 있던 `lib/`, `types/`는 완전히 제거되고 `api/_lib/`로만 존재 — 다른 브랜치가 루트 `lib/`·`types/`를 참조하고 있었다면(현재까지 확인된 바 없음) 경로가 깨진다.

## 6. 다음 액션
- `findSigungu` 지역명→코드 매핑을 서버에도 둘지 결정(중복 대신 공유 상수로 뽑는 방안 검토 — 단 `api/_lib`는 프론트 `frontend/src/constants`를 import할 수 없으므로 값 복제 또는 별도 공유 패키지 필요).
- 무장애/반려동물/숨은지역(DataLab) 실데이터 병합을 `api/course.ts`에 추가.
- courseEngine.ts와의 로직 정합(축제 연계, 찜 가중치, 다중 프로필) 범위와 일정을 helper-manager와 조율.

---

## 이전 완료 내역 (참고용 — 이전 라운드 보고서)
- 한국관광공사 API 클라이언트: 허용 서비스 경로 화이트리스트, operation 형식 검증, `MobileOS`/`MobileApp`/`_type`/페이징 기본값 주입, 호출자 `serviceKey` 무시 후 서버 키만 사용, HTTP/타임아웃/미신청/`resultCode` 오류 구분, 단일·배열 `item` 응답 통합 처리.
- 관광 데이터 정규화: TourAPI 원본 → 프런트 `Place` 호환 camelCase, 숫자/좌표 변환, HTML 공백 정리, 이미지·홈페이지 HTTPS 강제, 중복 제거, 카테고리 분류(한옥·템플스테이·서원·사찰·체험·시장·음식점·길·관광지·축제), 필수 필드 누락 항목 제거 및 `issues` 기록, 숙박류(글램핑·풀빌라·캠핑·모텔·리조트·카지노) 제외.
- 추천 코스 생성: 카테고리/동반자/반려동물/무장애/강수/인지도/거점 거리 가중치, DataLab 방문자 수 기반 숨은지역 보너스(데이터 없으면 미적용), 카테고리 반복 점진 감점, 최근접 이웃 + 2-opt 동선 최적화, Haversine 거리 기반 일자별 방문 순서·구간 거리·총 거리 산출.
- 검증(이전 라운드): `tsc --noEmit --strict` 통과. Node 스모크 테스트로 정규화·분류·추천·동선 로직 확인.

## 검증 (이번 라운드)
- `tsc --noEmit --strict`(ES2023/ESNext/Bundler, `--allowImportingTsExtensions`)로 `api/_lib/**` + `api/course.ts` 전체 통과(단, 순수 `process` 전역은 기존 `api/*.ts`와 동일하게 앰비언트 선언 없이도 Vercel Edge 런타임에서 정상 동작 — 로컬 tsc 단독 실행 시에만 `@types/node` 필요).
- Node 스모크 테스트: 4건 원본(한옥/시장/글램핑 제외 대상/좌표 없음) → 정규화 2건 + issue 1건, 카테고리 분류 정상(hanok/market), `generateCourse` 실행 결과 1일차 2곳 방문·총 58.4km·`hiddenAreaAdjusted: true` 확인.
