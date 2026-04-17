'use client'

import { KeyboardEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { parseAsString, useQueryState } from 'nuqs'
import { FileText, ListFilter, MoreHorizontal, Plus, Share2, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import { TiptapEditor } from '@/components/notes/TiptapEditor'
import {
  emptyDoc,
  extractTextFromTiptap,
  formatRelativeNoteDate,
  formatSavedTime,
} from '@/components/notes/noteUtils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useCreateNote, useDeleteNote, useNote, useNotes, useUpdateNote } from '@/hooks/useNotes'
import { useUserProjects } from '@/hooks/useProjects'
import { RootState } from '@/store'
import { Note } from '@/types'

function NoteListItem({
  note,
  active,
  onSelect,
  onDelete,
}: {
  note: Note
  active: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const firstTag = note.tags[0]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full border-l-2 px-4 py-3 text-left transition-colors ${
        active
          ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary-light)]/60'
          : 'border-transparent hover:bg-[color:var(--color-surface-low)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold text-[color:var(--color-text-primary)]">
            {note.title}
          </h3>
          <p className="mt-1 text-[11px] text-[color:var(--color-text-tertiary)]">
            {formatRelativeNoteDate(note.updated_at)}
          </p>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
              onDelete()
            }
          }}
          className="rounded-md p-1 text-[color:var(--color-text-tertiary)] opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          aria-label="Delete note"
        >
          <X size={14} />
        </span>
      </div>
      {firstTag ? (
        <span className="mt-3 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[color:var(--color-primary)]">
          {firstTag}
        </span>
      ) : null}
    </button>
  )
}

