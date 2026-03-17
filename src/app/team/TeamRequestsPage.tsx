import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { api, getData } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
interface Invitation {
  id: number
  team_id: number
  status: number
  reason?: string
  created_at?: string
  from_student: { id: number; name: string }
  to_student: { id: number; name: string }
  team?: { id: number; description?: string }
}

interface TeamRequest {
  id: number
  team_id: number
  status: number
  reason?: string
  created_at?: string
  student?: { id: number; name: string }
  team?: { id: number; description?: string }
}

export function TeamRequestsPage() {
  const { user, refreshUser } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [requests, setRequests] = useState<TeamRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  if (user?.team_id != null) return <Navigate to="/team/my" replace />

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [invRes, reqRes] = await Promise.all([
          api.get('/team/invitations'),
          api.get('/team/requests'),
        ])
        if (cancelled) return
        const invData = getData<{ team_invitations: Invitation[] }>(invRes)
        const reqData = getData<{ team_requests: TeamRequest[] }>(reqRes)
        setInvitations(invData.team_invitations ?? [])
        setRequests(reqData.team_requests ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const processInvitation = async (teamInvitationId: number, accept: boolean) => {
    setProcessing(true)
    try {
      getData(await api.post('/team/invitation/process', { team_invitation_id: teamInvitationId, accept }))
      await refreshUser()
      setInvitations((prev) => prev.filter((i) => i.id !== teamInvitationId))
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

  return (
    <>
      <PageHeader title="组队请求 | Team Requests" />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="mb-4 font-medium">组队邀请</h3>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground">你还没有发出或收到过组队邀请哦~</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>发起人</TableHead>
                  <TableHead>接收人</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      {row.from_student.id === user?.id ? '我' : <Link to={`/roommates/${row.from_student.id}`}>{row.from_student.name}</Link>}
                    </TableCell>
                    <TableCell>
                      {row.to_student.id === user?.id ? '我' : <Link to={`/roommates/${row.to_student.id}`}>{row.to_student.name}</Link>}
                    </TableCell>
                    <TableCell>{statusLabel(row.status)}</TableCell>
                    <TableCell>{row.reason ?? '—'}</TableCell>
                    <TableCell>{row.created_at ?? '—'}</TableCell>
                    <TableCell>
                      {row.status === 0 && (
                        <div className="flex gap-2">
                          {row.from_student.id === user?.id ? (
                            <Button size="sm" variant="secondary" onClick={() => processInvitation(row.id, false)} disabled={processing}>
                              撤回
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" variant="destructive" onClick={() => processInvitation(row.id, false)} disabled={processing}>
                                拒绝
                              </Button>
                              <Button size="sm" onClick={() => processInvitation(row.id, true)} disabled={processing}>
                                接受
                              </Button>
                            </>
                          )}
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

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 font-medium">组队申请</h3>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">你还没有发出过入队申请哦~</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>队伍</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.team?.description ?? `队伍 ${row.team_id}`}</TableCell>
                    <TableCell>{statusLabel(row.status)}</TableCell>
                    <TableCell>{row.reason ?? '—'}</TableCell>
                    <TableCell>{row.created_at ?? '—'}</TableCell>
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
