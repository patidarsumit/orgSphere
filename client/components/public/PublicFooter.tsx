import Link from 'next/link'
import { ArrowRight, CheckCircle2, Globe2, Mail, ShieldCheck } from 'lucide-react'
import { OrgSphereMark } from '@/components/shared/OrgSphereMark'

const footerGroups = [
  { title: 'Product', links: ['Features', 'Integrations', 'Pricing', 'Changelog'] },
  { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Contact'] },
  { title: 'Support', links: ['Documentation', 'Help Center', 'API Status'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
]

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#312e81_0%,#0f172a_38%,#020617_100%)] px-5 py-16 text-white">
      <div className="absolute left-[-8rem] top-[-5rem] h-96 w-96 rounded-[42%_58%_67%_33%/45%_38%_62%_55%] bg-indigo-500/25 blur-3xl" />
      <div className="absolute bottom-[-9rem] right-[-7rem] h-[28rem] w-[28rem] rounded-[62%_38%_45%_55%/34%_55%_45%_66%] bg-cyan-400/20 blur-3xl" />
      <div className="absolute left-1/2 top-20 h-56 w-56 -translate-x-1/2 rounded-[55%_45%_35%_65%/60%_30%_70%_40%] bg-fuchsia-400/10 blur-2xl" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.12),transparent_26%,rgba(255,255,255,0.06)_55%,transparent_78%)]" />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="mb-12 rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-[0_24px_90px_-40px_rgba(15,23,42,0.95)] backdrop-blur-2xl md:flex md:items-center md:justify-between md:gap-8 md:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-100 shadow-inner shadow-white/5">
              <ShieldCheck size={14} />
              Private workspace ready
            </div>
            <h2 className="mt-4 max-w-xl text-2xl font-black tracking-tight md:text-3xl">
              Bring clarity to every team, project, and decision.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              OrgSphere gives growing companies a calm source of truth for people, work, and accountability.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white/90 px-5 text-sm font-bold text-slate-950 shadow-[0_14px_35px_-20px_rgba(255,255,255,0.8)] transition hover:bg-white md:mt-0"
          >
            Enter workspace <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.05fr_1.95fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <OrgSphereMark className="h-9 w-9" />
              <span className="text-xl font-black tracking-tight">OrgSphere</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              The architectural curator for modern organizational excellence. Built for teams that value visibility without noise.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-300">
              <a href="mailto:sales@orgsphere.local" className="inline-flex w-fit items-center gap-2 hover:text-white">
                <Mail size={15} /> sales@orgsphere.local
              </a>
              <span className="inline-flex items-center gap-2">
                <Globe2 size={15} /> Local-first enterprise workspace
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-8 md:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-indigo-200/70">
                  {group.title}
                </h3>
                <div className="mt-5 space-y-3">
                  {group.links.map((link) => (
                    <Link
                      key={link}
                      href={link === 'Blog' ? '/blog' : '/'}
                      className="block text-sm font-medium text-slate-300 transition hover:translate-x-0.5 hover:text-white"
                    >
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-full border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-400 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-indigo-300" />
            © 2025 OrgSphere Technologies Inc. All rights reserved.
          </div>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-slate-300">Privacy</Link>
            <Link href="/" className="hover:text-slate-300">Terms</Link>
            <Link href="/blog" className="hover:text-slate-300">Blog</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
