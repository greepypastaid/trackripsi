import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarClock, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useResearches } from '@/services/researches'
import { useAppointments } from '@/services/literature'
import { ResearchStatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { DeleteResearchDialog, ResearchFormDialog } from '@/components/research-dialogs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { Research } from '@/services/types'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: researches, isLoading } = useResearches()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Research | null>(null)
  const [deleting, setDeleting] = useState<Research | null>(null)

  // Jadwal mendatang lintas riset: satu query per riset (maks 5 teratas).
  const activeId = researches?.[0]?.id
  const { data: appointmentData } = useAppointments(activeId ?? Number.NaN)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (research: Research) => {
    setEditing(research)
    setFormOpen(true)
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Halo, {user?.name.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">Ini semua riset yang lagi kamu kerjakan.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Riset baru
        </Button>
      </header>

      {appointmentData?.meta.next && researches?.[0] && (
        <Alert>
          <CalendarClock aria-hidden="true" />
          <AlertDescription className="flex flex-wrap items-center gap-x-2">
            <span className="font-medium">Bimbingan berikutnya:</span>
            <span>
              {new Date(appointmentData.meta.next.scheduled_at).toLocaleString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <Button asChild variant="link" size="sm" className="px-0">
              <Link to={`/researches/${researches[0].id}/appointments`}>
                {researches[0].title}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      {!isLoading && researches?.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Belum ada riset"
          description="Bikin riset pertamamu. Bab 1 sampai Bab 5 langsung ada, nggak perlu nyiapin apa-apa."
          action={<Button onClick={openCreate}>Buat riset pertama</Button>}
        />
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {researches?.map((research: Research) => (
          <li key={research.id}>
            {/* Tautan dibentangkan lewat after:inset-0 supaya satu kartu bisa diklik,
                tanpa menyarangkan tombol aksi di dalam elemen <a>. */}
            <Card className="relative h-full justify-between transition-all focus-within:ring-2 focus-within:ring-ring hover:ring-primary">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="leading-snug">
                    <Link
                      to={`/researches/${research.id}/overview`}
                      className="after:absolute after:inset-0 after:content-[''] hover:underline"
                    >
                      {research.title}
                    </Link>
                  </CardTitle>
                  <div className="relative z-10 flex shrink-0 items-center gap-1">
                    <ResearchStatusBadge status={research.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Aksi riset ${research.title}`}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEdit(research)}>
                          <Pencil aria-hidden="true" />
                          Edit riset
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(research)}>
                          <Trash2 aria-hidden="true" />
                          Hapus riset
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardDescription>
                  {research.faculty_field ?? 'Bidang belum diisi'}
                  {research.target_completion_date ? ` · target ${research.target_completion_date}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <p className="font-mono text-sm" aria-live="polite">
                  {research.progress_percent ?? 0}% selesai
                </p>
                <Progress value={research.progress_percent ?? 0} aria-label={`Progres ${research.title}`} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <ResearchFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        research={editing}
      />
      <DeleteResearchDialog research={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  )
}
