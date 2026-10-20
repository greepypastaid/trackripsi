import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, CalendarClock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCreateResearch, useResearches } from '@/services/researches'
import { useAppointments } from '@/services/literature'
import { ResearchStatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/services/api'
import type { Research } from '@/services/types'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: researches, isLoading } = useResearches()
  const createResearch = useCreateResearch()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', field: '', target: '' })

  // Jadwal mendatang lintas riset: satu query per riset (maks 5 teratas).
  const activeId = researches?.[0]?.id
  const { data: appointmentData } = useAppointments(activeId ?? Number.NaN)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const research = await createResearch.mutateAsync({
        title: form.title,
        faculty_field: form.field || null,
        target_completion_date: form.target || null,
      })
      toast.success('Riset dibuat', { description: `${research.title} siap dengan template Bab 1–5.` })
      setForm({ title: '', field: '', target: '' })
      setOpen(false)
      // Langsung bawa pengguna ke riset barunya agar alur tidak terputus.
      navigate(`/researches/${research.id}/overview`)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal membuat riset.'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Halo, {user?.name.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">Pantau progres semua riset aktif Anda.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" aria-hidden="true" />
              Riset Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat riset baru</DialogTitle>
              <DialogDescription>
                Sistem otomatis menyiapkan template Bab 1 sampai Bab 5 untuk riset ini.
              </DialogDescription>
            </DialogHeader>
            <form id="create-research" onSubmit={submit} className="flex flex-col gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Judul skripsi</Label>
                <Input
                  id="title"
                  required
                  maxLength={500}
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="field">Bidang studi (opsional)</Label>
                <Input
                  id="field"
                  maxLength={255}
                  value={form.field}
                  onChange={(e) => setForm((prev) => ({ ...prev, field: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="target">Target selesai (opsional)</Label>
                <Input
                  id="target"
                  type="date"
                  value={form.target}
                  onChange={(e) => setForm((prev) => ({ ...prev, target: e.target.value }))}
                />
              </div>
            </form>
            <DialogFooter>
              <Button type="submit" form="create-research" disabled={createResearch.isPending}>
                {createResearch.isPending ? 'Menyimpan…' : 'Simpan riset'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
          description="Mulai dengan membuat proyek riset pertama. Sistem akan menyiapkan template Bab 1 sampai Bab 5 otomatis."
          action={<Button onClick={() => setOpen(true)}>Buat riset pertama</Button>}
        />
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {researches?.map((research: Research) => (
          <li key={research.id}>
            <Link to={`/researches/${research.id}/overview`} className="group block rounded-xl outline-none">
              <Card className="h-full justify-between transition-all group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="leading-snug">{research.title}</CardTitle>
                    <ResearchStatusBadge status={research.status} />
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
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
