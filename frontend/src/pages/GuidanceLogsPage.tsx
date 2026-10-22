import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CalendarIcon, ChevronsUpDown, CircleAlert, CircleCheck, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { useConvertActionItems, useCreateLog, useResearch } from '@/services/researches'
import { EmptyState } from '@/components/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  const [chapterIds, setChapterIds] = useState<number[]>([])
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState('')

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Log bimbingannya nggak bisa dimuat.</AlertDescription>
      </Alert>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createLog.mutateAsync({
        meeting_date: meetingDate,
        chapter_ids: chapterIds,
        feedback_notes: notes,
        action_items: items.split('\n').map((s) => s.trim()).filter(Boolean),
      })
      toast.success('Log bimbingan tersimpan.')
      setNotes('')
      setItems('')
    } catch {
      toast.error('Log bimbingannya belum kesimpen.')
    }
  }

  const logs = research?.supervision_logs ?? []
  const selectedDate = meetingDate ? new Date(`${meetingDate}T00:00:00`) : undefined

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Log Bimbingan</h1>
        <p className="text-sm text-muted-foreground">
          Tulis hasil tiap sesi bimbingan. Poin revisi dari pembimbing bisa langsung jadi tugas
          di babnya.
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
                <Label>Bab terkait (opsional, bisa pilih beberapa)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between font-normal">
                      <span className="truncate">
                        {chapterIds.length === 0
                          ? 'Tidak terkait bab'
                          : research?.chapters
                              ?.filter((c) => chapterIds.includes(c.id))
                              .map((c) => c.title.replace(/^Bab \d+:\s*/, ''))
                              .join(', ')}
                      </span>
                      <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-1" align="start">
                    <div className="max-h-56 overflow-y-auto">
                      {research?.chapters?.map((c) => {
                        const checked = chapterIds.includes(c.id)
                        return (
                          <label
                            key={c.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                setChapterIds((prev) =>
                                  checked ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                                )
                              }
                              aria-label={c.title}
                            />
                            {c.title}
                          </label>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
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
              description="Abis bimbingan, tulis hasilnya di sini biar poin revisinya nggak kelupaan."
            />
          )}
          <ol className="relative flex flex-col gap-0 border-l pl-5">
            {logs.map((log) => {
              const open = log.action_items?.filter((item) => !item.is_resolved) ?? []
              const done = log.action_items?.filter((item) => item.is_resolved) ?? []
              return (
                <li key={log.id} className="relative pb-6 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 -left-[calc(1.25rem+3px)] size-2.5 rounded-full border-2 border-background bg-primary"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <time
                      dateTime={log.meeting_date}
                      className="font-mono text-xs font-medium text-muted-foreground"
                    >
                      {dateFmt.format(new Date(`${log.meeting_date}T00:00:00`))}
                    </time>
                    {log.chapters?.map((title) => (
                      <Badge key={title} variant="outline" className="text-[11px]">
                        {title}
                      </Badge>
                    ))}
                    {(log.chapter_ids?.length ?? 0) > 0 && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="ml-auto"
                        onClick={() =>
                          convert.mutate(log.id, {
                            onSuccess: () => toast.success('Poin revisi udah jadi tugas di babnya.'),
                            onError: () => toast.error('Poin revisinya belum bisa dijadikan tugas.'),
                          })
                        }
                        disabled={convert.isPending}
                      >
                        <ListChecks aria-hidden="true" />
                        Jadikan tugas
                      </Button>
                    )}
                  </div>

                  <p className="mt-1.5 text-sm">{log.feedback_notes}</p>

                  {(open.length > 0 || done.length > 0) && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {open.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm text-status-revision">
                          <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                          {item.description}
                        </li>
                      ))}
                      {done.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CircleCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-status-done" />
                          <span className="line-through">{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </div>
  )
}
