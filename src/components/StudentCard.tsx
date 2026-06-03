import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { parseContactWords } from '@/lib/contactDisplay'
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
}

export function StudentCard({
  student,
  teamMaxStudentCount,
  hideTeamFlag = false,
  hideScore = false,
  showDetailToggle = true,
  detailsOpen,
  onDetailsOpenChange,
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
  const teamFlag = !hideTeamFlag && (
    <div className={cn('rounded px-2 py-0.5 text-xs font-medium text-white', teamFlagColor(teamNum, teamMaxStudentCount))}>
      {teamFlagText(teamNum, teamMaxStudentCount)}
    </div>
  )
  const scoreBadge = (
    <div className="rounded border border-sky-200 bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
      匹配分数 {numRounding(student.score)}
    </div>
  )
  const provinceText = student.province && (
    <span className="inline-block max-w-full truncate rounded border border-black px-1.5 py-0.5 text-xs font-medium text-foreground">
      来自 {student.province}
    </span>
  )
  const mbtiBadge = student.mbti && (
    <span className={cn('mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium', getMbtiClass(student.mbti))}>
      {student.mbti}
    </span>
  )
  const traitBadges = traits.length > 0 && (
    <div className="flex flex-wrap gap-1">
      {traits.map((t, i) => (
        <span key={`${i}-${t}`} className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-800 dark:bg-orange-500/20 dark:text-orange-200">
          {t}
        </span>
      ))}
    </div>
  )
  const contactInfo = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-2 text-xs text-muted-foreground">
      <span>QQ {student.qq ?? '—'}</span>
      <span>微信 {student.wechat ?? '—'}</span>
    </div>
  )
  const openProfile = () => navigate(`/roommates/${student.id}`)

  return (
    <div className={cn('student-card-flip', isDetailsOpen && 'student-card-flip--open')}>
      <Card className="min-h-[220px] border-primary/20 transition-shadow hover:border-primary/40 hover:shadow-md">
        <CardContent className="student-card-flip__inner relative min-h-[220px] p-0">
          <div
            className="student-card-flip__face flex min-h-[220px] cursor-pointer flex-col gap-3 p-4"
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
            {teamFlag && <div className="absolute left-4 top-4">{teamFlag}</div>}
            <div className="flex flex-1 flex-col items-center justify-center gap-3 pt-2 text-center">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="h-20 w-20 shrink-0 rounded-full bg-muted"
                  aria-hidden
                />
              )}
              <div className="space-y-1">
                <div className="max-w-full truncate text-lg font-semibold text-foreground">{student.name}</div>
                {traitBadges}
              </div>
            </div>
            {showDetailToggle && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="ml-auto mt-auto h-7 px-2 text-xs"
                onClick={(event) => {
                  event.stopPropagation()
                  setDetailsOpen(true)
                }}
              >
                详细信息
              </Button>
            )}
          </div>
          <div className="student-card-flip__face student-card-flip__face--back flex min-h-[220px] flex-col gap-2 p-4">
            {!hideScore && (
              <div className="flex flex-wrap items-center gap-2">
                {scoreBadge}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {provinceText ?? (
                <span className="inline-block rounded border border-black px-1.5 py-0.5 text-xs font-medium text-foreground">
                  来自 —
                </span>
              )}
              {mbtiBadge ?? <span className="text-xs text-muted-foreground">—</span>}
            </div>
            <div>{contactInfo}</div>
            {showDetailToggle && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="ml-auto mt-auto h-7 px-2 text-xs"
                onClick={() => setDetailsOpen(false)}
              >
                收起
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
