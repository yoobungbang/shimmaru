/**
 * data.go.kr 계열 프록시 공용 — 응답 캐시 헤더 결정.
 *
 * 왜 필요한가:
 *   개발계정 쿼터가 1일 1000회다. 상류 호출 수가 곧 서비스 수용량이라,
 *   Vercel 엣지 캐시 TTL 이 "동시 접속 N명 → 상류 1회" 배수를 결정한다.
 *   (클라이언트 IndexedDB 캐시는 브라우저별이라 방문자가 늘면 배수가 안 나온다.)
 *
 * 왜 그냥 TTL 만 올리면 안 되는가:
 *   이 API 들은 쿼터 초과·미신청·키 오류에도 HTTP 200 에 에러 본문을 실어 보낸다
 *   (response.header.resultCode 가 '0000' 이 아님). 그 응답을 장기 캐시하면
 *   자정에 쿼터가 리셋돼도 엣지가 계속 에러를 뱉는다 — 캐시 포이즈닝.
 *   그래서 "성공으로 보이는 본문"만 장기 캐시하고 에러는 캐시하지 않는다.
 *
 * 파일명 앞의 _ 는 Vercel 이 이 파일을 라우트로 노출하지 않게 한다.
 */

/** data.go.kr 성공 코드. 서비스에 따라 '0000' 또는 '00'. */
const SUCCESS_CODES = new Set(['0000', '00'])

export function cacheHeader(status: number, body: string, maxAgeSec: number): string {
  // 비-200, 또는 JSON 이 아닌 본문(평문 "Forbidden" 등 미신청 응답) — 캐시 금지.
  if (status !== 200 || !body.trimStart().startsWith('{')) return 'no-store'

  // 200 + JSON 이어도 헤더에 에러코드가 실려 올 수 있다. 성공만 통과시킨다.
  // resultCode 가 아예 없는 응답 형태도 있어(일부 표준데이터), 그건 에러로 보지 않는다.
  const m = body.match(/resultCode"?\s*[:>]\s*"?(\d{2,4})/)
  if (m && !SUCCESS_CODES.has(m[1])) return 'no-store'

  return `public, s-maxage=${maxAgeSec}, stale-while-revalidate=${maxAgeSec * 7}`
}
