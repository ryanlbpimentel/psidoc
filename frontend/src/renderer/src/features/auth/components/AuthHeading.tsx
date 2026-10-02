interface AuthHeadingProps {
  eyebrow?: string
  title: string
  description?: string
}

export function AuthHeading({ eyebrow, title, description }: AuthHeadingProps) {
  return (
    <header className="mb-6">
      {eyebrow && <p className="text-caption font-medium tracking-wide text-cyan-brand uppercase">{eyebrow}</p>}
      <h1 className="text-title leading-tight font-medium text-ink">{title}</h1>
      {description && <p className="mt-2 text-body leading-relaxed text-muted">{description}</p>}
    </header>
  )
}
