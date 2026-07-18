import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { api, getData } from '@/lib/api'
import type { Announcement } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PROVINCES, MBTI_TYPES, MBTI_OPTIONS } from '@/lib/provinces'
import {
  CONTACT_WORD_MAX_CHARS,
  formatContactForCard,
  joinThreeContact,
  parseContactToThree,
} from '@/lib/contactDisplay'
import ReactMarkdown from 'react-markdown'

function resolveAssetUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
  if (url.startsWith('/')) return `${base}${url}`
  return `${base}/${url}`
}

function mbtiSelectValue(mbti: string): string {
  const t = mbti.trim()
  if (!t) return '_none'
  if (t === '未知') return '未知'
  const u = t.toUpperCase()
  return MBTI_TYPES.includes(u) ? u : '_none'
}

export function GuidePage() {
  const { user, refreshUser } = useAuth()
  const { loading: settingsLoading } = useSystemSettings()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [qq, setQq] = useState(user?.qq ?? '')
  const [wechat, setWechat] = useState(user?.wechat ?? '')
  const [province, setProvince] = useState(user?.province ?? '')
  const [mbti, setMbti] = useState(user?.mbti ?? '')
  const [desc1, setDesc1] = useState('')
  const [desc2, setDesc2] = useState('')
  const [desc3, setDesc3] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [profileError, setProfileError] = useState('')

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await api.get('/announcement/list')
      setAnnouncements(getData<Announcement[]>(res))
    } catch {
      setAnnouncements([])
    } finally {
      setAnnouncementsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  useEffect(() => {
    if (user) {
      setQq(user.qq ?? '')
      setWechat(user.wechat ?? '')
      setProvince(user.province ?? '')
      setMbti(user.mbti ?? '')
      const [a, b, c] = parseContactToThree(user.contact ?? '')
      setDesc1(a.slice(0, CONTACT_WORD_MAX_CHARS))
      setDesc2(b.slice(0, CONTACT_WORD_MAX_CHARS))
      setDesc3(c.slice(0, CONTACT_WORD_MAX_CHARS))
    }
  }, [user?.id, user?.qq, user?.wechat, user?.province, user?.mbti, user?.contact])

  const handleSaveProfile = async () => {
    if (!qq?.trim() && !wechat?.trim()) {
      setProfileError('QQ和Wechat不能同时为空')
      return
    }
    setProfileError('')
    setProfileLoading(true)
    const contact = joinThreeContact(desc1, desc2, desc3)
    try {
      getData(await api.post('/update_contact', { qq, wechat, province, mbti, contact }))
      await refreshUser()
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : '更新失败')
    } finally {
      setProfileLoading(false)
    }
  }

  const loading = settingsLoading
  if (loading) return <div className="py-8 text-center text-muted-foreground">加载中...</div>

  const handleUploadAvatar = async (file: File) => {
    setProfileError('')
    if (!/image\/(png|jpeg)/.test(file.type)) {
      setProfileError('头像仅支持 png/jpg/jpeg 格式')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setProfileError('头像最大 10MB')
      return
    }
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/avatar/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : '头像上传失败')
    } finally {
      setAvatarUploading(false)
    }
  }

  const customAvatarUrl = resolveAssetUrl(user?.avatar_url)

  return (
    <>
      {/* 欢迎横幅 + 头像上传 */}
      <div className="card-shell relative mb-8 overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="kicker mb-2">Home</div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              你好，{user?.name ?? '同学'}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              欢迎来到舍友匹配中心。完善资料、填写问卷，然后去大厅遇见合拍的舍友吧。
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {user?.province && (
                <span className="rounded-full border border-foreground/15 px-2.5 py-0.5 text-xs">{user.province}</span>
              )}
              {user?.mbti && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-grotesk text-xs font-semibold text-primary">
                  {user.mbti}
                </span>
              )}
              {parseContactToThree(user?.contact ?? '')
                .filter(Boolean)
                .map((t, i) => (
                  <span key={`${i}-${t}`} className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs text-orange-800">
                    {t}
                  </span>
                ))}
            </div>
          </div>
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-card bg-background shadow-lg ring-2 ring-primary/20">
            {customAvatarUrl ? (
              <img
                src={customAvatarUrl}
                alt="我的头像"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="pointer-events-none flex h-full w-full items-center justify-center bg-white px-2 text-center text-xs leading-snug text-muted-foreground dark:bg-muted">
                点击上传头像
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              disabled={avatarUploading}
              aria-label="选择头像图片"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleUploadAvatar(f)
                e.target.value = ''
              }}
            />
            {avatarUploading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 text-xs text-foreground">
                上传中…
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* 公告列表 */}
        <section className="card-shell p-6 lg:col-span-3">
          <div className="mb-5 flex items-baseline gap-3">
            <h2 className="section-title">公告</h2>
            <span className="kicker !text-[10px]">Notice</span>
            <div className="h-px flex-1 bg-primary/15" aria-hidden />
          </div>
          {announcementsLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无公告</p>
          ) : (
            <ul className="space-y-4">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-border/80 bg-background/60 p-4 transition-colors hover:border-primary/30"
                >
                  <div className="numeral text-xs font-medium tracking-wide text-muted-foreground">{a.created_at}</div>
                  <div className="mt-1 font-display text-lg font-semibold tracking-tight">{a.title}</div>
                  {a.content && (
                    <div className="prose prose-sm mt-2 max-w-none dark:prose-invert">
                      <ReactMarkdown>{a.content}</ReactMarkdown>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 个人信息展示与编辑 */}
        <section className="card-shell h-fit p-6 lg:col-span-2">
          <div className="mb-5 flex items-baseline gap-3">
            <h2 className="section-title">我的信息</h2>
            <span className="kicker !text-[10px]">Profile</span>
            <div className="h-px flex-1 bg-primary/15" aria-hidden />
          </div>
          <dl className="grid gap-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 pb-2">
              <dt className="shrink-0 text-muted-foreground">QQ</dt>
              <dd className="numeral truncate font-medium">{user?.qq ?? '—'}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 pb-2">
              <dt className="shrink-0 text-muted-foreground">Wechat</dt>
              <dd className="numeral truncate font-medium">{user?.wechat ?? '—'}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 pb-2">
              <dt className="shrink-0 text-muted-foreground">来自</dt>
              <dd className="truncate font-medium">{user?.province ?? '—'}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 pb-2">
              <dt className="shrink-0 text-muted-foreground">MBTI</dt>
              <dd className="font-grotesk font-medium">{user?.mbti ?? '—'}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">自我描述</dt>
              <dd className="truncate text-right font-medium">{formatContactForCard(user?.contact) || '—'}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-primary/15 pt-5">
            <div className="mb-4 font-grotesk text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              编辑个人信息
            </div>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">QQ</Label>
                  <Input value={qq} onChange={(e) => setQq(e.target.value)} placeholder="QQ" className="numeral" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Wechat</Label>
                  <Input value={wechat} onChange={(e) => setWechat(e.target.value)} placeholder="Wechat" className="numeral" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">你来自哪里</Label>
                  <Select value={province || '_none'} onValueChange={(v) => setProvince(v === '_none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择省份" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">请选择</SelectItem>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">MBTI</Label>
                  <Select
                    value={mbtiSelectValue(mbti)}
                    onValueChange={(v) => setMbti(v === '_none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择 MBTI 类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">请选择</SelectItem>
                      {MBTI_OPTIONS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">用三个词描述自己（每个最多{CONTACT_WORD_MAX_CHARS}个字符）</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={desc1}
                    maxLength={CONTACT_WORD_MAX_CHARS}
                    onChange={(e) => setDesc1(e.target.value.slice(0, CONTACT_WORD_MAX_CHARS))}
                    placeholder="词 1"
                    className="min-w-0"
                  />
                  <Input
                    value={desc2}
                    maxLength={CONTACT_WORD_MAX_CHARS}
                    onChange={(e) => setDesc2(e.target.value.slice(0, CONTACT_WORD_MAX_CHARS))}
                    placeholder="词 2"
                    className="min-w-0"
                  />
                  <Input
                    value={desc3}
                    maxLength={CONTACT_WORD_MAX_CHARS}
                    onChange={(e) => setDesc3(e.target.value.slice(0, CONTACT_WORD_MAX_CHARS))}
                    placeholder="词 3"
                    className="min-w-0"
                  />
                </div>
              </div>
              {profileError && <p className="text-sm text-destructive">{profileError}</p>}
              <Button onClick={handleSaveProfile} disabled={profileLoading || avatarUploading} className="rounded-xl">
                {profileLoading ? '保存中...' : avatarUploading ? '头像上传中...' : '保存'}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
