import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { api, getData } from '@/lib/api'
import { applyStudentTheme } from '@/lib/theme'

function resolveAssetUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
  if (url.startsWith('/')) return `${base}${url}`
  return `${base}/${url}`
}

/** PNG/SVG 可作透明底水印；JPG/JPEG 非透明底则不加水印 */
function isTransparentCapableLogo(url?: string) {
  if (!url) return false
  const path = url.split('?')[0].split('#')[0].toLowerCase()
  return path.endsWith('.png') || path.endsWith('.svg')
}

type PublicStyle = {
  login_bg_url?: string
  student_logo_url?: string
  student_nav_system_name?: string
  student_theme_color?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bgUrl, setBgUrl] = useState<string>('')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [systemName, setSystemName] = useState('Roommate Matcher')

  useEffect(() => {
    ;(async () => {
      try {
        const d = getData<PublicStyle>(await api.get('/public_style'))
        setBgUrl(resolveAssetUrl(d.login_bg_url))
        setLogoUrl(resolveAssetUrl(d.student_logo_url))
        const name = (d.student_nav_system_name || '').trim()
        setSystemName(name || 'Roommate Matcher')
        applyStudentTheme((d.student_theme_color || '').trim() || null)
      } catch {
        setBgUrl('')
        setLogoUrl('')
        setSystemName('Roommate Matcher')
      }
    })()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const idNum = id.trim()
    if (!idNum) {
      setError('请输入学号/账号')
      return
    }
    if (password.length < 8) {
      setError('密码不能包含空格，且至少8个字符')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(idNum, password)
      navigate('/guide', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败，请检查学号和密码')
    } finally {
      setLoading(false)
    }
  }

  const showWatermark = Boolean(logoUrl && isTransparentCapableLogo(logoUrl))

  return (
    <div
      className={cn(
        'relative flex min-h-screen items-center justify-center overflow-hidden bg-background/80 bg-cover bg-center',
        'px-4'
      )}
      style={{
        backgroundImage: `url('${bgUrl || 'https://s2.loli.net/2022/02/01/X5meEt3qr4bKPZB.jpg'}')`,
      }}
    >
      {showWatermark && (
        <img
          src={logoUrl}
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-[-6%] left-1/2 z-0 w-[min(92vw,720px)] -translate-x-1/2 select-none object-contain opacity-[0.22]"
        />
      )}

      <div className="relative z-10 w-full max-w-[420px] rounded-3xl border border-white/30 bg-white/95 p-8 shadow-[0_24px_60px_-24px_rgba(120,60,10,0.45)] backdrop-blur sm:p-10">
        <div className="mb-8 text-center">
          {logoUrl ? (
            <div className="mb-4 flex justify-center">
              <img
                src={logoUrl}
                alt="logo"
                className="h-16 w-16 object-contain sm:h-[4.5rem] sm:w-[4.5rem]"
              />
            </div>
          ) : null}
          <div className="kicker mb-3">Roommate Matcher</div>
          <div className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {systemName}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">登录以开始寻找你的合拍舍友</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="id">账号 / Account</Label>
            <Input
              id="id"
              type="text"
              inputMode="numeric"
              placeholder="请输入学号"
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="username"
              className="h-12"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">密码 / Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-12"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="h-12 w-full rounded-xl font-grotesk tracking-wide" disabled={loading}>
            {loading ? '登录中...' : '登录 / Login'}
          </Button>
        </form>
      </div>
    </div>
  )
}
