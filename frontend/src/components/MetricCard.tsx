import React from 'react'

interface MetricCardProps {
  icon: React.ElementType
  iconClass: string
  label: string
  value: string
  badge: string
  badgeClass: string
  cardClass?: string
  labelClass?: string
  valueClass?: string
  watermark?: React.ReactNode
  onClick?: () => void
}

const MetricCard = ({
  icon: Icon, iconClass, label, value, badge, badgeClass,
  cardClass = 'bg-white border-outline-variant',
  labelClass = 'text-on-surface-variant',
  valueClass = 'text-on-surface',
  watermark, onClick,
}: MetricCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 ${cardClass} ${onClick ? 'cursor-pointer hover:border-primary/40 active:scale-[0.98]' : ''}`}
    >
      {watermark && <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">{watermark}</div>}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <Icon className={`h-6 w-6 ${iconClass}`} />
        <span className={`text-xs font-bold ${badgeClass}`}>{badge}</span>
      </div>
      <p className={`text-[11px] uppercase tracking-wider font-medium mb-1 relative z-10 ${labelClass}`}>{label}</p>
      <p className={`text-4xl font-extrabold leading-tight relative z-10 ${valueClass}`}>{value}</p>
    </div>
  )
}

export default MetricCard
