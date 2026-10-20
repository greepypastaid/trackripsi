import { Navigate, useParams } from 'react-router-dom'
import { CalendarClock, ListTodo, Target } from 'lucide-react'
import { useResearch } from '@/services/researches'
import { ChapterStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export function OverviewPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error || !research) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Gagal memuat</AlertTitle>
        <AlertDescription>Riset tidak ditemukan atau Anda tidak berhak mengaksesnya.</AlertDescription>
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
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{research.title}</h1>
        <p className="text-sm text-muted-foreground">
          {research.faculty_field ?? 'Bidang belum diisi'}
          {research.supervisor_name ? ` · Pembimbing: ${research.supervisor_name}` : ''}
        </p>
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
              <Badge className="border-transparent bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
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

      <Card>
        <CardHeader>
          <CardTitle>Progres per bab</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-4">
            {chapters.map((chapter) => (
              <li key={chapter.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{chapter.title}</span>
                  <span className="flex items-center gap-2">
                    <ChapterStatusBadge status={chapter.status} />
                    <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                      {chapter.progress_percent}%
                    </span>
                  </span>
                </div>
                <Progress value={chapter.progress_percent} aria-label={`Progres ${chapter.title}`} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
