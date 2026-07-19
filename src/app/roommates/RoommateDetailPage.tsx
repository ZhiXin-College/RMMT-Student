import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, getData } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { PageHeader } from '@/components/PageHeader'
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
    <div className="space-y-5">
      <div className="card-shell relative overflow-hidden p-5">
        {student.score != null && (
          <div aria-hidden className="score-watermark score-watermark--sm absolute -bottom-6 -right-3 z-0">
            {Number(student.score).toFixed(2)}
          </div>
        )}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full border-2 border-card object-cover shadow-md ring-2 ring-primary/20"
              />
            ) : (
              <div className="h-20 w-20 shrink-0 rounded-full border-2 border-card bg-muted shadow-md ring-2 ring-primary/15" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-2xl font-semibold tracking-tight">{student.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {student.province && (
                  <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-xs">来自 {student.province}</span>
                )}
                {student.mbti && (
                  <span className="rounded-full bg-primary/90 px-2 py-0.5 font-grotesk text-xs font-semibold text-primary-foreground">
                    {student.mbti}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              组队状态：
              {student.team_id == null ? (
                <span className="font-medium text-green-600">未组队</span>
              ) : teamStudentCount >= teamMax ? (
                <span className="font-medium text-red-600">已组队 满员</span>
              ) : (
                <span className="font-medium text-primary">已组队</span>
              )}
            </span>
            {student.score != null && (
              <span className="text-muted-foreground">
                匹配指数：<span className="numeral font-semibold text-primary">{Number(student.score).toFixed(2)}</span>
              </span>
            )}
          </div>

          {traits.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {traits.map((t, i) => (
                <span key={`${i}-${t}`} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <span className="font-grotesk text-[10px] uppercase tracking-wider text-muted-foreground">QQ</span>
              <div className="numeral mt-0.5 truncate text-sm font-medium text-foreground">{student.qq ?? '—'}</div>
            </div>
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <span className="font-grotesk text-[10px] uppercase tracking-wider text-muted-foreground">WeChat</span>
              <div className="numeral mt-0.5 truncate text-sm font-medium text-foreground">{student.wechat ?? '—'}</div>
            </div>
          </div>

          {user?.team_id == null && user?.id !== student.id && student.team_id == null && (
            <Button size="sm" className="w-full rounded-xl" onClick={invite} disabled={inviting}>
              {inviting ? '发送中...' : '与他组队'}
            </Button>
          )}
        </div>
      </div>

      {student.team && (
        <div className="card-shell p-5">
          <div className="mb-3 flex items-baseline gap-2">
            <h3 className="section-title !text-base">Ta 的队伍</h3>
            <span className="numeral rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {teamStudentCount}/{teamMax}
            </span>
          </div>
          <div className="space-y-3">
            {teammates.map((s) => (
              <StudentCard
                key={s.id}
                student={{ ...s, team_students_num: teamStudentCount }}
                teamMaxStudentCount={teamMax}
              />
            ))}
          </div>
          {user?.team_id == null && user?.id !== student.id && teamStudentCount < teamMax && (
            <Button className="mt-4 w-full rounded-xl" variant="outline" size="sm" onClick={() => joinTeam(student.team!.id)} disabled={joining}>
              {joining ? '提交中...' : '申请加入该队'}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  const rightColumn = hasQuestionnaire ? (
    <div className="card-shell p-6">
      <div className="mb-4 flex items-baseline gap-3">
        <h3 className="section-title">Ta 的问卷</h3>
        <span className="kicker !text-[10px]">Questionnaire</span>
        <div className="h-px flex-1 bg-primary/15" aria-hidden />
      </div>
      <QuestionnaireReadOnly items={questionnaireItems} answersByItemId={answersByItemId} />
    </div>
  ) : (
    <div className="card-shell border-dashed py-12 text-center text-muted-foreground">
      暂未填写问卷
    </div>
  )

  return (
    <>
      <PageHeader kicker="Profile" title={`${student.name}的个人资料`} />
      <div className={cn('flex flex-col gap-6 md:flex-row md:items-start')}>
        <aside className={cn('w-full shrink-0 md:w-80 md:sticky md:top-24 md:self-start')}>
          {leftColumn}
        </aside>
        <main className={cn('min-w-0 flex-1', !hasQuestionnaire && 'md:max-w-md')}>
          {rightColumn}
        </main>
      </div>
    </>
  )
}
