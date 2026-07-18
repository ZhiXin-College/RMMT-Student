import { useEffect, useMemo, useRef, useState } from 'react'
import { LoaderCircle, Search, SlidersHorizontal, UserPlus, X } from 'lucide-react'
import { api, getData } from '@/lib/api'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { PageHeader } from '@/components/PageHeader'
import { StudentCard } from '@/components/StudentCard'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PROVINCES, MBTI_OPTIONS } from '@/lib/provinces'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
interface RoommateStudent {
  id: number
  name: string
  avatar_url?: string
  contact?: string
  qq?: string
  wechat?: string
  province?: string
  mbti?: string
  score?: number
  team_students_num?: number
}

interface AiTrait {
  text: string
  highlight?: string
}

interface AiExplanation {
  mode: 'general' | 'search_context'
  summary: string
  matched_traits: AiTrait[]
  mismatched_traits: AiTrait[]
  suggested_questions: string[]
}

interface AiSearchResult {
  student_id: number
  ai_score: number
  reason: string
  highlights: string[]
  match_score?: number
  score?: number
}

interface DormTeam {
  candidate_key: string
  team_id?: number | null
  virtual: boolean
  member_count: number
  match_score: number
  score?: number
  members: RoommateStudent[]
}

interface AiDormSearchResult {
  candidate_key: string
  ai_score: number
  reason: string
  highlights: string[]
  match_score?: number
  score?: number
}

type MatchMode = 'personal' | 'dorm'

function canShowForTeamFilter(student: RoommateStudent, teamMax: number) {
  const teamNum = Number(student.team_students_num)
  if (!Number.isFinite(teamNum)) return false
  return teamNum < teamMax
}

function renderHighlighted(text: string, highlight?: string) {
  const key = highlight?.trim()
  if (!key || !text.includes(key)) return text
  const parts = text.split(key)
  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 && <strong>{key}</strong>}
    </span>
  ))
}

function useCompletionFlip(isLoading?: boolean, hasResult?: boolean) {
  const wasLoading = useRef(false)
  const [flipKey, setFlipKey] = useState(0)

  useEffect(() => {
    if (wasLoading.current && !isLoading && hasResult) {
      setFlipKey((value) => value + 1)
    }
    wasLoading.current = !!isLoading
  }, [hasResult, isLoading])

  return flipKey
}

function SearchLimitNote({
  matchMode,
  searchName,
  searchProvince,
  searchMbti,
  onlyUnteamed,
  activeAiQuery,
  aiCandidateLimit,
}: {
  matchMode: MatchMode
  searchName: string
  searchProvince: string
  searchMbti: string
  onlyUnteamed: boolean
  activeAiQuery: string
  aiCandidateLimit: number
}) {
  const filters = []
  const name = searchName.trim()
  if (matchMode === 'personal') {
    if (name) filters.push(<>姓名 <strong>{name}</strong></>)
    if (searchProvince) filters.push(<>来自 <strong>{searchProvince}</strong></>)
    if (searchMbti) filters.push(<>MBTI <strong>{searchMbti}</strong></>)
    if (onlyUnteamed) filters.push(<>仅未组队/未满员</>)
  }

  return (
    <div className="text-sm leading-relaxed text-muted-foreground" aria-label="搜索限制">
      搜索限制：
      {filters.length > 0 ? (
        <>
          已筛选
          {filters.map((item, index) => (
            <span key={index}>
              {index > 0 ? '、' : ''}
              {item}
            </span>
          ))}
          ；
        </>
      ) : (
        '未设置筛选条件；'
      )}
      {activeAiQuery ? (
        <>
          已 AI 搜索 <strong className="text-foreground">{activeAiQuery}</strong>，
        </>
      ) : (
        '已按匹配分数从高到低，'
      )}
      范围为当前{matchMode === 'dorm' ? '宿舍匹配' : '筛选后的推荐匹配'}前 {aiCandidateLimit} {matchMode === 'dorm' ? '组' : '人'}
    </div>
  )
}

