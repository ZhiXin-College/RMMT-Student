import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export function SelectField({ item, defaultValue = '', submitValue, disabled, isInvalid, showLabel = true }: QuestionFieldProps) {
  const { options = [] } = parseParams(item.params)

  return (
    <div className="space-y-2">
      {showLabel ? <Label className={isInvalid ? 'text-destructive' : ''}>{item.title}</Label> : null}
      <Select
        value={defaultValue || undefined}
        disabled={disabled}
        onValueChange={(value) => submitValue?.(item.id, value)}
      >
        <SelectTrigger className={isInvalid ? 'border-destructive' : ''}>
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt: string) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function validate(_item: QuestionnaireItem, value: string): boolean {
  return value.trim().length > 0
}
