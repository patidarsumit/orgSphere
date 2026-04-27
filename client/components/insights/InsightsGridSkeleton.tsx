export function InsightsGridSkeleton({
  cards = 4,
  className = 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3',
}: {
  cards?: number
  className?: string
}) {
  return (
    <section className={className} aria-label="Loading insights">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-[color:var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="h-4 w-32 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
              <div className="mt-2 h-3 w-48 max-w-full animate-pulse rounded bg-[color:var(--color-surface-low)]" />
            </div>
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-[color:var(--color-surface-low)]" />
          </div>
          <div className="h-[240px] animate-pulse rounded-lg bg-[color:var(--color-surface-low)]" />
        </div>
      ))}
    </section>
  )
}
