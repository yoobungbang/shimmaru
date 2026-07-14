# 작업 보고서 (helper-manager)

## 1. 완료한 작업
- 프로젝트 운영용 기본 문서 4종 생성 (`docs/`): `PROJECT_SPEC.md`, `API_SPEC.md`, `PAGE_FLOW.md`, `JUDGE_APPEAL.md`
- 각 문서는 실제 코드(README.md, shimmaru.md, `frontend/src/routes.tsx`, `api/*.ts`, `frontend/src/api/*.ts`)를 근거로 쉼마루 공모전 MVP 기준 초안 작성
- 브랜치 담당자용 보고서 틀 3종 생성 (`agent-reports/`): `design.md`, `ui-frontend.md`, `backend.md` — 공통 6항목 양식 적용
- 실제 구현 코드는 수정하지 않음 (요청 범위 준수)

## 2. 수정한 파일
- `docs/PROJECT_SPEC.md` (신규)
- `docs/API_SPEC.md` (신규)
- `docs/PAGE_FLOW.md` (신규)
- `docs/JUDGE_APPEAL.md` (신규)
- `agent-reports/design.md` (신규, 빈 양식)
- `agent-reports/ui-frontend.md` (신규, 빈 양식)
- `agent-reports/backend.md` (신규, 빈 양식)
- `agent-reports/helper-summary.md` (신규, 본 문서)

## 3. 아직 안 된 것
- `feature/design`, `feature/ui-frontend`, `feature/backend` 브랜치의 실제 작업 내용 취합 — 아직 각 브랜치를 diff/checkout해서 들여다보지 않음. 이번 세션은 "문서 틀 생성"까지만 진행.
- 각 브랜치 담당자(또는 담당 세션)가 `agent-reports/*.md`를 실제 내용으로 채워야 함.
- `docs/*.md` 안의 "미결 사항" 항목들은 각 브랜치 취합 시점에 실제 코드로 검증 필요 (아래 4번 참고).

## 4. 다른 담당자에게 필요한 것
- **feature/backend**: 실제로 별도 서버(Spring Boot 등)를 추가하는지, 아니면 Vercel Edge Function(`api/*.ts`) 확장에 그치는지 확인 필요. `docs/PROJECT_SPEC.md` §3, §8 및 `docs/API_SPEC.md` §4, §7 참고.
- **feature/ui-frontend**: 실제 내비게이션 UI(탭바/메뉴) 구성, `CourseEdit` 편집 기능 범위, `CourseJoin`(동행 초대) 동기화 방식 확인 필요. `docs/PAGE_FLOW.md` §5 참고.
- **feature/design**: 디자인 시스템/톤앤매너가 `docs/JUDGE_APPEAL.md`의 어필 포인트(데이터 신뢰성, 숨은지역 발굴 등)와 시각적으로 정합하는지 확인. 발표용 PPT/데모 스크립트 존재 여부 공유 필요.
- 3개 브랜치 모두: 작업 완료 시 `agent-reports/<본인 브랜치>.md`를 6항목 양식대로 채워서 helper-manager가 dev 병합 전 충돌 여부를 판단할 수 있도록 해줄 것.

## 5. 충돌 가능성
- 아직 각 브랜치 diff를 확인하지 않아 구체적 충돌 지점은 미상.
- 구조적으로 짐작되는 위험 지점:
  - `frontend/src/routes.tsx` — design/ui-frontend 양쪽에서 라우트나 레이아웃을 동시에 건드릴 가능성.
  - `api/*.ts` (Edge Function) — backend 브랜치가 새 프록시를 추가하면 `vercel.json` rewrites와 `frontend/src/api/*.ts` 클라이언트 쪽 계약을 함께 맞춰야 함.
  - i18next 리소스 파일 — design(카피/톤) vs ui-frontend(키 구조)가 동시에 수정하면 병합 충돌 가능성 높음.
- 다음 취합 세션에서 각 브랜치를 `dev` 기준으로 diff 떠서 실제 충돌 파일 목록을 갱신할 예정.

## 6. 다음 액션
1. `feature/design`, `feature/ui-frontend`, `feature/backend` 각 브랜치를 개별적으로 조사(diff 또는 로그 확인)해 `agent-reports/*.md` 채우기.
2. 세 브랜치의 변경 파일 목록을 비교해 실제 충돌 지점 식별.
3. `docs/API_SPEC.md`, `docs/PAGE_FLOW.md`의 "미결 사항" 항목을 브랜치 조사 결과로 갱신.
4. 충돌 위험이 낮은 것부터 순서를 정해 `dev`로 병합 제안.
