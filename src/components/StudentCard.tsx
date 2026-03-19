import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
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

function getTraits(contact?: string | null): string[] {
  if (!contact || contact.length < 15) return []
  return contact.split(/[,，;；]/).map((t) => t.trim()).filter(Boolean)
}

function simpleHash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(16)
}

function resolveAssetUrl(url?: string | null): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
  if (url.startsWith('/')) return `${base}${url}`
  return `${base}/${url}`
}

function getAvatarUrl(student: { avatar_url?: string | null; qq?: string | null; id: number }): string {
  const custom = resolveAssetUrl(student.avatar_url)
  if (custom) return custom
  if (student.qq && student.qq.length > 0) {
    return `https://q.qlogo.cn/headimg_dl?dst_uin=${student.qq}&spec=640`
  }
  const email = `${new Date().getFullYear()}rmmp.${student.id}@chacuo.net`
  return `https://gravatar.loli.net/avatar/${simpleHash(email)}?d=retro`
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
}

export function StudentCard({ student, teamMaxStudentCount }: StudentCardProps) {
  const teamNum = student.team_students_num ?? 0
  const traits = getTraits(student.contact)

  return (
    <Link to={`/roommates/${student.id}`} className="block">
      <Card className="min-h-[180px] cursor-pointer border-primary/20 transition-shadow hover:shadow-md hover:border-primary/40">
        <CardContent className="relative flex flex-col gap-3 p-4">
          <div className={cn('absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-medium text-white', teamFlagColor(teamNum, teamMaxStudentCount))}>
            {teamFlagText(teamNum, teamMaxStudentCount)}
          </div>
          <div className="absolute right-2 top-2 rounded border border-sky-200 bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
            匹配分数 {numRounding(student.score)}
          </div>
          <div className="flex gap-3 pt-6">
            <img
              src={getAvatarUrl(student)}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
            />
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
              {traits.map((t) => (
                <span key={t} className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-800 dark:bg-orange-500/20 dark:text-orange-200">
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
