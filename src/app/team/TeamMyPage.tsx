import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { api, getData } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { StudentCard } from '@/components/StudentCard'
import { UserPlus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TeamDetail {
  id: number
  description?: string
  students: {
    id: number
    name: string
    contact?: string
    qq?: string
    wechat?: string
    province?: string
    mbti?: string
    avatar_url?: string | null
    score?: number | null
    team_students_num?: number
  }[]
}

interface TeamRequest {
  id: number
  team_id: number
  status: number
  reason?: string
  created_at?: string
  student?: { id: number; name: string }
}

export function TeamMyPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [requests, setRequests] = useState<TeamRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [quitting, setQuitting] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (user?.team_id == null) {
      setLoading(false)
      setTeam(null)
      setRequests([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const [detailRes, reqRes] = await Promise.all([
          api.get('/team/detail'),
          api.get('/team/requests'),
        ])
        if (cancelled) return
        const detailData = getData<TeamDetail>(detailRes)
        const reqData = getData<{ team_requests: TeamRequest[] }>(reqRes)
        const teamStudentCount = detailData.students?.length ?? 0
        const teammates = (detailData.students ?? []).filter((s) => s.id !== user?.id)
        const teammateScores = new Map<number, number | null>()

        await Promise.all(
          teammates.map(async (s) => {
            try {
              const teammateRes = await api.get(`/student/${s.id}`)
              const teammateData = getData<{ score?: number | null }>(teammateRes)
              teammateScores.set(s.id, teammateData.score ?? null)
            } catch {
              teammateScores.set(s.id, null)
            }
          }),
        )

        const studentsWithTeamInfo = (detailData.students ?? []).map((s) => ({
          ...s,
          team_students_num: s.team_students_num ?? teamStudentCount,
          score: s.score ?? teammateScores.get(s.id) ?? null,
        }))

        setTeam({ ...detailData, students: studentsWithTeamInfo })
        setRequests(reqData.team_requests ?? [])
      } catch {
        if (!cancelled) setTeam(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id, user?.team_id])

  const quit = async () => {
    if (!window.confirm('确定要退出队伍吗？')) return
    setQuitting(true)
    try {
      getData(await api.post('/team/quit'))
      await refreshUser()
      navigate('/team/requests', { replace: true })
    } finally {
      setQuitting(false)
    }
  }

  const processRequest = async (teamRequestId: number, accept: boolean) => {
    setProcessing(true)
    try {
      getData(await api.post('/team/request/process', { team_request_id: teamRequestId, accept }))
      await refreshUser()
      setRequests((prev) => prev.filter((r) => r.id !== teamRequestId))
    } finally {
      setProcessing(false)
    }
  }

  const statusLabel = (status: number) => {
    if (status === 0) return '待处理'
    if (status === -1) return '已拒绝'
    if (status === -2) return '已撤回'
    if (status === 1) return '已接受'
    return String(status)
  }

  const statusPill = (status: number) => (
    <span
      className={
        status === 0
          ? 'rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
          : status === 1
            ? 'rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700'
            : 'rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'
      }
    >
      {statusLabel(status)}
    </span>
  )

  if (loading) return <div className="py-8 text-center text-muted-foreground">加载中...</div>
  if (user?.team_id == null) return <Navigate to="/team/requests" replace />
  if (!team) return <div className="py-8 text-center">未找到队伍信息</div>

  const teammates = team.students?.filter((s) => s.id !== user?.id) ?? []
  const teamMax = 4
  const memberCount = team.students?.length ?? 0
  const emptySlots = Math.max(0, teamMax - memberCount)

  return (
    <>
      <PageHeader
        kicker="My Team"
        title="我的组队"
        description="查看队伍成员与入队申请，满员后将无法再接收新成员。"
      />

      <section className="card-shell mb-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            {/* 成员头像重叠堆叠 + 空位圆圈 */}
            <div className="avatar-stack" aria-label={`队伍成员 ${memberCount} 人`}>
              {(team.students ?? []).map((s) => {
                const src = s.avatar_url
                  ? /^https?:\/\//i.test(s.avatar_url)
                    ? s.avatar_url
                    : `${import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''}${s.avatar_url.startsWith('/') ? '' : '/'}${s.avatar_url}`
                  : ''
                return src ? (
                  <img key={s.id} src={src} alt={s.name} title={s.name} className="avatar-stack__item" />
                ) : (
                  <span
                    key={s.id}
                    title={s.name}
                    className="avatar-stack__item flex items-center justify-center bg-primary/10 font-display text-base font-semibold text-primary"
                  >
                    {s.name.slice(0, 1)}
                  </span>
                )
              })}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <span key={`empty-${i}`} title="虚位以待" aria-label="还可加入" className="avatar-stack__empty">
                  <UserPlus className="h-4 w-4" />
                </span>
              ))}
            </div>
            <div>
              <div className="font-display text-xl font-semibold tracking-tight">
                队伍 <span className="numeral">#{team.id}</span>
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                <span className="numeral font-medium">{memberCount} / {teamMax}</span> 人
                {emptySlots > 0 ? (
                  <span className="ml-2 text-primary/80">还可加入 {emptySlots} 人</span>
                ) : (
                  <span className="ml-2 text-red-500">已满员</span>
                )}
              </div>
            </div>
          </div>
          <Button variant="destructive" className="rounded-full" onClick={quit} disabled={quitting}>
            退出队伍
          </Button>
        </div>
      </section>

      <section className="card-shell mb-8 p-6">
        <div className="mb-4 flex items-baseline gap-3">
          <h3 className="section-title">我的队友</h3>
          <span className="kicker !text-[10px]">My Roommates</span>
          <div className="h-px flex-1 bg-primary/15" aria-hidden />
        </div>
        {teammates.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">暂时还没有队友，去舍友大厅找找合拍的同学吧~</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teammates.map((s) => (
              <StudentCard key={s.id} student={s} teamMaxStudentCount={teamMax} />
            ))}
          </div>
        )}
      </section>

      <section className="card-shell p-6">
        <div className="mb-4 flex items-baseline gap-3">
          <h3 className="section-title">入队申请</h3>
          <span className="numeral rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {requests.length}
          </span>
          <div className="h-px flex-1 bg-primary/15" aria-hidden />
        </div>
        {requests.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">你的队伍还没有收到过入队申请哦，赶快去拉人吧~</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">#</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">申请人</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">状态</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">备注</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">创建时间</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="numeral">{row.id}</TableCell>
                    <TableCell className="font-medium">
                      {row.student ? <Link className="text-primary hover:underline" to={`/roommates/${row.student.id}`}>{row.student.name} ({row.student.id})</Link> : '—'}
                    </TableCell>
                    <TableCell>{statusPill(row.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{row.reason ?? '—'}</TableCell>
                    <TableCell className="numeral text-muted-foreground">{row.created_at ?? '—'}</TableCell>
                    <TableCell>
                      {row.status === 0 && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" className="rounded-full" onClick={() => processRequest(row.id, false)} disabled={processing}>
                            拒绝
                          </Button>
                          <Button size="sm" className="rounded-full" onClick={() => processRequest(row.id, true)} disabled={processing}>
                            接受
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </>
  )
}
