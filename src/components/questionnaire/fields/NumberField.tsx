import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { QuestionnaireItem } from '@/types/api'
import type { QuestionFieldProps } from '@/types/questionnaire'

export function NumberField({ item, defaultValue = '', submitValue, disabled, isInvalid }: QuestionFieldProps) {
  const value = defaultValue ?? ''
  return (
    <div className="space-y-2">
      <Label className={isInvalid ? 'text-destructive' : ''}>{item.title}</Label>
      <Input
        type="number"
        value={value}
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
