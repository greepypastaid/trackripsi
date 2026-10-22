import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { format, isValid } from 'date-fns'
import {
  CalendarClock,
  CheckCircle2,
  FileDown,
  ListTodo,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  ShieldCheck,
  Target,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { useResearch, useTimeline } from '@/services/researches'
import { useReadiness } from '@/services/literature'
import { ChapterStatusBadge, ResearchStatusBadge } from '@/components/status-badge'
import { ResearchStatusMenuItems } from '@/components/research-status-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteResearchDialog, ResearchFormDialog } from '@/components/research-dialogs'

const EVENT_META = {
  task_completed: { label: 'Tugas selesai', Icon: CheckCircle2, className: 'text-status-done' },
  draft_uploaded: { label: 'Draf diunggah', Icon: Upload, className: 'text-primary' },
  supervision_logged: { label: 'Bimbingan dicatat', Icon: NotebookPen, className: 'text-status-todo' },
  appointment_done: { label: 'Sesi bimbingan selesai', Icon: CalendarClock, className: 'text-status-todo' },
} as const

export function OverviewPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)
  const { data: timeline } = useTimeline(id)
  const { data: readiness } = useReadiness(id)
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error || !research) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Nggak bisa dimuat</AlertTitle>
        <AlertDescription>Riset ini nggak ada, atau bukan punya akunmu.</AlertDescription>
      </Alert>
    )
  }

  const now = new Date()
  const chapters = research.chapters ?? []
  const tasks = chapters.flatMap((c) => c.tasks ?? [])
  const pending = tasks.filter((t) => !t.is_completed)
  const overdue = pending.filter((t) => t.due_date && new Date(t.due_date) < now)

  const countdown = research.target_completion_date
    ? Math.ceil((new Date(research.target_completion_date).getTime() - now.getTime()) / 86_400_000)
    : null

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{research.title}</h1>
            <ResearchStatusBadge status={research.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {research.faculty_field ?? 'Bidang belum diisi'}
            {research.supervisor_name ? ` · Pembimbing: ${research.supervisor_name}` : ''}
          </p>
        </div>
        <nav aria-label="Tindakan cepat" className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/researches/${id}/chapters`}>
              <ListTodo aria-hidden="true" />
              Atur bab &amp; tugas
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/researches/${id}/guidance-logs`}>
              <NotebookPen aria-hidden="true" />
              Catat bimbingan
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/researches/${id}/documents`}>
              <Upload aria-hidden="true" />
              Unggah draf
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const { apiRaw } = await import('@/services/download')
              await apiRaw(`/researches/${id}/export`, `rekap-riset-${id}.md`)
              toast.success('Rekap udah diunduh')
            }}
          >
            <FileDown aria-hidden="true" />
            Unduh rekap
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal aria-hidden="true" />
                Kelola
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setFormOpen(true)}>
                <Pencil aria-hidden="true" />
                Edit riset
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 aria-hidden="true" />
                Hapus riset
              </DropdownMenuItem>
              <ResearchStatusMenuItems research={research} />
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </header>

      <section aria-label="Metrik progres" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target aria-hidden="true" className="size-4" />
              Progres total
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-mono text-2xl font-bold" aria-live="polite">
              {research.progress_percent ?? 0}%
            </p>
            <Progress value={research.progress_percent ?? 0} aria-label="Progres total skripsi" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListTodo aria-hidden="true" className="size-4" />
              Tugas tertunda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-mono text-2xl font-bold">{pending.length}</p>
            {overdue.length > 0 && (
              <Badge className="border-transparent bg-status-blocked/10 text-status-blocked">
                {overdue.length} lewat tenggat
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarClock aria-hidden="true" className="size-4" />
              Target selesai
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-mono text-2xl font-bold">
              {countdown === null ? '—' : countdown < 0 ? 'Lewat' : `${countdown} hari`}
            </p>
            <p className="text-xs text-muted-foreground">{research.target_completion_date ?? 'Belum ditentukan'}</p>
          </CardContent>
        </Card>
      </section>

      {readiness && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
              <span className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                Kesiapan sidang: {readiness.score}%
              </span>
              <Button asChild variant="outline" size="sm">
                <Link to={`/researches/${id}/readiness`}>Lihat rincian</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={readiness.score} aria-label="Skor kesiapan sidang" />
            {readiness.blockers.length > 0 ? (
              <ul className="text-sm text-muted-foreground">
                {readiness.blockers.slice(0, 3).map((blocker) => (
                  <li key={blocker.key} className="flex gap-2">
                    <span aria-hidden="true">•</span>
                    <span>
                      <span className="font-medium text-foreground">{blocker.label}</span>:{' '}
                      {blocker.detail}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-status-done">Semua syarat udah beres.</p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{readiness.stats.literature_included} sumber masuk</Badge>
              <Badge variant="outline">
                {readiness.stats.supervision_logs}/{readiness.stats.min_supervision_sessions} sesi
              </Badge>
              <Badge variant="outline">{readiness.stats.upcoming_appointments} jadwal mendatang</Badge>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to={`/researches/${id}/logbook/print`}>Cetak log bimbingan</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section aria-label="Timeline aktivitas" className="space-y-3">
        <h2 className="text-xl font-semibold">Timeline aktivitas</h2>
        <Card size="sm">
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Isinya otomatis: tiap kali kamu selesaikan tugas, upload draf, catat bimbingan, atau tandai jadwal selesai.
            </p>
            {timeline === undefined ? (
              <Skeleton className="h-24 w-full" />
            ) : timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada jejak. Selesaikan satu tugas atau upload draf, nanti riwayatnya muncul di sini.
              </p>
            ) : (
              <ol className="space-y-3">
                {timeline.map((event, index) => {
                  const { label, Icon, className } = EVENT_META[event.type]
                  const date = new Date(event.occurred_at)
                  return (
                    <li key={`${event.type}-${event.occurred_at}-${index}`} className="flex items-start gap-3 text-sm">
                      <Icon aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${className}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">
                          <span className="font-medium">{event.title}</span>
                          {event.chapter ? <span className="text-muted-foreground"> · {event.chapter}</span> : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {label} ·{' '}
                          <time dateTime={event.occurred_at}>
                            {isValid(date) ? format(date, 'd MMM yyyy HH:mm') : event.occurred_at}
                          </time>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-label="Progres per bab" className="space-y-3">
        <h2 className="text-xl font-semibold">Progres per bab</h2>
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Card size="sm">
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{chapter.title}</span>
                    <ChapterStatusBadge status={chapter.status} />
                  </div>
                  <Progress value={chapter.progress_percent} aria-label={`Progres ${chapter.title}`} />
                  <p className="text-right font-mono text-xs text-muted-foreground">
                    {chapter.progress_percent}%
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <ResearchFormDialog open={formOpen} onOpenChange={setFormOpen} research={research} />
      <DeleteResearchDialog
        research={deleteOpen ? research : null}
        onOpenChange={(open) => !open && setDeleteOpen(false)}
        onDeleted={() => navigate('/dashboard')}
      />
    </div>
  )
}
