/**
 * 한적지수(Quiet Index) — '숨은 경북 코스'의 데이터 근거.
 *
 * 방문자(또는 인구밀도)가 적을수록 한적하다고 보고 0~100 점수를 매긴다.
 * 로그 정규화로 극단값(경주·안동 같은 초대형 방문지) 쏠림을 완화한다.
 *
 * 데이터 출처: 한국관광공사 DataLab '외부 방문객(외지인+외국인)' 통계.
 *   라이브 데이터가 없으면(미구독/지연/에러) 통계청 인구밀도를 대리값으로 폴백해
 *   항상 렌더된다. (Insights 방문자 지도와 동일한 폴백 정책)
 */
import type { RegionVisit } from '@/api/bigdata'
import { SIGUNGUS } from '@/constants/sigungu'

export interface QuietRegion {
  sigunguCode: number
  /** 외부 방문객 수(라이브) 또는 인구밀도(폴백) — 낮을수록 한적 */
  metric: number
  /** 한적지수 0~100 (높을수록 한적) */
  quietScore: number
  /** 1 = 가장 한적 */
  rank: number
}

function scoreByMetric(rows: { sigunguCode: number; metric: number }[]): QuietRegion[] {
  if (rows.length === 0) return []
  const logs = rows.map((r) => Math.log(Math.max(1, r.metric)))
  const min = Math.min(...logs)
  const max = Math.max(...logs)
  const span = max - min || 1
  return rows
    .map((r, i) => {
      const norm = (logs[i] - min) / span // 0(적음) ~ 1(많음)
      return { sigunguCode: r.sigunguCode, metric: r.metric, quietScore: Math.round((1 - norm) * 100) }
    })
    .sort((a, b) => b.quietScore - a.quietScore)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

/** 라이브 DataLab 방문자 데이터로 한적지수 산출. */
export function computeQuietRegions(visits: RegionVisit[]): QuietRegion[] {
  return scoreByMetric(visits.map((v) => ({ sigunguCode: v.sigunguCode, metric: v.visitors })))
}

/** 폴백 — 통계청 인구밀도를 방문 신호 대리값으로. 라이브가 오기 전에도 항상 렌더. */
export function staticQuietRegions(): QuietRegion[] {
  return scoreByMetric(SIGUNGUS.map((sg) => ({ sigunguCode: sg.code, metric: sg.populationDensity })))
}