function AiEvaluationBody({
  explanation,
  loadingExplanation,
  aiScore,
  flipKey,
  scroll = false,
  expanded = false,
}: {
  explanation?: AiExplanation
  loadingExplanation?: boolean
  aiScore?: number
  flipKey: number
  scroll?: boolean
  expanded?: boolean
}) {
  const matchedTraits = explanation?.matched_traits ?? []
  const mismatchedTraits = explanation?.mismatched_traits ?? []

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="kicker !text-[10px]">AI 评价</span>
        {aiScore != null && (
          <span className="numeral rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            相关度 {aiScore}
          </span>
        )}
      </div>
      {loadingExplanation && !explanation ? (
        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          生成中...
        </div>
      ) : explanation ? (
        <div
          key={flipKey}
          className={cn(
            'ai-evaluation-card space-y-2.5 text-xs leading-relaxed',
            flipKey > 0 && 'ai-evaluation-card--flip',
            scroll ? 'ai-scroll' : 'min-h-0 overflow-hidden',
            !scroll && !expanded && 'max-h-[110px]'
          )}
        >
          {explanation.summary && (
            <p className="text-foreground/90">{explanation.summary}</p>
          )}
          {matchedTraits.length > 0 && (
            <div>
              <div className="mb-1 font-grotesk text-[10px] font-semibold uppercase tracking-[0.14em] text-green-700">
                契合点
              </div>
              <ul className="space-y-1 text-muted-foreground">
                {matchedTraits.map((item, index) => (
                  <li key={index}>· {renderHighlighted(item.text, item.highlight)}</li>
                ))}
              </ul>
            </div>
          )}
          {mismatchedTraits.length > 0 && (
            <div>
              <div className="mb-1 font-grotesk text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-700">
                需要沟通
              </div>
              <ul className="space-y-1 text-muted-foreground">
                {mismatchedTraits.map((item, index) => (
                  <li key={index}>· {renderHighlighted(item.text, item.highlight)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="py-1 text-xs text-muted-foreground">AI解释暂不可用</div>
      )}
    </div>
  )
}

function RecommendedMatchCard({
  student,
  teamMaxStudentCount,
  explanation,
  loadingExplanation,
  aiSearchResult,
}: {
  student: RoommateStudent
  teamMaxStudentCount: number
  explanation?: AiExplanation
  loadingExplanation?: boolean
  aiSearchResult?: AiSearchResult
}) {
  const flipKey = useCompletionFlip(loadingExplanation, !!explanation)

  return (
    <StudentCard
      student={student}
      teamMaxStudentCount={teamMaxStudentCount}
      aiEvaluation={
        <AiEvaluationBody
          explanation={explanation}
          loadingExplanation={loadingExplanation}
          aiScore={aiSearchResult?.ai_score}
          flipKey={flipKey}
          scroll
        />
      }
    />
  )
}

function resolveAvatarUrl(url?: string | null): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : ''
  if (url.startsWith('/')) return `${base}${url}`
  return `${base}/${url}`
}

function RecommendedDormTeamCard({
  team,
  teamMaxStudentCount,
  explanation,
  loadingExplanation,
  aiSearchResult,
}: {
  team: DormTeam
  teamMaxStudentCount: number
  explanation?: AiExplanation
  loadingExplanation?: boolean
  aiSearchResult?: AiDormSearchResult
}) {
  const [expanded, setExpanded] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const matchedTraits = explanation?.matched_traits ?? []
  const mismatchedTraits = explanation?.mismatched_traits ?? []
  const canExpand = matchedTraits.length + mismatchedTraits.length > 2
  const flipKey = useCompletionFlip(loadingExplanation, !!explanation)

  const emptySlots = Math.max(0, teamMaxStudentCount - team.member_count)
  const rawScore = team.match_score ?? team.score
  const scoreNum = rawScore == null ? null : Number(rawScore)
  const scoreText = scoreNum == null || Number.isNaN(scoreNum) ? null : scoreNum.toFixed(2)

  return (
    <div className="card-shell group relative overflow-hidden p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_18px_44px_-18px_rgba(194,94,10,0.35)]">
      {/* 匹配分数水印 */}
      {scoreText && (
        <div aria-hidden className="score-watermark score-watermark--sm absolute -right-4 -top-6 z-0">
          {scoreText}
        </div>
      )}

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* 成员头像重叠堆叠 + 空位圆圈 */}
          <div className="avatar-stack" aria-label={`宿舍成员 ${team.member_count} 人`}>
            {team.members.map((member) => {
              const src = resolveAvatarUrl(member.avatar_url)
              return src ? (
                <img
                  key={member.id}
                  src={src}
                  alt={member.name}
                  title={member.name}
                  className="avatar-stack__item"
                />
              ) : (
                <span
                  key={member.id}
                  title={member.name}
                  className="avatar-stack__item flex items-center justify-center bg-primary/10 font-display text-base font-semibold text-primary"
                >
                  {member.name.slice(0, 1)}
                </span>
              )
            })}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <span
                key={`empty-${i}`}
                title="虚位以待"
                aria-label="还可加入"
                className="avatar-stack__empty"
              >
                <UserPlus className="h-4 w-4" />
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold tracking-tight text-foreground">
              {team.virtual ? '未组队同学' : `候选宿舍 #${team.team_id}`}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="numeral font-medium">{team.member_count} / {teamMaxStudentCount} 人</span>
              {emptySlots > 0 && <span className="text-primary/80">还可加入 {emptySlots} 人</span>}
              {scoreText && <span className="numeral text-primary">匹配 {scoreText}</span>}
            </div>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-full px-3.5 text-xs"
          onClick={() => setDetailsOpen((open) => !open)}
        >
          {detailsOpen ? '收起' : '详细信息'}
        </Button>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {team.members.map((member) => (
          <StudentCard
            key={member.id}
            student={member}
            teamMaxStudentCount={teamMaxStudentCount}
            hideTeamFlag
            showDetailToggle={false}
            detailsOpen={detailsOpen}
          />
        ))}
      </div>

      <div className="relative z-10 mt-4 rounded-xl border border-primary/15 bg-muted/25 p-3.5">
        <AiEvaluationBody
          explanation={explanation}
          loadingExplanation={loadingExplanation}
          aiScore={aiSearchResult?.ai_score}
          flipKey={flipKey}
          expanded={expanded}
        />
        {canExpand && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 h-7 self-start px-2 text-xs"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '收起' : '展开'}
          </Button>
        )}
      </div>
    </div>
  )
}

export function RoommatesPage() {
  const { user } = useAuth()
  const { settings } = useSystemSettings()
  const [matchMode, setMatchMode] = useState<MatchMode>('personal')
  const [withScore, setWithScore] = useState<RoommateStudent[]>([])
  const [noScore, setNoScore] = useState<RoommateStudent[]>([])
  const [dormTeams, setDormTeams] = useState<DormTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [dormLoading, setDormLoading] = useState(true)
  const [onlyUnteamed, setOnlyUnteamed] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [searchProvince, setSearchProvince] = useState<string>('')
  const [searchMbti, setSearchMbti] = useState<string>('')
  const [aiSearch, setAiSearch] = useState('')
  const [searchSettingsOpen, setSearchSettingsOpen] = useState(false)
  const [choiceWeight, setChoiceWeight] = useState('0.7')
  const [textWeight, setTextWeight] = useState('0.3')
  const [aiCandidateLimit, setAiCandidateLimit] = useState('30')
  const [activeAiQuery, setActiveAiQuery] = useState('')
  const [aiSearching, setAiSearching] = useState(false)
  const [aiSearchError, setAiSearchError] = useState('')
  const [aiOrderedIds, setAiOrderedIds] = useState<number[]>([])
  const [aiResultById, setAiResultById] = useState<Record<number, AiSearchResult>>({})
  const [aiOrderedTeamKeys, setAiOrderedTeamKeys] = useState<string[]>([])
  const [aiResultByTeamKey, setAiResultByTeamKey] = useState<Record<string, AiDormSearchResult>>({})
  const [explanations, setExplanations] = useState<Record<string, AiExplanation>>({})
  const [loadingExplanationIds, setLoadingExplanationIds] = useState<Record<string, boolean>>({})
  const explanationsRef = useRef<Record<string, AiExplanation>>({})
  const requestedExplanationKeys = useRef<Set<string>>(new Set())
  const failedExplanationKeys = useRef<Set<string>>(new Set())
  const [pageSize, setPageSize] = useState(16)
  const [currentPage, setCurrentPage] = useState(1)

  const configuredTeamMax = settings?.team_max_student_count != null ? Number(settings.team_max_student_count) : 4
  const teamMax = Number.isFinite(configuredTeamMax) && configuredTeamMax > 0 ? configuredTeamMax : 4
  const choiceWeightNumber = Number(choiceWeight)
  const textWeightNumber = Number(textWeight)
  const aiCandidateLimitNumber = Number(aiCandidateLimit)
  const weightsAreNumbers = Number.isFinite(choiceWeightNumber) && Number.isFinite(textWeightNumber)
  const weightsSum = weightsAreNumbers ? choiceWeightNumber + textWeightNumber : NaN
  const weightsValid = weightsAreNumbers && choiceWeightNumber >= 0 && textWeightNumber >= 0 && Math.abs(weightsSum - 1) < 0.001
  const aiCandidateLimitValid = Number.isInteger(aiCandidateLimitNumber) && aiCandidateLimitNumber > 0
  const searchSettingsError = !weightsValid
    ? '选择题权重与文本题权重之和必须等于 1'
    : !aiCandidateLimitValid
      ? 'AI搜索范围必须是大于 0 的整数'
      : ''

  useEffect(() => {
    if (activeAiQuery) return
    let cancelled = false
    setDormLoading(true)
    ;(async () => {
      try {
        // Default dorm view: precomputed matching_scores.
        const res = await api.get('/team/recommend_dorm_teams', {
          params: { score_source: 'stored' },
        })
        const data = getData<{ teams_with_score: DormTeam[] }>(res)
        if (cancelled) return
        setDormTeams(data.teams_with_score ?? [])
      } finally {
        if (!cancelled) setDormLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id, activeAiQuery])

  useEffect(() => {
    setActiveAiQuery('')
    setAiOrderedIds([])
    setAiResultById({})
    setAiOrderedTeamKeys([])
    setAiResultByTeamKey({})
    setExplanations({})
    explanationsRef.current = {}
    requestedExplanationKeys.current.clear()
    failedExplanationKeys.current.clear()
    // Default personal view + restore after leaving AI-search context: matching_scores.
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await api.get('/team/recommend_teammates')
        if (cancelled) return
        const personal = getData<{ students_with_score: RoommateStudent[]; students_with_no_score: RoommateStudent[] }>(res)
        setWithScore(personal.students_with_score ?? [])
        setNoScore((personal.students_with_no_score ?? []).filter((s) => s.id !== user?.id))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [choiceWeight, textWeight, matchMode, user?.id])

  const filteredWithScore = useMemo(() => {
    if (!onlyUnteamed) return withScore
    return withScore.filter((s) => canShowForTeamFilter(s, teamMax))
  }, [withScore, onlyUnteamed, teamMax])

  const filteredNoScore = useMemo(() => {
    if (!onlyUnteamed) return noScore
    return noScore.filter((s) => canShowForTeamFilter(s, teamMax))
  }, [noScore, onlyUnteamed, teamMax])

  const filteredWithScoreByFields = useMemo(() => {
    let list = filteredWithScore
    const name = searchName.trim().toLowerCase()
    if (name) list = list.filter((s) => s.name.toLowerCase().includes(name))
    if (searchProvince) list = list.filter((s) => (s.province ?? '') === searchProvince)
    if (searchMbti) {
      list = list.filter((s) => {
        const m = (s.mbti ?? '').trim()
        if (searchMbti === '未知') return m === '未知'
        return m.toUpperCase() === searchMbti.toUpperCase()
      })
    }
    return list
  }, [filteredWithScore, searchName, searchProvince, searchMbti])

  const filteredNoScoreByFields = useMemo(() => {
    let list = filteredNoScore
    const name = searchName.trim().toLowerCase()
    if (name) list = list.filter((s) => s.name.toLowerCase().includes(name))
    if (searchProvince) list = list.filter((s) => (s.province ?? '') === searchProvince)
    if (searchMbti) {
      list = list.filter((s) => {
        const m = (s.mbti ?? '').trim()
        if (searchMbti === '未知') return m === '未知'
        return m.toUpperCase() === searchMbti.toUpperCase()
      })
    }
    return list
  }, [filteredNoScore, searchName, searchProvince, searchMbti])

  const filteredForSearch = useMemo(() => {
    if (activeAiQuery) {
      const byId = new Map(filteredWithScoreByFields.map((s) => [s.id, s]))
      return aiOrderedIds.map((id) => byId.get(id)).filter((s): s is RoommateStudent => !!s)
    }
    return [...filteredWithScoreByFields, ...filteredNoScoreByFields]
  }, [activeAiQuery, aiOrderedIds, filteredNoScoreByFields, filteredWithScoreByFields])

  const filteredDormTeamsForSearch = useMemo(() => {
    if (activeAiQuery) {
      const byKey = new Map(dormTeams.map((team) => [team.candidate_key, team]))
      return aiOrderedTeamKeys.map((key) => byKey.get(key)).filter((team): team is DormTeam => !!team)
    }
    return dormTeams
  }, [activeAiQuery, aiOrderedTeamKeys, dormTeams])

  const withScoreIds = useMemo(() => new Set(filteredWithScore.map((s) => s.id)), [filteredWithScore])
  const activeTotalCount = matchMode === 'dorm' ? filteredDormTeamsForSearch.length : filteredForSearch.length
  const totalPages = Math.ceil(activeTotalCount / pageSize) || 1
  const start = (currentPage - 1) * pageSize
  const paginatedPage = useMemo(
    () => filteredForSearch.slice(start, start + pageSize),
    [filteredForSearch, pageSize, start]
  )
  const paginatedDormTeams = useMemo(
    () => filteredDormTeamsForSearch.slice(start, start + pageSize),
    [filteredDormTeamsForSearch, pageSize, start]
  )
  const paginatedWithScore = useMemo(
    () => paginatedPage.filter((s) => withScoreIds.has(s.id)),
    [paginatedPage, withScoreIds]
  )
  const paginatedNoScore = useMemo(
    () => paginatedPage.filter((s) => !withScoreIds.has(s.id)),
    [paginatedPage, withScoreIds]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchName, searchProvince, searchMbti, activeAiQuery, onlyUnteamed, pageSize, matchMode])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    explanationsRef.current = explanations
  }, [explanations])

  useEffect(() => {
    if (matchMode !== 'personal') return
    if (!weightsValid) return
    const queue = paginatedWithScore
      .map((s) => ({ student: s, key: `${s.id}:${activeAiQuery}` }))
      .filter(({ key }) => (
        !explanationsRef.current[key] &&
        !requestedExplanationKeys.current.has(key) &&
        !failedExplanationKeys.current.has(key)
      ))
    if (queue.length === 0) return

    const run = async () => {
      let index = 0
      const worker = async () => {
        while (index < queue.length) {
          const item = queue[index++]
          if (
            explanationsRef.current[item.key] ||
            requestedExplanationKeys.current.has(item.key) ||
            failedExplanationKeys.current.has(item.key)
          ) continue
          requestedExplanationKeys.current.add(item.key)
          setLoadingExplanationIds((prev) => ({ ...prev, [item.key]: true }))
          try {
            const data = getData<AiExplanation>(await api.post('/ai/match_explanation', {
              target_student_id: item.student.id,
              search_query: activeAiQuery || undefined,
              search_highlights: aiResultById[item.student.id]?.highlights ?? [],
              numeric_weight: choiceWeightNumber,
              text_weight: textWeightNumber,
            }))
            explanationsRef.current = { ...explanationsRef.current, [item.key]: data }
            setExplanations((prev) => ({ ...prev, [item.key]: data }))
          } catch {
            failedExplanationKeys.current.add(item.key)
            // 单个解释失败不影响列表和其他解释。
          } finally {
            requestedExplanationKeys.current.delete(item.key)
            setLoadingExplanationIds((prev) => {
              const next = { ...prev }
              delete next[item.key]
              return next
            })
          }
        }
      }
      await Promise.all([worker(), worker(), worker()])
    }
    run()
  }, [activeAiQuery, aiResultById, paginatedWithScore, weightsValid, choiceWeightNumber, textWeightNumber, matchMode])

  useEffect(() => {
    if (matchMode !== 'dorm') return
    if (!weightsValid) return
    const queue = paginatedDormTeams
      .map((team) => ({ team, key: `${team.candidate_key}:${activeAiQuery}` }))
      .filter(({ key }) => (
        !explanationsRef.current[key] &&
        !requestedExplanationKeys.current.has(key) &&
        !failedExplanationKeys.current.has(key)
      ))
    if (queue.length === 0) return

    const run = async () => {
      let index = 0
      const worker = async () => {
        while (index < queue.length) {
          const item = queue[index++]
          if (
            explanationsRef.current[item.key] ||
            requestedExplanationKeys.current.has(item.key) ||
            failedExplanationKeys.current.has(item.key)
          ) continue
          requestedExplanationKeys.current.add(item.key)
          setLoadingExplanationIds((prev) => ({ ...prev, [item.key]: true }))
          try {
            const data = getData<AiExplanation>(await api.post('/ai/team_match_explanation', {
              candidate_key: item.team.candidate_key,
              search_query: activeAiQuery || undefined,
              search_highlights: aiResultByTeamKey[item.team.candidate_key]?.highlights ?? [],
              numeric_weight: choiceWeightNumber,
              text_weight: textWeightNumber,
            }))
            explanationsRef.current = { ...explanationsRef.current, [item.key]: data }
            setExplanations((prev) => ({ ...prev, [item.key]: data }))
          } catch {
            failedExplanationKeys.current.add(item.key)
          } finally {
            requestedExplanationKeys.current.delete(item.key)
            setLoadingExplanationIds((prev) => {
              const next = { ...prev }
              delete next[item.key]
              return next
            })
          }
        }
      }
      await Promise.all([worker(), worker()])
    }
    run()
  }, [activeAiQuery, aiResultByTeamKey, paginatedDormTeams, weightsValid, choiceWeightNumber, textWeightNumber, matchMode])

  const runAiSearch = async () => {
    const query = aiSearch.trim()
    if (!query) return
    if (searchSettingsError) {
      setAiSearchError(searchSettingsError)
      return
    }
    setAiSearching(true)
    setAiSearchError('')
    try {
      if (matchMode === 'dorm') {
        const candidateKeys = dormTeams.map((team) => team.candidate_key)
        const data = getData<{
          query: string
          results: AiDormSearchResult[]
          teams?: DormTeam[]
        }>(await api.post('/ai/search_dorm_teams', {
          query,
          candidate_keys: candidateKeys,
          candidate_limit: aiCandidateLimitNumber,
          numeric_weight: choiceWeightNumber,
          text_weight: textWeightNumber,
        }))
        // Switch dorm list to realtime questionnaire scores returned by AI search.
        if (data.teams && data.teams.length > 0) {
          const teamMap = new Map(data.teams.map((team) => [team.candidate_key, team]))
          data.results.forEach((item) => {
            const team = teamMap.get(item.candidate_key)
            if (team && item.match_score != null) {
              teamMap.set(item.candidate_key, {
                ...team,
                match_score: item.match_score,
                score: item.match_score,
              })
            }
          })
          setDormTeams(Array.from(teamMap.values()))
        } else {
          setDormTeams((prev) => {
            const byKey = new Map(prev.map((team) => [team.candidate_key, team]))
            return data.results
              .map((item) => {
                const team = byKey.get(item.candidate_key)
                if (!team) return null
                if (item.match_score == null) return team
                return { ...team, match_score: item.match_score, score: item.match_score }
              })
              .filter((team): team is DormTeam => !!team)
          })
        }
        const resultMap: Record<string, AiDormSearchResult> = {}
        data.results.forEach((item) => { resultMap[item.candidate_key] = item })
        setAiResultByTeamKey(resultMap)
        setAiOrderedTeamKeys(data.results.map((item) => item.candidate_key))
      } else {
        const candidateIds = [
          ...filteredWithScoreByFields.map((s) => s.id),
          ...filteredNoScoreByFields.map((s) => s.id),
        ].slice(0, aiCandidateLimitNumber)
        const data = getData<{
          query: string
          results: Array<AiSearchResult & { match_score?: number; score?: number }>
        }>(await api.post('/ai/search_roommates', {
          query,
          candidate_ids: candidateIds,
          candidate_limit: aiCandidateLimitNumber,
          numeric_weight: choiceWeightNumber,
          text_weight: textWeightNumber,
        }))
        // Update displayed match scores to realtime values from AI search.
        const scoreById = new Map(
          data.results
            .filter((item) => item.match_score != null || item.score != null)
            .map((item) => [item.student_id, Number(item.match_score ?? item.score)])
        )
        setWithScore((prev) => {
          const byId = new Map(prev.map((s) => [s.id, s]))
          data.results.forEach((item) => {
            const existing = byId.get(item.student_id)
            const nextScore = scoreById.get(item.student_id)
            if (existing) {
              byId.set(item.student_id, nextScore == null ? existing : { ...existing, score: nextScore })
            }
          })
          // Prefer AI order for scored list; keep only students that still have a score.
          const ordered = data.results
            .map((item) => byId.get(item.student_id))
            .filter((s): s is RoommateStudent => !!s && s.score != null)
          const leftover = prev.filter((s) => !data.results.some((r) => r.student_id === s.id))
          return [...ordered, ...leftover]
        })
        setNoScore((prev) => prev.filter((s) => !scoreById.has(s.id)))
        const resultMap: Record<number, AiSearchResult> = {}
        data.results.forEach((item) => { resultMap[item.student_id] = item })
        setAiResultById(resultMap)
        setAiOrderedIds(data.results.map((item) => item.student_id))
      }
      setActiveAiQuery(query)
    } catch (err) {
      setAiSearchError(err instanceof Error ? err.message : 'AI搜索失败')
    } finally {
      setAiSearching(false)
    }
  }

  const clearAiSearch = () => {
    setAiSearch('')
    setActiveAiQuery('')
    setAiSearchError('')
    setAiOrderedIds([])
    setAiResultById({})
    setAiOrderedTeamKeys([])
    setAiResultByTeamKey({})
    // Reload stored matching_scores after clearing AI search.
    void (async () => {
      try {
        setLoading(true)
        setDormLoading(true)
        const [personalRes, dormRes] = await Promise.all([
          api.get('/team/recommend_teammates'),
          api.get('/team/recommend_dorm_teams', { params: { score_source: 'stored' } }),
        ])
        const personal = getData<{ students_with_score: RoommateStudent[]; students_with_no_score: RoommateStudent[] }>(personalRes)
        const dorm = getData<{ teams_with_score: DormTeam[] }>(dormRes)
        setWithScore(personal.students_with_score ?? [])
        setNoScore((personal.students_with_no_score ?? []).filter((s) => s.id !== user?.id))
        setDormTeams(dorm.teams_with_score ?? [])
      } finally {
        setLoading(false)
        setDormLoading(false)
      }
    })()
  }

  if ((matchMode === 'personal' && loading) || (matchMode === 'dorm' && dormLoading)) {
    return <div className="py-8 text-center text-muted-foreground">加载中...</div>
  }

  return (
    <>
      <PageHeader
        kicker="Match Hall"
        title="舍友大厅"
        description="根据问卷与 AI 分析为你推荐合拍的同学与宿舍，点击卡片翻转查看详细信息。"
      />

      {/* 搜索与筛选 */}
      <div className="card-shell mb-8 p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-primary/20 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setMatchMode('personal')}
                className={cn(
                  'rounded-full px-4 py-1.5 font-grotesk text-sm font-medium transition-all',
                  matchMode === 'personal'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                匹配个人
              </button>
              <button
                type="button"
                onClick={() => setMatchMode('dorm')}
                className={cn(
                  'rounded-full px-4 py-1.5 font-grotesk text-sm font-medium transition-all',
                  matchMode === 'dorm'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                匹配宿舍
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">每页</Label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="numeral h-8 rounded-full border bg-background px-2.5 text-xs"
              >
                {[8, 16, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {matchMode === 'personal' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_auto]">
              <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
                <Label className="shrink-0 text-xs text-muted-foreground">姓名</Label>
                <Input
                  placeholder="搜索姓名"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-7 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
                <Label className="shrink-0 text-xs text-muted-foreground">来自</Label>
                <Select value={searchProvince || '_all'} onValueChange={(v) => setSearchProvince(v === '_all' ? '' : v)}>
                  <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-sm shadow-none focus:ring-0">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">全部</SelectItem>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
                <Label className="shrink-0 text-xs text-muted-foreground">MBTI</Label>
                <Select value={searchMbti || '_all'} onValueChange={(v) => setSearchMbti(v === '_all' ? '' : v)}>
                  <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-sm shadow-none focus:ring-0">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">全部</SelectItem>
                    {MBTI_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border bg-background px-3 py-2">
                <input
                  type="checkbox"
                  checked={onlyUnteamed}
                  onChange={(e) => setOnlyUnteamed(e.target.checked)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                <span className="whitespace-nowrap text-xs">仅未组队/未满员</span>
              </label>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border bg-background px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-primary/70" />
                <Input
                  value={aiSearch}
                  onChange={(e) => setAiSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runAiSearch()
                  }}
                  placeholder="AI 搜索：例如「向我推荐早起的舍友」"
                  className="h-7 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
              <Button
                size="sm"
                className="h-10 rounded-xl px-4"
                onClick={runAiSearch}
                disabled={aiSearching || !aiSearch.trim() || !!searchSettingsError}
              >
                {aiSearching ? <LoaderCircle className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
                搜索
              </Button>
              {activeAiQuery && (
                <Button size="sm" variant="outline" className="h-10 rounded-xl" onClick={clearAiSearch}>
                  <X className="mr-1 h-4 w-4" />
                  清空
                </Button>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={() => setSearchSettingsOpen((v) => !v)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                搜索设置
              </Button>
            </div>
            {searchSettingsOpen && (
              <div className="grid gap-3 rounded-xl border border-primary/15 bg-muted/30 p-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">选择题权重</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={choiceWeight}
                    onChange={(e) => setChoiceWeight(e.target.value)}
                    className="numeral h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">文本题权重</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={textWeight}
                    onChange={(e) => setTextWeight(e.target.value)}
                    className="numeral h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">AI搜索范围</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={aiCandidateLimit}
                    onChange={(e) => setAiCandidateLimit(e.target.value)}
                    className="numeral h-9"
                  />
                  <div className="text-xs text-muted-foreground">
                    匹配分数前 x {matchMode === 'dorm' ? '组' : '人'}，建议 30；太长会导致搜索时间变长
                  </div>
                </div>
                <div className="sm:col-span-3">
                  {searchSettingsError ? (
                    <div className="text-sm text-red-600">{searchSettingsError}</div>
                  ) : (
                    <div className="numeral text-xs text-muted-foreground">
                      当前权重和：{weightsSum.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-l-2 border-primary/30 pl-3">
            <SearchLimitNote
              matchMode={matchMode}
              searchName={searchName}
              searchProvince={searchProvince}
              searchMbti={searchMbti}
              onlyUnteamed={onlyUnteamed}
              activeAiQuery={activeAiQuery}
              aiCandidateLimit={aiCandidateLimitNumber}
            />
          </div>
          {aiSearchError && <div className="text-sm text-red-600">{aiSearchError}</div>}
        </div>
      </div>

      {matchMode === 'personal' && filteredForSearch.length === 0 && (
        <div className="card-shell mb-8 border-dashed py-12 text-center text-muted-foreground">
          未找到匹配同学，可调整筛选条件
        </div>
      )}

      {matchMode === 'dorm' && filteredDormTeamsForSearch.length === 0 && (
        <div className="card-shell mb-8 border-dashed py-12 text-center text-muted-foreground">
          未找到可匹配宿舍
        </div>
      )}

      {matchMode === 'personal' && paginatedWithScore.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline gap-3">
            <h3 className="section-title">匹配个人</h3>
            <span className="numeral rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {filteredWithScore.filter((s) => filteredForSearch.some((f) => f.id === s.id)).length} 人
            </span>
            <div className="hidden h-px flex-1 bg-primary/15 sm:block" aria-hidden />
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4">
            {paginatedWithScore.map((s) => (
              <RecommendedMatchCard
                key={s.id}
                student={s}
                teamMaxStudentCount={teamMax}
                explanation={explanations[`${s.id}:${activeAiQuery}`]}
                loadingExplanation={loadingExplanationIds[`${s.id}:${activeAiQuery}`]}
                aiSearchResult={aiResultById[s.id]}
              />
            ))}
          </div>
        </section>
      )}

      {matchMode === 'dorm' && paginatedDormTeams.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline gap-3">
            <h3 className="section-title">匹配宿舍</h3>
            <span className="numeral rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {filteredDormTeamsForSearch.length} 组
            </span>
            <div className="hidden h-px flex-1 bg-primary/15 sm:block" aria-hidden />
          </div>
          <div className="grid gap-5">
            {paginatedDormTeams.map((team) => (
              <RecommendedDormTeamCard
                key={team.candidate_key}
                team={team}
                teamMaxStudentCount={teamMax}
                explanation={explanations[`${team.candidate_key}:${activeAiQuery}`]}
                loadingExplanation={loadingExplanationIds[`${team.candidate_key}:${activeAiQuery}`]}
                aiSearchResult={aiResultByTeamKey[team.candidate_key]}
              />
            ))}
          </div>
        </section>
      )}

      {matchMode === 'personal' && paginatedNoScore.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-baseline gap-3">
            <h3 className="section-title">其他同学</h3>
            <span className="numeral rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {filteredNoScore.filter((s) => filteredForSearch.some((f) => f.id === s.id)).length} 人
            </span>
            <div className="hidden h-px flex-1 bg-primary/15 sm:block" aria-hidden />
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {paginatedNoScore.map((s) => (
              <StudentCard key={s.id} student={s} teamMaxStudentCount={teamMax} />
            ))}
          </div>
        </section>
      )}

      {activeTotalCount > 0 && totalPages > 1 && (
        <div className="card-shell flex flex-wrap items-center justify-center gap-3 py-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="numeral text-sm text-muted-foreground">
            {currentPage} / {totalPages}（共 {activeTotalCount} {matchMode === 'dorm' ? '组' : '人'}）
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </>
  )
}
