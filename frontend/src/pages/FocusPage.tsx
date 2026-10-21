import { useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Flame, Pause, Play, Timer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useResearch, useUpdateResearch } from '@/services/researches'
import type { Response } from '@/services/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface FocusSession {
  id: number
  started_at: string
  ended_at: string
  duration_minutes: number
  note: string | null
}

interface FocusPayload {
  sessions: FocusSession[]
  total_minutes: number
  week_minutes: number
  today_minutes: number
  daily_target_minutes: number | null
  streak_days: number
}

function useFocusSessions(id: number) {
  return useQuery({
    queryKey: ['focus-sessions', id],
    queryFn: () => api<Response<FocusPayload>>(`/researches/${id}/focus-sessions`).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

export function FocusPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)
  const { data: payload } = useFocusSessions(id)
  const qc = useQueryClient()
  const updateTarget = useUpdateResearch()

  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [note, setNote] = useState('')
  const startedAtRef = useRef<Date | null>(null)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [running])

  const saveSession = useMutation({
    mutationFn: (body: { started_at: string; ended_at: string; note: string | null }) =>
      api<Response<FocusSession>>(`/researches/${id}/focus-sessions`, { method: 'POST', body }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-sessions', id] })
      toast.success('Sesi fokus tersimpan')
    },
    onError: () => toast.error('Gagal menyimpan sesi.'),
  })

  const deleteSession = useMutation({
    mutationFn: (sessionId: number) => api(`/focus-sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['focus-sessions', id] }),
  })

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

  const toggle = () => {
    if (!running) {
      startedAtRef.current = new Date()
      setRunning(true)
      return
    }
    // Berhenti: simpan sesi bila >= 1 menit, reset timer.
    setRunning(false)
    const endedAt = new Date()
    if (seconds < 60) {
      toast.info('Sesi terlalu pendek, tidak disimpan.')
      setSeconds(0)
      return
    }
    saveSession.mutate({
      started_at: (startedAtRef.current ?? endedAt).toISOString(),
      ended_at: endedAt.toISOString(),
      note: note.trim() || null,
    })
    setSeconds(0)
    setNote('')
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Fokus</h1>
        <p className="text-sm text-muted-foreground">Timer belajar untuk {research.title} — setiap sesi tercatat otomatis.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer aria-hidden="true" className="size-4 text-primary" />
              Timer sesi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center font-mono text-5xl font-semibold tabular-nums" aria-live="off">
              {mm}:{ss}
            </p>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Sedang mengerjakan apa? (opsional)"
              maxLength={500}
              aria-label="Catatan sesi"
            />
            <Button className="w-full" onClick={toggle} aria-pressed={running}>
              {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {running ? 'Berhenti & simpan' : 'Mulai'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target &amp; total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hari ini</span>
                <span className="font-semibold tabular-nums">
                  {payload?.today_minutes ?? 0}
                  {payload?.daily_target_minutes ? ` / ${payload.daily_target_minutes}` : ''} menit
                </span>
              </div>
              {payload?.daily_target_minutes ? (
                <Progress
                  value={Math.min(100, (payload.today_minutes / payload.daily_target_minutes) * 100)}
                  aria-label="Progres target hari ini"
                />
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {payload && payload.streak_days > 0 ? (
                <Badge variant="outline" className="text-status-done">
                  <Flame aria-hidden="true" className="size-3" />
                  {payload.streak_days} hari beruntun
                </Badge>
              ) : null}
              {payload ? (
                <>
                  <Badge variant="outline">{Math.floor(payload.week_minutes / 60)} jam minggu ini</Badge>
                  <Badge variant="outline">{Math.floor(payload.total_minutes / 60)} jam total</Badge>
                </>
              ) : null}
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="daily-target">Target harian (menit)</Label>
                <Input
                  id="daily-target"
                  type="number"
                  min={5}
                  max={1440}
                  defaultValue={payload?.daily_target_minutes ?? ''}
                  key={payload?.daily_target_minutes ?? 'unset'}
                  onBlur={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null
                    if (value !== (payload?.daily_target_minutes ?? null)) {
                      updateTarget.mutate({ id, daily_target_minutes: value })
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section aria-label="Riwayat sesi fokus" className="space-y-3">
        <h2 className="text-xl font-semibold">Riwayat sesi</h2>
        {payload && payload.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada sesi. Mulai timernya di atas.</p>
        ) : (
          <ul className="space-y-2">
            {payload?.sessions.map((session) => (
              <li key={session.id}>
                <Card size="sm">
                  <CardContent className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{session.note ?? 'Tanpa catatan'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.started_at), 'd MMM yyyy HH:mm')} · {session.duration_minutes} menit
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Hapus sesi ${session.duration_minutes} menit`}
                      onClick={() => deleteSession.mutate(session.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
