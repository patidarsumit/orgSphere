'use client'

import { KeyboardEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, Loader2, Search, UsersRound, X } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { OrgSphereMark } from '@/components/shared/OrgSphereMark'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TechStackChip } from '@/components/shared/TechStackChip'
import { useSearch } from '@/hooks/useSearch'
import { SearchResult } from '@/types'

interface GlobalSearchProps {
  onClose: () => void
}

interface RecentSearch {
  query: string
  timestamp: number
}

const RECENT_SEARCHES_KEY = 'orgsphere_recent_searches'

const resultHref = (result: SearchResult) => {
  if (result.type === 'project') return `/projects/${result.id}`
  if (result.type === 'employee') return `/employees/${result.id}`
  return `/teams/${result.id}`
}

const loadRecentSearches = (): RecentSearch[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.slice(0, 5) : []
  } catch {
    return []
  }
}

const saveRecentSearch = (query: string) => {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return

  const recent = loadRecentSearches()
  const updated = [
    { query: trimmedQuery, timestamp: Date.now() },
    ...recent.filter((item) => item.query.toLowerCase() !== trimmedQuery.toLowerCase()),
  ].slice(0, 5)
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}

function ResultRow({
  result,
  focused,
  onSelect,
}: {
  result: SearchResult
  focused: boolean
  onSelect: () => void
}) {
  const href = resultHref(result)

  return (
    <Link
      href={href}
      onClick={onSelect}
      className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        focused ? 'bg-indigo-50' : 'hover:bg-gray-50'
      }`}
    >
      {result.type === 'employee' ? (
        <Avatar name={result.name} avatarPath={result.avatar_path} size="sm" />
      ) : result.type === 'team' ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-black text-indigo-600">
          {result.name.charAt(0)}
        </span>
      ) : (
        <OrgSphereMark className="h-4 w-4" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{result.name}</p>
        {result.type === 'employee' ? (
          <p className="truncate text-xs text-gray-500">{result.email}</p>
        ) : result.type === 'team' ? (
          <p className="truncate text-xs text-gray-500">{result.description || 'Team workspace'}</p>
        ) : (
          <p className="truncate text-xs text-gray-500">
            {result.manager_name ? `Managed by ${result.manager_name}` : 'Project'}
          </p>
        )}
      </div>
      {result.type === 'project' && result.status ? <StatusBadge status={result.status} /> : null}
      {result.type === 'project' ? (
        <div className="hidden max-w-40 gap-1 sm:flex">
          {(result.tech_stack || []).slice(0, 2).map((tech) => (
            <TechStackChip key={tech} tech={tech} size="sm" />
          ))}
        </div>
      ) : null}
      {result.type === 'employee' && result.role ? (
        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold capitalize text-gray-600">
          {result.role.replace('_', ' ')}
        </span>
      ) : null}
      {result.type === 'team' ? (
        <span className="text-xs font-medium text-gray-500">{result.member_count || 0} members</span>
      ) : null}
    </Link>
  )
}

function ResultGroup({
  title,
  query,
  results,
  type,
  focusedStart,
  focusedIndex,
  onSelect,
  onClose,
}: {
  title: string
  query: string
  results: SearchResult[]
  type: 'projects' | 'employees' | 'teams'
  focusedStart: number
  focusedIndex: number
  onSelect: () => void
  onClose: () => void
}) {
  if (results.length === 0) return null

  return (
    <section className="space-y-1">
      <p className="px-3 text-[11px] font-black uppercase tracking-wider text-gray-400">
        {title} ({results.length})
      </p>
      {results.slice(0, 3).map((result, index) => (
        <ResultRow
          key={`${result.type}-${result.id}`}
          result={result}
          focused={focusedIndex === focusedStart + index}
          onSelect={() => {
            saveRecentSearch(query)
            onSelect()
          }}
        />
      ))}
      <Link
        href={`/${type}?search=${encodeURIComponent(query)}`}
        onClick={() => {
          saveRecentSearch(query)
          onClose()
        }}
        className="block rounded-lg px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
      >
        See all {title.toLowerCase()} for &quot;{query}&quot; →
      </Link>
    </section>
  )
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() =>
    typeof window === 'undefined' ? [] : loadRecentSearches()
  )
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data, isFetching } = useSearch(debouncedQuery)

  useEffect(() => {
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const visibleResults = useMemo(
    () => [
      ...(data?.projects || []).slice(0, 3),
      ...(data?.employees || []).slice(0, 3),
      ...(data?.teams || []).slice(0, 3),
    ],
    [data]
  )

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  const navigateFocusedResult = () => {
    const result = visibleResults[focusedIndex]
    if (!result) return
    saveRecentSearch(query)
    onClose()
    router.push(resultHref(result))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setFocusedIndex((current) => Math.min(current + 1, Math.max(visibleResults.length - 1, 0)))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setFocusedIndex((current) => Math.max(current - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      navigateFocusedResult()
    }
  }

  const clearRecentSearches = () => {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY)
    setRecentSearches([])
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-950/30 px-4"
      onMouseDown={handleBackdropClick}
    >
      <div className="mx-auto mt-20 max-h-[540px] w-full max-w-[560px] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-100">
        <div className="flex h-[60px] items-center gap-3 border-b border-gray-100 px-4">
          <Search size={20} className="text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setFocusedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, people, teams..."
            className="h-full min-w-0 flex-1 border-none text-base text-gray-900 outline-none placeholder:text-gray-400"
          />
          {isFetching ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : null}
          <kbd className="hidden rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-400 sm:inline-flex">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-900"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[480px] overflow-y-auto p-3">
          {query.trim().length < 2 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Recent searches
                </p>
                {recentSearches.length > 0 ? (
                  <button type="button" onClick={clearRecentSearches} className="text-xs font-bold text-gray-500 hover:text-gray-900">
                    Clear
                  </button>
                ) : null}
              </div>
              {recentSearches.length > 0 ? (
                recentSearches.map((item) => (
                  <button
                    key={`${item.query}-${item.timestamp}`}
                    type="button"
                    onClick={() => setQuery(item.query)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Clock size={16} className="text-gray-400" />
                    {item.query}
                  </button>
                ))
              ) : (
                <div className="rounded-lg bg-gray-50 p-8 text-center text-sm text-gray-500">
                  Tip: Press ⌘K or Ctrl+K anywhere to search.
                </div>
              )}
            </div>
          ) : isFetching && !data ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : data?.total === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <UsersRound size={40} className="text-gray-300" />
              <h2 className="mt-4 text-sm font-black text-gray-900">
                No results for &quot;{query}&quot;
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Try searching for a project name, employee, or team.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <ResultGroup
                title="Projects"
                type="projects"
                query={query}
                results={data?.projects || []}
                focusedStart={0}
                focusedIndex={focusedIndex}
                onSelect={onClose}
                onClose={onClose}
              />
              <ResultGroup
                title="Employees"
                type="employees"
                query={query}
                results={data?.employees || []}
                focusedStart={(data?.projects || []).slice(0, 3).length}
                focusedIndex={focusedIndex}
                onSelect={onClose}
                onClose={onClose}
              />
              <ResultGroup
                title="Teams"
                type="teams"
                query={query}
                results={data?.teams || []}
                focusedStart={
                  (data?.projects || []).slice(0, 3).length +
                  (data?.employees || []).slice(0, 3).length
                }
                focusedIndex={focusedIndex}
                onSelect={onClose}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
