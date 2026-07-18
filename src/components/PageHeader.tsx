import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  kicker?: string
  description?: string
  className?: string
  children?: React.ReactNode
}

export function PageHeader({ title, kicker, description, className, children }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 border-b border-primary/15 pb-5 text-center sm:text-left', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {kicker && <div className="kicker mb-1.5">{kicker}</div>}
          <h1 className="page-title">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
