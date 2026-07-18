import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  PartyPopper,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TourStep {
  icon: React.ComponentType<{ className?: string }>
  kicker: string
  title: string
  body: React.ReactNode
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="leading-relaxed text-zinc-300">{children}</span>
    </li>
  )
}

const STEPS: TourStep[] = [
  {
    icon: Sparkles,
    kicker: 'Welcome',
    title: '欢迎来到 RMMT 舍友匹配',
    body: (
      <ul className="space-y-2.5 text-sm">
        <Point>系统会根据你的<b className="text-zinc-100">问卷答案</b>计算与其他同学的匹配分数</Point>
        <Point>AI 会为每位推荐同学生成<b className="text-zinc-100">契合点 / 需要沟通</b>的分析</Point>
        <Point>找到合拍的同学后，可以直接发起<b className="text-zinc-100">组队邀请</b></Point>
        <Point>只需三步：完善资料 → 填写问卷 → 去大厅匹配</Point>
      </ul>
    ),
  },
  {
    icon: UserRound,
    kicker: 'Step 1 · 主页',
    title: '先完善你的个人资料',
    body: (
      <ul className="space-y-2.5 text-sm">
        <Point>在「主页」右上角<b className="text-zinc-100">点击圆形头像</b>即可上传头像</Point>
        <Point>填写 QQ / Wechat，这是舍友联系你的唯一方式</Point>
        <Point>选择省份与 MBTI，再用<b className="text-zinc-100">三个词</b>描述自己</Point>
        <Point>这些信息都会展示在舍友大厅你的专属卡片上</Point>
      </ul>
    ),
  },
  {
    icon: ClipboardList,
    kicker: 'Step 2 · 问卷',
    title: '认真填写问卷，它决定匹配分数',
    body: (
      <ul className="space-y-2.5 text-sm">
        <Point>问卷按左侧分页填写，<b className="text-zinc-100">每页都可以单独保存</b>，切换不丢失</Point>
        <Point>每题的<b className="text-zinc-100">权重</b>代表它在心中的重要程度，会直接改变匹配结果</Point>
        <Point>越重要的生活习惯问题，记得把权重调高</Point>
        <Point>填完所有分页后，匹配分数才会更准确</Point>
      </ul>
    ),
  },
  {
    icon: UsersRound,
    kicker: 'Step 3 · 舍友大厅',
    title: '在大厅遇见合拍的舍友',
    body: (
      <ul className="space-y-2.5 text-sm">
        <Point>「匹配个人」按匹配分数排序，<b className="text-zinc-100">点「详细信息」翻转卡片</b>查看省份、MBTI、联系方式与 AI 评价</Point>
        <Point>点击卡片正面可进入对方主页，查看完整问卷并发起组队</Point>
        <Point>「匹配宿舍」直接推荐整组人选：头像堆叠展示成员，<b className="text-zinc-100">虚线空圈 = 还可加入</b></Point>
        <Point>支持姓名 / 省份 / MBTI 筛选，也可以试试 <b className="text-zinc-100">AI 搜索</b>：「向我推荐早起的舍友」</Point>
      </ul>
    ),
  },
  {
    icon: UsersRound,
    kicker: 'Step 4 · 组队',
    title: '组队入住一间宿舍',
    body: (
      <ul className="space-y-2.5 text-sm">
        <Point>在对方主页点击<b className="text-zinc-100">「与他组队」</b>发出邀请，或申请加入已有的队伍</Point>
        <Point>在「组队请求」页处理你收到与发出的邀请和申请</Point>
        <Point>组队成功后进入「我的组队」，可查看队友与入队申请</Point>
        <Point>宿舍满员后队伍将自动锁定</Point>
      </ul>
    ),
  },
  {
    icon: PartyPopper,
    kicker: 'All Set',
    title: '准备好了，开始吧！',
    body: (
      <ul className="space-y-2.5 text-sm">
        <Point>建议现在就去「主页」上传头像、补全联系方式</Point>
        <Point>然后完成问卷，匹配分数马上为你计算</Point>
        <Point>这份指引随时可以重新查看：点击导航栏右侧<b className="text-zinc-100">你的名字 → 新手指引</b></Point>
      </ul>
    ),
  },
]

export function OnboardingTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const handleClose = useCallback(() => {
    setStep(0)
    onClose()
  }, [onClose])

  // 打开时锁定背景滚动，ESC 关闭
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowRight') setStep((s) => Math.min(STEPS.length - 1, s + 1))
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, handleClose])

  if (!open) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="新手指引"
      onClick={handleClose}
    >
      <div
        className="questionnaire-fade relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部装饰光斑 */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />

        <button
          type="button"
          onClick={handleClose}
          aria-label="关闭指引"
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-7 pb-6 pt-8 sm:px-9">
          <div className="kicker mb-3 !text-primary/90">
            {current.kicker} · {step + 1}/{STEPS.length}
          </div>

          <div key={step} className="questionnaire-fade">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
              {current.title}
            </h2>
            <div className="mt-4 min-h-[132px]">{current.body}</div>
          </div>

          {/* 步骤圆点 */}
          <div className="mt-2 flex items-center justify-center gap-1.5" aria-label={`第 ${step + 1} 步，共 ${STEPS.length} 步`}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`跳到第 ${i + 1} 步`}
                onClick={() => setStep(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                )}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            >
              跳过指引
            </Button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-full border-white/15 bg-transparent text-zinc-200 hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  上一步
                </Button>
              )}
              {isLast ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    handleClose()
                    navigate('/guide')
                  }}
                >
                  去完善资料
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                >
                  下一步
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
