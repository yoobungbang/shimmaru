# 작업 보고서 (helper-manager) — 7차: 전체 병합 + 배포 완료

## 1. 이번 라운드에서 한 일
1. `feature/backend`, `feature/ui-frontend`, `feature/design` 세 브랜치 전부 커밋 후 `origin`에 푸시.
2. `dev`에 순서대로 병합: `feature/backend`(신규 파일, 무충돌) → `feature/design`(docs 2개 충돌 — dev의 더 최신 버전으로 해결) → `feature/ui-frontend`(`Home.tsx` 자동 병합, 무충돌 — 두 브랜치가 서로 다른 영역을 건드려서 깨끗하게 합쳐짐).
3. 병합된 `dev`에서 `tsc`/`build`/`lint`/테스트(58개) 전부 재검증 — 통과.
4. `dev`를 `origin`에 푸시.
5. **배포 중 실제 버그 발견 및 수정**: `api/course.ts`와 `api/_lib/**`의 상대 import가 `./ktoApi.ts`처럼 명시적 `.ts` 확장자를 쓰고 있었는데, 로컬 `tsc`(`--allowImportingTsExtensions` 옵션 사용)에서는 통과했지만 **Vercel Edge Function 번들러는 이를 지원하지 않아 첫 배포가 실패**했다(`referencing unsupported modules`). 확장자를 제거하고 재검증 후 다시 배포해 해결.
6. Vercel `frontend` 프로젝트에 연결(`vercel link`) 후 `vercel deploy --prod`로 배포 성공. 프로덕션 도메인 `https://frontend-rho-ten-40.vercel.app`에 alias 완료.
7. 배포본 스모크 테스트: index 200, `/api/course`(빈 바디) 400(검증 로직 정상 동작), `/api/tour` 라우팅 정상(키 없어 업스트림에서 401).

## 2. (해결됨) Vercel 환경변수 — TOUR_API_KEY, VITE_KAKAO_MAP_KEY 등록 완료
사용자가 키를 제공해 `TOUR_API_KEY`, `VITE_KAKAO_MAP_KEY`를 Vercel production 환경변수로 등록하고 재배포 완료. `/api/course` 실호출로 실제 장소 데이터(좌표·썸네일 포함)가 정상 반환되는 것을 확인했다(2026-07-21).

### (이전 기록 — 참고용)
`vercel env ls production` 결과 **환경변수가 하나도 설정되어 있지 않습니다.** 즉 지금 배포된 프로덕션은:
- `TOUR_API_KEY` 없음 → 관광공사 API 전부 실패(장소 검색, 코스 생성, 축제, 인사이트 등 핵심 기능 동작 안 함).
- `VITE_KAKAO_MAP_KEY` 없음 → 카카오 지도가 안 뜸.
- `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` 없음 → `/join` 실시간 협업 자동 비활성화(이건 앱이 안 깨지고 graceful하게 링크 공유로 폴백하니 괜찮음).

**앱이 배포는 됐지만, 키를 넣기 전까지는 첫 화면 정적 UI 외에는 거의 동작하지 않습니다.** 아래 순서로 Vercel 대시보드(Project Settings → Environment Variables) 또는 `vercel env add`로 넣어주셔야 합니다:
- `TOUR_API_KEY` (필수 — 공공데이터포털 관광공사 키)
- `VITE_KAKAO_MAP_KEY` (필수 — 카카오 지도)
- `WEATHER_API_KEY` (선택, 없으면 TOUR_API_KEY 재사용)
- `FESTIVAL_STD_API_KEY` (선택, 없으면 TOUR_API_KEY 재사용)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (선택 — 실시간 협업)

넣은 뒤 `vercel deploy --prod` 재실행(또는 다음 `git push` 시 재배포)이 필요합니다.

## 3. 최종 상태
- `dev` 브랜치: 3개 feature 브랜치 전부 병합 완료, 원격 푸시 완료.
- `feature/backend`, `feature/ui-frontend`, `feature/design`: 각각 커밋 + 원격 푸시 완료(리뷰/PR 참고용으로 브랜치 유지).
- 프로덕션 배포: 완료(코드 기준). 환경변수 설정은 사용자 조치 필요(위 2번).

## 4. 다음 액션
- **사용자**: Vercel 환경변수 설정.
- helper-manager: 환경변수 설정 후 재배포 요청 시 즉시 진행 가능.
- 이월 사항(계속 미해결): `feature/backend`의 v1 gap(축제/찜/무장애/반려동물/숨은지역 실데이터, 지역코드 매핑) 해소, Supabase 운영 배포 확인, PPT/데모 스크립트.
