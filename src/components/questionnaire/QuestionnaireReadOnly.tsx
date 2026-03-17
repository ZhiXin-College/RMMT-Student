import { getFieldForItem } from '@/components/questionnaire/QuestionFieldRegistry'
import type { QuestionnaireItem } from '@/types/api'

interface QuestionnaireReadOnlyProps {
  items: QuestionnaireItem[]
  answersByItemId: Record<string, string>
}

export function QuestionnaireReadOnly({ items, answersByItemId }: QuestionnaireReadOnlyProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const Field = getFieldForItem(item)
        const value = answersByItemId[item.id] ?? ''
        return (
          <div key={item.id} className="space-y-1">
            <Field
              item={item}
              defaultValue={value}
              disabled={true}
              isInvalid={false}
            />
          </div>
        )
      })}
    </div>
  )
}
