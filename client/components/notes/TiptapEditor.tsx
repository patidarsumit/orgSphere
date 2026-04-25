'use client'

import { useCallback, useEffect } from 'react'
import { EditorContent, JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import type { AnyExtension } from '@tiptap/core'
import {
  Bold,
  Code2,
  Heading2,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  UnderlineIcon,
} from 'lucide-react'
import { emptyDoc } from './noteUtils'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
  editable?: boolean
  placeholder?: string
}

interface ToolbarButtonProps {
  label: string
  active?: boolean
  onClick: () => void
  icon: typeof Bold
}

function ToolbarButton({ label, active = false, onClick, icon: Icon }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active
          ? 'bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]'
          : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]'
      }`}
      aria-label={label}
      title={label}
    >
      <Icon size={16} />
    </button>
  )
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
  placeholder = 'Start writing...',
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-[color:var(--color-primary)] underline underline-offset-2',
        },
      }),
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
    ] as AnyExtension[],
    content: (Object.keys(content || {}).length > 0 ? content : emptyDoc) as JSONContent,
    editorProps: {
      attributes: {
        class:
          'mx-auto min-h-[520px] max-w-3xl text-[15px] leading-7 text-[color:var(--color-text-primary)] outline-none',
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getJSON() as Record<string, unknown>)
    },
  })

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  useEffect(() => {
    if (!editor) return

    const nextContent = JSON.stringify(Object.keys(content || {}).length > 0 ? content : emptyDoc)
    const currentContent = JSON.stringify(editor.getJSON())
    if (nextContent !== currentContent) {
      editor.commands.setContent((Object.keys(content || {}).length > 0 ? content : emptyDoc) as JSONContent)
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Paste link URL', previousUrl || 'https://')

    if (url === null) return
    if (url === '') {
      ;(editor.chain().focus().extendMarkRange('link') as unknown as { unsetLink: () => { run: () => boolean } }).unsetLink().run()
      return
    }
    ;(
      editor.chain().focus().extendMarkRange('link') as unknown as {
        setLink: (attributes: { href: string }) => { run: () => boolean }
      }
    )
      .setLink({ href: url })
      .run()
  }, [editor])

  if (!editor) {
    return <div className="min-h-[400px] animate-pulse bg-[color:var(--color-surface-low)]" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {editable ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-50 bg-[color:var(--color-surface-low)]/50 px-8 py-3">
          <ToolbarButton
            label="Bold"
            icon={Bold}
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="Italic"
            icon={Italic}
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label="Underline"
            icon={UnderlineIcon}
            active={editor.isActive('underline')}
            onClick={() =>
              (
                editor.chain().focus() as unknown as {
                  toggleUnderline: () => { run: () => boolean }
                }
              )
                .toggleUnderline()
                .run()
            }
          />
          <ToolbarButton
            label="Heading"
            icon={Heading2}
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <span className="mx-1 h-6 w-px bg-[color:var(--color-border)]" />
          <ToolbarButton
            label="Bullet list"
            icon={List}
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="Numbered list"
            icon={ListOrdered}
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            label="Code block"
            icon={Code2}
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          />
          <ToolbarButton
            label="Link"
            icon={LinkIcon}
            active={editor.isActive('link')}
            onClick={setLink}
          />
        </div>
      ) : null}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none flex-1 overflow-y-auto bg-white p-8 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-[color:var(--color-surface-low)] [&_.ProseMirror_code]:px-1 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_p]:text-[color:var(--color-text-secondary)] [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_pre]:my-4 [&_.ProseMirror_pre]:rounded-xl [&_.ProseMirror_pre]:border-l-4 [&_.ProseMirror_pre]:border-indigo-500 [&_.ProseMirror_pre]:!bg-slate-900 [&_.ProseMirror_pre]:p-6 [&_.ProseMirror_pre]:text-sm [&_.ProseMirror_pre]:!text-slate-100 [&_.ProseMirror_pre_code]:!bg-transparent [&_.ProseMirror_pre_code]:!p-0 [&_.ProseMirror_pre_code]:!text-slate-100 [&_.ProseMirror_pre_code_*]:!bg-transparent [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:list-decimal [&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-[color:var(--color-text-tertiary)] [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
      />
    </div>
  )
}
