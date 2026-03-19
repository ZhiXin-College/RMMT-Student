/** 主页「三个词」每个词最多字符数（与输入框 maxLength 一致） */
export const CONTACT_WORD_MAX_CHARS = 12

/**
 * 「自我描述」contact 字段：存库可用分号等分隔；展示时只显示词，不显示分隔符。
 * 同时兼容历史数据（斜杠、逗号等）。
 */
export function parseContactWords(contact: string | null | undefined): string[] {
  if (!contact?.trim()) return []
  return contact
    .split(/[,，;；/／|｜]+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

/** 资料卡、主页等只展示三个词，用空格连接 */
export function formatContactForCard(contact: string | null | undefined): string {
  const parts = parseContactWords(contact)
  return parts.length ? parts.join(' ') : '—'
}

/** 编辑表单：拆成三个框（最多取前三个词） */
export function parseContactToThree(raw: string): [string, string, string] {
  const w = parseContactWords(raw)
  return [w[0] ?? '', w[1] ?? '', w[2] ?? '']
}

export function joinThreeContact(a: string, b: string, c: string): string {
  const clip = (x: string) => x.trim().slice(0, CONTACT_WORD_MAX_CHARS)
  return [clip(a), clip(b), clip(c)].join(';')
}
