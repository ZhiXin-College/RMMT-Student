import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  className?: string
  children?: React.ReactNode
}

export function PageHeader({ title, className, children }: PageHeaderProps) {
  return (
    <div className={cn('mb-4 text-center sm:text-left', className)}>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  )
}
