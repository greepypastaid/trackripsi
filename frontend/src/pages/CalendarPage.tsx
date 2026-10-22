import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock, NotebookPen, BookOpen, Plus, Trash2, Video } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/services/api'
import { useResearch } from '@/services/researches'
import { useAppointmentMutations } from '@/services/literature'
import type { Response } from '@/services/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DatePicker } from '@/components/date-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Textarea } from '@/components/ui/textarea'

interface CalendarDay {
  tasks?: Array<{ id: number; title: string; chapter: string; is_completed: boolean }>
  appointments?: Array<{ id: number; scheduled_at: string; status: string }>
  supervision?: Array<{ id: number; title: string }>
  journal?: Array<{ id: number; mood: string }>
  focus_minutes?: number
}

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const APPOINTMENT_LABEL: Record<string, string> = {
  planned: 'dijadwalkan',
  done: 'selesai',
  cancelled: 'dibatalkan',
}

const MOOD_LABEL: Record<string, string> = {
  produktif: 'produktif',
  biasa: 'biasa saja',
  struggle: 'kesulitan',
}

function useCalendar(id: number, month: string) {
  return useQuery({
    queryKey: ['calendar', id, month],
    queryFn: () => api<Response<Record<string, CalendarDay>>>(`/researches/${id}/calendar?month=${month}`).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

export function CalendarPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)
  const [cursor, setCursor] = useState(() => format(new Date(), 'yyyy-MM'))
  const [selected, setSelected] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const { data: days, isLoading: loadingDays } = useCalendar(id, cursor)
  const qc = useQueryClient()
  const { create } = useAppointmentMutations(Number.isFinite(id) ? id : Number.NaN)
  const invalidateCalendar = () => {
    qc.invalidateQueries({ queryKey: ['calendar', id] })
  }
  const toggleTask = useMutation({
    mutationFn: (taskId: number) => api(`/tasks/${taskId}/toggle`, { method: 'PATCH' }),
    onSuccess: () => {
      invalidateCalendar()
      qc.invalidateQueries({ queryKey: ['research', id] })
    },
  })
  const deleteTask = useMutation({
    mutationFn: (taskId: number) => api(`/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateCalendar()
      qc.invalidateQueries({ queryKey: ['research', id] })
    },
  })
  const deleteAppointment = useMutation({
    mutationFn: (appointmentId: number) => api(`/appointments/${appointmentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateCalendar()
      qc.invalidateQueries({ queryKey: ['appointments', id] })
    },
  })
  const deleteJournal = useMutation({
    mutationFn: (entryId: number) => api(`/journal/${entryId}`, { method: 'DELETE' }),
    onSuccess: invalidateCalendar,
  })
  const [confirm, setConfirm] = useState<{
    title: string
    description: string
    confirmLabel: string
    run: () => void
  } | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<{ date: Date | undefined; time: string; agenda: string }>({
    date: undefined,
    time: '09:00',
    agenda: '',
  })

  const grid = useMemo(() => {
    const first = new Date(`${cursor}-01T00:00:00`)
    const lead = (first.getDay() + 6) % 7 // Senin = kolom pertama.
    const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
    const cells: Array<{ date: string; day: number } | null> = Array.from({ length: lead }, () => null)
    for (let day = 1; day <= total; day++) {
      cells.push({ date: `${cursor}-${String(day).padStart(2, '0')}`, day })
    }
    return cells
  }, [cursor])

  const shiftMonth = (delta: number) => {
    const first = new Date(`${cursor}-01T00:00:00`)
    first.setMonth(first.getMonth() + delta)
    setCursor(format(first, 'yyyy-MM'))
    setSelected(format(new Date(), 'yyyy-MM-dd'))
  }

  const openAdd = (date: string) => {
    setForm({
      date: date === format(new Date(), 'yyyy-MM-dd') ? new Date() : new Date(`${date}T00:00:00`),
      time: '09:00',
      agenda: '',
    })
    setAddOpen(true)
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date) {
      toast.error('Tanggalnya belum dipilih.')
      return
    }
    try {
      await create.mutateAsync({
        scheduled_at: `${format(form.date, 'yyyy-MM-dd')} ${form.time}:00`,
        agenda: form.agenda
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      })
      qc.invalidateQueries({ queryKey: ['calendar', id, cursor] })
      qc.invalidateQueries({ queryKey: ['appointments', id] })
      toast.success('Jadwal bimbingan dibuat.')
      setAddOpen(false)
    } catch {
      toast.error('Jadwalnya belum jadi. Coba lagi.')
    }
  }

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

  const today = format(new Date(), 'yyyy-MM-dd')
  const selectedData = selected ? days?.[selected] : undefined
  const hasSelection = Boolean(selectedData && Object.keys(selectedData).length > 0)

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
          <p className="text-sm text-muted-foreground">Satu bulan sekali lihat: tenggat tugas, jadwal bimbingan, sesi fokus, sama jurnal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya">
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="min-w-28 text-center text-sm font-semibold capitalize" aria-live="polite">
            {format(new Date(`${cursor}-01T00:00:00`), 'MMMM yyyy', { locale: localeId })}
          </span>
          <Button variant="outline" size="sm" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya">
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button size="sm" className="sm:ml-2" onClick={() => openAdd(selected)}>
            <Plus aria-hidden="true" />
            Tambah jadwal
          </Button>
        </div>
      </header>

      <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card size="sm">
          <CardContent>
            {loadingDays ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={`Kalender ${cursor}`}>
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    role="columnheader"
                    className="pb-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {grid.map((cell, index) => {
                  if (!cell) return <div key={`blank-${index}`} role="presentation" />
                  const data = days?.[cell.date]
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      role="gridcell"
                      aria-label={`${cell.date}${data ? ', ada agenda' : ''}`}
                      aria-selected={selected === cell.date}
                      onClick={() => setSelected(cell.date)}
                      className={`relative flex h-20 flex-col items-center justify-center gap-1 rounded-lg border text-base transition-colors hover:bg-accent sm:h-24 ${
                        selected === cell.date ? 'border-primary bg-primary/10' : ''
                      } ${cell.date === today ? 'font-bold' : ''}`}
                    >
                      <span>{cell.day}</span>
                      {data ? (
                        <span className="flex h-1.5 items-center gap-1" aria-hidden="true">
                          {data.tasks && <span className="size-1.5 rounded-full bg-blue-500" />}
                          {data.appointments && <span className="size-1.5 rounded-full bg-amber-500" />}
                          {data.supervision && <span className="size-1.5 rounded-full bg-violet-500" />}
                          {data.journal && <span className="size-1.5 rounded-full bg-emerald-500" />}
                        </span>
                      ) : null}
                      {data?.focus_minutes ? (
                        <span className="absolute right-1 top-1 text-[10px] leading-none text-muted-foreground">
                          {data.focus_minutes}m
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
            <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-blue-500" aria-hidden="true" /> Tenggat tugas</span>
              <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" /> Jadwal</span>
              <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-violet-500" aria-hidden="true" /> Log bimbingan</span>
              <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" /> Jurnal</span>
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className="lg:sticky lg:top-16">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
              {format(new Date(`${selected ?? today}T00:00:00`), 'd MMMM yyyy', { locale: localeId })}
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/researches/${id}/appointments`}>Semua jadwal</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!hasSelection ? (
              <p className="text-muted-foreground">Nggak ada agenda hari ini.</p>
            ) : (
              <>
                {selectedData!.focus_minutes ? (
                  <p className="flex items-center gap-1.5">
                    <Clock aria-hidden="true" className="size-4 text-primary" />
                    {selectedData!.focus_minutes} menit fokus
                  </p>
                ) : null}
                {selectedData!.tasks?.map((task) => {
                  const done = task.is_completed
                  return (
                    <div key={`task-${task.id}`} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={done ? `Tandai ${task.title} belum selesai` : `Selesaikan ${task.title}`}
                        onClick={() => toggleTask.mutate(task.id)}
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                      >
                        {done ? (
                          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-status-done" />
                        ) : (
                          <Circle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className={`truncate ${done ? 'line-through' : 'font-medium'}`}>{task.title}</span>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus tugas ${task.title}`}
                        onClick={() =>
                          setConfirm({
                            title: 'Hapus tugas ini?',
                            description: `“${task.title}” bakal hilang dari bab asalnya.`,
                            confirmLabel: 'Ya, hapus',
                            run: () => deleteTask.mutate(task.id),
                          })
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  )
                })}
                {selectedData!.appointments?.map((appointment) => (
                  <div key={`appt-${appointment.id}`} className="flex items-center gap-1.5">
                    <p className="flex min-w-0 flex-1 items-center gap-1.5">
                      <Video aria-hidden="true" className="size-4 shrink-0 text-amber-500" />
                      <span className="truncate">
                        Bimbingan {format(new Date(appointment.scheduled_at), 'HH:mm')}
                        <span className="text-muted-foreground">
                          {' '}
                          ({APPOINTMENT_LABEL[appointment.status] ?? appointment.status})
                        </span>
                      </span>
                    </p>
                    {appointment.status === 'planned' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Batalkan jadwal"
                        onClick={() =>
                          setConfirm({
                            title: 'Batalkan jadwal ini?',
                            description: `Jadwal bimbingan jam ${format(new Date(appointment.scheduled_at), 'HH:mm')} bakal dihapus, bukan ditandai selesai.`,
                            confirmLabel: 'Ya, batalkan',
                            run: () => deleteAppointment.mutate(appointment.id),
                          })
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))}
                {selectedData!.supervision?.map((log) => (
                  <p key={`log-${log.id}`} className="flex items-center gap-1.5">
                    <NotebookPen aria-hidden="true" className="size-4 shrink-0 text-violet-500" />
                    <span className="truncate">{log.title}</span>
                  </p>
                ))}
                {selectedData!.journal?.map((entry) => (
                  <div key={`journal-${entry.id}`} className="flex items-center gap-1.5">
                    <p className="flex min-w-0 flex-1 items-center gap-1.5">
                      <BookOpen aria-hidden="true" className="size-4 shrink-0 text-emerald-500" />
                      <span className="truncate">Jurnal · suasana {MOOD_LABEL[entry.mood] ?? entry.mood}</span>
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Hapus entri jurnal"
                      onClick={() =>
                        setConfirm({
                          title: 'Hapus entri jurnal ini?',
                          description:
                            'Catatan harian beserta suasananya bakal hilang dan nggak bisa dikembalikan.',
                          confirmLabel: 'Ya, hapus',
                          run: () => deleteJournal.mutate(entry.id),
                        })
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel={confirm?.confirmLabel}
        pending={deleteTask.isPending || deleteAppointment.isPending || deleteJournal.isPending}
        onConfirm={() => {
          confirm?.run()
          setConfirm(null)
        }}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah jadwal bimbingan</DialogTitle>
            <DialogDescription>
              Jadwalnya muncul di kalender. Abis selesai, bisa kamu lengkapin jadi log bimbingan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Tanggal</Label>
                <DatePicker
                  value={form.date}
                  onChange={(value) => setForm((f) => ({ ...f, date: value }))}
                  ariaLabel="Tanggal jadwal"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Jam</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={form.time.slice(0, 2)}
                    onValueChange={(hour) => setForm((f) => ({ ...f, time: `${hour}:${f.time.slice(3)}` }))}
                  >
                    <SelectTrigger aria-label="Jam" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={form.time.slice(3)}
                    onValueChange={(minute) => setForm((f) => ({ ...f, time: `${f.time.slice(0, 2)}:${minute}` }))}
                  >
                    <SelectTrigger aria-label="Menit" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['00', '15', '30', '45'].map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-agenda">Agenda (satu per baris, opsional)</Label>
              <Textarea
                id="appt-agenda"
                rows={3}
                value={form.agenda}
                onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
                placeholder="Diskusi Bab 1&#10;Feedback metodologi"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={create.isPending}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
