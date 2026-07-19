import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { Button } from '@/components/ui/button'
import { OnboardingTour } from '@/components/OnboardingTour'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, getData } from '@/lib/api'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  applyPageWash,
  applyStudentTheme,
  buildThemeAmbientBackground,
  parseCssColor,
} from '@/lib/theme'

const navItems = [
  { to: '/guide', label: '主页' },
  { to: '/questionnaire', label: '问卷' },
  { to: '/roommates', label: '舍友大厅' },
  { to: '/team/requests', label: '组队请求' },
  { to: '/team/my', label: '我的组队' },
]

function resolveAssetUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
  if (url.startsWith('/')) return `${base}${url}`
  return `${base}/${url}`
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { settings } = useSystemSettings()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changePwLoading, setChangePwLoading] = useState(false)
  const [changePwError, setChangePwError] = useState('')

  const teamNavLabel = user?.team_id ? '我的组队' : '组队请求'
  const teamNavTo = user?.team_id ? '/team/my' : '/team/requests'
  const logoUrl = resolveAssetUrl(settings?.student_logo_url)
  const studentBg = (settings?.student_guide_bg_color || '').trim()
  const themeColor = (settings?.student_theme_color || '').trim()
  const navSystemName = (settings?.student_nav_system_name || '').trim() || 'Roommate Matcher'
  const themeHsl = parseCssColor(themeColor)

  useEffect(() => {
    applyStudentTheme(themeColor || null)
    if (studentBg) applyPageWash(studentBg)
  }, [themeColor, studentBg])

  // 首次登录（本浏览器内该账号未见指引）时自动弹出新手指引
  useEffect(() => {
    if (!user?.id) return
    try {
      if (localStorage.getItem(`rmmt_onboarding_v1_seen_${user.id}`)) return
    } catch {
      return
    }
    const timer = window.setTimeout(() => setTourOpen(true), 700)
    return () => window.clearTimeout(timer)
  }, [user?.id])

  const closeTour = () => {
    setTourOpen(false)
    try {
      if (user?.id) localStorage.setItem(`rmmt_onboarding_v1_seen_${user.id}`, '1')
    } catch {
      // localStorage 不可用时静默忽略
    }
  }

  const openChangePw = () => {
    setChangePwOpen(true)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setChangePwError('')
  }

  const doChangePassword = async () => {
    if (newPw.length < 8) {
      setChangePwError('新密码不能少于八位')
      return
    }
    if (newPw !== confirmPw) {
      setChangePwError('两次输入密码不一致')
      return
    }
    setChangePwLoading(true)
    setChangePwError('')
    try {
      getData(await api.post('/change_password', { current_password: currentPw, new_password: newPw }))
      setChangePwOpen(false)
    } catch (e) {
      setChangePwError(e instanceof Error ? e.message : '修改失败')
    } finally {
      setChangePwLoading(false)
    }
  }

  const wideContent = location.pathname.startsWith('/roommates') || location.pathname.startsWith('/questionnaire')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        {/* 左侧品牌固定；右侧单一操作区，避免 justify-between + 响应式显隐把 Logo 挤到右边 */}
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-2.5 no-underline">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                aria-hidden
                className="h-9 w-auto max-w-[2.75rem] shrink-0 object-contain sm:h-10 sm:max-w-[3rem]"
              />
            ) : null}
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
              {navSystemName}
            </span>
            <span className="hidden font-grotesk text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/70 sm:inline">
              RMMT
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.slice(0, 3).map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn('nav-pill', location.pathname === to && 'nav-pill--active')}
                >
                  {label}
                </Link>
              ))}
              <Link
                to={teamNavTo}
                className={cn('nav-pill', location.pathname.startsWith('/team') && 'nav-pill--active')}
              >
                {teamNavLabel}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-1 rounded-full font-grotesk tracking-wide">
                    Hello，{user?.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/guide">主页</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTourOpen(true)}>
                    新手指引 Guide Tour
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openChangePw}>
                    修改密码 Change Password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    退出登录 Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                aria-label="打开菜单"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="font-grotesk">
                    {user?.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/guide">主页</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTourOpen(true)}>新手指引</DropdownMenuItem>
                  <DropdownMenuItem onClick={openChangePw}>修改密码</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>退出登录</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t md:hidden">
            <nav className="flex flex-col gap-1 p-3">
              {navItems.slice(0, 3).map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={cn('nav-pill', location.pathname === to && 'nav-pill--active')}
                >
                  {label}
                </Link>
              ))}
              <Link
                to={teamNavTo}
                onClick={() => setMobileOpen(false)}
                className={cn('nav-pill', location.pathname.startsWith('/team') && 'nav-pill--active')}
              >
                {teamNavLabel}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main
        className="relative flex flex-1 flex-col min-h-[calc(100vh-120px)]"
        style={
          studentBg
            ? { backgroundColor: studentBg }
            : themeHsl
              ? { background: buildThemeAmbientBackground(themeHsl) }
              : {
                  background:
                    'radial-gradient(52rem 30rem at 110% -10%, rgba(251 191 36 / 0.28), transparent 60%), radial-gradient(46rem 28rem at -15% 8%, rgba(249 115 22 / 0.14), transparent 55%), linear-gradient(to right, rgb(255 251 235), rgba(254 243 199 / 0.8))',
                }
        }
      >
        <div className="texture-dots absolute inset-0 opacity-40" aria-hidden />
        <div
          className={cn(
            'container relative mx-auto w-full flex-1 px-4 py-8 sm:px-6',
            wideContent ? 'max-w-6xl' : 'max-w-4xl'
          )}
        >
          {children}
        </div>
        {/* 页脚：悬浮小框，落在主背景内、与内容列对齐，避免底部白条 */}
        <div
          className={cn(
            'container relative mx-auto w-full px-4 pb-6 sm:px-6',
            wideContent ? 'max-w-6xl' : 'max-w-4xl'
          )}
        >
          <div className="flex w-fit flex-wrap items-center gap-x-3 gap-y-0.5 rounded-2xl border border-border/70 bg-card/70 px-4 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
            <span className="font-grotesk tracking-wide">
              Designed by <b>Xuanyu Liu</b> · Improved by <b>Yicheng Xiao</b> & <b>Huitian Wang</b> & <b>Xingchen Xiao</b>
            </span>
            <span className="font-display italic">
              Made With <span className="not-italic text-red-500">❤</span>
            </span>
          </div>
        </div>
      </main>

      <OnboardingTour open={tourOpen} onClose={closeTour} />

      <Dialog open={changePwOpen} onOpenChange={setChangePwOpen}>
        <DialogContent showClose={true}>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>当前密码</Label>
              <Input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="grid gap-2">
              <Label>新密码（不少于八位）</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-2">
              <Label>确认密码</Label>
              <Input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {changePwError && <p className="text-sm text-destructive">{changePwError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePwOpen(false)}>
              取消
            </Button>
            <Button onClick={doChangePassword} disabled={changePwLoading}>
              {changePwLoading ? '提交中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
