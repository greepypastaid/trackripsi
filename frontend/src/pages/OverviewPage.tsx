import { Link, Navigate, useParams } from 'react-router-dom'
import { CalendarClock, ListTodo, NotebookPen, Target, Upload } from 'lucide-react'
import { useResearch } from '@/services/researches'
import { ChapterStatusBadge } from '@/components/status-badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{research.title}</h1>
          <p className="text-sm text-muted-foreground">
            {research.faculty_field ?? 'Bidang belum diisi'}
            {research.supervisor_name ? ` · Pembimbing: ${research.supervisor_name}` : ''}
          </p>
        </div>
        <nav aria-label="Tindakan cepat" className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/researches/${id}/chapters`}>
              <ListTodo aria-hidden="true" />
              Kelola bab &amp; tugas
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
    </div>
  )
}
