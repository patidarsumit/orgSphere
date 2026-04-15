import Image from 'next/image'

const colorClasses = [
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-green-100 text-green-700',
  'bg-red-100 text-red-700',
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
] as const

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-base',
} as const

const sizePixels = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
} as const

type AvatarSize = keyof typeof sizeClasses

interface AvatarProps {
  name: string
  avatarPath?: string | null
  size?: AvatarSize
  showTooltip?: boolean
}

const initialsFor = (name: string) => {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || 'O'
  const last = parts.length > 1 ? parts.at(-1)?.[0] : parts[0]?.[1]
  return `${first}${last || ''}`.toUpperCase()
}

const colorForName = (name: string) => {
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return colorClasses[hash % colorClasses.length]
}

export function Avatar({
  name,
  avatarPath,
  size = 'md',
  showTooltip = false,
}: AvatarProps) {
  const title = showTooltip ? name : undefined
  const baseClass =
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white font-semibold'

  if (avatarPath) {
    const imageUrl = avatarPath.startsWith('http')
      ? avatarPath
      : `http://localhost:4000/${avatarPath}`

    return (
      <Image
        src={imageUrl}
        alt={name}
        title={title}
        width={sizePixels[size]}
        height={sizePixels[size]}
        unoptimized
        className={`${baseClass} ${sizeClasses[size]} object-cover`}
      />
    )
  }

  return (
    <span
      title={title}
      className={`${baseClass} ${sizeClasses[size]} ${colorForName(name)}`}
    >
      {initialsFor(name)}
    </span>
  )
}
