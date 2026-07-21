import type { Coordinates, NormalizedTourPlace, TourCategory } from './tour.ts'

export type CourseCompanion = 'solo' | 'friends' | 'couple' | 'kids' | 'parents' | 'pet' | 'accessible'

export interface CourseCandidate extends NormalizedTourPlace {
  /** DataLab 방문자 수. 값이 작을수록 숨은지역 가산점이 커진다. */
  visitorCount?: number
  /** 0~1 품질/인지도 지표. 없으면 중립값을 사용한다. */
  popularity?: number
  indoor?: boolean
  petFriendly?: boolean
  wheelchairAccessible?: boolean
}

export interface GenerateCourseOptions {
  candidates: CourseCandidate[]
  origin: Coordinates
  durationDays: number
  preferredCategories?: TourCategory[]
  companions?: CourseCompanion[]
  /** 0~1. 0.6 이상이면 실내 후보를 우대한다. */
  rainProbability?: number
  /** 0~2. 데이터랩 기반 한적함 가중치. */
  hiddenAreaWeight?: number
  maxStopsPerDay?: number
  categoryWeights?: Partial<Record<TourCategory, number>>
}

export interface CourseStop {
  place: CourseCandidate
  order: number
  score: number
  distanceFromPreviousKm: number
}

export interface CourseDay {
  day: number
  stops: CourseStop[]
  distanceKm: number
}

export interface GeneratedCourse {
  days: CourseDay[]
  totalDistanceKm: number
  meta: {
    candidateCount: number
    selectedCount: number
    rainAdjusted: boolean
    hiddenAreaAdjusted: boolean
  }
}
