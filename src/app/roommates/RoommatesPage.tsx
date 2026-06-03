import { useEffect, useMemo, useRef, useState } from 'react'
import { LoaderCircle, Search, SlidersHorizontal, X } from 'lucide-react'
import { api, getData } from '@/lib/api'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { PageHeader } from '@/components/PageHeader'
import { StudentCard } from '@/components/StudentCard'
import { Card, CardContent } from '@/components/ui/card'
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
  const [expanded, setExpanded] = useState(false)
  const matchedTraits = explanation?.matched_traits ?? []
  const mismatchedTraits = explanation?.mismatched_traits ?? []
  const canExpand = matchedTraits.length + mismatchedTraits.length > 2
  const flipKey = useCompletionFlip(loadingExplanation, !!explanation)

  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(150px,0.7fr)]">
      <StudentCard student={student} teamMaxStudentCount={teamMaxStudentCount} />
      <div
        key={flipKey}
        className={cn(
          'ai-evaluation-card flex flex-col rounded-md border border-primary/15 bg-muted/20 p-3 text-sm',
          flipKey > 0 && 'ai-evaluation-card--flip',
          expanded ? 'min-h-[220px]' : 'h-[220px]'
        )}
        aria-label="AI评价"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="font-medium text-primary">AI评价</span>
          {aiSearchResult && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
              相关度 {aiSearchResult.ai_score}
            </span>
          )}
        </div>
        {loadingExplanation && !explanation ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            生成中...
          </div>
        ) : explanation ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className={cn('min-h-0 space-y-2 overflow-hidden', expanded ? 'overflow-visible' : 'max-h-[145px]')}>
            {explanation.summary && (
              <p className="leading-relaxed text-foreground">
                {explanation.summary.length > 50 ? `${explanation.summary.slice(0, 50)}...` : explanation.summary}
              </p>
            )}
            {matchedTraits.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-green-700">契合点</div>
                <ul className="space-y-1 text-muted-foreground">
                  {matchedTraits.map((item, index) => (
                    <li key={index}>· {renderHighlighted(item.text, item.highlight)}</li>
                  ))}
                </ul>
              </div>
            )}
            {mismatchedTraits.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-orange-700">需要沟通</div>
                <ul className="space-y-1 text-muted-foreground">
                  {mismatchedTraits.map((item, index) => (
                    <li key={index}>· {renderHighlighted(item.text, item.highlight)}</li>
                  ))}
                </ul>
              </div>
            )}
            </div>
            {canExpand && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-auto h-7 self-start px-2 text-xs"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? '收起' : '展开'}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground">AI解释暂不可用</div>
        )}
      </div>
    </div>
  )
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

  return (
    <div className="rounded-md border border-primary/15 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-2">
        <div className="text-sm font-medium text-primary">
          {team.virtual ? '未组队同学' : `候选宿舍 #${team.team_id}`} · {team.member_count}人
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => setDetailsOpen((open) => !open)}
        >
          {detailsOpen ? '收起' : '详细信息'}
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
      <div
        key={flipKey}
        className={cn(
          'ai-evaluation-card mt-3 flex flex-col rounded-md border border-primary/15 bg-muted/20 p-3 text-sm',
          flipKey > 0 && 'ai-evaluation-card--flip',
          expanded ? 'min-h-[160px]' : 'h-[180px]'
        )}
        aria-label="AI评价"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="font-medium text-primary">AI评价</span>
          {aiSearchResult && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
              相关度 {aiSearchResult.ai_score}
            </span>
          )}
        </div>
        {loadingExplanation && !explanation ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            生成中...
          </div>
        ) : explanation ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className={cn('min-h-0 space-y-2 overflow-hidden', expanded ? 'overflow-visible' : 'max-h-[110px]')}>
              {explanation.summary && (
                <p className="leading-relaxed text-foreground">
                  {explanation.summary.length > 50 ? `${explanation.summary.slice(0, 50)}...` : explanation.summary}
                </p>
              )}
              {matchedTraits.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-green-700">契合点</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {matchedTraits.map((item, index) => (
                      <li key={index}>· {renderHighlighted(item.text, item.highlight)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {mismatchedTraits.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-orange-700">需要沟通</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {mismatchedTraits.map((item, index) => (
                      <li key={index}>· {renderHighlighted(item.text, item.highlight)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {canExpand && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-auto h-7 self-start px-2 text-xs"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? '收起' : '展开'}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground">AI解释暂不可用</div>
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
    if (!weightsValid) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/team/recommend_teammates', {
          params: {
            algorithm: 'v2',
            numeric_weight: choiceWeightNumber,
            text_weight: textWeightNumber,
          },
        })
        const data = getData<{ students_with_score: RoommateStudent[]; students_with_no_score: RoommateStudent[] }>(res)
        if (cancelled) return
        setWithScore(data.students_with_score ?? [])
        const noScoreList = (data.students_with_no_score ?? []).filter((s) => s.id !== user?.id)
        setNoScore(noScoreList)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [choiceWeightNumber, textWeightNumber, user?.id, weightsValid])

  useEffect(() => {
    if (!weightsValid) return
    let cancelled = false
    setDormLoading(true)
    ;(async () => {
      try {
        const res = await api.get('/team/recommend_dorm_teams', {
          params: {
            numeric_weight: choiceWeightNumber,
            text_weight: textWeightNumber,
          },
        })
        const data = getData<{ teams_with_score: DormTeam[] }>(res)
        if (cancelled) return
        setDormTeams(data.teams_with_score ?? [])
      } finally {
        if (!cancelled) setDormLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [choiceWeightNumber, textWeightNumber, weightsValid])

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
  }, [choiceWeight, textWeight, matchMode])

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
        const data = getData<{ query: string; results: AiDormSearchResult[] }>(await api.post('/ai/search_dorm_teams', {
          query,
          candidate_keys: candidateKeys,
          candidate_limit: aiCandidateLimitNumber,
          numeric_weight: choiceWeightNumber,
          text_weight: textWeightNumber,
        }))
        const resultMap: Record<string, AiDormSearchResult> = {}
        data.results.forEach((item) => { resultMap[item.candidate_key] = item })
        setAiResultByTeamKey(resultMap)
        setAiOrderedTeamKeys(data.results.map((item) => item.candidate_key))
      } else {
        const candidateIds = filteredWithScoreByFields.map((s) => s.id)
        const data = getData<{ query: string; results: AiSearchResult[] }>(await api.post('/ai/search_roommates', {
          query,
          candidate_ids: candidateIds,
          candidate_limit: aiCandidateLimitNumber,
        }))
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
  }

  if ((matchMode === 'personal' && loading) || (matchMode === 'dorm' && dormLoading)) {
    return <div className="py-8 text-center text-muted-foreground">加载中...</div>
  }

  return (
    <>
      <PageHeader title="舍友大厅" />
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="inline-flex w-fit rounded-md border border-primary/20 p-1">
            <Button
              type="button"
              size="sm"
              variant={matchMode === 'personal' ? 'default' : 'ghost'}
              onClick={() => setMatchMode('personal')}
            >
              匹配个人
            </Button>
            <Button
              type="button"
              size="sm"
              variant={matchMode === 'dorm' ? 'default' : 'ghost'}
              onClick={() => setMatchMode('dorm')}
            >
              匹配宿舍
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {matchMode === 'personal' && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-sm shrink-0">姓名</Label>
                  <Input
                    placeholder="搜索姓名"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="h-9 w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm shrink-0">来自</Label>
                  <Select value={searchProvince || '_all'} onValueChange={(v) => setSearchProvince(v === '_all' ? '' : v)}>
                    <SelectTrigger className="h-9 w-40">
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
                <div className="flex items-center gap-2">
                  <Label className="text-sm shrink-0">MBTI</Label>
                  <Select value={searchMbti || '_all'} onValueChange={(v) => setSearchMbti(v === '_all' ? '' : v)}>
                    <SelectTrigger className="h-9 w-32">
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyUnteamed}
                    onChange={(e) => setOnlyUnteamed(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">仅显示未组队/未满员</span>
                </label>
              </>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Label className="text-sm">每页</Label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-9 rounded border px-2 text-sm"
              >
                {[8, 16, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm shrink-0">ai搜索</Label>
              <Input
                value={aiSearch}
                onChange={(e) => setAiSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runAiSearch()
                }}
                placeholder="例如：向我推荐早起的舍友"
                className="h-9 max-w-xl flex-1"
              />
              <Button size="sm" onClick={runAiSearch} disabled={aiSearching || !aiSearch.trim() || !!searchSettingsError}>
                {aiSearching ? <LoaderCircle className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
                搜索
              </Button>
              {activeAiQuery && (
                <Button size="sm" variant="outline" onClick={clearAiSearch}>
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
                className="h-8 px-2 text-xs"
                onClick={() => setSearchSettingsOpen((v) => !v)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                搜索设置
              </Button>
            </div>
            {searchSettingsOpen && (
              <div className="ml-auto grid max-w-3xl gap-3 rounded-md border border-primary/15 bg-muted/20 p-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">选择题权重</Label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={choiceWeight}
                    onChange={(e) => setChoiceWeight(e.target.value)}
                    className="h-9"
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
                    className="h-9"
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
                    className="h-9"
                  />
                  <div className="text-xs text-muted-foreground">
                    匹配分数前 x {matchMode === 'dorm' ? '组' : '人'}，建议 30；太长会导致搜索时间变长
                  </div>
                </div>
                <div className="sm:col-span-3">
                  {searchSettingsError ? (
                    <div className="text-sm text-red-600">{searchSettingsError}</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      当前权重和：{weightsSum.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <SearchLimitNote
            matchMode={matchMode}
            searchName={searchName}
            searchProvince={searchProvince}
            searchMbti={searchMbti}
            onlyUnteamed={onlyUnteamed}
            activeAiQuery={activeAiQuery}
            aiCandidateLimit={aiCandidateLimitNumber}
          />
          {aiSearchError && <div className="text-sm text-red-600">{aiSearchError}</div>}
        </CardContent>
      </Card>

      {matchMode === 'personal' && filteredForSearch.length === 0 && (
        <Card className="mb-6">
          <CardContent className="py-8 text-center text-muted-foreground">
            未找到匹配同学，可调整筛选条件
          </CardContent>
        </Card>
      )}

      {matchMode === 'dorm' && filteredDormTeamsForSearch.length === 0 && (
        <Card className="mb-6">
          <CardContent className="py-8 text-center text-muted-foreground">
            未找到可匹配宿舍
          </CardContent>
        </Card>
      )}

      {matchMode === 'personal' && paginatedWithScore.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="mb-4 border-b border-primary/30 pb-2 text-lg font-medium text-primary">
              匹配个人 ({filteredWithScore.filter((s) => filteredForSearch.some((f) => f.id === s.id)).length}人)
            </h3>
            <div className="grid gap-4 lg:grid-cols-2">
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
          </CardContent>
        </Card>
      )}

      {matchMode === 'dorm' && paginatedDormTeams.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="mb-4 border-b border-primary/30 pb-2 text-lg font-medium text-primary">
              匹配宿舍 ({filteredDormTeamsForSearch.length}组)
            </h3>
            <div className="grid gap-4">
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
          </CardContent>
        </Card>
      )}

      {matchMode === 'personal' && paginatedNoScore.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="mb-4 border-b border-primary/30 pb-2 text-lg font-medium text-primary">
              其他同学 ({filteredNoScore.filter((s) => filteredForSearch.some((f) => f.id === s.id)).length}人)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedNoScore.map((s) => (
                <StudentCard key={s.id} student={s} teamMaxStudentCount={teamMax} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTotalCount > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}（共 {activeTotalCount} {matchMode === 'dorm' ? '组' : '人'}）
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              下一页
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}
