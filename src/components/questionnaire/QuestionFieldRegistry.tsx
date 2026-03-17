import type { QuestionnaireItem } from '@/types/api'
import type { QuestionFieldComponent } from '@/types/questionnaire'
import { TextField, validate as validateText } from './fields/TextField'
import { NumberField, validate as validateNumber } from './fields/NumberField'
import { TextAreaField, validate as validateTextArea } from './fields/TextAreaField'
import { SelectField, validate as validateSelect } from './fields/SelectField'
import { CheckboxField, validate as validateCheckbox } from './fields/CheckboxField'

const registry: Record<string, { component: QuestionFieldComponent; validate: (item: QuestionnaireItem, value: string) => boolean }> = {
  text: { component: TextField as QuestionFieldComponent, validate: validateText },
  input: { component: TextField as QuestionFieldComponent, validate: validateText },
  number: { component: NumberField as QuestionFieldComponent, validate: validateNumber },
  integer: { component: NumberField as QuestionFieldComponent, validate: validateNumber },
  textarea: { component: TextAreaField as QuestionFieldComponent, validate: validateTextArea },
  select: { component: SelectField as QuestionFieldComponent, validate: validateSelect },
  radio: { component: SelectField as QuestionFieldComponent, validate: validateSelect },
  checkbox: { component: CheckboxField as QuestionFieldComponent, validate: validateCheckbox },
}

export function getFieldForItem(item: QuestionnaireItem): QuestionFieldComponent {
  const type = (item.type || 'text').toLowerCase()
  const entry = registry[type] ?? registry.text
  return entry.component
}

export function validateItem(item: QuestionnaireItem, value: string): boolean {
  const type = (item.type || 'text').toLowerCase()
  const entry = registry[type] ?? registry.text
  return entry.validate(item, value)
}
