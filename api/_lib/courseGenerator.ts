import type {
  CourseCandidate,
  CourseCompanion,
  CourseDay,
  GeneratedCourse,
  GenerateCourseOptions,
} from './types/course.ts'
import type { Coordinates, TourCategory } from './types/tour.ts'

const EARTH_RADIUS_KM = 6371
const BASE_CATEGORY_WEIGHT: Record<TourCategory, number> = {
  hanok: 1.25, templestay: 1.25, seowon: 1.15, temple: 1.15, experience: 1.2,
  market: 1.05, restaurant: 1, trail: 1, attraction: 1, festival: 1.1,
}
const COMPANION_CATEGORY: Partial<Record<CourseCompanion, Partial<Record<TourCategory, number>>>> = {
  kids: { experience: 1.35, trail: 0.8, seowon: 0.85 },
  parents: { hanok: 1.2, temple: 1.15, trail: 0.8 },
  couple: { hanok: 1.2, trail: 1.1 },
  friends: { experience: 1.15, market: 1.15 },
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function quietBonuses(candidates: CourseCandidate[]): Map<string, number> {
  const values = candidates
    .map((p) => p.visitorCount)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0)
  if (values.length < 2) return new Map()
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return new Map(candidates.map((p) => [p.id, 0.5]))
  return new Map(candidates.map((p) => [p.id, p.visitorCount === undefined ? 0 : (max - p.visitorCount) / (max - min)]))
}

function scoreCandidate(
  place: CourseCandidate,
  options: GenerateCourseOptions,
  quiet: Map<string, number>,
): number {
  let score = BASE_CATEGORY_WEIGHT[place.category] * (options.categoryWeights?.[place.category] ?? 1)
  if (options.preferredCategories?.includes(place.category)) score *= 1.65
  for (const companion of options.companions ?? []) {
    score *= COMPANION_CATEGORY[companion]?.[place.category] ?? 1
  }
  if (options.companions?.includes('pet')) score *= place.petFriendly ? 1.5 : 0.75
  if (options.companions?.includes('accessible')) score *= place.wheelchairAccessible ? 1.5 : 0.7
  if ((options.rainProbability ?? 0) >= 0.6) score *= place.indoor ? 1.35 : place.category === 'trail' ? 0.55 : 0.85
  score *= 0.85 + clamp(place.popularity ?? 0.5, 0, 1) * 0.3
  score *= 1 + (quiet.get(place.id) ?? 0) * clamp(options.hiddenAreaWeight ?? 0, 0, 2)
  score *= 1 / (1 + distanceKm(options.origin, place.position) / 120)
  return score
}

function routeLength(route: CourseCandidate[], origin: Coordinates): number {
  let total = 0
  let previous = origin
  for (const place of route) {
    total += distanceKm(previous, place.position)
    previous = place.position
  }
  return total
}

function nearestNeighbor(places: CourseCandidate[], origin: Coordinates): CourseCandidate[] {
  const remaining = [...places]
  const ordered: CourseCandidate[] = []
  let current = origin
  while (remaining.length) {
    let best = 0
    for (let i = 1; i < remaining.length; i += 1) {
      if (distanceKm(current, remaining[i].position) < distanceKm(current, remaining[best].position)) best = i
    }
    const [next] = remaining.splice(best, 1)
    ordered.push(next)
    current = next.position
  }
  return ordered
}

/** 열린 경로(origin 고정)에 대한 결정적 2-opt 개선. */
export function optimizeRoute(places: CourseCandidate[], origin: Coordinates): CourseCandidate[] {
  let route = nearestNeighbor(places, origin)
  let improved = true
  while (improved) {
    improved = false
    const before = routeLength(route, origin)
    for (let i = 0; i < route.length - 1 && !improved; i += 1) {
      for (let j = i + 1; j < route.length; j += 1) {
        const candidate = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)]
        if (routeLength(candidate, origin) + 1e-6 < before) {
          route = candidate
          improved = true
          break
        }
      }
    }
  }
  return route
}

function buildDay(day: number, places: CourseCandidate[], origin: Coordinates, scores: Map<string, number>): CourseDay {
  let previous = origin
  let distance = 0
  const stops = places.map((place, index) => {
    const leg = distanceKm(previous, place.position)
    previous = place.position
    distance += leg
    return { place, order: index + 1, score: scores.get(place.id) ?? 0, distanceFromPreviousKm: Math.round(leg * 10) / 10 }
  })
  return { day, stops, distanceKm: Math.round(distance * 10) / 10 }
}

export function generateCourse(options: GenerateCourseOptions): GeneratedCourse {
  const days = clamp(Math.floor(options.durationDays || 1), 1, 14)
  const perDay = clamp(Math.floor(options.maxStopsPerDay ?? 4), 1, 8)
  const unique = [...new Map(options.candidates.map((p) => [p.id, p])).values()]
    .filter((p) => Number.isFinite(p.position.lat) && Number.isFinite(p.position.lng))
  const quiet = quietBonuses(unique)
  const scores = new Map(unique.map((p) => [p.id, scoreCandidate(p, options, quiet)]))
  const categoryCount = new Map<TourCategory, number>()
  const pool = [...unique]
  const selected: CourseCandidate[] = []
  while (pool.length && selected.length < days * perDay) {
    // 같은 카테고리가 반복되면 점진 감점하되 후보가 부족할 때는 끝까지 채운다.
    pool.sort((a, b) => {
      const adjusted = (place: CourseCandidate) =>
        (scores.get(place.id) ?? 0) / (1 + (categoryCount.get(place.category) ?? 0) * 0.35)
      return adjusted(b) - adjusted(a) || a.id.localeCompare(b.id)
    })
    const next = pool.shift()
    if (!next) break
    selected.push(next)
    categoryCount.set(next.category, (categoryCount.get(next.category) ?? 0) + 1)
  }

  const routed = optimizeRoute(selected, options.origin)
  const courseDays: CourseDay[] = []
  for (let day = 0; day < days; day += 1) {
    const slice = routed.slice(day * perDay, (day + 1) * perDay)
    if (slice.length) courseDays.push(buildDay(day + 1, optimizeRoute(slice, options.origin), options.origin, scores))
  }
  const totalDistanceKm = Math.round(courseDays.reduce((sum, item) => sum + item.distanceKm, 0) * 10) / 10
  return {
    days: courseDays,
    totalDistanceKm,
    meta: {
      candidateCount: unique.length,
      selectedCount: selected.length,
      rainAdjusted: (options.rainProbability ?? 0) >= 0.6,
      hiddenAreaAdjusted: (options.hiddenAreaWeight ?? 0) > 0 && quiet.size > 0,
    },
  }
}
