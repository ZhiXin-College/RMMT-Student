import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { QuestionnaireItem } from '@/types/api'
import type { QuestionFieldProps } from '@/types/questionnaire'

function parseParams(params?: string): { options?: string[] } {
  try {
    if (!params) return {}
    const p = typeof params === 'string' ? JSON.parse(params) : params
    const options = p?.options ?? p?.data ?? []
    return { options: Array.isArray(options) ? options : [] }
  } catch {
    return {}
  }
}

export function CheckboxField({ item, defaultValue = '', submitValue, disabled, isInvalid }: QuestionFieldProps) {
  const { options = [] } = parseParams(item.params)
  const selected = (defaultValue ?? '') ? String(defaultValue).split(',').filter(Boolean) : []

  const toggle = (opt: string) => {
    if (disabled) return
    const next = selected.includes(opt)
      ? selected.filter((x) => x !== opt)
      : [...selected, opt]
    submitValue?.(item.id, next.join(','))
  }

  return (
    <div className="space-y-2">
      <Label className={isInvalid ? 'text-destructive' : ''}>{item.title}</Label>
      <div className="flex flex-wrap gap-4">
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <Input
              type="checkbox"
              checked={selected.includes(opt)}
              disabled={disabled}
              onChange={() => toggle(opt)}
              className="h-4 w-4"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function validate(_i: QuestionnaireItem, _v: string): boolean {
  return true
}
