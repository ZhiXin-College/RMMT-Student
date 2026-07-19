/** CSS 变量名（值为 "H S% L%"，供 hsl(var(--x)) 使用） */
const THEME_VAR_KEYS = [
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--input',
  '--ring',
  '--background',
] as const

export type Hsl = { h: number; s: number; l: number }

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      h = ((b - r) / d + 2) / 6
      break
    default:
      h = ((r - g) / d + 4) / 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

/** 解析 #RGB / #RRGGBB / rgb() / hsl() */
export function parseCssColor(input?: string | null): Hsl | null {
  if (!input) return null
  const raw = input.trim()
  if (!raw) return null

  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    const n = parseInt(h, 16)
    return rgbToHsl((n >> 16) & 255, (n >> 8) & 255, n & 255)
  }

  const rgb = raw.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (rgb) {
    return rgbToHsl(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]))
  }

  const hsl = raw.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i)
  if (hsl) {
    return { h: Number(hsl[1]), s: Number(hsl[2]), l: Number(hsl[3]) }
  }

  return null
}

function fmt(h: number, s: number, l: number) {
  return `${Math.round(h)} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%`
}

function relativeLuminance(hsl: Hsl) {
  // 粗略：L 即可判断前景色
  return hsl.l
}

/**
 * 由主题色生成多级色阶：
 * - primary：主强调（按钮、链接）
 * - accent / secondary / muted：浅底与弱提示
 * - border / ring：边框与焦点环
 */
export function buildThemeVars(base: Hsl): Record<string, string> {
  const h = ((base.h % 360) + 360) % 360
  const s = clamp(base.s, 35, 96)
  // 主色亮度压到可读区间，避免过浅/过深
  const primaryL = clamp(base.l, 32, 52)
  const primary: Hsl = { h, s, l: primaryL }
  const onPrimary = relativeLuminance(primary) > 55 ? fmt(h, 30, 12) : '0 0% 100%'

  return {
    '--primary': fmt(h, s, primaryL),
    '--primary-foreground': onPrimary,
    '--secondary': fmt(h, clamp(s * 0.55, 20, 70), 96),
    '--secondary-foreground': fmt(h, clamp(s, 40, 90), 28),
    '--muted': fmt(h, clamp(s * 0.35, 12, 45), 95),
    '--muted-foreground': fmt(h, clamp(s * 0.2, 8, 25), 40),
    '--accent': fmt(h, clamp(s * 0.85, 40, 92), 94),
    '--accent-foreground': fmt(h, clamp(s, 50, 95), 30),
    '--border': fmt(h, clamp(s * 0.25, 10, 35), 88),
    '--input': fmt(h, clamp(s * 0.22, 8, 32), 86),
    '--ring': fmt(h, clamp(s, 50, 95), clamp(primaryL + 6, 40, 58)),
    // 未单独设页面背景时，用极浅主题色作默认 wash
    '--background': fmt(h, clamp(s * 0.28, 12, 40), 98),
  }
}

/** 由主题色生成默认主区氛围渐变（未设置背景色时） */
export function buildThemeAmbientBackground(base: Hsl): string {
  const h = ((base.h % 360) + 360) % 360
  const s = clamp(base.s, 40, 95)
  const soft = `hsl(${h} ${s * 0.7}% 70% / 0.28)`
  const soft2 = `hsl(${h} ${s}% 55% / 0.14)`
  const wash = `hsl(${h} ${s * 0.35}% 97%)`
  const wash2 = `hsl(${h} ${s * 0.45}% 92% / 0.85)`
  return `radial-gradient(52rem 30rem at 110% -10%, ${soft}, transparent 60%), radial-gradient(46rem 28rem at -15% 8%, ${soft2}, transparent 55%), linear-gradient(to right, ${wash}, ${wash2})`
}

export function applyStudentTheme(themeColor?: string | null) {
  const root = document.documentElement
  const hsl = parseCssColor(themeColor)
  if (!hsl) {
    for (const key of THEME_VAR_KEYS) root.style.removeProperty(key)
    root.style.removeProperty('--page-wash')
    return null
  }
  const vars = buildThemeVars(hsl)
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
  // overscroll / html 底色
  root.style.setProperty('--page-wash', `hsl(${vars['--background']})`)
  return hsl
}

export function applyPageWash(pageBg?: string | null) {
  const root = document.documentElement
  const trimmed = (pageBg || '').trim()
  if (trimmed) {
    root.style.setProperty('--page-wash', trimmed)
  }
}
