import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { NotebookPen, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/services/api'
import { useResearch } from '@/services/researches'
import type { Response } from '@/services/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface JournalEntry {
  id: number
  entry_date: string
  mood: 'produktif' | 'biasa' | 'struggle'
  body: string
}

const MOOD_LABEL: Record<JournalEntry['mood'], string> = {
  produktif: 'Produktif',
  biasa: 'Biasa saja',
  struggle: 'Kesulitan',
}

function useJournal(id: number, month: string) {
  return useQuery({
    queryKey: ['journal', id, month],
    queryFn: () =>
      api<Response<JournalEntry[]>>(`/researches/${id}/journal?month=${month}`).then((r) => r.data),
    enabled: Number.isFinite(id),
  })
}

export function JournalPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const { data: entries, isLoading: loadingEntries } = useJournal(id, month)
  const qc = useQueryClient()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mood, setMood] = useState<JournalEntry['mood']>('biasa')
  const [body, setBody] = useState('')

  const refresh = () => qc.invalidateQueries({ queryKey: ['journal', id] })

  const create = useMutation({
    mutationFn: (payload: { entry_date: string; mood: string; body: string }) =>
      api<Response<JournalEntry>>(`/researches/${id}/journal`, { method: 'POST', body: payload }),
    onSuccess: () => {
      refresh()
      setBody('')
      toast.success('Jurnal tersimpan')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Gagal menyimpan jurnal.'),
  })

  const remove = useMutation({
    mutationFn: (entryId: number) => api(`/journal/${entryId}`, { method: 'DELETE' }),
    onSuccess: () => {
      refresh()
      toast.success('Entri dihapus')
    },
  })

  if (!Number.isFinite(id)) return null
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error || !research) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Gagal memuat</AlertTitle>
        <AlertDescription>Riset tidak ditemukan atau Anda tidak berhak mengaksesnya.</AlertDescription>
      </Alert>
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) {
      toast.error('Isi catatan dulu.')
      return
    }
    create.mutate({ entry_date: date, mood, body: body.trim() })
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jurnal Refleksi</h1>
          <p className="text-sm text-muted-foreground">Catatan harian progres &amp; hambatan {research.title}.</p>
        </div>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value || format(new Date(), 'yyyy-MM'))}
          className="w-44"
          aria-label="Filter bulan"
        />
      </header>

      <Card size="sm">
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-[auto_1fr_auto]">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Tanggal"
              className="md:w-40"
            />
            <Select value={mood} onValueChange={(v) => setMood(v as JournalEntry['mood'])}>
              <SelectTrigger aria-label="Suasana">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="produktif">Produktif</SelectItem>
                <SelectItem value="biasa">Biasa saja</SelectItem>
                <SelectItem value="struggle">Kesulitan</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Apa yang dikerjakan hari ini? Ada hambatan?"
              rows={3}
              className="md:col-span-3"
              aria-label="Catatan jurnal"
              maxLength={5000}
            />
            <Button type="submit" disabled={create.isPending} className="md:col-span-3 md:justify-self-end">
              <Send aria-hidden="true" />
              Simpan
            </Button>
          </form>
        </CardContent>
      </Card>

      <section aria-label="Daftar entri jurnal" className="space-y-3">
        {loadingEntries ? (
          <Skeleton className="h-24 w-full" />
        ) : !entries || entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada entri bulan ini.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card size="sm">
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{format(new Date(entry.entry_date), 'd MMMM yyyy')}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            entry.mood === 'produktif'
                              ? 'text-status-done'
                              : entry.mood === 'struggle'
                                ? 'text-destructive'
                                : ''
                          }
                        >
                          <NotebookPen aria-hidden="true" className="size-3" />
                          {MOOD_LABEL[entry.mood]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Hapus entri"
                          onClick={() => remove.mutate(entry.id)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{entry.body}</p>
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
