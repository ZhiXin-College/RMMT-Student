import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { api, getData } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StudentCard } from '@/components/StudentCard'
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
  students: { id: number; name: string; contact?: string; qq?: string; wechat?: string; province?: string; mbti?: string }[]
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
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [requests, setRequests] = useState<TeamRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [quitting, setQuitting] = useState(false)
  const [processing, setProcessing] = useState(false)

  if (user?.team_id == null) return <Navigate to="/team/requests" replace />

  useEffect(() => {
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
        setTeam(detailData)
        setRequests(reqData.team_requests ?? [])
      } catch {
        if (!cancelled) setTeam(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const quit = async () => {
    if (!window.confirm('确定要退出队伍吗？')) return
    setQuitting(true)
    try {
      getData(await api.post('/team/quit'))
      await refreshUser()
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

  if (loading) return <div className="py-8 text-center text-muted-foreground">加载中...</div>
  if (!team) return <div className="py-8 text-center">未找到队伍信息</div>

  const teammates = team.students?.filter((s) => s.id !== user?.id) ?? []
  const teamMax = 4

  return (
    <>
      <PageHeader title="我的组队 | My Team" />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="mb-4 font-medium">队伍信息</h3>
          <div className="space-y-1 text-sm">
            <div>ID：{team.id}</div>
            <div>人数上限：{teamMax} 人</div>
          </div>
          <div className="mt-4">
            <Button variant="destructive" onClick={quit} disabled={quitting}>
              退出队伍
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="mb-4 font-medium">我的队友 | My Roommates</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teammates.map((s) => (
              <StudentCard key={s.id} student={s} teamMaxStudentCount={teamMax} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 font-medium">入队申请</h3>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">你的队伍还没有收到过入队申请哦，赶快去拉人吧~</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>申请人</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      {row.student ? <Link to={`/roommates/${row.student.id}`}>{row.student.name} ({row.student.id})</Link> : '—'}
                    </TableCell>
                    <TableCell>{statusLabel(row.status)}</TableCell>
                    <TableCell>{row.reason ?? '—'}</TableCell>
                    <TableCell>{row.created_at ?? '—'}</TableCell>
                    <TableCell>
                      {row.status === 0 && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => processRequest(row.id, false)} disabled={processing}>
                            拒绝
                          </Button>
                          <Button size="sm" onClick={() => processRequest(row.id, true)} disabled={processing}>
                            接受
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
