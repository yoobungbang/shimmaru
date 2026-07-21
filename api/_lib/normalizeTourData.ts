import type {
  KtoTourItem,
  NormalizeResult,
  NormalizedTourPlace,
  TourCategory,
  TourLanguage,
} from './types/tour.ts'

const TITLE_EXCLUSION = /글램|glamping|풀\s*빌라|캠핑|모텔|리조트|카지노/i

function optionalNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function cleanText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const cleaned = value.replace(/<br\s*\/?\s*>/gi, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || undefined
}

function forceHttps(value: unknown): string | undefined {
  const text = cleanText(value)
  return text?.replace(/^http:\/\//i, 'https://')
}

function homepageUrl(value: unknown): string | undefined {
  const text = cleanText(value)
  if (!text) return undefined
  const href = text.match(/href=["']([^"']+)/i)?.[1]
  return forceHttps(href ?? text)
}

export function inferTourCategory(item: KtoTourItem): TourCategory {
  const cat3 = String(item.cat3 ?? '')
  const title = String(item.title ?? '')
  const contentTypeId = Number(item.contenttypeid ?? 0)

  if (contentTypeId === 15) return 'festival'
  if (contentTypeId === 39) return 'restaurant'
  if (cat3 === 'B02011600' || /한옥|고택|종택/.test(title)) return 'hanok'
  if (cat3 === 'A02010800') return /템플스테이/i.test(title) ? 'templestay' : 'temple'
  if (/서원/.test(title)) return 'seowon'
  if (cat3 === 'A02030100' || cat3 === 'A02030200' || /전통.*체험|공방/.test(title)) return 'experience'
  if (cat3 === 'A04010100' || cat3 === 'A04010200' || /시장|장터/.test(title)) return 'market'
  if (contentTypeId === 28 || /둘레길|옛길|트레일|탐방로/.test(title)) return 'trail'
  return 'attraction'
}

export function normalizeTourItem(
  item: KtoTourItem,
  lang: TourLanguage = 'ko',
): NormalizedTourPlace | null {
  const id = String(item.contentid ?? '').trim()
  const name = cleanText(item.title)
  const lat = optionalNumber(item.mapy)
  const lng = optionalNumber(item.mapx)
  if (!id || !name || lat === undefined || lng === undefined) return null
  if (lat === 0 || lng === 0 || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null

  const address = [cleanText(item.addr1), cleanText(item.addr2)].filter(Boolean).join(' ')
  return {
    id,
    contentTypeId: optionalNumber(item.contenttypeid) ?? 0,
    category: inferTourCategory(item),
    name,
    address,
    areaCode: optionalNumber(item.areacode),
    sigunguCode: optionalNumber(item.sigungucode),
    position: { lat, lng },
    thumbnail: forceHttps(item.firstimage ?? item.firstimage2),
    tel: cleanText(item.tel),
    homepage: homepageUrl(item.homepage),
    overview: cleanText(item.overview),
    openHours: cleanText(item.usetime),
    eventStartDate: cleanText(item.eventstartdate),
    eventEndDate: cleanText(item.eventenddate),
    lang,
    source: 'kto',
  }
}

export function normalizeTourData(
  input: KtoTourItem | KtoTourItem[] | null | undefined,
  lang: TourLanguage = 'ko',
): NormalizeResult {
  const rows = !input ? [] : Array.isArray(input) ? input : [input]
  const items: NormalizedTourPlace[] = []
  const issues: NormalizeResult['issues'] = []
  const seen = new Set<string>()

  rows.forEach((row, index) => {
    const contentId = String(row.contentid ?? '').trim() || undefined
    const normalized = normalizeTourItem(row, lang)
    if (!normalized) {
      const reason = !contentId
        ? 'missing-id'
        : !cleanText(row.title)
          ? 'missing-title'
          : 'invalid-coordinate'
      issues.push({ index, contentId, reason })
      return
    }
    if (TITLE_EXCLUSION.test(normalized.name) || seen.has(normalized.id)) return
    seen.add(normalized.id)
    items.push(normalized)
  })

  return { items, issues }
}
