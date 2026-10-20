import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Download, Link2, Loader2, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  useBibliography,
  useCitation,
  useCreateLiterature,
  useCreateSynthesisField,
  useDeleteLiterature,
  useDeleteSynthesisField,
  useImportDoi,
  useLiterature,
  useSaveMatrixValues,
  useSynthesisFields,
  useUpdateLiterature,
} from '@/services/literature'
import { ApiError, tokenStore } from '@/services/api'
import type { CitationStyle, LiteratureEntry, LiteratureStatus } from '@/services/types'
import { EmptyState } from '@/components/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const STYLE_LABEL: Record<CitationStyle, string> = {
  apa7: 'APA 7',
  ieee: 'IEEE',
  harvard: 'Harvard',
  chicago_author_date: 'Chicago',
}

const STATUS_META: Record<LiteratureStatus, { label: string; className: string }> = {
  candidate: { label: 'Kandidat', className: 'bg-status-todo/10 text-status-todo border-transparent' },
  included: { label: 'Termasuk', className: 'bg-status-done/10 text-status-done border-transparent' },
  excluded: { label: 'Dikecualikan', className: 'bg-destructive/10 text-destructive border-transparent' },
}

/**
 * Server mengirim teks yang sudah di-escape plus penanda *...* untuk italic.
 * Dipecah jadi elemen React — tidak ada HTML mentah yang disuntik.
 */
function FormattedReference({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*(.+?)\*/g).map((part, index) =>
        index % 2 === 1 ? <em key={index}>{part}</em> : part,
      )}
    </>
  )
}

function authorText(entry: LiteratureEntry) {
  if (!entry.authors?.length) return 'Anonim'
  const first = entry.authors[0].family
  return entry.authors.length > 1 ? `${first} dkk.` : first
}

