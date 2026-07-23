/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ─── Surface — 한지(韓紙) 크림 ────────────────────────────
        canvas: '#f5f1e8',              // 페이지 floor — 따뜻한 한지 베이지
        'canvas-soft': '#eee8dc',       // 섹션 밴드, 한 단계 짙은 한지
        // card: 한지 위에 살짝 들리는 밝은 장지.
        card: '#fcfaf5',
        'surface-strong': '#ded5c5',    // 배지/태그 pill
        'surface-cream-strong': '#ded5c5',

        // ─── Hairlines (그림자 없이 깊이감) ─────────────────────────
        hairline: '#d8d0c2',
        'hairline-soft': '#e9e3d9',
        'hairline-strong': '#b9ae9d',

        // ─── Text — 먹(墨) ───────────────────────────────────────
        ink: '#201f1b',                 // 본문/제목 — 먹빛 near-black
        body: '#504c44',
        'body-strong': '#34322d',
        muted: '#777168',
        'muted-soft': '#9b958b',

        // ─── Brand voltage — 단청 벽돌빛 적갈(丹靑) ──────────────────
        // 시그니처. 핵심 CTA / 선택 상태 / 브랜드 표식에만 희소하게(화면 10% 이하).
        primary: {
          DEFAULT: '#8f3b32',
          active: '#6f2c26',
          disabled: '#ded5c5',
        },
        'on-primary': '#fffcf6',

        // ─── Accent — 단청 청록/황토 (카테고리·보조 강조 한정) ─────────
        'accent-teal': '#2f625b',
        'accent-amber': '#a8782e',

        // ─── Timeline pastel pills (in-product AI 단계 전용) ────────
        timeline: {
          thinking: '#d6a58a',
          grep: '#8fbf92',
          read: '#8fb0cf',
          edit: '#b39ac9',
          done: '#8f3b32',          // 단청 적갈로 정렬
        },

        // ─── Semantic ────────────────────────────────────────────
        success: '#386a50',
        warning: '#a56b23',
        error: '#a33f35',
      },
      fontFamily: {
        // 폰트 통일 — Pretendard Variable 단일 패밀리 (한글+라틴 모두 커버.
        // Pretendard 의 라틴은 Inter 파생이라 별도 Inter 로드가 불필요).
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        // Display — MaruBuri(마루부리, 네이버 명조). 정제된 전통 명조로
        // 히어로·페이지 제목·장소명 등 큰 제목에만. 붓글씨는 쓰지 않음.
        display: [
          'MaruBuri',
          'Nanum Myeongjo',
          'Batang',
          'serif',
        ],
      },
      fontSize: {
        // Cursor 디스플레이 스케일 — 모두 weight 400, 부정 자간(-3% 내외).
        'display-mega': ['72px', { lineHeight: '1.1',  letterSpacing: '-2.16px',  fontWeight: '400' }],
        'display-xl':   ['72px', { lineHeight: '1.1',  letterSpacing: '-2.16px',  fontWeight: '400' }],
        'display-lg':   ['36px', { lineHeight: '1.2',  letterSpacing: '-0.72px',  fontWeight: '400' }],
        'display-md':   ['26px', { lineHeight: '1.25', letterSpacing: '-0.325px', fontWeight: '400' }],
        'display-sm':   ['22px', { lineHeight: '1.3',  letterSpacing: '-0.11px',  fontWeight: '400' }],
        // Title — 산세리프, weight 600. 컴포넌트 제목/리스트 라벨.
        'title-lg':     ['20px', { lineHeight: '1.4',  fontWeight: '600' }],
        'title-md':     ['18px', { lineHeight: '1.4',  fontWeight: '600' }],
        'title-sm':     ['16px', { lineHeight: '1.4',  fontWeight: '600' }],
        'body-md':      ['16px', { lineHeight: '1.5',  fontWeight: '400' }],
        'body-tracked': ['16px', { lineHeight: '1.5',  letterSpacing: '0.08px', fontWeight: '400' }],
        'body-sm':      ['14px', { lineHeight: '1.5',  fontWeight: '400' }],
        caption:        ['13px', { lineHeight: '1.4',  fontWeight: '400' }],
        // Cursor caption-uppercase — 섹션 라벨, timeline pill 라벨.
        eyebrow:        ['11px', { lineHeight: '1.4',  letterSpacing: '0.88px', fontWeight: '600' }],
        code:           ['13px', { lineHeight: '1.5',  fontWeight: '400' }],
        button:         ['14px', { lineHeight: '1.0',  fontWeight: '500' }],
        'nav-link':     ['14px', { lineHeight: '1.4',  fontWeight: '500' }],
      },
      spacing: {
        xxl: '48px',
        section: '80px',          // Cursor 80px 섹션 리듬
      },
      maxWidth: {
        content: '1200px',
      },
      // Warm-ink 그림자 — 검정 대신 ink(#26251e) 틴트로 크림 캔버스와 어울리게.
      // card: 카드 기본(거의 안 보이는 접지감) / lift: hover 리프트 / modal: 오버레이 패널.
      boxShadow: {
        card: '0 1px 2px 0 rgba(38, 37, 30, 0.04)',
        lift: '0 2px 8px -2px rgba(38, 37, 30, 0.08), 0 8px 24px -10px rgba(38, 37, 30, 0.12)',
        modal: '0 24px 64px -16px rgba(38, 37, 30, 0.28)',
      },
      borderRadius: {
        xs: '4px',     // inline tags
        sm: '6px',     // compact rows
        md: '8px',     // CTA, form inputs
        lg: '12px',    // 카드, IDE panes
        xl: '16px',    // 큰 feature 카드 (드물게)
        pill: '9999px',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pill-pop': {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Skeleton shimmer — 1.5s 주기로 좌→우 광택 슬라이드
        skeleton: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // OnboardingTour — 코치마크 카드 진입
        'fade-scale': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Builder 강조 — NL 적용 직후 살짝 펄스 (Cursor Orange)
        highlight: {
          '0%':   { boxShadow: '0 0 0 0 rgba(143, 59, 50, 0.45)' },
          '70%':  { boxShadow: '0 0 0 10px rgba(143, 59, 50, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(143, 59, 50, 0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out',
        'pill-pop': 'pill-pop 0.3s ease-out',
        skeleton: 'skeleton 1.5s ease-in-out infinite',
        'fade-scale': 'fade-scale 0.25s ease-out',
        highlight: 'highlight 1.4s ease-out',
      },
    },
  },
  plugins: [],
}
