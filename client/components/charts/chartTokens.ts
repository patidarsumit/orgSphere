export const chartPalette = [
  '#3525cd',
  '#0f766e',
  '#d97706',
  '#2563eb',
  '#7c3aed',
  '#16a34a',
  '#dc2626',
  '#64748b',
]

export const statusColorByKey: Record<string, string> = {
  active: '#16a34a',
  completed: '#2563eb',
  on_hold: '#d97706',
  planned: '#7c3aed',
  archived: '#64748b',
  todo: '#64748b',
  in_progress: '#2563eb',
  review: '#d97706',
  done: '#16a34a',
  low: '#0f766e',
  medium: '#d97706',
  high: '#dc2626',
}

export function colorForKey(key: string, index: number) {
  return statusColorByKey[key] ?? chartPalette[index % chartPalette.length]
}

export function titleize(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
