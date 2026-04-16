'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Plus,
  Search,
  UsersRound,
} from 'lucide-react'
import { TeamFormModal } from '@/components/teams/TeamFormModal'
import { iconClassForTeam, initialsForTeam } from '@/components/teams/teamUtils'
import { AvatarStack } from '@/components/shared/AvatarStack'
import { EmptyState } from '@/components/shared/EmptyState'
import { useTeams } from '@/hooks/useTeams'
import { Team } from '@/types'

const pageNumbersFor = (currentPage: number, totalPages: number) => {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function TeamIcon({ name }: { name: string }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black ${iconClassForTeam(
        name
      )}`}
    >
      {initialsForTeam(name)}
    </div>
  )
}

function TeamCard({ team }: { team: Team }) {
  const members = team.members.map((member) => ({
    name: member.name,
    avatarPath: member.avatar_path,
  }))
  const onlineCount = Math.max(1, Math.ceil(team.members.length / 2))

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg">
      <div className="mb-6 flex items-start justify-between gap-4">
        <TeamIcon name={team.name} />
        <span className="rounded-full bg-[color:var(--color-primary-light)] px-3 py-1 text-[10px] font-bold uppercase text-[color:var(--color-primary)]">
          Active
        </span>
      </div>

      <h2 className="text-base font-semibold text-[color:var(--color-text-primary)]">
        {team.name}
      </h2>
      <p className="mt-2 min-h-10 text-sm leading-5 text-[color:var(--color-text-secondary)]">
        {team.description || 'A shared workspace for cross-functional collaboration.'}
      </p>

      <div className="mt-6 flex items-center justify-between gap-4">
        <AvatarStack users={members} max={3} />
        <div className="text-right">
          <span className="block text-xs font-bold text-[color:var(--color-text-primary)]">
            {team.members.length} Members
          </span>
          <span className="block text-[10px] text-[color:var(--color-text-tertiary)]">
            {onlineCount} Online
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-[color:var(--color-border)] py-4">
        <FolderOpen size={15} className="text-[color:var(--color-text-tertiary)]" />
        <span className="text-xs font-semibold text-[color:var(--color-text-secondary)]">
          Projects arrive in Phase 5
        </span>
      </div>

      <Link
        href={`/teams/${team.id}`}
        className="block w-full rounded-xl bg-[color:var(--color-surface-low)] px-4 py-3 text-center text-sm font-bold text-[color:var(--color-primary)] transition-colors group-hover:bg-[color:var(--color-primary)] group-hover:text-white"
      >
        View Team
      </Link>
    </article>
  )
}

function BuildTeamCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-low)] p-6 text-center transition-all hover:border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-light)]/40"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[color:var(--color-text-tertiary)] shadow-sm">
        <Plus size={28} />
      </span>
      <span className="mt-4 text-base font-bold text-[color:var(--color-text-primary)]">
        Build a new team
      </span>
      <span className="mt-2 max-w-[220px] text-xs leading-5 text-[color:var(--color-text-secondary)]">
        Define a new workspace for cross-functional collaboration.
      </span>
    </button>
  )
}

function TeamGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="min-h-[310px] animate-pulse rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-sm"
        >
          <div className="mb-6 flex justify-between">
            <div className="h-12 w-12 rounded-xl bg-[color:var(--color-surface-low)]" />
            <div className="h-6 w-16 rounded-full bg-[color:var(--color-surface-low)]" />
          </div>
          <div className="h-4 w-36 rounded bg-[color:var(--color-surface-low)]" />
          <div className="mt-4 h-3 rounded bg-[color:var(--color-surface-low)]" />
          <div className="mt-2 h-3 w-4/5 rounded bg-[color:var(--color-surface-low)]" />
          <div className="mt-8 h-8 w-32 rounded bg-[color:var(--color-surface-low)]" />
          <div className="mt-8 h-11 rounded-xl bg-[color:var(--color-surface-low)]" />
        </div>
      ))}
    </div>
  )
}

export default function TeamsPage() {
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ startTransition })
  )
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [searchInput, setSearchInput] = useState(search)
  const { data, isLoading, isError } = useTeams({ page, limit: 12, search })

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchInput !== search) {
        setPage(1)
        setSearch(searchInput)
      }
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [search, searchInput, setPage, setSearch])

  const teams = data?.data || []
  const totalTeams = data?.total || 0
  const totalPages = data?.totalPages || 1
  const pageNumbers = pageNumbersFor(page, totalPages)

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <div className="w-full space-y-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[color:var(--color-text-primary)]">Teams</h1>
            <p className="mt-2 font-medium text-[color:var(--color-text-tertiary)]">
              Coordinate collaboration across your enterprise units.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="primary-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-16px_rgba(53,37,205,0.8)] transition-transform active:scale-95"
          >
            <Plus size={18} />
            Create Team
          </button>
        </header>

        <div className="relative max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search teams"
            className="h-12 w-full rounded-xl border-none bg-[color:var(--color-surface-card)] pl-12 pr-4 text-sm shadow-sm outline-none transition-all focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
          />
        </div>

        {isPending ? (
          <p className="text-sm text-[color:var(--color-text-tertiary)]">Updating teams...</p>
        ) : null}

        {isLoading ? <TeamGridSkeleton /> : null}

        {isError ? (
          <EmptyState
            icon={UsersRound}
            title="Teams unavailable"
            description="Team data could not be loaded right now."
          />
        ) : null}

        {!isLoading && !isError && teams.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No teams found"
            description="Try a different search or create a new team."
            action={{ label: 'Create Team', onClick: () => setModalOpen(true) }}
          />
        ) : null}

        {!isLoading && !isError && teams.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
              <BuildTeamCard onClick={() => setModalOpen(true)} />
            </div>

            {totalPages > 1 ? (
              <div className="mt-12 flex flex-col gap-4 border-t border-[color:var(--color-border-strong)] pt-8 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-[color:var(--color-text-tertiary)]">
                  Showing {teams.length} of {totalTeams} teams
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-lg bg-[color:var(--color-surface-card)] p-2 text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-high)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-tertiary)]"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition-colors ${
                        page === pageNumber
                          ? 'bg-[color:var(--color-primary)] text-white'
                          : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-card)]'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="rounded-lg bg-[color:var(--color-surface-card)] p-2 text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-high)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-tertiary)]"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <TeamFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
