import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
      <section className="w-full max-w-md rounded-xl bg-white p-8 text-center ring-1 ring-gray-100">
        <div className="mx-auto flex items-center justify-center gap-3">
          <span className="h-4 w-4 rounded-full bg-indigo-600" />
          <span className="text-xl font-semibold text-gray-900">OrgSphere</span>
        </div>
        <h1 className="mt-8 text-2xl font-semibold text-gray-900">404 - Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Go to Dashboard
        </Link>
      </section>
    </main>
  )
}
