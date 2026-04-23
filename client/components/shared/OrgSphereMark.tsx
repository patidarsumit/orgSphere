interface OrgSphereMarkProps {
  className?: string
}

export function OrgSphereMark({ className }: OrgSphereMarkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-600 shadow-[0_8px_20px_-12px_rgba(79,70,229,0.9)] ${className ?? ''}`}
      aria-hidden="true"
    >
      <span className="absolute rounded-full border-[2px] border-white/90" style={{ inset: '26%' }} />
      <span className="absolute h-[18%] w-[18%] rounded-full bg-white" />
      <span className="absolute right-[18%] top-[24%] h-[13%] w-[13%] rounded-full bg-indigo-100 ring-1 ring-white/70" />
    </span>
  )
}
