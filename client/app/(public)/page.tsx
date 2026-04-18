import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  House,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'

const stats = [
  { value: '500+', label: 'Companies' },
  { value: '10,000+', label: 'Employees Connected' },
  { value: '99.9%', label: 'Uptime' },
]

const features = [
  {
    icon: FolderKanban,
    title: 'Project Visibility',
    body: 'Eliminate silos with transparent project tracking. See dependencies and timelines across the entire organization.',
    link: 'Learn more',
  },
  {
    icon: UsersRound,
    title: 'Team Directory',
    body: 'Dynamic org charts that actually work. Understand reporting lines and expertise clusters without the administrative overhead.',
    link: 'Explore structure',
  },
  {
    icon: House,
    title: 'Personal Workspace',
    body: 'A focused sanctuary for individual contributors. Tailored views that pull relevant data from across your various team assignments.',
    link: 'View demo',
  },
]

const footerGroups = [
  { title: 'Product', links: ['Features', 'Integrations', 'Pricing', 'Changelog'] },
  { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Contact'] },
  { title: 'Support', links: ['Documentation', 'Help Center', 'API Status'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
]

export default function LandingPage() {
  return (
    <main id="top" className="min-h-screen bg-gray-50 text-gray-900">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full bg-indigo-600" />
            <span className="text-lg font-semibold">OrgSphere</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Login
          </Link>
        </div>
      </header>

      <section className="px-5 pb-20 pt-32">
        <div className="mx-auto max-w-[1200px] text-center">
          <div className="inline-flex rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            Now in private beta
          </div>
          <h1 className="mx-auto mt-7 max-w-3xl text-5xl font-bold leading-tight text-gray-900">
            Know your organization.
            <span className="block text-indigo-600">From every angle.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[520px] text-lg leading-8 text-gray-500">
            OrgSphere connects your projects, people, and teams in one unified
            workspace - so everyone always knows what&apos;s happening and who&apos;s
            responsible.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Get Started <ArrowRight size={16} />
            </Link>
            <Link
              href="#features"
              className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-gray-600 hover:bg-white hover:text-gray-900"
            >
              See how it works <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-xl bg-white ring-1 ring-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-5">
                <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-5xl rounded-2xl bg-gray-950 p-4 shadow-[0_24px_80px_rgba(17,24,39,0.22)]">
            <div className="rounded-xl border border-white/10 bg-gray-900 p-5 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <p className="text-sm font-medium text-white">App Preview</p>
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="grid gap-4 pt-5 lg:grid-cols-[220px_1fr]">
                <div className="space-y-3 rounded-xl bg-white/5 p-4">
                  {['Dashboard', 'Projects', 'Employees', 'Teams'].map((item, index) => (
                    <div
                      key={item}
                      className={`h-8 rounded-lg ${index === 0 ? 'bg-indigo-500' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-24 rounded-xl bg-white/10" />
                    ))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                    <div className="h-48 rounded-xl bg-white/10" />
                    <div className="h-48 rounded-xl bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white px-5 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900">
              The architecture of collaboration
            </h2>
            <p className="mt-3 text-base text-gray-500">
              Modern tools for modern hierarchies.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className="rounded-xl bg-white p-6 ring-1 ring-gray-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-500">{feature.body}</p>
                  <Link
                    href="#features"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-600"
                  >
                    {feature.link} <ArrowRight size={14} />
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 rounded-xl bg-indigo-600 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
              <ShieldCheck size={16} /> Private workspace ready
            </div>
            <h2 className="text-3xl font-semibold text-white">
              Ready to unify your workspace?
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-white/80">
              Join hundreds of organizations transforming their culture through
              radical clarity and connection.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Create Your Space
            </Link>
            <a
              href="mailto:sales@orgsphere.local"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white px-5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white px-5 py-12">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full bg-indigo-600" />
              <span className="text-lg font-semibold text-gray-900">OrgSphere</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
              The architectural curator for modern organizational excellence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {group.title}
                </h3>
                <div className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <Link
                      key={link}
                      href="#top"
                      className="block text-sm text-gray-500 hover:text-gray-900"
                    >
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1200px] items-center gap-2 border-t border-gray-100 pt-6 text-sm text-gray-400">
          <CheckCircle2 size={16} />
          © 2025 OrgSphere Technologies Inc. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
