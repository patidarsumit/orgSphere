export const emptyDoc = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export const extractTextFromTiptap = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''

  const record = node as { text?: unknown; content?: unknown }
  const ownText = typeof record.text === 'string' ? record.text : ''
  const children = Array.isArray(record.content)
    ? record.content.map(extractTextFromTiptap).join(' ')
    : ''

  return `${ownText} ${children}`.replace(/\s+/g, ' ').trim()
}

export const formatRelativeNoteDate = (value: string) => {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60_000))

  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'Yesterday'

  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export const formatSavedTime = (value?: string | Date | null) => {
  const date = value ? new Date(value) : new Date()
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
