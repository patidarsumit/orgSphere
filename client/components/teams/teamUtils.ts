const iconClassNames = [
  'bg-indigo-50 text-indigo-600',
  'bg-orange-50 text-orange-600',
  'bg-teal-50 text-teal-600',
  'bg-green-50 text-green-600',
  'bg-blue-50 text-blue-600',
  'bg-pink-50 text-pink-600',
] as const

export const iconClassForTeam = (name: string) => {
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return iconClassNames[hash % iconClassNames.length]
}

export const initialsForTeam = (name: string) => {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
