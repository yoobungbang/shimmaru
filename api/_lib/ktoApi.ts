import { normalizeTourData } from './normalizeTourData.ts'
import type {
  KtoResponse,
  KtoTourItem,
  NormalizeResult,
  TourLanguage,
} from './types/tour.ts'

const KTO_BASE_URL = 'https://apis.data.go.kr/B551011/'
const ALLOWED_SERVICES = new Set([
  'KorService2', 'EngService2', 'JpnService2', 'ChsService2',
  'KorWithService2', 'KorPetTourService', 'KorPetTourService2',
  'TarRlteService1', 'DataLabService',
])

export interface KtoRequestOptions {
  serviceKey: string
  path: string
  params?: Record<string, string | number | boolean | null | undefined>
  timeoutMs?: number
  fetcher?: typeof fetch
}

export class KtoApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'KtoApiError'
  }
}

function validatedPath(path: string): string {
  const cleaned = path.replace(/^\/+/, '')
  const [service, operation, ...rest] = cleaned.split('/')
  if (!service || !operation || rest.length > 0 || !ALLOWED_SERVICES.has(service)) {
    throw new KtoApiError(`허용되지 않은 TourAPI 경로: ${path}`, 'INVALID_PATH')
  }
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(operation)) {
    throw new KtoApiError(`잘못된 TourAPI 작업명: ${operation}`, 'INVALID_PATH')
  }
  return `${service}/${operation}`
}

export function buildKtoUrl(options: KtoRequestOptions): URL {
  if (!options.serviceKey.trim()) throw new KtoApiError('TOUR_API_KEY가 필요합니다.', 'MISSING_KEY')
  const target = new URL(validatedPath(options.path), KTO_BASE_URL)
  const defaults: Record<string, string> = {
    MobileOS: 'ETC', MobileApp: 'Shimmaru', _type: 'json', numOfRows: '30', pageNo: '1',
  }
  for (const [key, value] of Object.entries({ ...defaults, ...options.params })) {
    if (key === 'serviceKey' || value === undefined || value === null || value === '') continue
    target.searchParams.set(key, String(value))
  }
  target.searchParams.set('serviceKey', options.serviceKey)
  return target
}

export function extractKtoItems<T>(payload: KtoResponse<T>): T[] {
  const value = payload.response?.body?.items
  if (!value || typeof value === 'string' || !value.item) return []
  return Array.isArray(value.item) ? value.item : [value.item]
}

export async function fetchKto<T = KtoTourItem>(options: KtoRequestOptions): Promise<KtoResponse<T>> {
  const fetcher = options.fetcher ?? fetch
  const timeoutMs = Math.max(1, options.timeoutMs ?? 8_000)
  let response: Response
  try {
    response = await fetcher(buildKtoUrl(options), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw new KtoApiError(`TourAPI 요청 실패: ${String(error)}`, 'NETWORK_ERROR')
  }

  const text = await response.text()
  if (!response.ok) throw new KtoApiError(text || response.statusText, 'HTTP_ERROR', response.status)
  if (/forbidden|unexpected errors/i.test(text)) {
    throw new KtoApiError(text.slice(0, 200), 'NOT_SUBSCRIBED', response.status)
  }

  let payload: KtoResponse<T>
  try {
    payload = JSON.parse(text) as KtoResponse<T>
  } catch {
    throw new KtoApiError('TourAPI가 JSON이 아닌 응답을 반환했습니다.', 'INVALID_RESPONSE', response.status)
  }
  const header = payload.response?.header
  if (header?.resultCode && header.resultCode !== '0000') {
    throw new KtoApiError(header.resultMsg ?? 'TourAPI 오류', header.resultCode, response.status)
  }
  return payload
}

export async function fetchNormalizedTourPlaces(
  options: KtoRequestOptions,
  lang: TourLanguage = 'ko',
): Promise<NormalizeResult> {
  const payload = await fetchKto<KtoTourItem>(options)
  return normalizeTourData(extractKtoItems(payload), lang)
}
