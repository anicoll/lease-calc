interface SectionCardProps {
  title: string
  children: React.ReactNode
}

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div data-pdf-section className="glass-panel p-5">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h3>
      {children}
    </div>
  )
}
