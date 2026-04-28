'use client'

import Link from 'next/link'
import { BellRing } from 'lucide-react'
import { AppNotification } from '@/types/notifications'

const formatNotificationTime = (value: string) => {
  const date = new Date(value)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export function NotificationFeedItem({
  notification,
  onSelect,
}: {
  notification: AppNotification
  onSelect?: () => void
}) {
  const isUnread = !notification.read_at
  const content = (
    <>
      <span
        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUnread ? 'bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]' : 'bg-gray-50 text-gray-400'
        }`}
      >
        <BellRing size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-gray-950">{notification.title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-gray-600">{notification.message}</span>
        <span className="mt-1 block text-[11px] font-medium text-gray-400">
          {formatNotificationTime(notification.created_at)}
        </span>
      </span>
      {isUnread ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" /> : null}
    </>
  )
  const baseClassName = `flex w-full gap-3 rounded-lg px-3 py-3 text-left ${
    isUnread ? 'bg-indigo-50/55' : 'bg-white'
  }`
  const interactiveClassName =
    'transition-all hover:bg-[color:var(--color-surface-low)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20'

  if (notification.target_url) {
    return (
      <Link href={notification.target_url} onClick={onSelect} className={`${baseClassName} ${interactiveClassName}`}>
        {content}
      </Link>
    )
  }

  return <div className={`${baseClassName} cursor-default`}>{content}</div>
}
