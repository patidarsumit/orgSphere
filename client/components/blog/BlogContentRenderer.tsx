'use client'

import { TiptapEditor } from '@/components/notes/TiptapEditor'

export function BlogContentRenderer({ content }: { content: Record<string, unknown> }) {
  return (
    <div className="blog-prose overflow-hidden rounded-xl bg-white">
      <TiptapEditor
        content={content}
        editable={false}
        onChange={() => undefined}
        placeholder=""
      />
    </div>
  )
}
