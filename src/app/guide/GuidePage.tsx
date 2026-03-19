import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { api, getData } from '@/lib/api'
import type { Announcement } from '@/types/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PROVINCES, MBTI_TYPES } from '@/lib/provinces'
import ReactMarkdown from 'react-markdown'

function resolveAssetUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
  if (url.startsWith('/')) return `${base}${url}`
  return `${base}/${url}`
}

function simpleHash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(16)
}

function getDisplayAvatar(user: {
  id?: number
  qq?: string
  avatar_url?: string
} | null): string {
  const custom = resolveAssetUrl(user?.avatar_url)
  if (custom) return custom
  if (user?.qq && user.qq.length > 0) {
    return `https://q.qlogo.cn/headimg_dl?dst_uin=${user.qq}&spec=640`
  }
  const id = user?.id ?? 0
  const email = `${new Date().getFullYear()}rmmp.${id}@chacuo.net`
  return `https://gravatar.loli.net/avatar/${simpleHash(email)}?d=retro`
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
  const [contact, setContact] = useState(user?.contact ?? '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [selectedAvatarName, setSelectedAvatarName] = useState('')
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
      setContact(user.contact ?? '')
    }
  }, [user?.id, user?.qq, user?.wechat, user?.province, user?.mbti, user?.contact])

  const handleSaveProfile = async () => {
    if (!qq?.trim() && !wechat?.trim()) {
      setProfileError('QQ和Wechat不能同时为空')
      return
    }
    setProfileError('')
    setProfileLoading(true)
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
    setSelectedAvatarName(file.name)
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

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">主页</h1>
        <img
          src={getDisplayAvatar(user)}
          alt="我的头像"
          className="h-[7.5rem] w-[7.5rem] rounded-full border object-cover"
        />
      </div>

      {/* 公告列表 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="text-lg font-medium">公告</div>
        </CardHeader>
        <CardContent>
          {announcementsLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无公告</p>
          ) : (
            <ul className="space-y-4">
              {announcements.map((a) => (
                <li key={a.id} className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">{a.created_at}</div>
                  <div className="mt-1 text-base font-semibold">{a.title}</div>
                  {a.content && (
                    <div className="prose prose-sm mt-2 max-w-none dark:prose-invert">
                      <ReactMarkdown>{a.content}</ReactMarkdown>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 个人信息展示与编辑 */}
      <Card>
        <CardHeader>
          <div className="text-lg font-medium">我的信息</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <div><span className="text-muted-foreground">QQ：</span>{user?.qq ?? '—'}</div>
            <div><span className="text-muted-foreground">Wechat：</span>{user?.wechat ?? '—'}</div>
            <div><span className="text-muted-foreground">来自：</span>{user?.province ?? '—'}</div>
            <div><span className="text-muted-foreground">MBTI：</span>{user?.mbti ?? '—'}</div>
            <div><span className="text-muted-foreground">自我描述：</span>{user?.contact ?? '—'}</div>
          </div>
          <div className="border-t pt-4">
            <div className="mb-3 text-sm font-medium">编辑个人信息</div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>QQ</Label>
                <Input value={qq} onChange={(e) => setQq(e.target.value)} placeholder="QQ" />
              </div>
              <div className="grid gap-1.5">
                <Label>Wechat</Label>
                <Input value={wechat} onChange={(e) => setWechat(e.target.value)} placeholder="Wechat" />
              </div>
              <div className="grid gap-1.5">
                <Label>你来自哪里</Label>
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
                <Label>MBTI</Label>
                <Select value={mbti?.trim() && MBTI_TYPES.includes(mbti.trim().toUpperCase()) ? mbti.trim().toUpperCase() : '_none'} onValueChange={(v) => setMbti(v === '_none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择 MBTI 类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">请选择</SelectItem>
                    {MBTI_TYPES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>用几个词语描述自己（英文分号分隔）</Label>
                <Textarea value={contact} onChange={(e) => setContact(e.target.value)} placeholder="用几个词语描述一下自己" rows={2} />
              </div>
              <div className="grid gap-1.5">
                <Label>头像（不超过10M）</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={avatarUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUploadAvatar(f)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {selectedAvatarName || '未选择任何文件'}
                </p>
              </div>
              {profileError && <p className="text-sm text-destructive">{profileError}</p>}
              <Button onClick={handleSaveProfile} disabled={profileLoading || avatarUploading}>
                {profileLoading ? '保存中...' : avatarUploading ? '头像上传中...' : '保存'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
