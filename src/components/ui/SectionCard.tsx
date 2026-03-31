interface SectionCardProps {
  title: string
  children: React.ReactNode
}

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  )
}
