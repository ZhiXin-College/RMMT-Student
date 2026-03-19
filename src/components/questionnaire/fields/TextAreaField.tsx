import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

export function TextAreaField({ item, defaultValue = '', submitValue, disabled, isInvalid, showLabel = true }: QuestionFieldProps) {
  const { placeholder } = parseParams(item.params)
  const value = defaultValue ?? ''
  return (
    <div className="space-y-2">
      {showLabel ? <Label className={isInvalid ? 'text-destructive' : ''}>{item.title}</Label> : null}
      <Textarea
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className={isInvalid ? 'border-destructive' : ''}
        onChange={(e) => submitValue?.(item.id, e.target.value)}
      />
    </div>
  )
}

export function validate(_i: QuestionnaireItem, _v: string): boolean {
  return true
}
