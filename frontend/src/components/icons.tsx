import type { SVGProps } from 'react'

/**
 * 내비게이션/유틸 아이콘 — 24px 그리드, 1.75px 스트로크, currentColor.
 *
 * 유니코드 글리프(○ ◇ ✦ ♡ ✎ ⚙)는 기기 폰트에 따라 컬러 이모지로 바뀌거나
 * 굵기·광학 크기가 제각각으로 렌더돼 완성도를 깎는다. 인라인 SVG 로 통일해
 * 어느 플랫폼에서든 같은 선 굵기·같은 크기로 그려지게 한다.
 * 색은 currentColor — 활성/비활성 상태는 부모의 text 색을 그대로 따른다.
 */

type IconProps = SVGProps<SVGSVGElement>

function Svg(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  )
}

/** 홈 — 지붕 + 몸체 */
export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 11.2 12 4.6l8 6.6" />
      <path d="M6.4 10.4V19h11.2v-8.6" />
    </Svg>
  )
}

/** 탐색 — 나침반 */
export function ExploreIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M14.9 9.1 13.2 13l-3.9 1.7L11 10.9z" fill="currentColor" stroke="none" />
    </Svg>
  )
}

/** 축제 — 깃발 */
export function FestivalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 21V4" />
      <path d="M6 5.1c2.1-1 4.1-1 6.1.1 1.9 1 3.7 1.1 5.9.2v7c-2.2.9-4 .8-5.9-.2-2-1.1-4-1.1-6.1-.1z" />
    </Svg>
  )
}

/** 데이터 — 막대 3개 */
export function InsightsIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2.2">
      <path d="M5.5 20v-7" />
      <path d="M12 20V5.5" />
      <path d="M18.5 20v-4.5" />
    </Svg>
  )
}

/** 찜 — 하트 */
export function HeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20.1C7 16.5 3.7 13.4 3.7 10c0-2.4 1.9-4.3 4.3-4.3 1.6 0 3 .8 4 2.1 1-1.3 2.4-2.1 4-2.1 2.4 0 4.3 1.9 4.3 4.3 0 3.4-3.3 6.5-8.3 10.1z" />
    </Svg>
  )
}

/** 기록 — 펜 */
export function JournalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 19.5l.9-3.7L16.6 4.6a2 2 0 0 1 2.8 2.8L8.2 18.6l-3.7.9z" />
      <path d="M14.7 6.5l2.8 2.8" />
    </Svg>
  )
}

/** 설정 — 조절 슬라이더 */
export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8h16" />
      <circle cx="9.2" cy="8" r="2.1" fill="#fff" />
      <path d="M4 16h16" />
      <circle cx="14.8" cy="16" r="2.1" fill="#fff" />
    </Svg>
  )
}
