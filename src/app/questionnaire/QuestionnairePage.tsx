import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, getData } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getFieldForItem, validateItem } from '@/components/questionnaire/QuestionFieldRegistry'
import type { QuestionnaireItem, QuestionnairePage } from '@/types/api'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatContactForCard } from '@/lib/contactDisplay'

interface QuestionWithWeight extends QuestionnaireItem {
  default_weight: number
  weight: number
}

const WEIGHT_TIPS_SHORT =
  '重要的问题权重调高，不重要的调低；采用相对权重计算匹配分数。'
const WEIGHT_MAX = 20

export function QuestionnairePage() {
  const { user } = useAuth()
  const [pages, setPages] = useState<QuestionnairePage[]>([])
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)
  const [pageAnswer, setPageAnswer] = useState<Record<string, { answer: unknown; weight: number }> | null>(null)
  const [questionWithWeight, setQuestionWithWeight] = useState<QuestionWithWeight[]>([]) // current page only
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({})
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const questionRefsMap = useRef<Record<string, HTMLDivElement | null>>({})

  const canSave = useCallback(() => true, [])

  const submitValue = useCallback((itemId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [itemId]: value }))
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const structureRes = await api.get('/questionnaire/structure')
        if (cancelled) return
        const data = getData<{ pages: QuestionnairePage[] }>(structureRes)
        const ps = data.pages ?? []
        setPages(ps)
        setSelectedPageId((prev) => {
          if (prev != null && ps.some((p) => p.id === prev)) return prev
          return ps.length ? ps[0].id : null
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedPageId) ?? null,
    [pages, selectedPageId]
  )
  const items = selectedPage?.items ?? []
  const totalWeight = useMemo(
    () =>
      questionWithWeight
        .filter((q) => Number(q.default_weight) >= 0)
        .reduce((sum, q) => sum + (Number.isFinite(Number(q.weight)) ? Number(q.weight) : 0), 0),
    [questionWithWeight]
  )

  // load page draft when page changes
  useEffect(() => {
    if (selectedPageId == null) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(`/questionnaire/page_answer?page_id=${selectedPageId}`)
        const data = getData<Record<string, { answer: unknown; weight: number }>>(res)
        if (cancelled) return
        setPageAnswer(data)

        const initial: Record<string, string> = {}
        Object.entries(data ?? {}).forEach(([itemId, v]) => {
          try {
            const a = v?.answer
            initial[itemId] = typeof a === 'string' ? a : JSON.stringify(a ?? '')
          } catch {
            initial[itemId] = ''
          }
        })
        setFormValues(initial)

        const withWeight: QuestionWithWeight[] = items.map((el) => {
          const saved = data?.[el.id]
          let weight = el.weight
          if (saved && typeof saved.weight === 'number') weight = saved.weight
          if (el.weight < 0) weight = el.weight
          if (weight >= 0) weight = Math.max(0, Math.min(WEIGHT_MAX, Math.round(weight)))
          return { ...el, default_weight: el.weight, weight }
        })
        setQuestionWithWeight(withWeight)
        setFormErrors({})
      } catch {
        if (!cancelled) {
          setPageAnswer({})
          setFormValues({})
          setQuestionWithWeight(
            items.map((el) => ({
              ...el,
              default_weight: el.weight,
              weight:
                el.weight >= 0
                  ? Math.max(0, Math.min(WEIGHT_MAX, Math.round(el.weight)))
                  : el.weight,
            }))
          )
          setFormErrors({})
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedPageId, items])

  const validateForm = useCallback((): { valid: boolean; firstErrorId: string | null } => {
    const err: Record<string, boolean> = {}
    items.forEach((item) => {
      const value = formValues[item.id] ?? ''
      if (!validateItem(item, value)) err[item.id] = true
    })
    setFormErrors(err)
    const firstErrorId = items.find((i) => err[i.id])?.id ?? null
    return { valid: Object.keys(err).length === 0, firstErrorId }
  }, [items, formValues])

  const save = useCallback(async () => {
    if (!canSave()) return
    if (selectedPageId == null) return
    const { valid, firstErrorId } = validateForm()
    if (!valid && firstErrorId) {
      setTimeout(() => {
        questionRefsMap.current[firstErrorId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }
    const payload: Record<string, { answer: unknown; weight: number }> = {}
    questionWithWeight.forEach((q) => {
      const value = formValues[q.id]
      payload[q.id] = { answer: value ?? '', weight: q.weight }
    })
    setSaving(true)
    try {
      getData(await api.post('/questionnaire/page_answer', { page_id: selectedPageId, answers: payload }))
      setPageAnswer(payload)
    } finally {
      setSaving(false)
    }
  }, [canSave, selectedPageId, questionWithWeight, formValues, items, validateForm])

  // 切换分页时窗口回到顶部：侧栏 sticky 的自然位与吸附位重合，不会上下跳动
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [selectedPageId])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const pageIndex = pages.findIndex((p) => p.id === selectedPageId)
  const canPrev = pageIndex > 0
  const canNext = pageIndex >= 0 && pageIndex < pages.length - 1

  return (
    <div className="w-full">
      <div className="w-full grid gap-6 md:grid-cols-10">
        {/* 侧栏：sticky 固定在最上方；切换分页时窗口回顶部，侧栏视觉位置不变 */}
        <aside className="space-y-5 md:col-span-3 md:sticky md:top-24 md:self-start">
          <div className="card-shell p-5">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="section-title !text-base">我的资料</span>
              <span className="kicker !text-[10px]">Me</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">姓名</span><span className="font-medium">{user?.name ?? '—'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">来自</span><span className="font-medium">{user?.province ?? '—'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">MBTI</span><span className="font-grotesk font-medium">{user?.mbti ?? '—'}</span></div>
              <div className="flex justify-between gap-2"><span className="shrink-0 text-muted-foreground">标签</span><span className="truncate text-right font-medium">{formatContactForCard(user?.contact) || '—'}</span></div>
            </div>
          </div>

          <div className="card-shell p-5">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="section-title !text-base">分页</span>
              <span className="kicker !text-[10px]">Pages</span>
            </div>
            <div className="space-y-1.5">
              {pages.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    p.id === selectedPageId
                      ? 'border-primary/50 bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/25 hover:bg-muted/40'
                  }`}
                  onClick={() => setSelectedPageId(p.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{p.title}</span>
                    <span className="numeral text-xs text-muted-foreground">{idx + 1}/{pages.length}</span>
                  </div>
                  {p.remark ? <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{p.remark}</div> : null}
                </button>
              ))}
              {pages.length === 0 && (
                <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                  暂无分页
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="md:col-span-7">
          <div
            key={selectedPageId ?? 'empty'}
            className="questionnaire-fade card-shell flex w-full flex-col gap-6 p-6 sm:p-7"
          >
            <div>
              <div className="kicker mb-1.5">Questionnaire</div>
              <h1 className="page-title !text-2xl sm:!text-3xl">问卷调查</h1>
              <p className="mt-2 text-sm text-muted-foreground">{WEIGHT_TIPS_SHORT}</p>
            </div>
            {selectedPage?.remark ? (
              <p className="rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-sm text-orange-700">{selectedPage.remark}</p>
            ) : null}

            {selectedPage && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="font-display text-lg font-semibold tracking-tight text-primary">{selectedPage.title}</div>
              </div>
            )}

            {items.map((item) => {
          const Field = getFieldForItem(item)
          const defaultValue = formValues[item.id] ?? ''
          const qWithWeight = questionWithWeight.find((q) => q.id === item.id)
          const showWeight = qWithWeight != null && Number(qWithWeight.default_weight) >= 0
          return (
            <div
              key={item.id}
              ref={(el) => {
                questionRefsMap.current[item.id] = el
              }}
              className="rounded-lg border border-transparent p-3 data-[invalid]:border-destructive"
              data-invalid={formErrors[item.id] ? true : undefined}
            >
              <div className="space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <Label className={formErrors[item.id] ? 'text-destructive' : ''}>
                    {item.title}
                  </Label>
                  {showWeight && qWithWeight && (
                    <div className="flex shrink-0 items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-muted-foreground text-xs whitespace-nowrap">权重</Label>
                        <Input
                          type="number"
                          min={0}
                          max={WEIGHT_MAX}
                          step={1}
                          className="numeral h-7 w-14 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                          value={qWithWeight.weight}
                          disabled={!canSave()}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            setQuestionWithWeight((prev) =>
                              prev.map((x) =>
                                x.id === item.id
                                  ? {
                                      ...x,
                                      weight: Number.isNaN(v)
                                        ? 0
                                        : Math.max(0, Math.min(WEIGHT_MAX, v)),
                                    }
                                  : x
                              )
                            )
                          }}
                        />
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground whitespace-nowrap">占比</span>
                        <span className="numeral font-semibold text-primary">
                          {totalWeight > 0 ? `${Math.round((qWithWeight.weight / totalWeight) * 100)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Field
                    item={item}
                    defaultValue={defaultValue}
                    submitValue={submitValue}
                    disabled={!canSave()}
                    isInvalid={formErrors[item.id]}
                    showLabel={false}
                  />
                </div>
              </div>
            </div>
          )
        })}

            <div className="flex flex-col gap-2 pt-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canPrev}
                  onClick={() => {
                    if (pageIndex > 0) setSelectedPageId(pages[pageIndex - 1].id)
                  }}
                >
                  上一页
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canNext}
                  onClick={() => {
                    if (pageIndex >= 0 && pageIndex < pages.length - 1) setSelectedPageId(pages[pageIndex + 1].id)
                  }}
                >
                  下一页
                </Button>
                <Button
                  type="button"
                  onClick={save}
                  disabled={!canSave() || saving || selectedPageId == null}
                  title={!canSave() ? '当前不在问卷开放时间内' : undefined}
                  className="ml-auto"
                >
                  {saving ? '保存中...' : '保存本页'}
                </Button>
              </div>
              {pageAnswer && (
                <span className="text-xs text-muted-foreground">
                  已按页保存草稿（切换分页不会丢失）
                </span>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
