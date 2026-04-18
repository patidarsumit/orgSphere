import { Avatar } from './Avatar'

interface AvatarStackProps {
  users: Array<{ name: string; avatarPath?: string | null }>
  max?: number
}

export function AvatarStack({ users, max = 4 }: AvatarStackProps) {
  const visibleUsers = users.slice(0, max)
  const hiddenCount = Math.max(users.length - max, 0)

  return (
    <div className="flex items-center">
      {visibleUsers.map((user) => (
        <div key={user.name} className="-ml-2 first:ml-0">
          <Avatar name={user.name} avatarPath={user.avatarPath} size="md" showTooltip />
        </div>
      ))}
      {hiddenCount > 0 ? (
        <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-semibold text-gray-600">
          +{hiddenCount}
        </div>
      ) : null}
    </div>
  )
}

