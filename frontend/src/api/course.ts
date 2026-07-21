import type { CategoryId, Companion, Course, CourseItem, LatLng, Place } from '@/types/domain'
import { estimateMinutes } from '@/lib/geo'

/**
 * 서버 코스 생성(`POST /api/course`, 2026-07-14 서버 이전 결정) 클라이언트.
 *
 * v1 범위: 단일 시군구 + 축제/찜/무장애/반려동물 미사용인 "단순 케이스"에서만 사용.
 * 서버가 아직 지원하지 않는 기능(축제 연계·찜 가중치·다중 프로필·무장애/반려동물/숨은지역
 * 실데이터)이 필요한 경우 호출하지 않고 기존 클라이언트 엔진(`courseEngine.ts`)을 그대로 쓴다.
 * 실패 시(네트워크·5xx·형식 오류) 예외를 던지므로 호출부가 로컬 엔진으로 폴백한다.
 */

const GB_AREA_CODE = 35

interface ServerNormalizedPlace {
  id: string
  contentTypeId: number
  category: CategoryId
  name: string
  address: string
  areaCode?: number
  sigunguCode?: number
  position: LatLng
  thumbnail?: string
  tel?: string
  homepage?: string
  overview?: string
  openHours?: string
  eventStartDate?: string
  eventEndDate?: string
  lang: 'ko' | 'en' | 'ja' | 'zh'
}

interface ServerCourseStop {
  place: ServerNormalizedPlace
  order: number
  score: number
  distanceFromPreviousKm: number
}

interface ServerCourseDay {
  day: number
  stops: ServerCourseStop[]
  distanceKm: number
}

interface ServerGeneratedCourse {
  days: ServerCourseDay[]
  totalDistanceKm: number
  meta: {
    candidateCount: number
    selectedCount: number
    rainAdjusted: boolean
    hiddenAreaAdjusted: boolean
  }
}

type ServerCourseResponse =
  | { status: 'ok'; course: ServerGeneratedCourse; issues: unknown[] }
  | { status: 'not-subscribed'; message: string }

export interface RequestServerCourseOptions {
  sigunguCode: number
  origin: LatLng
  durationDays: number
  preferredCategories?: CategoryId[]
  companions?: Companion[]
  rainProbability?: number
  hiddenAreaWeight?: number
  maxStopsPerDay?: number
}

function toServerPlace(p: ServerNormalizedPlace): Place {
  return {
    id: p.id,
    contentTypeId: p.contentTypeId,
    category: p.category,
    name: p.name,
    address: p.address,
    sigunguCode: p.sigunguCode,
    thumbnail: p.thumbnail,
    position: p.position,
    overview: p.overview,
    tel: p.tel,
    homepage: p.homepage,
    openHours: p.openHours,
    lang: p.lang,
  }
}

/**
 * `POST /api/course` 호출 후 프론트 `Course` 도형으로 매핑한다.
 * 일자별(`days[]`)로 온 결과를 순서 보존한 채 평탄화(`items[]`)한다 — 프론트 Course 는
 * 일자 그룹이 아닌 단일 순서 리스트를 쓴다(CourseItem.order 로 1-based 순번만 유지).
 *
 * 서버가 `not-subscribed`(TourAPI 미신청) 또는 네트워크/5xx 오류를 반환하면 예외를 던진다 —
 * 호출부가 기존 클라이언트 엔진으로 폴백하도록.
 */
export async function requestServerCourse(
  opts: RequestServerCourseOptions,
  meta: { title: string; baseSigungus: number[]; duration: Course['duration']; dateRange?: Course['dateRange']; lang: Course['lang'] },
): Promise<Course> {
  const res = await fetch('/api/course', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      areaCode: GB_AREA_CODE,
      sigunguCode: opts.sigunguCode,
      origin: opts.origin,
      durationDays: opts.durationDays,
      preferredCategories: opts.preferredCategories,
      companions: opts.companions,
      rainProbability: opts.rainProbability,
      hiddenAreaWeight: opts.hiddenAreaWeight,
      maxStopsPerDay: opts.maxStopsPerDay,
    }),
    signal: AbortSignal.timeout(12_000),
  })

  if (!res.ok) throw new Error(`서버 코스 생성 실패: HTTP ${res.status}`)
  const data = (await res.json()) as ServerCourseResponse
  if (data.status === 'not-subscribed') throw new Error(`서버 코스 생성 미신청: ${data.message}`)

  let order = 0
  const items: CourseItem[] = data.course.days.flatMap((day) =>
    day.stops.map((stop): CourseItem => {
      order += 1
      return {
        place: toServerPlace(stop.place),
        order,
        distanceFromPrevKm: stop.distanceFromPreviousKm,
      }
    }),
  )

  return {
    id: `course-${Date.now()}`,
    title: meta.title,
    baseSigungus: meta.baseSigungus,
    baseCenter: opts.origin,
    duration: meta.duration,
    dateRange: meta.dateRange,
    hiddenMode: data.course.meta.hiddenAreaAdjusted,
    items,
    totalDistanceKm: data.course.totalDistanceKm,
    estimatedTravelMinutes: estimateMinutes(data.course.totalDistanceKm),
    createdAt: new Date().toISOString(),
    lang: meta.lang,
  }
}
