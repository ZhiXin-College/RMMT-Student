import type { ReactNode } from 'react'
import type { QuestionnaireItem } from './api'

export type SubmitValueFn = (itemId: string, value: string) => void

export interface QuestionFieldProps {
  item: QuestionnaireItem
  defaultValue?: string
  submitValue?: SubmitValueFn
  disabled?: boolean
  isInvalid?: boolean
}

export interface QuestionFieldComponent {
  (props: QuestionFieldProps): ReactNode
  validate?: (item: QuestionnaireItem, value: string) => boolean
}
