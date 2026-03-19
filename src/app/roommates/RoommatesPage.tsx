import { useEffect, useMemo, useState } from 'react'
import { api, getData } from '@/lib/api'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { PageHeader } from '@/components/PageHeader'
import { StudentCard } from '@/components/StudentCard'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PROVINCES, MBTI_TYPES } from '@/lib/provinces'
import { useAuth } from '@/hooks/useAuth'
interface RoommateStudent {
  id: number
  name: string
  avatar_url?: string
  contact?: string
  qq?: string
  wechat?: string
  province?: string
  mbti?: string
  score?: number
  team_students_num?: number
}

export function RoommatesPage() {
  const { user } = useAuth()
  const { settings } = useSystemSettings()
  const [withScore, setWithScore] = useState<RoommateStudent[]>([])
  const [noScore, setNoScore] = useState<RoommateStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyUnteamed, setOnlyUnteamed] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [searchProvince, setSearchProvince] = useState<string>('')
  const [searchMbti, setSearchMbti] = useState<string>('')
  const [pageSize, setPageSize] = useState(16)
  const [currentPage, setCurrentPage] = useState(1)

  const teamMax = settings?.team_max_student_count != null ? Number(settings.team_max_student_count) : 4

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/team/recommend_teammates')
        const data = getData<{ students_with_score: RoommateStudent[]; students_with_no_score: RoommateStudent[] }>(res)
        if (cancelled) return
        setWithScore(data.students_with_score ?? [])
        const noScoreList = (data.students_with_no_score ?? []).filter((s) => s.id !== user?.id)
        setNoScore(noScoreList)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  const filteredWithScore = useMemo(() => {
    if (!onlyUnteamed) return withScore
    return withScore.filter((s) => (s.team_students_num ?? 0) < teamMax)
  }, [withScore, onlyUnteamed, teamMax])

  const filteredNoScore = useMemo(() => {
    if (!onlyUnteamed) return noScore
    return noScore.filter((s) => (s.team_students_num ?? 0) < teamMax)
  }, [noScore, onlyUnteamed, teamMax])

  const allFiltered = useMemo(() => [...filteredWithScore, ...filteredNoScore], [filteredWithScore, filteredNoScore])

  const filteredForSearch = useMemo(() => {
    let list = allFiltered
    const name = searchName.trim().toLowerCase()
    if (name) list = list.filter((s) => s.name.toLowerCase().includes(name))
    if (searchProvince) list = list.filter((s) => (s.province ?? '') === searchProvince)
    if (searchMbti) list = list.filter((s) => (s.mbti ?? '').toUpperCase() === searchMbti)
    return list
  }, [allFiltered, searchName, searchProvince, searchMbti])

  const withScoreIds = useMemo(() => new Set(filteredWithScore.map((s) => s.id)), [filteredWithScore])
  const totalPages = Math.ceil(filteredForSearch.length / pageSize) || 1
  const start = (currentPage - 1) * pageSize
  const paginatedPage = filteredForSearch.slice(start, start + pageSize)
  const paginatedWithScore = paginatedPage.filter((s) => withScoreIds.has(s.id))
  const paginatedNoScore = paginatedPage.filter((s) => !withScoreIds.has(s.id))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchName, searchProvince, searchMbti])

  if (loading) return <div className="py-8 text-center text-muted-foreground">加载中...</div>

  return (
    <>
      <PageHeader title="舍友大厅" />
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm shrink-0">姓名</Label>
              <Input
                placeholder="搜索姓名"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm shrink-0">来自</Label>
              <Select value={searchProvince || '_all'} onValueChange={(v) => setSearchProvince(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">全部</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm shrink-0">MBTI</Label>
              <Select value={searchMbti || '_all'} onValueChange={(v) => setSearchMbti(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">全部</SelectItem>
                  {MBTI_TYPES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={onlyUnteamed}
                onChange={(e) => setOnlyUnteamed(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">仅显示未组队/未满员</span>
            </label>
            <div className="flex items-center gap-2 ml-auto">
              <Label className="text-sm">每页</Label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-9 rounded border px-2 text-sm"
              >
                {[8, 16, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredForSearch.length === 0 && (
        <Card className="mb-6">
          <CardContent className="py-8 text-center text-muted-foreground">
            未找到匹配同学，可调整筛选条件
          </CardContent>
        </Card>
      )}

      {paginatedWithScore.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="mb-4 border-b border-primary/30 pb-2 text-lg font-medium text-primary">
              推荐匹配 ({filteredWithScore.filter((s) => filteredForSearch.some((f) => f.id === s.id)).length}人)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedWithScore.map((s) => (
                <StudentCard key={s.id} student={s} teamMaxStudentCount={teamMax} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {paginatedNoScore.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="mb-4 border-b border-primary/30 pb-2 text-lg font-medium text-primary">
              其他同学 ({filteredNoScore.filter((s) => filteredForSearch.some((f) => f.id === s.id)).length}人)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedNoScore.map((s) => (
                <StudentCard key={s.id} student={s} teamMaxStudentCount={teamMax} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredForSearch.length > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}（共 {filteredForSearch.length} 人）
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              下一页
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}
