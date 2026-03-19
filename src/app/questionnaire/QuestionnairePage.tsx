import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, getData } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getFieldForItem, validateItem } from '@/components/questionnaire/QuestionFieldRegistry'
import type { QuestionnaireItem, QuestionnairePage } from '@/types/api'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'

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
    <div className="flex w-full flex-grow justify-center overflow-y-auto p-4">
      <div className="w-full max-w-5xl grid gap-4 md:grid-cols-10">
        <aside className="md:col-span-3 md:sticky md:top-20 md:self-start space-y-4">
          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-2 text-sm">
              <div className="font-semibold text-base">我的资料</div>
              <div className="text-muted-foreground">姓名：{user?.name ?? '—'}</div>
              <div className="text-muted-foreground">来自：{user?.province ?? '—'}</div>
              <div className="text-muted-foreground">MBTI：{user?.mbti ?? '—'}</div>
              <div className="text-muted-foreground">标签：{user?.contact ?? '—'}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="pt-6 space-y-3">
              <div className="font-medium text-sm text-primary">分页</div>
              <div className="space-y-1">
                {pages.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                      p.id === selectedPageId ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                    }`}
                    onClick={() => setSelectedPageId(p.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="text-xs text-muted-foreground">{idx + 1}/{pages.length}</span>
                    </div>
                    {p.remark ? <div className="text-xs text-muted-foreground line-clamp-1">{p.remark}</div> : null}
                  </button>
                ))}
                {pages.length === 0 && (
                  <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    暂无分页
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="md:col-span-7">
          <div className="w-full flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-xl">
            <h1 className="text-xl font-semibold">问卷调查</h1>
            <p className="text-sm text-muted-foreground">{WEIGHT_TIPS_SHORT}</p>
            {selectedPage?.remark ? (
              <p className="text-sm text-orange-600">{selectedPage.remark}</p>
            ) : null}

            {selectedPage && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="text-lg font-semibold text-primary">{selectedPage.title}</div>
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
                    <div className="flex shrink-0 items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-muted-foreground text-xs whitespace-nowrap">权重</Label>
                        <Input
                          type="number"
                          min={0}
                          max={WEIGHT_MAX}
                          step={1}
                          className="h-8 w-16 px-2 text-sm"
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
                      <div className="h-5 w-px bg-border" />
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground whitespace-nowrap">权重占比</span>
                        <span className="font-medium">
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
