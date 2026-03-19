import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { QuestionnaireItem } from '@/types/api'
import type { QuestionFieldProps } from '@/types/questionnaire'

function parseParams(params?: string): { placeholder?: string } {
  try {
    if (!params) return {}
    return typeof params === 'string' ? JSON.parse(params) : params
  } catch {
    return {}
  }
}

export function TextField({ item, defaultValue = '', submitValue, disabled, isInvalid, showLabel = true }: QuestionFieldProps) {
  const { placeholder } = parseParams(item.params)
  const value = defaultValue ?? ''

  return (
    <div className="space-y-2">
      {showLabel ? <Label className={isInvalid ? 'text-destructive' : ''}>{item.title}</Label> : null}
      <Input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className={isInvalid ? 'border-destructive' : ''}
        onChange={(e) => submitValue?.(item.id, e.target.value)}
      />
    </div>
  )
}

export function validate(_item: QuestionnaireItem, _value: string): boolean {
  return true
}