export default function MyNotesPage() {
  const [isPending, startTransition] = useTransition()
  const [selectedNoteId, setSelectedNoteId] = useQueryState(
    'note',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const { data: projects = [] } = useUserProjects(currentUser?.id || '')
  const { data: notesData, isLoading: notesLoading } = useNotes({ search, limit: 100 })
  const { data: selectedNote, isLoading: noteLoading } = useNote(selectedNoteId)
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tagsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notes = notesData?.data || []

  useEffect(() => {
    return () => {
      if (contentTimer.current) clearTimeout(contentTimer.current)
      if (tagsTimer.current) clearTimeout(tagsTimer.current)
    }
  }, [])

  const selectedPreview = useMemo(
    () => (selectedNote ? extractTextFromTiptap(selectedNote.content).slice(0, 80) : ''),
    [selectedNote]
  )

  const createBlankNote = async (projectId?: string | null) => {
    const note = await createNote.mutateAsync({
      title: 'Untitled note',
      content: emptyDoc,
      tags: [],
      project_id: projectId || null,
    })
    void setSelectedNoteId(note.id)
  }

  const saveNote = async (input: Record<string, unknown>) => {
    if (!selectedNote) return

    setSaveStatus('Saving...')
    const saved = await updateNote.mutateAsync({ id: selectedNote.id, ...input })
    setSaveStatus(`Saved at ${formatSavedTime(saved.updated_at)}`)
    window.setTimeout(() => setSaveStatus(''), 3000)
  }

  const saveTitle = async (value: string) => {
    const title = value.trim() || 'Untitled note'
    if (!selectedNote || title === selectedNote.title) return

    await saveNote({ title })
  }

  const saveTags = (tags: string[]) => {
    if (!selectedNote) return
    if (tagsTimer.current) clearTimeout(tagsTimer.current)
    tagsTimer.current = setTimeout(() => {
      void saveNote({ tags })
    }, 800)
  }

  const addTag = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !selectedNote) return
    event.preventDefault()

    const nextTag = tagInput.trim()
    if (!nextTag || selectedNote.tags.includes(nextTag)) return

    const tags = [...selectedNote.tags, nextTag]
    setTagInput('')
    void updateNote.mutateAsync({ id: selectedNote.id, tags })
    saveTags(tags)
  }

  const removeTag = (tag: string) => {
    if (!selectedNote) return
    const tags = selectedNote.tags.filter((item) => item !== tag)
    void updateNote.mutateAsync({ id: selectedNote.id, tags })
    saveTags(tags)
  }

  const handleContentChange = (content: Record<string, unknown>) => {
    if (!selectedNote) return
    if (contentTimer.current) clearTimeout(contentTimer.current)
    setSaveStatus('Saving...')
    contentTimer.current = setTimeout(() => {
      void saveNote({ content })
    }, 1000)
  }

  return (
    <div className="-m-8 flex h-[calc(100vh-64px)] min-h-0 bg-white">
      <aside className="flex w-full shrink-0 flex-col border-r border-[color:var(--color-border)] bg-white sm:w-[280px]">
        <div className="border-b border-[color:var(--color-border)] p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-[color:var(--color-text-primary)]">Notes</h1>
            <button
              type="button"
              className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-[color:var(--color-surface-low)]"
              aria-label="Sort notes"
            >
              <ListFilter size={17} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => void createBlankNote()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[color:var(--color-border-strong)] px-3 py-2.5 text-sm font-bold text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-light)]"
          >
            <Plus size={16} />
            New Note
          </button>
          <input
            value={search}
            onChange={(event) => void setSearch(event.target.value)}
            placeholder="Filter notes..."
            className="mt-4 w-full rounded-lg border border-[color:var(--color-border-strong)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/15"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {notesLoading || isPending ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-[color:var(--color-surface-low)]" />
              ))}
            </div>
          ) : notes.length > 0 ? (
            notes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                active={note.id === selectedNoteId}
                onSelect={() => void setSelectedNoteId(note.id)}
                onDelete={() => setDeleteTarget(note)}
              />
            ))
          ) : (
            <div className="p-4 text-center">
              <FileText className="mx-auto text-[color:var(--color-text-tertiary)]" size={30} />
              <p className="mt-3 text-sm font-bold text-[color:var(--color-text-primary)]">
                {search ? `No notes match "${search}"` : 'No notes yet'}
              </p>
              {!search ? (
                <button
                  type="button"
                  onClick={() => void createBlankNote()}
                  className="mt-3 text-sm font-bold text-[color:var(--color-primary)]"
                >
                  + Create your first note
                </button>
              ) : null}
            </div>
          )}
        </div>
      </aside>

      <main className="hidden min-w-0 flex-1 flex-col bg-white sm:flex">
        {!selectedNoteId ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <EmptyState
              icon={FileText}
              title="Select a note or create a new one"
              description="Your project thinking, meeting notes, and decisions stay close to the work."
              action={{ label: '+ New Note', onClick: () => void createBlankNote() }}
            />
          </div>
        ) : noteLoading || !selectedNote ? (
          <div className="space-y-6 p-8">
            <div className="h-10 w-2/3 animate-pulse rounded-lg bg-[color:var(--color-surface-low)]" />
            <div className="h-80 animate-pulse rounded-xl bg-[color:var(--color-surface-low)]" />
          </div>
        ) : (
          <>
            <div className="border-b border-[color:var(--color-border)] px-6 py-4">
              <div className="flex items-center gap-3">
                <input
                  key={selectedNote.id}
                  defaultValue={selectedNote.title}
                  onBlur={(event) => void saveTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur()
                  }}
                  className="min-w-0 flex-1 border-none bg-transparent text-xl font-bold text-[color:var(--color-text-primary)] outline-none"
                />
                {saveStatus ? (
                  <span className="text-xs font-semibold text-[color:var(--color-text-tertiary)]">
                    {saveStatus}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-[color:var(--color-surface-low)]"
                  aria-label="Share note"
                >
                  <Share2 size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selectedNote)}
                  className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete note"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-text-tertiary)]">
                {selectedPreview || 'Blank note'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b border-[color:var(--color-border)] px-6 py-3">
              <div className="flex min-w-[220px] flex-1 flex-wrap items-center gap-2">
                {selectedNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-primary-light)] px-2.5 py-1 text-xs font-bold text-[color:var(--color-primary)]"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={addTag}
                  placeholder="Add tag..."
                  className="min-w-[110px] flex-1 border-none bg-transparent text-sm outline-none"
                />
              </div>
              <select
                value={selectedNote.project_id || ''}
                onChange={(event) => void saveNote({ project_id: event.target.value || null })}
                className="rounded-lg border border-[color:var(--color-border-strong)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/15"
              >
                <option value="">No linked project</option>
                {projects.map((membership) => (
                  <option key={membership.project.id} value={membership.project.id}>
                    {membership.project.name}
                  </option>
                ))}
              </select>
            </div>

            <TiptapEditor
              content={selectedNote.content || emptyDoc}
              onChange={handleContentChange}
              placeholder="Start writing..."
            />
          </>
        )}
      </main>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete note?"
        description="This note will be removed from your workspace."
        dangerous
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const deletingSelected = deleteTarget.id === selectedNoteId
            void deleteNote.mutateAsync(deleteTarget.id).then(() => {
              if (deletingSelected) void setSelectedNoteId('')
            })
          }
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
