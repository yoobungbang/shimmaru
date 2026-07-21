export type TourLanguage = 'ko' | 'en' | 'ja' | 'zh'

export type TourCategory =
  | 'hanok'
  | 'templestay'
  | 'seowon'
  | 'temple'
  | 'experience'
  | 'market'
  | 'restaurant'
  | 'trail'
  | 'attraction'
  | 'festival'

export interface Coordinates {
  lat: number
  lng: number
}

/** TourAPI area/search 응답에서 사용하는 공통 필드. */
export interface KtoTourItem {
  contentid?: string | number
  contenttypeid?: string | number
  title?: string
  addr1?: string
  addr2?: string
  firstimage?: string
  firstimage2?: string
  mapx?: string | number
  mapy?: string | number
  areacode?: string | number
  sigungucode?: string | number
  cat1?: string
  cat2?: string
  cat3?: string
  tel?: string
  homepage?: string
  overview?: string
  eventstartdate?: string
  eventenddate?: string
  usetime?: string
  [key: string]: unknown
}

export interface KtoResponse<T = KtoTourItem> {
  response?: {
    header?: { resultCode?: string; resultMsg?: string }
    body?: {
      items?: { item?: T | T[] } | string
      numOfRows?: number
      pageNo?: number
      totalCount?: number
    }
  }
}

/** 프런트 Place와 필드 의미를 맞춘 정규화 결과. */
export interface NormalizedTourPlace {
  id: string
  contentTypeId: number
  category: TourCategory
  name: string
  address: string
  areaCode?: number
  sigunguCode?: number
  position: Coordinates
  thumbnail?: string
  tel?: string
  homepage?: string
  overview?: string
  openHours?: string
  eventStartDate?: string
  eventEndDate?: string
  lang: TourLanguage
  source: 'kto'
}

export interface NormalizeIssue {
  index: number
  contentId?: string
  reason: 'missing-id' | 'missing-title' | 'invalid-coordinate'
}

export interface NormalizeResult {
  items: NormalizedTourPlace[]
  issues: NormalizeIssue[]
}