export function LiteraturePage() {
  const { researchId } = useParams()
  const id = Number(researchId)

  const [status, setStatus] = useState<'all' | LiteratureStatus>('all')
  const [search, setSearch] = useState('')
  const [style, setStyle] = useState<CitationStyle>('apa7')

  const { data: entries = [], isLoading, error } = useLiterature(id, {
    status: status === 'all' ? undefined : status,
    q: search || undefined,
  })
  const { data: fields = [] } = useSynthesisFields(id)
  const { data: bibliography } = useBibliography(id, style)

  const importDoi = useImportDoi(id)
  const createEntry = useCreateLiterature(id)
  const updateEntry = useUpdateLiterature(id)
  const deleteEntry = useDeleteLiterature(id)
  const saveValues = useSaveMatrixValues(id)
  const createField = useCreateSynthesisField(id)
  const deleteField = useDeleteSynthesisField(id)

  const [doi, setDoi] = useState('')
  const [newField, setNewField] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState({ title: '', family: '', given: '', year: '' })
  const [citationFor, setCitationFor] = useState<LiteratureEntry | null>(null)
  const [excludeTarget, setExcludeTarget] = useState<LiteratureEntry | null>(null)
  const [excludeReason, setExcludeReason] = useState('')

  const prisma = useMemo(() => {
    const bySource = (source: string) => entries.filter((e) => e.metadata_source === source).length
    const excluded = entries.filter((e) => e.status === 'excluded')
    return {
      identified: entries.length,
      openalex: bySource('openalex'),
      crossref: bySource('crossref'),
      manual: bySource('manual'),
      screened: entries.filter((e) => e.status !== 'candidate').length,
      included: entries.filter((e) => e.status === 'included').length,
      excluded: excluded.length,
      reasons: excluded.reduce<Record<string, number>>((acc, entry) => {
        const reason = entry.exclusion_reason?.trim() || 'Tanpa alasan'
        acc[reason] = (acc[reason] ?? 0) + 1
        return acc
      }, {}),
    }
  }, [entries])

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Gagal memuat matriks literatur.</AlertDescription>
      </Alert>
    )
  }

  const onImport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const entry = await importDoi.mutateAsync(doi)
      toast.success('Metadata diambil', { description: entry.title })
      setDoi('')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal mengambil metadata DOI.')
    }
  }

  const onManual = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createEntry.mutateAsync({
        title: manual.title,
        authors: manual.family
          ? [{ family: manual.family, given: manual.given || undefined }]
          : [],
        year: manual.year ? Number(manual.year) : null,
      })
      toast.success('Sumber ditambahkan.')
      setManual({ title: '', family: '', given: '', year: '' })
      setManualOpen(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Gagal menambah sumber.')
    }
  }

  const setMatrix = async (entry: LiteratureEntry, fieldId: number, value: string) => {
    const values = fields.map((field) => ({
      synthesis_field_id: field.id,
      value:
        field.id === fieldId
          ? value
          : (entry.values?.find((v) => v.synthesis_field_id === field.id)?.value ?? ''),
    }))
    try {
      await saveValues.mutateAsync({ entryId: entry.id, values })
    } catch {
      toast.error('Gagal menyimpan kolom sintesis.')
    }
  }

  const onSetStatus = async (entry: LiteratureEntry, next: LiteratureStatus) => {
    try {
      if (next === 'excluded' && !entry.exclusion_reason) {
        setExcludeTarget(entry)
        setExcludeReason('')
        return
      }
      await updateEntry.mutateAsync({ entryId: entry.id, status: next })
    } catch {
      toast.error('Gagal mengubah status sumber.')
    }
  }

  const confirmExclude = async () => {
    const reason = excludeReason.trim()
    if (!excludeTarget || !reason) return
    try {
      await updateEntry.mutateAsync({
        entryId: excludeTarget.id,
        status: 'excluded',
        exclusion_reason: reason,
      })
      setExcludeTarget(null)
    } catch {
      toast.error('Gagal mengubah status sumber.')
    }
  }

  const exportBibtex = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'}/researches/${id}/literature/export`,
        { headers: { Authorization: `Bearer ${tokenStore.get() ?? ''}` } },
      )
      if (!response.ok) throw new Error('export')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'daftar-pustaka.bib'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Gagal mengekspor BibTeX.')
    }
  }

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Matriks Literatur</h1>
        <p className="text-sm text-muted-foreground">
          Kumpulkan sumber, sintesis per kolom, lalu salin sitasi sesuai gaya yang dipakai kampus.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tambah sumber</CardTitle>
              <CardDescription>Tempel DOI; metadata diambil otomatis dari OpenAlex/Crossref.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onImport} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    id="doi"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    placeholder="10.70570/jikmc.v4i1.1568"
                    className="font-mono text-xs"
                    required
                  />
                  <Button type="submit" size="icon" aria-label="Ambil metadata DOI" disabled={importDoi.isPending}>
                    {importDoi.isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Link2 aria-hidden="true" />}
                  </Button>
                </div>
                <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="self-start">
                      <Plus aria-hidden="true" />
                      Tambah manual
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={onManual} className="flex flex-col gap-4">
                      <DialogHeader>
                        <DialogTitle>Tambah sumber manual</DialogTitle>
                        <DialogDescription>Untuk buku cetak atau sumber tanpa DOI.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="manual-title">Judul</Label>
                        <Input
                          id="manual-title"
                          value={manual.title}
                          onChange={(e) => setManual({ ...manual, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="manual-family">Nama belakang penulis</Label>
                          <Input
                            id="manual-family"
                            value={manual.family}
                            onChange={(e) => setManual({ ...manual, family: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="manual-given">Nama depan</Label>
                          <Input
                            id="manual-given"
                            value={manual.given}
                            onChange={(e) => setManual({ ...manual, given: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="manual-year">Tahun</Label>
                        <Input
                          id="manual-year"
                          type="number"
                          min={1000}
                          max={2100}
                          value={manual.year}
                          onChange={(e) => setManual({ ...manual, year: e.target.value })}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createEntry.isPending}>
                          Simpan sumber
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kolom sintesis</CardTitle>
              <CardDescription>Dipakai sebagai kolom matriks perbandingan.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ul className="flex flex-wrap gap-2">
                {fields.map((field) => (
                  <li key={field.id}>
                    <Badge variant="outline" className="gap-1 pr-1">
                      {field.label}
                      <button
                        type="button"
                        onClick={() => deleteField.mutate(field.id)}
                        aria-label={`Hapus kolom ${field.label}`}
                        className="rounded-full p-0.5 hover:bg-muted"
                      >
                        <X aria-hidden="true" className="size-3" />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newField.trim()) return
                  createField.mutate(newField.trim(), { onSuccess: () => setNewField('') })
                }}
                className="flex gap-2"
              >
                <Input
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  placeholder="Kolom baru…"
                  aria-label="Nama kolom sintesis baru"
                />
                <Button type="submit" size="icon" aria-label="Tambah kolom" disabled={createField.isPending}>
                  <Plus aria-hidden="true" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Penyaringan (PRISMA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  ['Diidentifikasi', prisma.identified],
                  ['Termasuk', prisma.included],
                  ['Dikecualikan', prisma.excluded],
                ].map(([label, value]) => (
                  <Badge key={String(label)} variant="secondary" className="gap-1.5 font-mono">
                    {label}: {value}
                  </Badge>
                ))}
              </div>
              {Object.entries(prisma.reasons).length > 0 && (
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {Object.entries(prisma.reasons).map(([reason, count]) => (
                    <li key={reason} className="flex justify-between gap-2">
                      <span className="truncate">{reason}</span>
                      <span className="font-mono">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:max-w-72">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul, jurnal, DOI…"
                className="pl-9"
                aria-label="Cari literatur"
              />
            </div>
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger className="w-40" aria-label="Filter status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="candidate">Kandidat</SelectItem>
                <SelectItem value="included">Termasuk</SelectItem>
                <SelectItem value="excluded">Dikecualikan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={style} onValueChange={(value) => setStyle(value as CitationStyle)}>
              <SelectTrigger className="w-36" aria-label="Gaya sitasi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STYLE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportBibtex}>
              <Download aria-hidden="true" />
              BibTeX
            </Button>
          </div>

          <Tabs defaultValue="matrix">
            <TabsList>
              <TabsTrigger value="matrix">Matriks</TabsTrigger>
              <TabsTrigger value="bibliography">Daftar Pustaka</TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="mt-4">
              {entries.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Belum ada sumber"
                  description="Mulai dengan impor DOI untuk mengisi metadata otomatis."
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-56">Sumber</TableHead>
                        <TableHead className="w-36">Status</TableHead>
                        {fields.map((field) => (
                          <TableHead key={field.id} className="min-w-40">
                            {field.label}
                          </TableHead>
                        ))}
                        <TableHead className="w-24 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="align-top">
                            <p className="font-medium">{entry.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {authorText(entry)} · {entry.year ?? 'n.d.'}
                              {entry.container ? ` · ${entry.container}` : ''}
                            </p>
                            {entry.doi && (
                              <a
                                href={`https://doi.org/${entry.doi}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary underline-offset-4 hover:underline"
                              >
                                {entry.doi}
                              </a>
                            )}
                            {entry.status === 'excluded' && entry.exclusion_reason && (
                              <p className="mt-1 text-xs text-destructive">
                                Alasan: {entry.exclusion_reason}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="align-top">
                            <select
                              value={entry.status}
                              onChange={(event) =>
                                void onSetStatus(entry, event.target.value as LiteratureStatus)
                              }
                              aria-label={`Status ${entry.title}`}
                              className={`h-5 w-32 cursor-pointer rounded-4xl border px-2 py-0 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${STATUS_META[entry.status].className}`}
                            >
                              {(Object.keys(STATUS_META) as LiteratureStatus[]).map((value) => (
                                <option key={value} value={value}>
                                  {STATUS_META[value].label}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          {fields.map((field) => (
                            <TableCell key={field.id} className="align-top">
                              <Textarea
                                defaultValue={
                                  entry.values?.find((v) => v.synthesis_field_id === field.id)?.value ??
                                  ''
                                }
                                onBlur={(e) => {
                                  const current =
                                    entry.values?.find((v) => v.synthesis_field_id === field.id)
                                      ?.value ?? ''
                                  if (e.target.value !== current) {
                                    void setMatrix(entry, field.id, e.target.value)
                                  }
                                }}
                                rows={3}
                                className="min-h-16 text-xs"
                                aria-label={`${field.label} untuk ${entry.title}`}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="align-top text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setCitationFor(entry)}
                                aria-label={`Sitasi ${entry.title}`}
                              >
                                <Link2 aria-hidden="true" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => deleteEntry.mutate(entry.id)}
                                aria-label={`Hapus ${entry.title}`}
                              >
                                <Trash2 aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bibliography" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Daftar pustaka {STYLE_LABEL[style]} · {bibliography?.count ?? 0} sumber
                  </CardTitle>
                  <CardDescription>Hanya sumber berstatus “Termasuk”.</CardDescription>
                </CardHeader>
                <CardContent>
                  {bibliography?.items.length ? (
                    <ol className="space-y-3 text-sm">
                      {bibliography.items.map((item) => (
                        <li key={item.id}>
                          <FormattedReference text={item.reference} />
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum ada sumber berstatus “Termasuk”.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CitationDialog
        entry={citationFor}
        style={style}
        onClose={() => setCitationFor(null)}
        researchId={id}
      />

      <Dialog open={excludeTarget !== null} onOpenChange={(open) => !open && setExcludeTarget(null)}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void confirmExclude()
            }}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle>Dikecualikan dari matriks</DialogTitle>
              <DialogDescription>
                Tulis alasan eksklusi untuk “{excludeTarget?.title}”.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="exclude-reason">Alasan (wajib)</Label>
              <Input
                id="exclude-reason"
                value={excludeReason}
                onChange={(e) => setExcludeReason(e.target.value)}
                placeholder="Contoh: di luar cakupan topik"
                maxLength={255}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setExcludeTarget(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={updateEntry.isPending || !excludeReason.trim()}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CitationDialog({
  entry,
  style,
  onClose,
  researchId,
}: {
  entry: LiteratureEntry | null
  style: CitationStyle
  onClose: () => void
  researchId: number
}) {
  const { data, isLoading } = useCitation(researchId, entry?.id ?? null, style)

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} disalin.`)
    } catch {
      toast.error('Gagal menyalin.')
    }
  }

  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sitasi · {STYLE_LABEL[style]}</DialogTitle>
          <DialogDescription className="line-clamp-2">{entry?.title}</DialogDescription>
        </DialogHeader>
        {isLoading || !data ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sitasi dalam teks</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm">
                  {data.in_text}
                </code>
                <Button size="sm" variant="outline" onClick={() => copy(data.in_text, 'Sitasi')}>
                  Salin
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Daftar pustaka</Label>
              <div className="flex items-start gap-2">
                <p className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm">
                  {data.reference}
                </p>
                <Button size="sm" variant="outline" onClick={() => copy(data.reference, 'Referensi')}>
                  Salin
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
