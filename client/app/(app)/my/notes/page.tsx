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
import { appToast, getToastErrorMessage } from '@/lib/toast'
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
  const preview = extractTextFromTiptap(note.content).slice(0, 110)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full rounded-2xl border text-left transition-all ${
        active
          ? 'border-transparent border-l-4 border-l-[color:var(--color-primary)] bg-white p-4 shadow-sm'
          : 'border-[color:var(--color-border)]/45 bg-white/45 p-4 hover:border-[color:var(--color-border-strong)] hover:bg-white hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={`truncate pr-2 text-sm text-[color:var(--color-text-primary)] ${
              active ? 'font-bold' : 'font-semibold'
            }`}
          >
            {note.title}
          </h3>
        </div>
        <span className="shrink-0 text-[10px] font-medium text-[color:var(--color-text-tertiary)]">
          {formatRelativeNoteDate(note.updated_at)}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        {preview || 'Blank note'}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {firstTag ? (
            <span className="inline-flex rounded-full bg-[color:var(--color-primary-light)] px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--color-primary-hover)]">
              {firstTag}
            </span>
          ) : null}
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
    try {
      const note = await createNote.mutateAsync({
        title: 'Untitled note',
        content: emptyDoc,
        tags: [],
        project_id: projectId || null,
      })
      appToast.success('Note created')
      void setSelectedNoteId(note.id)
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to create note'))
    }
  }

  const saveNote = async (input: Record<string, unknown>) => {
    if (!selectedNote) return

    setSaveStatus('Saving...')
    try {
      const saved = await updateNote.mutateAsync({ id: selectedNote.id, ...input })
      setSaveStatus(`Saved at ${formatSavedTime(saved.updated_at)}`)
      window.setTimeout(() => setSaveStatus(''), 3000)
    } catch (error) {
      setSaveStatus('Save failed')
      appToast.error(getToastErrorMessage(error, 'Unable to save note'))
    }
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
    saveTags(tags)
  }

  const removeTag = (tag: string) => {
    if (!selectedNote) return
    const tags = selectedNote.tags.filter((item) => item !== tag)
    saveTags(tags)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    const deletingSelected = deleteTarget.id === selectedNoteId
    try {
      await deleteNote.mutateAsync(deleteTarget.id)
      appToast.success('Note deleted')
      if (deletingSelected) void setSelectedNoteId('')
      setDeleteTarget(null)
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to delete note'))
    }
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
    <div className="-m-8 flex h-[calc(100vh-64px)] min-h-0 bg-[color:var(--color-surface)]">
      <aside className="flex w-full shrink-0 flex-col overflow-hidden border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-low)] sm:w-[320px]">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight text-[color:var(--color-text-primary)]">
              Notes
            </h1>
            <button
              type="button"
              className="rounded-xl bg-white p-2 text-[color:var(--color-primary)] shadow-sm transition-all hover:shadow-md"
              aria-label="Sort notes"
            >
              <ListFilter size={17} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => void createBlankNote()}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[color:var(--color-border-strong)] bg-white px-3 py-3 text-sm font-semibold text-[color:var(--color-text-secondary)] transition-all hover:border-[color:var(--color-primary)]/40 hover:text-[color:var(--color-primary)]"
          >
            <Plus size={17} className="text-[color:var(--color-primary)]" />
            New Note
          </button>
          <input
            value={search}
            onChange={(event) => void setSearch(event.target.value)}
            placeholder="Filter notes..."
            className="w-full rounded-lg border-none bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-6">
          {notesLoading || isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/70" />
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

      <main className="hidden min-w-0 flex-1 flex-col overflow-hidden bg-white sm:flex">
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
          <div className="space-y-6 bg-white p-8">
            <div className="h-10 w-2/3 animate-pulse rounded-lg bg-[color:var(--color-surface-low)]" />
            <div className="h-80 animate-pulse rounded-xl bg-[color:var(--color-surface-low)]" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6 border-b border-slate-50 bg-white p-8">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[color:var(--color-primary)]">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--color-primary)]" />
                  <span>{saveStatus || `Saved at ${formatSavedTime(selectedNote.updated_at)}`}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-low)]"
                    aria-label="Share note"
                  >
                    <Share2 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selectedNote)}
                    className="rounded-lg p-2 text-[color:var(--color-text-secondary)] transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete note"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  key={selectedNote.id}
                  defaultValue={selectedNote.title}
                  onBlur={(event) => void saveTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur()
                  }}
                  className="w-full border-none bg-transparent p-0 text-[28px] font-extrabold tracking-tight text-[color:var(--color-text-primary)] outline-none placeholder:text-slate-200"
                />
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex min-w-[220px] flex-wrap items-center gap-2 rounded-full border border-[color:var(--color-border)]/40 bg-[color:var(--color-surface-low)] px-3 py-1.5">
                    {selectedNote.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-primary-light)] px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--color-primary-hover)]"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={addTag}
                      placeholder="Add tag..."
                      className="min-w-[90px] flex-1 border-none bg-transparent p-0 text-xs font-bold text-[color:var(--color-text-secondary)] outline-none"
                    />
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <select
                    value={selectedNote.project_id || ''}
                    onChange={(event) => void saveNote({ project_id: event.target.value || null })}
                    className="cursor-pointer border-none bg-transparent p-0 pr-6 text-xs font-bold text-[color:var(--color-text-secondary)] outline-none focus:ring-0"
                  >
                    <option value="">No linked project</option>
                    {projects.map((membership) => (
                      <option key={membership.project.id} value={membership.project.id}>
                        {membership.project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-[color:var(--color-text-tertiary)]">
                  {selectedPreview || 'Blank note'}
                </p>
              </div>
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
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
