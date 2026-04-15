import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl bg-white p-8 text-center ring-1 ring-gray-100">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon size={22} />
      </div>
      <h2 className="mt-5 text-base font-medium text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}

