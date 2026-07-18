import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { api, getData } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/PageHeader'
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

  const statusPill = (status: number) => (
    <span
      className={
        status === 0
          ? 'rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800'
          : status === 1
            ? 'rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700'
            : 'rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'
      }
    >
      {statusLabel(status)}
    </span>
  )

  if (loading) return <div className="py-8 text-center text-muted-foreground">加载中...</div>

  return (
    <>
      <PageHeader
        kicker="Team Requests"
        title="组队请求"
        description="处理你收到与发出的组队邀请，以及你发出的入队申请。"
      />
      <section className="card-shell mb-8 p-6">
        <div className="mb-4 flex items-baseline gap-3">
          <h3 className="section-title">组队邀请</h3>
          <span className="numeral rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {invitations.length}
          </span>
          <div className="h-px flex-1 bg-primary/15" aria-hidden />
        </div>
        {invitations.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">你还没有发出或收到过组队邀请哦~</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">#</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">发起人</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">接收人</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">状态</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">备注</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">创建时间</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="numeral">{row.id}</TableCell>
                    <TableCell className="font-medium">
                      {row.from_student.id === user?.id ? '我' : <Link className="text-primary hover:underline" to={`/roommates/${row.from_student.id}`}>{row.from_student.name}</Link>}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.to_student.id === user?.id ? '我' : <Link className="text-primary hover:underline" to={`/roommates/${row.to_student.id}`}>{row.to_student.name}</Link>}
                    </TableCell>
                    <TableCell>{statusPill(row.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{row.reason ?? '—'}</TableCell>
                    <TableCell className="numeral text-muted-foreground">{row.created_at ?? '—'}</TableCell>
                    <TableCell>
                      {row.status === 0 && (
                        <div className="flex gap-2">
                          {row.from_student.id === user?.id ? (
                            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => processInvitation(row.id, false)} disabled={processing}>
                              撤回
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" variant="destructive" className="rounded-full" onClick={() => processInvitation(row.id, false)} disabled={processing}>
                                拒绝
                              </Button>
                              <Button size="sm" className="rounded-full" onClick={() => processInvitation(row.id, true)} disabled={processing}>
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
          </div>
        )}
      </section>

      <section className="card-shell p-6">
        <div className="mb-4 flex items-baseline gap-3">
          <h3 className="section-title">组队申请</h3>
          <span className="numeral rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {requests.length}
          </span>
          <div className="h-px flex-1 bg-primary/15" aria-hidden />
        </div>
        {requests.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">你还没有发出过入队申请哦~</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">#</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">队伍</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">状态</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">备注</TableHead>
                  <TableHead className="font-grotesk text-xs uppercase tracking-wider">创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="numeral">{row.id}</TableCell>
                    <TableCell className="font-medium">{row.team?.description ?? `队伍 ${row.team_id}`}</TableCell>
                    <TableCell>{statusPill(row.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{row.reason ?? '—'}</TableCell>
                    <TableCell className="numeral text-muted-foreground">{row.created_at ?? '—'}</TableCell>
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
