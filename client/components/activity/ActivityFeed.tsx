'use client'

import { Activity, SlidersHorizontal } from 'lucide-react'
import { ActivityFeedItem } from '@/components/activity/ActivityFeedItem'
import { ActivityItem } from '@/types'

interface ActivityFeedProps {
  items: ActivityItem[]
  isLoading: boolean
  title?: string
  showHeader?: boolean
  compact?: boolean
  maxHeight?: string
}

export function ActivityFeed({
  items,
  isLoading,
  title = 'Activity Feed',
  showHeader = true,
  compact = false,
  maxHeight,
}: ActivityFeedProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      {showHeader ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[color:var(--color-text-primary)]">{title}</h2>
            <p className="mt-1 text-xs text-[color:var(--color-text-tertiary)]">
              Recent collaboration updates
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-[color:var(--color-surface-low)]"
            aria-label="Filter activity"
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      ) : null}

      <div className="overflow-y-auto" style={{ maxHeight }}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 py-3">
                <span className="h-2 w-2 rounded-full bg-gray-200" />
                {!compact ? <span className="h-8 w-8 rounded-full bg-gray-100" /> : null}
                <span className="flex-1 space-y-2">
                  <span className="block h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                  <span className="block h-2 w-1/3 animate-pulse rounded bg-gray-100" />
                </span>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className={compact ? 'divide-y divide-gray-50' : ''}>
            {items.map((item) => (
              <ActivityFeedItem key={item.id} item={item} compact={compact} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl bg-[color:var(--color-surface-low)] p-6 text-center">
            <Activity size={28} className="text-[color:var(--color-text-tertiary)]" />
            <h3 className="mt-3 text-sm font-bold text-[color:var(--color-text-primary)]">
              No activity yet
            </h3>
            <p className="mt-1 max-w-xs text-xs leading-5 text-[color:var(--color-text-tertiary)]">
              Actions will appear here as your team works.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-3 text-[11px] font-medium text-[color:var(--color-text-tertiary)]">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span>Live</span>
        <span>Updates every 30s</span>
      </div>
    </section>
  )
}
