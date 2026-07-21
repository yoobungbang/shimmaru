/**
 * Vercel Edge Function — 코스 자동 생성 (서버 이전, 2026-07-14 결정).
 *
 * 호출 흐름:
 *   POST /api/course { areaCode, sigunguCode?, origin, durationDays, ... }
 *     → KorService2/areaBasedList2 로 지역 후보 조회 (TOUR_API_KEY 서버 주입)
 *     → 정규화(api/_lib/normalizeTourData.ts) → 추천/동선 최적화(api/_lib/courseGenerator.ts)
 *
 * v1 범위: 지역 후보 자동 조회 + 가중치 추천 + 2-opt 동선.
 * 아직 프론트 courseEngine.ts 와 필드 1:1 매핑, 축제 연계, 찜 가중치는 포함하지 않음
 * (docs/API_SPEC.md §4.3 미결 참고 — 프론트 전환 전 스키마 확정 필요).
 */
import { fetchNormalizedTourPlaces, KtoApiError } from './_lib/ktoApi'
import { generateCourse } from './_lib/courseGenerator'
import type { CourseCandidate, CourseCompanion, GenerateCourseOptions } from './_lib/types/course'
import type { Coordinates, TourCategory } from './_lib/types/tour'

export const config = { runtime: 'edge' }

interface CourseRequestBody {
  areaCode: number
  sigunguCode?: number
  origin: Coordinates
  durationDays: number
  preferredCategories?: TourCategory[]
  companions?: CourseCompanion[]
  rainProbability?: number
  hiddenAreaWeight?: number
  maxStopsPerDay?: number
  numOfRows?: number
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function isValidBody(value: unknown): value is CourseRequestBody {
  if (!value || typeof value !== 'object') return false
  const body = value as Partial<CourseRequestBody>
  return (
    typeof body.areaCode === 'number'
    && !!body.origin
    && typeof body.origin.lat === 'number'
    && typeof body.origin.lng === 'number'
    && typeof body.durationDays === 'number'
    && body.durationDays > 0
  )
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'method-not-allowed' }, 405)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid-json' }, 400)
  }

  if (!isValidBody(body)) {
    return json(
      { error: 'missing-required-fields', required: ['areaCode', 'origin.lat', 'origin.lng', 'durationDays'] },
      400,
    )
  }

  const key = process.env.TOUR_API_KEY
  if (!key) {
    return json({ error: 'server-misconfigured', message: 'TOUR_API_KEY not set' }, 500)
  }

  let normalized: Awaited<ReturnType<typeof fetchNormalizedTourPlaces>>
  try {
    normalized = await fetchNormalizedTourPlaces({
      serviceKey: key,
      path: 'KorService2/areaBasedList2',
      params: {
        areaCode: body.areaCode,
        sigunguCode: body.sigunguCode,
        numOfRows: body.numOfRows ?? 100,
      },
    })
  } catch (error) {
    if (error instanceof KtoApiError && error.code === 'NOT_SUBSCRIBED') {
      return json({ status: 'not-subscribed', message: error.message })
    }
    return json({ error: 'upstream-failed', message: String(error) }, 502)
  }

  const candidates: CourseCandidate[] = normalized.items
  const options: GenerateCourseOptions = {
    candidates,
    origin: body.origin,
    durationDays: body.durationDays,
    preferredCategories: body.preferredCategories,
    companions: body.companions,
    rainProbability: body.rainProbability,
    hiddenAreaWeight: body.hiddenAreaWeight,
    maxStopsPerDay: body.maxStopsPerDay,
  }

  const course = generateCourse(options)
  return json({ status: 'ok', course, issues: normalized.issues })
}
