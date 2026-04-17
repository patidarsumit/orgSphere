const statusStyles: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  done: 'bg-green-50 text-green-700',
  completed: 'bg-green-50 text-green-700',
  in_progress: 'bg-amber-50 text-amber-700',
  'in progress': 'bg-amber-50 text-amber-700',
  blocked: 'bg-red-50 text-red-700',
  on_hold: 'bg-amber-50 text-amber-700',
  todo: 'bg-blue-50 text-blue-700',
  planned: 'bg-blue-50 text-blue-700',
  archived: 'bg-gray-100 text-gray-600',
}

const formatStatus = (status: string) =>
  status
    .replaceAll('_', ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        statusStyles[normalized] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {formatStatus(status)}
    </span>
  )
}
