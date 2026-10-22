import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CalendarIcon, CheckCircle2, ChevronDown, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAppointmentMutations,
  useAppointments,
  useSuggestedAgenda,
} from '@/services/literature'
import { useResearch } from '@/services/researches'
import { ApiError } from '@/services/api'
import { EmptyState } from '@/components/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' })

const pad = (value: number) => String(value).padStart(2, '0')

function toLocalDate(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

export function AppointmentsPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research } = useResearch(id)
  const { data, isLoading, error } = useAppointments(id)
  const { data: suggestions = [] } = useSuggestedAgenda(id)
  const { create, update, remove, complete } = useAppointmentMutations(id)

  const [date, setDate] = useState<Date | undefined>(() => new Date())
  const [time, setTime] = useState('09:00')
  const [dateOpen, setDateOpen] = useState(false)
  const [agenda, setAgenda] = useState('')
  const [completing, setCompleting] = useState<number | null>(null)
  const [session, setSession] = useState({ chapterId: 'none', notes: '', items: '' })

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Jadwal bimbingannya nggak bisa dimuat.</AlertDescription>
      </Alert>
    )
  }

  const appointments = data?.data ?? []
  const next = data?.meta.next ?? null
  const planned = appointments.filter((a) => a.status === 'planned')
  const done = appointments.filter((a) => a.status === 'done')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return
    try {
      await create.mutateAsync({
        scheduled_at: `${toLocalDate(date)} ${time}:00`,
        agenda: agenda
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      })
      toast.success('Jadwal bimbingan dibuat.')
      setAgenda('')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Jadwalnya belum jadi. Coba lagi.')
    }
  }

  const submitComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (completing === null) return
    try {
      await complete.mutateAsync({
        appointmentId: completing,
        chapter_id: session.chapterId === 'none' ? null : Number(session.chapterId),
        meeting_date: toLocalDate(new Date()),
        feedback_notes: session.notes,
        action_items: session.items
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      })
      toast.success('Sesi tercatat di log bimbingan.')
      setCompleting(null)
      setSession({ chapterId: 'none', notes: '', items: '' })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Jadwalnya belum bisa diselesaikan.')
    }
  }

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Jadwal Bimbingan</h1>
        <p className="text-sm text-muted-foreground">
          Bikin jadwal sama pembimbing, tulis agendanya, terus tandai selesai. Log bimbingannya
          keisi sendiri.
        </p>
      </header>

      {next && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon aria-hidden="true" className="size-4 text-primary" />
              Pertemuan berikutnya
            </CardTitle>
            <CardDescription>
              {dateFmt.format(new Date(next.scheduled_at))} · {timeFmt.format(new Date(next.scheduled_at))}
            </CardDescription>
          </CardHeader>
          {next.agenda.length > 0 && (
            <CardContent>
              <ul className="list-inside list-disc text-sm">
                {next.agenda.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle>Buat jadwal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="appointment-date">Tanggal</Label>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          id="appointment-date"
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <CalendarIcon aria-hidden="true" className="size-4 shrink-0 text-primary" />
                            <span className="truncate">{date ? dateFmt.format(date) : 'Pilih tanggal'}</span>
                          </span>
                          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(value) => {
                            setDate(value)
                            setDateOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="appointment-hour">Jam</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={time.slice(0, 2)}
                        onValueChange={(hour) => setTime(`${hour}:${time.slice(3)}`)}
                      >
                        <SelectTrigger id="appointment-hour" aria-label="Jam" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 15 }, (_, i) => String(i + 7).padStart(2, '0')).map(
                            (hour) => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <Select
                        value={time.slice(3)}
                        onValueChange={(minute) => setTime(`${time.slice(0, 2)}:${minute}`)}
                      >
                        <SelectTrigger id="appointment-minute" aria-label="Menit" className="w-full">
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

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="agenda">Agenda (satu per baris)</Label>
                    {suggestions.length > 0 && (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => setAgenda(suggestions.join('\n'))}
                      >
                        <Sparkles aria-hidden="true" />
                        Isi dari data
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="agenda"
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    rows={4}
                    placeholder="Bahas revisi Bab 3…"
                  />
                </div>

                <Button type="submit" disabled={create.isPending || !date}>
                  <Plus aria-hidden="true" />
                  Simpan jadwal
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <h2 className="text-lg font-semibold">Akan datang ({planned.length})</h2>
          {planned.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="Belum ada jadwal"
              description="Bikin jadwal pertamamu di panel kiri. Abis selesai, bisa langsung jadi log bimbingan."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {planned.map((appointment) => (
                <li key={appointment.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        {dateFmt.format(new Date(appointment.scheduled_at))}
                        <Badge variant="outline">{timeFmt.format(new Date(appointment.scheduled_at))}</Badge>
                      </CardTitle>
                      {appointment.agenda.length > 0 && (
                        <CardDescription>
                          <ul className="list-inside list-disc">
                            {appointment.agenda.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setCompleting(appointment.id)}>
                        <CheckCircle2 aria-hidden="true" />
                        Tandai selesai
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => update.mutate({ appointmentId: appointment.id, status: 'cancelled' })}
                      >
                        Batalkan
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove.mutate(appointment.id)}
                        aria-label="Hapus jadwal"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          {done.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Selesai ({done.length})</h2>
              <ul className="divide-y rounded-lg border text-sm">
                {done.map((appointment) => (
                  <li key={appointment.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <Badge className="bg-status-done/10 text-status-done border-transparent">
                      Selesai
                    </Badge>
                    <span>{dateFmt.format(new Date(appointment.scheduled_at))}</span>
                    {appointment.log_id && (
                      <span className="text-xs text-muted-foreground">Log #{appointment.log_id}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Dialog open={completing !== null} onOpenChange={(open) => !open && setCompleting(null)}>
        <DialogContent>
          <form onSubmit={submitComplete} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Selesaikan sesi bimbingan</DialogTitle>
              <DialogDescription>
                Satu log bimbingan dibuat dari catatan ini, terus jadwalnya ditandai selesai.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label htmlFor="chapter">Bab terkait (opsional)</Label>
              <Select
                value={session.chapterId}
                onValueChange={(value) => setSession({ ...session, chapterId: value })}
              >
                <SelectTrigger id="chapter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak terkait bab</SelectItem>
                  {(research?.chapters ?? []).map((chapter) => (
                    <SelectItem key={chapter.id} value={String(chapter.id)}>
                      {chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Catatan hasil bimbingan</Label>
              <Textarea
                id="notes"
                value={session.notes}
                onChange={(e) => setSession({ ...session, notes: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="items">Poin revisi (satu per baris)</Label>
              <Textarea
                id="items"
                value={session.items}
                onChange={(e) => setSession({ ...session, items: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={complete.isPending}>
                Simpan sesi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
