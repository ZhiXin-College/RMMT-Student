import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { parseContactWords } from '@/lib/contactDisplay'
import { ArrowRight, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const MBTI_GROUPS: Record<string, string> = {
  NT: 'bg-violet-600 text-white',
  NF: 'bg-green-700 text-white',
  SJ: 'bg-blue-600 text-white',
  SP: 'bg-amber-600 text-white',
}
const NT = ['INTJ', 'INTP', 'ENTP', 'ENTJ']
const NF = ['INFJ', 'INFP', 'ENFP', 'ENFJ']
const SJ = ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ']
const SP = ['ISTP', 'ISFP', 'ESTP', 'ESFP']

function getMbtiClass(mbti?: string | null): string {
  if (!mbti) return ''
  if (NT.includes(mbti)) return MBTI_GROUPS.NT
  if (NF.includes(mbti)) return MBTI_GROUPS.NF
  if (SJ.includes(mbti)) return MBTI_GROUPS.SJ
  if (SP.includes(mbti)) return MBTI_GROUPS.SP
  return ''
}

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

function teamFlagColor(num: number, max: number): string {
  if (num === 0) return 'bg-green-500'
  if (num >= max) return 'bg-red-500'
  return 'bg-yellow-500 text-black'
}

function teamFlagText(num: number, max: number): string {
  if (num === 0) return '未组队'
  if (num >= max) return '已满员'
  return '已组队'
}

function numRounding(num: number | null | undefined): string {
  if (num == null) return '—'
  const n = parseFloat(String(num))
  return isNaN(n) ? '—' : n.toFixed(2)
}

export interface StudentCardProps {
  student: {
    id: number
    name: string
    province?: string | null
    mbti?: string | null
    contact?: string | null
    avatar_url?: string | null
    qq?: string | null
    wechat?: string | null
    score?: number | null
    team_students_num?: number
  }
  teamMaxStudentCount: number
  hideTeamFlag?: boolean
  hideScore?: boolean
  showDetailToggle?: boolean
  detailsOpen?: boolean
  onDetailsOpenChange?: (open: boolean) => void
  /** Optional AI evaluation node rendered as a fixed-height scroll area on the card back. */
  aiEvaluation?: React.ReactNode
}

export function StudentCard({
  student,
  teamMaxStudentCount,
  hideTeamFlag = false,
  hideScore = false,
  showDetailToggle = true,
  detailsOpen,
  onDetailsOpenChange,
  aiEvaluation,
}: StudentCardProps) {
  const navigate = useNavigate()
  const [internalDetailsOpen, setInternalDetailsOpen] = useState(false)
  const isDetailsOpen = detailsOpen ?? internalDetailsOpen
  const setDetailsOpen = (open: boolean) => {
    if (detailsOpen === undefined) setInternalDetailsOpen(open)
    onDetailsOpenChange?.(open)
  }
  const teamNum = student.team_students_num ?? 0
  const traits = parseContactWords(student.contact)
  const avatarSrc = getAvatarUrl(student)
  const scoreText = numRounding(student.score)
  const showScore = !hideScore && student.score != null
  const hasAi = aiEvaluation != null
  const cardHeight = hasAi ? 'h-[320px]' : 'h-[230px]'

  const openProfile = () => navigate(`/roommates/${student.id}`)

  return (
    <div className={cn('student-card-flip', isDetailsOpen && 'student-card-flip--open')}>
      <div
        className={cn(
          'card-shell group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_44px_-18px_rgba(194,94,10,0.35)]',
          cardHeight
        )}
      >
        <div className={cn('student-card-flip__inner relative', cardHeight)}>
          {/* ------------------------------ 正面 ------------------------------ */}
          <div
            className="student-card-flip__face student-card-flip__face--front flex cursor-pointer flex-col overflow-hidden rounded-2xl"
            role="button"
            tabIndex={0}
            aria-label={`${student.name}的资料`}
            onClick={openProfile}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openProfile()
              }
            }}
          >
            {/* 匹配分数水印：放大 + 低透明度作为卡片背景 */}
            {showScore && (
              <div
                aria-hidden
                className="score-watermark absolute -bottom-8 -right-3 z-0 transition-opacity duration-300 group-hover:opacity-[0.16]"
              >
                {scoreText}
              </div>
            )}

            <div className="relative z-10 flex items-start justify-between p-3.5 pb-0">
              {!hideTeamFlag ? (
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 font-grotesk text-[11px] font-semibold tracking-wide text-white shadow-sm',
                    teamFlagColor(teamNum, teamMaxStudentCount)
                  )}
                >
                  {teamFlagText(teamNum, teamMaxStudentCount)}
                </span>
              ) : (
                <span />
              )}
              {showScore && (
                <span className="numeral rounded-full border border-primary/25 bg-background/80 px-2.5 py-0.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
                  匹配 {scoreText}
                </span>
              )}
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2 px-4 pb-2 text-center">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full border-2 border-card object-cover shadow-md ring-2 ring-primary/20"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-full border-2 border-card bg-muted shadow-md ring-2 ring-primary/15" aria-hidden />
              )}
              <div className="min-w-0 space-y-1">
                <div className="max-w-full truncate font-display text-lg font-semibold tracking-tight text-foreground">
                  {student.name}
                </div>
                {traits.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {traits.map((t, i) => (
                      <span
                        key={`${i}-${t}`}
                        className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {showDetailToggle && (
              <div className="relative z-10 flex items-center justify-between px-3.5 pb-3">
                <span className="font-grotesk text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  Tap to flip
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    setDetailsOpen(true)
                  }}
                >
                  详细信息
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* ------------------------------ 背面 ------------------------------ */}
          <div className="student-card-flip__face student-card-flip__face--back flex flex-col overflow-hidden rounded-2xl bg-card p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-primary/10 pb-2">
              <span className="min-w-0 truncate font-display text-base font-semibold tracking-tight">
                {student.name}
              </span>
              {showScore && (
                <span className="numeral shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {scoreText}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-foreground/20 px-2 py-0.5 text-xs font-medium text-foreground">
                来自 {student.province ?? '—'}
              </span>
              {student.mbti ? (
                <span className={cn('rounded-full px-2 py-0.5 font-grotesk text-xs font-semibold', getMbtiClass(student.mbti))}>
                  {student.mbti}
                </span>
              ) : (
                <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground">
                  MBTI —
                </span>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs">
              <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
                <span className="font-grotesk text-[10px] uppercase tracking-wider text-muted-foreground">QQ</span>
                <div className="numeral mt-0.5 truncate font-medium text-foreground">{student.qq ?? '—'}</div>
              </div>
              <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
                <span className="font-grotesk text-[10px] uppercase tracking-wider text-muted-foreground">WeChat</span>
                <div className="numeral mt-0.5 truncate font-medium text-foreground">{student.wechat ?? '—'}</div>
              </div>
            </div>

            {/* AI 评价：固定高度滚动区，不改变卡片尺寸 */}
            {hasAi && (
              <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-primary/15 bg-muted/25 p-2.5">
                {aiEvaluation}
              </div>
            )}

            {showDetailToggle && (
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    setDetailsOpen(false)
                  }}
                >
                  <RotateCw className="mr-1 h-3 w-3" />
                  返回
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
