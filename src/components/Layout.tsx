import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
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

const navItems = [
  { to: '/guide', label: '公告与个人资料' },
  { to: '/questionnaire', label: '问卷' },
  { to: '/roommates', label: '舍友大厅' },
  { to: '/team/requests', label: '组队请求' },
  { to: '/team/my', label: '我的组队' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [changePwOpen, setChangePwOpen] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changePwLoading, setChangePwLoading] = useState(false)
  const [changePwError, setChangePwError] = useState('')

  const teamNavLabel = user?.team_id ? '我的组队' : '组队请求'
  const teamNavTo = user?.team_id ? '/team/my' : '/team/requests'

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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/" className="font-semibold text-xl text-foreground no-underline md:text-2xl">
            Roommate Matcher
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.slice(0, 3).map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md',
                  location.pathname === to ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              to={teamNavTo}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md',
                location.pathname.startsWith('/team') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {teamNavLabel}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Hello，{user?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/guide">公告与个人资料</Link>
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
                <Button variant="ghost" size="sm">
                  {user?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/guide">公告与个人资料</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openChangePw}>修改密码</DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>退出登录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t md:hidden">
            <nav className="flex flex-col p-2">
              {navItems.slice(0, 3).map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium',
                    location.pathname === to ? 'bg-accent' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </Link>
              ))}
              <Link
                to={teamNavTo}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium',
                  location.pathname.startsWith('/team') ? 'bg-accent' : 'text-muted-foreground'
                )}
              >
                {teamNavLabel}
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 bg-gradient-to-r from-amber-50 to-amber-100/80 min-h-[calc(100vh-120px)]">
        <div className="container mx-auto max-w-4xl px-4 py-6">{children}</div>
      </main>

      <footer className="border-t bg-background py-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between px-4 text-sm text-muted-foreground">
          <span>
            Designed by Xuanyu Liu, Improved by Yicheng Xiao & Huitian Wang
            <br />
            Made With <span className="text-red-500">❤</span>
          </span>
        </div>
      </footer>

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
