import type { Course, CourseItem, Place } from '@/types/domain'
import { useCourses } from '@/stores/courses'
import { useCollab } from '@/stores/collab'
import { reoptimizeCourse, DURATION_PROFILE } from '@/lib/courseEngine'

/**
 * 탐색·장소상세 등 어디서든 "현재 코스에 장소 담기".
 * - 현재 코스가 있으면 거기에 추가(중복이면 무시) → 재최적화(순서 재배치) + 저장 + 협업 반영(방이면 publish).
 * - 현재 코스가 없으면 이 장소로 새 코스를 시작한다.
 * 동선 직접 편집/협업을 강화하는 진입점(찜 목록에만 의존하던 한계 해소).
 */
export type AddToCourseResult = 'added' | 'added-far' | 'duplicate' | 'created'

export function addPlaceToCourse(place: Place): AddToCourseResult {
  const courses = useCourses.getState()
  const collab = useCollab.getState()
  const cur = courses.current

  if (cur) {
    if (cur.items.some((it) => it.place.id === place.id)) return 'duplicate'
    const item: CourseItem = {
      place,
      order: cur.items.length + 1,
      distanceFromPrevKm: 0,
      addedBy: collab.me.id,
    }
    // recomputeCourse 는 순서를 그대로 두고 거리만 갱신해 새로 담은 장소가 무조건 맨 뒤에 붙는다 —
    // 거점에서 멀리 떨어진 곳이면 그 구간이 legLimitKm 을 훌쩍 넘는 "장거리 점프"가 생긴다
    // (FR: 코스 엔진 100km급 점프 차단과 동일 문제). reoptimizeCourse 로 NN+2-opt 재배치해
    // 가장 합리적인 위치에 끼워 넣는다.
    const updated = reoptimizeCourse({ ...cur, items: [...cur.items, item] })
    courses.setCurrent(updated)
    courses.save(updated)
    collab.publish(updated) // 협업 방이면 실시간 반영, 아니면 no-op

    const added = updated.items.find((it) => it.place.id === place.id)
    const legLimitKm = DURATION_PROFILE[updated.duration].legLimitKm
    return added && added.distanceFromPrevKm > legLimitKm ? 'added-far' : 'added'
  }

  // 현재 코스 없음 — 이 장소로 새 코스 시작
  const course: Course = {
    id: `course-${Date.now()}`,
    title: place.name,
    baseSigungus: place.sigunguCode ? [place.sigunguCode] : [],
    duration: '1n2d',
    hiddenMode: false,
    items: [{ place, order: 1, distanceFromPrevKm: 0, addedBy: collab.me.id }],
    totalDistanceKm: 0,
    estimatedTravelMinutes: 0,
    createdAt: new Date().toISOString(),
    lang: place.lang ?? 'ko',
  }
  courses.setCurrent(course)
  courses.save(course)
  return 'created'
}
