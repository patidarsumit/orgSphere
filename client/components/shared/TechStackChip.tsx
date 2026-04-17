const techStyles = [
  {
    matcher: /react|next|typescript|javascript/i,
    className: 'bg-blue-50 text-blue-700 ring-blue-100',
  },
  {
    matcher: /node|express|fastify/i,
    className: 'bg-green-50 text-green-700 ring-green-100',
  },
  {
    matcher: /python|fastapi|django/i,
    className: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  {
    matcher: /postgres|mysql|sql/i,
    className: 'bg-teal-50 text-teal-700 ring-teal-100',
  },
  {
    matcher: /docker|kubernetes|expo|storybook|figma/i,
    className: 'bg-purple-50 text-purple-700 ring-purple-100',
  },
  {
    matcher: /redis/i,
    className: 'bg-red-50 text-red-700 ring-red-100',
  },
]

const classNameForTech = (tech: string) =>
  techStyles.find((style) => style.matcher.test(tech))?.className ||
  'bg-gray-100 text-gray-700 ring-gray-200'

export function TechStackChip({
  tech,
  size = 'md',
}: {
  tech: string
  size?: 'sm' | 'md'
}) {
  const sizeClassName = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ${sizeClassName} ${classNameForTech(
        tech
      )}`}
    >
      {tech}
    </span>
  )
}
