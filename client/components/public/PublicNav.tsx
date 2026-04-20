'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { PublicAccountMenu } from './PublicAccountMenu'

export function PublicNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const homeActive = pathname === '/'
  const blogActive = pathname.startsWith('/blog')

  return (
    <header className="sticky inset-x-0 top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full bg-indigo-600" />
          <span className="text-lg font-semibold text-gray-950">OrgSphere</span>
        </Link>

        <nav className="hidden items-center gap-5 sm:flex">
          <Link
            href="/"
            className={`text-sm font-semibold ${homeActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-950'}`}
          >
            Home
          </Link>
          <Link
            href="/blog"
            className={`text-sm font-semibold ${blogActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-950'}`}
          >
            Blog
          </Link>
          <PublicAccountMenu />
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 sm:hidden"
          aria-label="Toggle public navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-gray-100 bg-white px-5 py-4 sm:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`text-sm font-semibold ${homeActive ? 'text-indigo-600' : 'text-gray-600'}`}
            >
              Home
            </Link>
            <Link
              href="/blog"
              onClick={() => setOpen(false)}
              className={`text-sm font-semibold ${blogActive ? 'text-indigo-600' : 'text-gray-600'}`}
            >
              Blog
            </Link>
            <PublicAccountMenu />
          </div>
        </div>
      ) : null}
    </header>
  )
}
