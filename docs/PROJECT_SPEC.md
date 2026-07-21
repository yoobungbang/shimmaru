# PROJECT_SPEC — 쉼(休)마루 · Shimmaru

> 2026 관광데이터 활용 공모전(웹·앱 개발 부문) 출품작
> 이 문서는 MVP 기준 초안이며, 브랜치 취합 과정에서 계속 갱신된다.

## 1. 한 줄 정의
경상북도 전통문화 여행 코스를 챗봇형 질문(지역·기간·동반자·취향)으로 자동 생성해주는 다국어(한/영/일/중) 모바일 퍼스트 PWA.

## 2. 왜 경상북도인가 (지역특화 근거)
- 22개 시군, 한옥·서원·사찰·전통체험·전통시장·향토축제 자원 밀도 전국 최고.
- 그러나 방문은 안동·경주 등 일부 도시에 쏠림.
- 쉼마루의 핵심 가치: **데이터로 숨은 시군을 끌어올리는 것** (데이터랩 실방문자 기반 "숨은지역 보너스" 스코어링).

## 3. 현재 아키텍처 (실제 구현 기준, 코드 확인 완료)
```
[React 19 + TS + Vite SPA]  ──HTTPS──▶  [Vercel Edge Function (api/*.ts)]  ──▶  한국관광공사 OpenAPI 등
        │                                                                          (TourAPI, DataLab, 기상청, 표준데이터, templestay.com, og-image)
        ├──▶ Kakao Map JS SDK (브라우저 직접 호출, 도메인 화이트리스트로 보호)
        └──▶ Supabase (선택적 실시간 협업 전용) ── anon key, RLS로 shared_courses 테이블만 익명 허용
```
- **로그인 없음.** 코스·찜·기록은 브라우저 `localStorage` + IndexedDB 캐시(`cachedFetch`)로 관리.
- **DB는 원칙적으로 없으나, 실시간 코스 공동편집(`/join/:code`) 기능만 Supabase를 선택적으로 사용.** `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` 미설정 시 `isCollabConfigured()===false`로 해당 기능이 자동 비활성화되고 기존 URL 링크 공유(서버 없는 payload 인코딩)로 graceful 폴백 — 심사 시연 환경 키 유무와 무관하게 앱이 정상 동작.
- 코스 생성 엔진(`frontend/src/lib/courseEngine.ts`)은 **100% 프론트 로직**. 서버 API 없음.
- API 키(TOUR_API_KEY, WEATHER_API_KEY, FESTIVAL_STD_API_KEY)는 **Vercel 환경변수**에만 존재. 프론트 번들에 포함되지 않음. Supabase anon key는 공개 키로 설계되어 프론트 노출이 안전(RLS로 방어).
- dev 환경은 Vite 프록시, 운영은 `api/` 아래 Vercel Edge Function이 동일 역할(serviceKey 주입)을 수행.

> 참고: 저장소 루트의 `shimmaru.md`는 "Spring Boot + MySQL 2차 백엔드"를 전제로 한 초기 기획 문서다.
> 현재 실제 구현은 **프론트 단독 + Vercel Edge Function 프록시 + Supabase(협업 전용)** 구조로, Java 백엔드는 아직 도입되지 않았다.
> `feature/backend` 브랜치 취합 시 이 구조가 유지되는지, 별도 서버가 추가되는지 확인 필요.

## 4. 기술 스택
| 영역 | 스택 |
|------|------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS, Zustand, React Router, i18next, Kakao Map JS SDK, vite-plugin-pwa |
| Serverless Proxy | Vercel Edge Function (`api/*.ts`) — Runtime: edge |
| 외부 API | 한국관광공사 TourAPI(KorService2), 무장애(KorWithService2), 반려동물(KorPetTourService), 연관추천(TarRlteService), 데이터랩(DataLabService), 행안부 문화축제 표준데이터, 기상청 단기예보(VilageFcstInfoService_2.0), templestay.com |
| 지도 | Kakao Map JavaScript SDK |
| 데이터 저장 | 브라우저 localStorage + IndexedDB (서버 DB 없음, MVP 기준) |
| 배포 | Vercel |

