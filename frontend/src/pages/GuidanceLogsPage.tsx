import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { useConvertActionItems, useCreateLog, useResearch } from '@/services/researches'
import { EmptyState } from '@/components/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

const todayIso = new Date().toISOString().slice(0, 10)

export function GuidanceLogsPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)
  const createLog = useCreateLog(id)
  const convert = useConvertActionItems(id)

  const [meetingDate, setMeetingDate] = useState(todayIso)
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Log Bimbingan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Catat bimbingan</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="create-log" onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="meeting_date">Tanggal bimbingan</Label>
                <Input
                  id="meeting_date"
                  type="date"
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
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
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback">Catatan masukan</Label>
              <Textarea
                id="feedback"
                required
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="actions">Poin revisi (satu per baris)</Label>
              <Textarea id="actions" rows={3} value={items} onChange={(e) => setItems(e.target.value)} />
            </div>
            <Button type="submit" disabled={createLog.isPending} className="self-start">
              {createLog.isPending ? 'Menyimpan…' : 'Simpan log'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section aria-label="Riwayat bimbingan" className="space-y-3">
        <h2 className="text-xl font-semibold">Riwayat</h2>
        {logs.length === 0 && (
          <EmptyState
            icon={ListChecks}
            title="Belum ada catatan bimbingan"
            description="Catat hasil setiap sesi bimbingan agar poin revisi tidak terlupakan."
          />
        )}
        <ol className="flex flex-col gap-3">
          {logs.map((log) => (
            <li key={log.id}>
              <Card size="sm">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <Badge variant="secondary" className="font-mono">
                    {log.meeting_date}
                  </Badge>
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
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-foreground">{log.feedback_notes}</p>
                  {log.action_items && log.action_items.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {log.action_items.map((item) => (
                        <li
                          key={item.id}
                          className={
                            item.is_resolved
                              ? 'text-sm text-muted-foreground line-through'
                              : 'flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300'
                          }
                        >
                          {item.is_resolved ? (
                            item.description
                          ) : (
                            <>
                              <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />
                              {item.description}
                            </>
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
  )
}
