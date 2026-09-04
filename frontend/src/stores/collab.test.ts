/**
 * 협업 publish 의 버전 게이트 검증 — 동시 편집 시 상대 편집이 사라지지 않아야 한다.
 * 여기가 깨지면 실시간 협업이 조용히 데이터를 잃는다.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Course } from '@/types/domain'

// ── 가짜 서버: shared_courses 한 행. version 이 일치할 때만 갱신(= Postgres 조건부 UPDATE) ──
const server = { code: 'GB-ABCDE', course: null as unknown, version: 1 }

function makeQuery() {
  const conds: Record<string, unknown> = {}
  let patch: Record<string, unknown> = {}
  const q = {
    update(p: Record<string, unknown>) {
      patch = p
      return q
    },
    eq(col: string, val: unknown) {
      conds[col] = val
      return q
    },
    select() {
      const matches = server.code === conds.code && server.version === conds.version
      if (!matches) return Promise.resolve({ data: [], error: null }) // 0행 = 충돌
      Object.assign(server, patch)
      return Promise.resolve({ data: [{ version: server.version }], error: null })
    },
  }
  return q
}

const fakeSb = { from: () => makeQuery() }

vi.mock('@/lib/supabase', () => ({
  isCollabConfigured: () => true,
  getSupabase: async () => fakeSb,
  peekSupabase: () => null,
}))

const currentCourse = { id: 'c1', collabCode: 'GB-ABCDE', items: [] } as unknown as Course
vi.mock('@/stores/courses', () => ({
  useCourses: {
    getState: () => ({
      current: currentCourse,
      setCurrent: () => {},
      save: () => {},
    }),
  },
}))

const { useCollab } = await import('@/stores/collab')

const course = { id: 'c1', collabCode: 'GB-ABCDE', items: [] } as unknown as Course
const settle = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('collab publish 버전 게이트', () => {
  beforeEach(() => {
    server.version = 1
    server.course = null
    useCollab.setState({ code: 'GB-ABCDE', version: 1, status: 'live' })
  })

  it('서버 버전이 내가 아는 버전과 같으면 쓰고 버전을 올린다', async () => {
    useCollab.getState().publish(course)
    await settle(500)
    expect(server.version).toBe(2)
    expect(useCollab.getState().version).toBe(2)
  })

  it('그 사이 상대가 먼저 썼으면(내 버전이 stale) 덮어쓰지 않는다', async () => {
    server.version = 5 // 상대가 앞서감
    server.course = { marker: '상대편집' }
    useCollab.getState().publish(course) // 내 로컬은 아직 version 1
    await settle(1600) // 재시도 2회까지 모두 소진시킨다(다음 테스트로 새지 않도록)
    expect(server.course).toEqual({ marker: '상대편집' }) // 상대 편집 보존
    expect(server.version).toBe(5) // 서버는 건드려지지 않음
    expect(useCollab.getState().version).toBe(1) // 성공 아님 — 버전 안 올림
  })

  it('충돌 후 realtime 이 버전을 따라잡으면 재시도가 병합본을 반영한다', async () => {
    server.version = 5
    useCollab.getState().publish(course)
    await settle(500) // 1차 시도 실패(내 버전 1 vs 서버 5)
    useCollab.setState({ version: 5 }) // realtime 이 원격 버전 전달
    await settle(700) // 재시도 창
    expect(server.version).toBe(6)
    expect(useCollab.getState().version).toBe(6)
  })
})