## 5. 핵심 기능 (MVP 범위)
1. **코스 자동 생성 엔진** — 카테고리 가중치 × 거점 반경 × 숨은지역 보너스(데이터랩) × 동반자 가중치 × 강수 경향(기상청) 스코어링 → 2-opt 동선 최적화.
2. **챗봇형 입력** — 지역/기간/동반자/취향 질문에 답하면 코스 생성.
3. **지도 표시** — Kakao Map 기반 코스 동선 시각화(`/course/map`).
4. **코스 편집 / 공유 / 참여** — `/course/edit`(드래그 순서 변경 `dnd-kit` + 재최적화), `/course/shared/:payload`(서버 없는 base64url payload 인코딩 링크), `/join/:code`(Supabase 실시간 방 — 익명 코드 하나로 로그인 없이 공동 편집, LWW 버전 병합).
5. **탐색 / 장소 상세** — `/explore`, `/place/:id`.
6. **축제 연계** — `/festivals`, `/festivals/:id` — 거점 지역·여행 기간에 열리는 축제만 코스에 연결.
7. **경북 데이터 인사이트** — `/insights` — 데이터랩 방문자 버블 지도 + 한적 랭킹 + 연관 추천("함께 찾은 곳").
8. **찜 / 여행 기록** — `/favorites`, `/journal` (localStorage 기반).
9. **쉼마루 Wrapped** — `/report` — 여행 기록 연말결산 스토리(풀스크린).
10. **다국어** — 한/영/일/중 4개 언어, i18next.
11. **PWA** — 오프라인 폴백, 홈 화면 추가.
12. **관리자 통계** — `/admin` — 개발 빌드에서만 라우트 노출(운영 URL 직접 진입 차단).

## 6. 원칙 (기존 shimmaru.md 승계)
1. 프론트엔드는 React 기반 유지.
2. 백엔드를 도입할 경우 Java Spring Boot 기준(변경 시 이 문서 갱신 필요).
3. API 키는 절대 프론트 번들에 포함하지 않는다 — 반드시 서버/Edge Function 경유.
4. localStorage 데이터 구조는 추후 DB 마이그레이션이 쉬운 필드명을 사용한다.
5. 모바일 퍼스트 — Tailwind 기본값에서 시작해 `md:`, `lg:`로 확장.
6. 외부 API(관광공사, 기상청, Kakao, templestay)는 에러/타임아웃/빈 응답을 가정한 UI 폴백을 갖춘다. 가짜/목업 데이터는 쓰지 않는다(미신청 API는 "활용신청 안내" 상태로 노출).

## 7. 브랜치 구조 및 취합 방침
- `dev` — 통합 브랜치. **사용자는 dev만 본다.**
- `feature/design` — 디자인/UI 비주얼 작업.
- `feature/ui-frontend` — 프론트엔드 화면/로직 구현.
- `feature/backend` — 백엔드(프록시/서버) 작업.
- helper-manager(현재 세션)가 각 브랜치의 작업 결과를 `agent-reports/`에 취합하고, 충돌 가능성을 사전 식별해 `dev` 병합을 조율한다.

## 8. 미결 사항
- [ ] `feature/backend`가 실제로 별도 서버(Spring Boot 등)를 추가하는지, 아니면 Edge Function 확장인지 확인.
- [x] 코스 공유/참여 저장 방식 — `/course/shared/:payload`는 서버 없는 base64url payload(`frontend/src/lib/share.ts`), `/join/:code`는 Supabase 실시간 방(`frontend/src/lib/supabase.ts`, `frontend/src/stores/collab.ts`). 둘은 별개 기능(공유=읽기 전용 스냅샷, 참여=실시간 공동편집).
- [x] `/admin` 통계 데이터 소스 — `useCourses`(saved/recent), `useFavorites` 등 **localStorage 집계**. 서버 호출 없음(`frontend/src/pages/Admin.tsx`).
- [ ] 데이터랩·연관추천·무장애·반려동물 API 활용신청 상태 확인(운영 키 기준).
- [ ] Supabase 프로젝트가 실제로 배포/설정되어 있는지(운영 환경변수 기준) 확인 — 미설정 시 `/join` 기능이 통째로 비활성화됨.
