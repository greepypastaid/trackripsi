import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CalendarIcon, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { useConvertActionItems, useCreateLog, useResearch } from '@/services/researches'
import { EmptyState } from '@/components/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

// Dipanggil di level modul agar tidak menganggu purity render.
const TODAY = new Date()
const TODAY_ISO = TODAY.toISOString().slice(0, 10)

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function GuidanceLogsPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)
  const createLog = useCreateLog(id)
  const convert = useConvertActionItems(id)

  const [meetingDate, setMeetingDate] = useState(TODAY_ISO)
  const [dateOpen, setDateOpen] = useState(false)
  const [chapterId, setChapterId] = useState('none')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState('')

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Gagal memuat log bimbingan.</AlertDescription>
      </Alert>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createLog.mutateAsync({
        meeting_date: meetingDate,
        chapter_id: chapterId === 'none' ? null : Number(chapterId),
        feedback_notes: notes,
        action_items: items.split('\n').map((s) => s.trim()).filter(Boolean),
      })
      toast.success('Log bimbingan tersimpan.')
      setNotes('')
      setItems('')
    } catch {
      toast.error('Gagal menyimpan log bimbingan.')
    }
  }

  const logs = research?.supervision_logs ?? []
  const selectedDate = meetingDate ? new Date(`${meetingDate}T00:00:00`) : undefined

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Log Bimbingan</h1>
        <p className="text-sm text-muted-foreground">
          Catat hasil setiap sesi bimbingan; poin revisi bisa langsung dikonversi menjadi checklist
          tugas bab.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <form
          id="create-log"
          onSubmit={submit}
          className="space-y-4 lg:sticky lg:top-20"
        >
          <Card>
            <CardHeader>
              <CardTitle>Catat bimbingan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="meeting_date">Tanggal bimbingan</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      id="meeting_date"
                      variant="outline"
                      className="w-full justify-between font-normal"
                      aria-expanded={dateOpen}
                    >
                      {selectedDate ? dateFmt.format(selectedDate) : 'Pilih tanggal'}
                      <CalendarIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(value) => {
                        if (value) {
                          const y = value.getFullYear()
                          const m = String(value.getMonth() + 1).padStart(2, '0')
                          const d = String(value.getDate()).padStart(2, '0')
                          setMeetingDate(`${y}-${m}-${d}`)
                        }
                        setDateOpen(false)
                      }}
                      disabled={{ after: TODAY }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="log_chapter">Bab terkait (opsional)</Label>
                <Select value={chapterId} onValueChange={setChapterId}>
                  <SelectTrigger id="log_chapter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak terkait bab</SelectItem>
                    {research?.chapters?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="feedback">Catatan masukan</Label>
                <Textarea
                  id="feedback"
                  required
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="actions">Poin revisi (satu per baris)</Label>
                <Textarea
                  id="actions"
                  rows={4}
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  placeholder={'Revisi latar belakang\nSusun tabel penelitian terdahulu'}
                />
              </div>
              <Button type="submit" disabled={createLog.isPending}>
                {createLog.isPending ? 'Menyimpan…' : 'Simpan log'}
              </Button>
            </CardContent>
          </Card>
        </form>

        <section aria-label="Riwayat bimbingan" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Riwayat</h2>
            {logs.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {logs.length} sesi tercatat
              </p>
            )}
          </div>
          {logs.length === 0 && (
            <EmptyState
              icon={ListChecks}
              title="Belum ada catatan bimbingan"
              description="Catat hasil setiap sesi bimbingan agar poin revisi tidak terlupakan."
            />
          )}
          <ol className="grid items-start gap-3 xl:grid-cols-2">
            {logs.map((log) => (
              <li key={log.id}>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {log.meeting_date}
                      </Badge>
                    </CardTitle>
                    <CardAction>
                      {log.chapter_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            convert.mutate(log.id, {
                              onSuccess: () => toast.success('Poin revisi dikonversi ke checklist bab.'),
                              onError: () => toast.error('Gagal mengonversi poin revisi.'),
                            })
                          }
                          disabled={convert.isPending}
                        >
                          Jadikan checklist
                        </Button>
                      )}
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-foreground">{log.feedback_notes}</p>
                    {log.action_items && log.action_items.length > 0 && (
                      <ul className="flex flex-col gap-1">
                        {log.action_items.map((item) => (
                          <li key={item.id}>
                            {item.is_resolved ? (
                              <span className="text-sm text-muted-foreground line-through">
                                {item.description}
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 text-sm text-status-revision">
                                <span
                                  aria-hidden="true"
                                  className="size-1.5 rounded-full bg-status-revision"
                                />
                                {item.description}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
