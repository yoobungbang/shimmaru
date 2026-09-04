/**
 * api/_cache.ts — 프록시 캐시 헤더 판정.
 * 여기가 깨지면 쿼터 초과 에러 본문이 24시간 엣지에 박혀서, 자정에 쿼터가 리셋돼도
 * 앱이 계속 죽는다. 1일 1000회 제한 환경에서 가장 아픈 실패 모드라 검증을 남긴다.
 */
import { describe, expect, it } from 'vitest'
import { cacheHeader } from '../../../api/_cache'

const long = 'public, s-maxage=86400, stale-while-revalidate=604800'

describe('cacheHeader', () => {
  it('TourAPI 정상 응답(resultCode 0000)은 장기 캐시', () => {
    const body = '{"response":{"header":{"resultCode":"0000","resultMsg":"OK"},"body":{}}}'
    expect(cacheHeader(200, body, 86400)).toBe(long)
  })

  it('기상청·표준데이터 정상 응답(resultCode 00)도 장기 캐시', () => {
    const body = '{"response":{"header":{"resultCode":"00","resultMsg":"NORMAL SERVICE."}}}'
    expect(cacheHeader(200, body, 86400)).toBe(long)
  })

  it('쿼터 초과는 HTTP 200 이어도 캐시하지 않는다', () => {
    // data.go.kr 은 한도 초과에도 200 을 준다. 이걸 캐시하면 리셋 후에도 계속 에러.
    const body = '{"response":{"header":{"resultCode":"22","resultMsg":"LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR"}}}'
    expect(cacheHeader(200, body, 86400)).toBe('no-store')
  })

  it('키 오류(30)·미등록 서비스도 캐시하지 않는다', () => {
    const body = '{"response":{"header":{"resultCode":"30","resultMsg":"SERVICE_KEY_IS_NOT_REGISTERED_ERROR"}}}'
    expect(cacheHeader(200, body, 86400)).toBe('no-store')
  })

  it('평문 응답(미신청 시 "Forbidden")은 캐시하지 않는다', () => {
    expect(cacheHeader(200, 'Forbidden', 86400)).toBe('no-store')
  })

  it('XML 에러 봉투도 캐시하지 않는다', () => {
    const body = '<OpenAPI_ServiceResponse><resultCode>22</resultCode></OpenAPI_ServiceResponse>'
    expect(cacheHeader(200, body, 86400)).toBe('no-store')
  })

  it('상류 5xx 는 캐시하지 않는다', () => {
    expect(cacheHeader(500, '{}', 86400)).toBe('no-store')
  })

  it('resultCode 가 없는 정상 JSON 은 캐시한다', () => {
    expect(cacheHeader(200, '{"items":[]}', 86400)).toBe(long)
  })

  it('TTL 에 맞춰 stale-while-revalidate 는 7배', () => {
    expect(cacheHeader(200, '{"items":[]}', 1800)).toBe(
      'public, s-maxage=1800, stale-while-revalidate=12600',
    )
  })
})
