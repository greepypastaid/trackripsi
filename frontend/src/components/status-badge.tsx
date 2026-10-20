import { Badge } from '@/components/ui/badge'
import { CheckCircle2, CircleDashed, Clock, RotateCcw } from 'lucide-react'
import type { ChapterStatus, ResearchStatus } from '@/services/types'
import type { LucideIcon } from 'lucide-react'

const CHAPTER_META: Record<ChapterStatus, { label: string; className: string; Icon: LucideIcon }> = {
  not_started: {
    label: 'Belum Mulai',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Icon: CircleDashed,
  },
  in_progress: {
    label: 'Dikerjakan',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    Icon: Clock,
  },
  revision: {
    label: 'Revisi',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    Icon: RotateCcw,
  },
  completed: {
    label: 'Selesai',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    Icon: CheckCircle2,
  },
}

const RESEARCH_META: Record<ResearchStatus, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  completed: { label: 'Selesai', className: 'bg-primary-100 text-primary-700 dark:bg-primary-700/30 dark:text-primary-100' },
  archived: { label: 'Arsip', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

export function ChapterStatusBadge({ status }: { status: ChapterStatus }) {
  const { label, className, Icon } = CHAPTER_META[status]
  return (
    <Badge className={`gap-1 border-transparent ${className}`}>
      <Icon aria-hidden="true" className="size-3" />
      {label}
    </Badge>
  )
}

export function ResearchStatusBadge({ status }: { status: ResearchStatus }) {
  const { label, className } = RESEARCH_META[status]
  return <Badge className={`border-transparent ${className}`}>{label}</Badge>
}
