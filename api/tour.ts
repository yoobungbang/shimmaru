/**
 * Vercel Serverless Function — 한국관광공사 TourAPI 프록시.
 *
 * 호출 흐름:
 *   클라이언트 /api/tour/KorService2/areaBasedList2?...
 *     → vercel.json rewrites → /api/tour?path=KorService2/areaBasedList2&...
 *     → 이 함수가 path 를 꺼내 apis.data.go.kr/B551011/<path>?... 로 포워딩
 *     → TOUR_API_KEY 환경변수를 serviceKey 로 자동 주입
 *
 * 환경변수 (Vercel Dashboard → Settings → Environment Variables):
 *   TOUR_API_KEY = (공공데이터포털 일반 인증키 Decoding)
 */
export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.searchParams.get('path') ?? ''
  url.searchParams.delete('path')

  // path 는 클라이언트가 보내는 값이다. new URL(...) 이 `..` 를 정규화하므로
  // path=../1360000/Foo 같은 값이면 B551011(관광공사) 밖의 다른 기관 API 로 나가면서
  // 아래에서 우리 serviceKey 까지 주입된다 — 키 도용. 서비스 경로 형태만 허용한다.
  if (!/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(path)) {
    return new Response(JSON.stringify({ error: 'invalid path' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const target = new URL(`https://apis.data.go.kr/B551011/${path}`)
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v))

  const key = process.env.TOUR_API_KEY
  if (key) target.searchParams.set('serviceKey', key)

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'upstream failed', message: String(err) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
