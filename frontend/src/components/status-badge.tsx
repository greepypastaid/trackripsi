import { Badge } from '@/components/ui/badge'
import { CheckCircle2, CircleDashed, Clock, RotateCcw } from 'lucide-react'
import type { ChapterStatus, ResearchStatus } from '@/services/types'
import type { LucideIcon } from 'lucide-react'

/* Warna mengikuti token status di index.css (@theme --color-status-*)
   yang otomatis menyesuaikan di dark mode. */
const CHAPTER_META: Record<ChapterStatus, { label: string; className: string; Icon: LucideIcon }> = {
  not_started: {
    label: 'Belum Mulai',
    className: 'bg-status-todo/10 text-status-todo border-transparent',
    Icon: CircleDashed,
  },
  in_progress: {
    label: 'Dikerjakan',
    className: 'bg-status-progress/10 text-status-progress border-transparent',
    Icon: Clock,
  },
  revision: {
    label: 'Revisi',
    className: 'bg-status-revision/10 text-status-revision border-transparent',
    Icon: RotateCcw,
  },
  completed: {
    label: 'Selesai',
    className: 'bg-status-done/10 text-status-done border-transparent',
    Icon: CheckCircle2,
  },
}

const RESEARCH_META: Record<ResearchStatus, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-status-done/10 text-status-done border-transparent' },
  completed: { label: 'Selesai', className: 'bg-primary/10 text-primary border-transparent' },
  archived: { label: 'Arsip', className: 'bg-status-todo/10 text-status-todo border-transparent' },
}

export function ChapterStatusBadge({ status }: { status: ChapterStatus }) {
  const { label, className, Icon } = CHAPTER_META[status]
  return (
    <Badge className={`gap-1 ${className}`}>
      <Icon aria-hidden="true" className="size-3" />
      {label}
    </Badge>
  )
}

export function ResearchStatusBadge({ status }: { status: ResearchStatus }) {
  const { label, className } = RESEARCH_META[status]
  return <Badge className={className}>{label}</Badge>
}
