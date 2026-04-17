'use client'

import Link from 'next/link'
import { Bot } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { ActivityItem } from '@/types'

interface ActivityFeedItemProps {
  item: ActivityItem
  compact?: boolean
  onSelect?: () => void
}

const entityHref = (item: ActivityItem) => {
  if (item.entity_type === 'project' || item.entity_type === 'project_member') {
    return `/projects/${item.entity_id}`
  }
  if (item.entity_type === 'employee') return `/employees/${item.entity_id}`
  if (item.entity_type === 'team' || item.entity_type === 'team_member') {
    return `/teams/${item.entity_id}`
  }
  return null
}

export function ActivityFeedItem({ item, compact = false, onSelect }: ActivityFeedItemProps) {
  const href = entityHref(item)
  const content = (
    <>
      <span className={`activity-dot-${item.color} mt-2 h-2 w-2 shrink-0 rounded-full ring-4 ring-current/10`} />
      {!compact ? (
        item.actor_id ? (
          <Avatar name={item.actor_name} avatarPath={item.actor_avatar} size="sm" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Bot size={16} />
          </span>
        )
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 text-[color:var(--color-text-secondary)]">
          <span className="font-semibold text-[color:var(--color-text-primary)]">
            {item.actor_name}
          </span>{' '}
          {item.message}
        </p>
        <p className="mt-1 text-[11px] font-medium text-[color:var(--color-text-tertiary)]">
          {item.time_ago}
        </p>
      </div>
    </>
  )

  const className = `flex w-full gap-3 rounded-lg border-b border-gray-50 px-3 py-3 text-left transition-all hover:bg-[color:var(--color-surface-low)] hover:shadow-[0_10px_24px_-22px_rgba(30,41,59,0.7)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20 ${
    compact ? 'items-start text-sm' : 'items-start'
  }`

  if (!href) {
    if (onSelect) {
      return (
        <button type="button" onClick={onSelect} className={className}>
          {content}
        </button>
      )
    }

    return <div className={className}>{content}</div>
  }

  return (
    <Link href={href} onClick={onSelect} className={className}>
      {content}
    </Link>
  )
}
