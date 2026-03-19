import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, getData } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StudentCard } from '@/components/StudentCard'
import { QuestionnaireReadOnly } from '@/components/questionnaire/QuestionnaireReadOnly'
import type { Student, QuestionnaireItem } from '@/types/api'
import { parseContactWords } from '@/lib/contactDisplay'
import { cn } from '@/lib/utils'

function resolveAssetUrl(url?: string | null): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
  if (url.startsWith('/')) return `${base}${url}`
  return `${base}/${url}`
}

function getAvatarUrl(student: { avatar_url?: string | null }): string {
  return resolveAssetUrl(student.avatar_url)
}

export function RoommateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { settings } = useSystemSettings()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(`/student/${id}`)
        const data = getData<Student>(res)
        if (cancelled) return
        setStudent(data)
      } catch {
        if (!cancelled) setStudent(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const invite = async () => {
    if (!student || !window.confirm('你确定已经和这位同学充分沟通过，了解并能接受他所有的生活习惯吗？')) return
    setInviting(true)
    try {
      getData(await api.post('/team/invite', { target_student_id: student.id }))
      alert('组队邀请已发出')
    } finally {
      setInviting(false)
    }
  }

  const joinTeam = async (teamId: number) => {
    if (!window.confirm('你确定已经和这个队伍里所有的成员充分沟通过，了解并且能够接受他们所有的生活习惯吗？')) return
    setJoining(true)
    try {
      getData(await api.post('/team/request', { team_id: teamId }))
      alert('入队申请已发出')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">加载中...</div>
  if (!student) return <div className="py-8 text-center">未找到该同学</div>

  const traits = parseContactWords(student.contact)
  const avatarSrc = getAvatarUrl(student)
  const questionnaireItems: QuestionnaireItem[] = (student.questionnaire_answers ?? [])
    .map((a) => a.item)
    .filter((item): item is QuestionnaireItem => item != null)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  const answersByItemId: Record<string, string> = {}
  ;(student.questionnaire_answers ?? []).forEach((a) => {
    try {
      const v = typeof a.answer === 'string' ? JSON.parse(a.answer) : a.answer
      answersByItemId[a.item_id] = typeof v === 'string' ? v : JSON.stringify(v)
    } catch {
      answersByItemId[a.item_id] = String(a.answer)
    }
  })

  const teamMax = settings?.team_max_student_count != null ? Number(settings.team_max_student_count) : 4
  const teamStudentCount = student.team?.students?.length ?? 0
  const teammates = student.team?.students?.filter((s) => s.id !== student.id) ?? []
  const hasQuestionnaire = student.has_answered_questionnaire && questionnaireItems.length > 0

  const leftColumn = (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex gap-3">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 shrink-0 rounded-full bg-muted" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-lg">{student.name}</div>
              {student.province && (
                <div className="text-sm text-muted-foreground">来自 {student.province}</div>
              )}
              {student.mbti && (
                <span className="mt-0.5 inline-block rounded bg-primary/90 px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                  {student.mbti}
                </span>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            组队状态：
            {student.team_id == null ? (
              <span className="text-green-600">未组队</span>
            ) : teamStudentCount >= teamMax ? (
              <span className="text-red-600">已组队 满员</span>
            ) : (
              <span className="text-orange-600">已组队</span>
            )}
          </div>
          {student.score != null && (
            <div className="text-sm">
              匹配指数：<span className="font-medium text-primary">{Number(student.score).toFixed(2)}</span>
            </div>
          )}
          {traits.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {traits.map((t, i) => (
                <span key={`${i}-${t}`} className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-800 dark:bg-orange-500/20 dark:text-orange-200">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="border-t border-border/60 pt-2 text-sm text-muted-foreground">
            <div>QQ {student.qq ?? '—'}</div>
            <div>微信 {student.wechat ?? '—'}</div>
          </div>
          {user?.team_id == null && user?.id !== student.id && student.team_id == null && (
            <Button size="sm" className="w-full" onClick={invite} disabled={inviting}>
              {inviting ? '发送中...' : '与他组队'}
            </Button>
          )}
        </CardContent>
      </Card>

      {student.team && (
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <h3 className="mb-3 text-sm font-medium text-primary">Ta 的队伍</h3>
            <div className="space-y-2">
              {teammates.map((s) => (
                <StudentCard
                  key={s.id}
                  student={{ ...s, team_students_num: teamStudentCount }}
                  teamMaxStudentCount={teamMax}
                />
              ))}
            </div>
            {user?.team_id == null && user?.id !== student.id && teamStudentCount < teamMax && (
              <Button className="mt-3 w-full" variant="outline" size="sm" onClick={() => joinTeam(student.team!.id)} disabled={joining}>
                {joining ? '提交中...' : '申请加入该队'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

  const rightColumn = hasQuestionnaire ? (
    <Card className="border-primary/20">
      <CardContent className="pt-6">
        <h3 className="mb-4 font-medium text-primary">Ta 的问卷</h3>
        <QuestionnaireReadOnly items={questionnaireItems} answersByItemId={answersByItemId} />
      </CardContent>
    </Card>
  ) : (
    <Card className="border-primary/20">
      <CardContent className="py-8 text-center text-muted-foreground">
        暂未填写问卷
      </CardContent>
    </Card>
  )

  return (
    <>
      <PageHeader title={`${student.name}的个人资料`} />
      <div className={cn('flex flex-col gap-6 md:flex-row md:items-start')}>
        <aside className={cn('w-full shrink-0 md:w-80 md:sticky md:top-20 md:self-start')}>
          {leftColumn}
        </aside>
        <main className={cn('min-w-0 flex-1', !hasQuestionnaire && 'md:max-w-md')}>
          {rightColumn}
        </main>
      </div>
    </>
  )
}
