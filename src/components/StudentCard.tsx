import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
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
}

export function StudentCard({ student, teamMaxStudentCount, hideTeamFlag = false }: StudentCardProps) {
  const teamNum = student.team_students_num ?? 0
  const traits = parseContactWords(student.contact)
  const avatarSrc = getAvatarUrl(student)

  return (
    <Link to={`/roommates/${student.id}`} className="block">
      <Card className="min-h-[180px] cursor-pointer border-primary/20 transition-shadow hover:shadow-md hover:border-primary/40">
        <CardContent className="relative flex flex-col gap-3 p-4">
          {!hideTeamFlag && (
            <div className={cn('absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-medium text-white', teamFlagColor(teamNum, teamMaxStudentCount))}>
              {teamFlagText(teamNum, teamMaxStudentCount)}
            </div>
          )}
          <div className="absolute right-2 top-2 rounded border border-sky-200 bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
            匹配分数 {numRounding(student.score)}
          </div>
          <div className="flex gap-3 pt-6">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
              />
            ) : (
              <div
                className="h-16 w-16 shrink-0 rounded-full bg-muted sm:h-20 sm:w-20"
                aria-hidden
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground truncate">{student.name}</div>
              {student.province && (
                <div className="text-xs text-muted-foreground truncate">来自 {student.province}</div>
              )}
              {student.mbti && (
                <span className={cn('mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium', getMbtiClass(student.mbti))}>
                  {student.mbti}
                </span>
              )}
            </div>
          </div>
          {traits.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {traits.map((t, i) => (
                <span key={`${i}-${t}`} className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-800 dark:bg-orange-500/20 dark:text-orange-200">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-2 text-xs text-muted-foreground">
            <span>QQ {student.qq ?? '—'}</span>
            <span>微信 {student.wechat ?? '—'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
