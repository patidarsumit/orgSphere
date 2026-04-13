export function PlaceholderPage({ label }: { label: string }) {
  return (
    <section className="rounded-xl bg-white p-8 ring-1 ring-gray-100">
      <p className="text-sm font-medium text-indigo-600">Phase 1</p>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900">{label}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
        This workspace route is ready for authenticated navigation. Real data lands in
        the dedicated feature phase.
      </p>
    </section>
  )
}

