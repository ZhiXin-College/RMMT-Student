import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { api, getData } from '@/lib/api'

function resolveAssetUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
  if (url.startsWith('/')) return `${base}${url}`
  return `${base}/${url}`
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bgUrl, setBgUrl] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const d = getData<{ login_bg_url?: string }>(await api.get('/public_style'))
        setBgUrl(resolveAssetUrl(d.login_bg_url))
      } catch {
        setBgUrl('')
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

  return (
    <div
      className={cn(
        'flex min-h-screen items-center justify-center bg-amber-50/80 bg-cover bg-center',
        'px-4'
      )}
      style={{
        backgroundImage: `url('${bgUrl || 'https://s2.loli.net/2022/02/01/X5meEt3qr4bKPZB.jpg'}')`,
      }}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-white/20 bg-white/95 p-8 shadow-xl backdrop-blur sm:p-10">
        <div className="mb-6 text-center">
          <div className="mb-2 text-2xl font-semibold text-foreground sm:text-3xl">
            RMMT Student
          </div>
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
          <Button type="submit" size="lg" className="h-12 w-full" disabled={loading}>
            {loading ? '登录中...' : '登录 / Login'}
          </Button>
        </form>
      </div>
    </div>
  )
}
