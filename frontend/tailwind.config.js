/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ─── Surface — 한지(韓紙) 아이보리 ─────────────────────────────
        // 실리콘밸리 크림이 아니라 장지 결의 따뜻한 종이 톤. 한 단계 옅은 면은 장지 소.
        canvas: '#f1ead9',              // 페이지 floor — 한지 natural
        'canvas-soft': '#f6f1e5',       // 한 단계 옅은 장지 면
        // 카드 — 순백이 아니라 미색(米色) 아이보리. 한지 위에서 살짝 들린다.
        card: '#fbf8f0',
        'surface-strong': '#e6dcc4',    // 배지/태그 pill (장지 강)
        'surface-cream-strong': '#e6dcc4',

        // ─── Hairlines — 먹선(墨線)을 아주 얇게. 그림자 대신 선으로 깊이. ─
        hairline: '#ddd2b8',
        'hairline-soft': '#e8dfc8',
        'hairline-strong': '#c3b58f',

        // ─── Text — 먹(墨) ────────────────────────────────────────
        ink: '#211d14',                 // 본문/제목 — warm 먹색 near-black
        body: '#4c4636',
        'body-strong': '#211d14',
        muted: '#867c66',
        'muted-soft': '#a89d83',

        // ─── Brand voltage — 단청 장단(丹) 주홍 ─────────────────────
        // 시그니처 voltage. primary CTA / 낙관(印) / wordmark 에만 희소하게.
        primary: {
          DEFAULT: '#b23a2b',
          active: '#922e21',
          disabled: '#e6dcc4',
        },
        'on-primary': '#fbf8f0',

        // ─── 단청 뇌록(磊碌) 청록 — 적(丹)의 짝. 링크·데이터·조용한 강조. ─
        // 적+청록의 단청 조합이 이 디자인의 정체성. 여행앱이 잘 안 쓰는 페어링.
        jade: {
          DEFAULT: '#2c6a5d',
          soft: '#e0ebe4',
          ink: '#1f4e45',
        },
        // ─── 단청 황(黃) 치자빛 — "숨은 보석"·리워드 등 드문 warm 강조. ──
        gold: {
          DEFAULT: '#bd8f2c',
          soft: '#f0e6c8',
        },

        // ─── 오방색(五方色) pastel pills — AI 코스 생성 단계 전용 ────────
        // 시스템 액션 색으로 쓰지 말 것 — 단계 타임라인 시각화 한정.
        timeline: {
          thinking: '#7fa8a0',      // 청 (동)
          grep: '#c9a24a',          // 황 (중앙)
          read: '#6f9bb0',          // 삼청
          edit: '#a98db0',          // 자
          done: '#b23a2b',          // 적 (남)
        },

        // ─── Semantic ────────────────────────────────────────────
        success: '#2c7a5e',
        error: '#b0243f',
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
        // Display — 명조(明朝) 세리프. 브랜드·제목의 전통 감성을 담당.
        // 사용 규칙: 큰 사이즈에서 weight 400~500 + 부정 자간. 편집체(editorial)로 절제해 쓴다.
        display: [
          'Noto Serif KR',
          'Nanum Myeongjo',
          'Apple SD Gothic Neo',
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
        card: '0 1px 2px 0 rgba(33, 29, 20, 0.05)',
        lift: '0 2px 8px -2px rgba(33, 29, 20, 0.09), 0 8px 24px -10px rgba(33, 29, 20, 0.14)',
        modal: '0 24px 64px -16px rgba(33, 29, 20, 0.30)',
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
        // Builder 강조 — 적용 직후 살짝 펄스 (단청 주홍)
        highlight: {
          '0%':   { boxShadow: '0 0 0 0 rgba(178, 58, 43, 0.45)' },
          '70%':  { boxShadow: '0 0 0 10px rgba(178, 58, 43, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(178, 58, 43, 0)' },
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
