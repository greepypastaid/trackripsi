import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Download, Link2, Loader2, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { cn } from 'cn'
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
import type {
  CitationStyle,
  LiteratureEntry,
  LiteratureStatus,
  SynthesisField,
} from '@/services/types'
import { EmptyState } from '@/components/empty-state'
import { ConfirmDialog } from '@/components/confirm-dialog'
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

function authorLong(entry: LiteratureEntry) {
  if (!entry.authors?.length) return 'Anonim'
  return entry.authors
    .map((author) => [author.given, author.family].filter(Boolean).join(' '))
    .join(', ')
}

export function LiteraturePage() {
  const { researchId } = useParams()
  const id = Number(researchId)

  const [status, setStatus] = useState<'all' | LiteratureStatus>('all')
  const [search, setSearch] = useState('')
  const [style, setStyle] = useState<CitationStyle>('apa7')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tab, setTab] = useState('focus')
  const [sort, setSort] = useState<'recent' | 'title' | 'status'>('recent')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [expandedCell, setExpandedCell] = useState<string | null>(null)
  const [confirmField, setConfirmField] = useState<SynthesisField | null>(null)
  const [showAllSources, setShowAllSources] = useState(false)

  const { data: entries = [], isLoading, error } = useLiterature(id, {
    status: status === 'all' ? undefined : status,
    q: search || undefined,
  })
  const { data: fields = [] } = useSynthesisFields(id)
  const {
    data: bibliography,
    refetch: refetchBibliography,
    isFetching: bibliographyFetching,
  } = useBibliography(id, style)

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
  const [deleteTarget, setDeleteTarget] = useState<LiteratureEntry | null>(null)
  const [excludeTarget, setExcludeTarget] = useState<LiteratureEntry | null>(null)
  const [excludeReason, setExcludeReason] = useState('')

  // Panel detail selalu punya isi: ikuti pilihan user, kalau belum ada pakai sumber pertama.
  const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0] ?? null

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

  // Urutan dipakai bareng oleh daftar sumber dan tabel, jadi dua tampilan itu selalu sinkron.
  const sortedEntries = useMemo(() => {
    const list = [...entries]
    if (sort === 'title') return list.sort((a, b) => a.title.localeCompare(b.title, 'id'))
    if (sort === 'status') {
      const rank: Record<LiteratureStatus, number> = { included: 0, candidate: 1, excluded: 2 }
      return list.sort((a, b) => rank[a.status] - rank[b.status] || a.title.localeCompare(b.title, 'id'))
    }
    return list.sort(
      (a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title, 'id'),
    )
  }, [entries, sort])

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageEntries = sortedEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const goToPage = (next: number) => setPage(Math.min(Math.max(next, 1), totalPages))

  // Daftar di panel kiri dipotong biar tetap ringan saat sumbernya ratusan.
  const listEntries = showAllSources ? sortedEntries : sortedEntries.slice(0, 100)

  const resetPage = () => setPage(1)

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Matriks literaturnya nggak bisa dimuat.</AlertDescription>
      </Alert>
    )
  }

  const onImport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const entry = await importDoi.mutateAsync(doi)
      toast.success('Metadata diambil', { description: entry.title })
      setDoi('')
      setSelectedId(entry.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Metadata DOI-nya nggak bisa diambil.')
    }
  }

  const onManual = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const entry = await createEntry.mutateAsync({
        title: manual.title,
        authors: manual.family
          ? [{ family: manual.family, given: manual.given || undefined }]
          : [],
        year: manual.year ? Number(manual.year) : null,
      })
      toast.success('Sumbernya udah masuk.')
      setManual({ title: '', family: '', given: '', year: '' })
      setManualOpen(false)
      setSelectedId(entry.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Sumbernya belum bisa ditambahin.')
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
      toast.error('Kolom sintesisnya belum kesimpen.')
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
      toast.error('Status sumbernya belum kesimpen.')
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
      toast.error('Status sumbernya belum kesimpen.')
    }
  }

  const removeEntry = async (entry: LiteratureEntry) => {
    try {
      await deleteEntry.mutateAsync(entry.id)
      if (selectedId === entry.id) setSelectedId(null)
    } catch {
      toast.error('Sumbernya belum bisa dihapus.')
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
      toast.error('BibTeX-nya gagal diekspor.')
    }
  }

  const setField = (fieldId: number, value: string) => {
    if (!selected) return
    void setMatrix(selected, fieldId, value)
  }

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Matriks Literatur</h1>
        <p className="text-sm text-muted-foreground">
          Kumpulin sumbernya, bandingin isinya per kolom, terus ambil sitasinya sesuai gaya yang
          kamu pakai.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Sumber
                <Badge variant="secondary" className="font-mono">
                  {entries.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Tempel DOI-nya, metadata diambil otomatis dari OpenAlex atau Crossref.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <form onSubmit={onImport} className="flex gap-2">
                <Input
                  id="doi"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="10.70570/jikmc.v4i1.1568"
                  className="font-mono text-xs"
                  required
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Ambil metadata DOI"
                  disabled={importDoi.isPending}
                >
                  {importDoi.isPending ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Link2 aria-hidden="true" />
                  )}
                </Button>
              </form>

              <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="justify-start">
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

              <div className="flex flex-col gap-2 border-t pt-3">
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      resetPage()
                    }}
                    placeholder="Cari judul, jurnal, DOI…"
                    className="pl-9"
                    aria-label="Cari literatur"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      setStatus(value as typeof status)
                      resetPage()
                    }}
                  >
                    <SelectTrigger className="min-w-0 flex-1" aria-label="Filter status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua status</SelectItem>
                      <SelectItem value="candidate">Kandidat</SelectItem>
                      <SelectItem value="included">Termasuk</SelectItem>
                      <SelectItem value="excluded">Dikecualikan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sort}
                    onValueChange={(value) => {
                      setSort(value as typeof sort)
                      resetPage()
                    }}
                  >
                    <SelectTrigger className="min-w-0 flex-1" aria-label="Urutkan sumber">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Tahun terbaru</SelectItem>
                      <SelectItem value="title">Judul A–Z</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {entries.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Nggak ada sumber yang cocok.
                </p>
              ) : (
                <ul
                  className="-mx-1 max-h-[clamp(12rem,38vh,26rem)] divide-y overflow-y-auto overscroll-contain rounded-md border"
                  aria-label="Daftar sumber"
                >
                  {listEntries.map((entry) => {
                    const active = entry.id === selected?.id
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(entry.id)}
                          aria-current={active ? 'true' : undefined}
                          className={cn(
                            'flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none',
                            active && 'bg-muted',
                          )}
                        >
                          <span className="line-clamp-2 text-sm leading-snug font-medium">
                            {entry.title}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="truncate">
                              {authorText(entry)} · {entry.year ?? 'n.d.'}
                            </span>
                            <Badge
                              className={cn('ml-auto shrink-0', STATUS_META[entry.status].className)}
                            >
                              {STATUS_META[entry.status].label}
                            </Badge>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {sortedEntries.length > 100 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start text-xs"
                  onClick={() => setShowAllSources((prev) => !prev)}
                >
                  {showAllSources
                    ? 'Ringkas daftarnya'
                    : `Tampilkan semua ${sortedEntries.length} sumber`}
                </Button>
              )}
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
        </aside>

        <div className="min-w-0">
          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="focus">Fokus</TabsTrigger>
                <TabsTrigger value="table">Tabel</TabsTrigger>
                <TabsTrigger value="bibliography">Daftar Pustaka</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
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
            </div>

            <TabsContent value="focus" className="">
              {!selected ? (
                <EmptyState
                  icon={Search}
                  title="Belum ada sumber"
                  description="Tempel DOI di panel kiri, atau tambahin sendiri kalau bukunya cetak."
                />
              ) : (
                <Card>
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="text-lg leading-snug">{selected.title}</CardTitle>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {authorLong(selected)} · {selected.year ?? 'n.d.'}
                          {selected.container ? ` · ${selected.container}` : ''}
                        </p>
                        {selected.doi && (
                          <a
                            href={`https://doi.org/${selected.doi}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-xs text-primary underline-offset-4 hover:underline"
                          >
                            {selected.doi}
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <select
                          value={selected.status}
                          onChange={(event) =>
                            void onSetStatus(selected, event.target.value as LiteratureStatus)
                          }
                          aria-label={`Status ${selected.title}`}
                          className={cn(
                            'h-6 cursor-pointer rounded-4xl border px-2 py-0 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                            STATUS_META[selected.status].className,
                          )}
                        >
                          {(Object.keys(STATUS_META) as LiteratureStatus[]).map((value) => (
                            <option key={value} value={value}>
                              {STATUS_META[value].label}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => setCitationFor(selected)}
                          aria-label={`Sitasi ${selected.title}`}
                        >
                          <Link2 aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => setDeleteTarget(selected)}
                          aria-label={`Hapus ${selected.title}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    {selected.status === 'excluded' && selected.exclusion_reason && (
                      <p className="text-xs text-destructive">
                        Dikecualikan: {selected.exclusion_reason}
                      </p>
                    )}

                    {selected.abstract && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer select-none font-medium">
                          Abstrak
                        </summary>
                        <p className="mt-1.5 leading-relaxed">{selected.abstract}</p>
                      </details>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Catatan sintesis
                      </p>
                      <p className="text-xs text-muted-foreground" aria-live="polite">
                        {saveValues.isPending ? 'Menyimpan…' : 'Tersimpan otomatis'}
                      </p>
                    </div>
                    {fields.length === 0 ? (
                      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        Kolom sintesis belum ada. Bikin dulu biar tiap sumber bisa dibandingin per
                        aspek.
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {fields.map((field) => {
                          const value =
                            selected.values?.find((v) => v.synthesis_field_id === field.id)?.value ??
                            ''
                          return (
                            <div key={field.id} className="flex flex-col gap-1.5">
                              <Label htmlFor={`field-${selected.id}-${field.id}`}>
                                {field.label}
                              </Label>
                              <Textarea
                                key={`${selected.id}-${field.id}`}
                                id={`field-${selected.id}-${field.id}`}
                                defaultValue={value}
                                onBlur={(e) => {
                                  if (e.target.value !== value) {
                                    setField(field.id, e.target.value)
                                  }
                                }}
                                rows={3}
                                className="min-h-20 max-h-64 field-sizing-content text-sm"
                                aria-label={`${field.label} untuk ${selected.title}`}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="space-y-2 border-t pt-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        Kolom sintesis (dipakai semua sumber)
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {fields.map((field) => (
                          <li key={field.id}>
                            <Badge variant="outline" className="gap-1 pr-1">
                              {field.label}
                              <button
                                type="button"
                                onClick={() => setConfirmField(field)}
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
                        className="flex max-w-sm gap-2"
                      >
                        <Input
                          value={newField}
                          onChange={(e) => setNewField(e.target.value)}
                          placeholder="Kolom baru…"
                          aria-label="Nama kolom sintesis baru"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          aria-label="Tambah kolom"
                          disabled={createField.isPending}
                        >
                          <Plus aria-hidden="true" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="table" className="mt-4">
              {entries.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Belum ada sumber"
                  description="Tempel DOI di panel kiri, atau tambahin sendiri kalau bukunya cetak."
                />
              ) : (
                <Card className="gap-0 overflow-hidden py-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      {sortedEntries.length} sumber · klik baris buat buka catatannya
                    </p>
                    <div className="flex items-center gap-2">
                      <Select
                        value={String(pageSize)}
                        onValueChange={(value) => {
                          setPageSize(Number(value))
                          resetPage()
                        }}
                      >
                        <SelectTrigger className="h-7 w-[7.5rem] text-xs" aria-label="Jumlah baris per halaman">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 baris</SelectItem>
                          <SelectItem value="50">50 baris</SelectItem>
                          <SelectItem value="100">100 baris</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Table containerClassName="max-h-[calc(100vh-18rem)] min-h-64">
                    <TableHeader className="sticky top-0 z-20 bg-card">
                      <TableRow>
                        <TableHead className="sticky left-0 z-30 min-w-56 border-r bg-card">
                          Sumber
                        </TableHead>
                        <TableHead className="w-32">Status</TableHead>
                        {fields.map((field) => (
                          <TableHead key={field.id} className="min-w-40">
                            {field.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageEntries.map((entry) => {
                        const active = entry.id === selected?.id
                        return (
                          <TableRow
                            key={entry.id}
                            onClick={() => {
                              setSelectedId(entry.id)
                              setTab('focus')
                            }}
                            className={cn('group cursor-pointer', active && 'bg-muted/50')}
                          >
                            <TableCell className="sticky left-0 z-10 max-w-72 border-r bg-card align-top group-hover:bg-muted/50 whitespace-normal">
                              <p className="line-clamp-2 text-sm font-medium">{entry.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {authorText(entry)} · {entry.year ?? 'n.d.'}
                                {entry.container ? ` · ${entry.container}` : ''}
                              </p>
                            </TableCell>
                            <TableCell className="align-top">
                              <select
                                value={entry.status}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) =>
                                  void onSetStatus(entry, event.target.value as LiteratureStatus)
                                }
                                aria-label={`Status ${entry.title}`}
                                className={cn(
                                  'h-5 w-28 cursor-pointer rounded-4xl border px-2 py-0 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                                  STATUS_META[entry.status].className,
                                )}
                              >
                                {(Object.keys(STATUS_META) as LiteratureStatus[]).map((value) => (
                                  <option key={value} value={value}>
                                    {STATUS_META[value].label}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                            {fields.map((field) => {
                              const value =
                                entry.values?.find((v) => v.synthesis_field_id === field.id)
                                  ?.value ?? ''
                              const cellKey = `${entry.id}-${field.id}`
                              const expanded = expandedCell === cellKey
                              return (
                                <TableCell key={field.id} className="max-w-64 align-top whitespace-normal">
                                  {value ? (
                                    <button
                                      type="button"
                                      aria-expanded={expanded}
                                      aria-label={`${expanded ? 'Ringkas' : 'Buka'} ${field.label} untuk ${entry.title}`}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        setExpandedCell(expanded ? null : cellKey)
                                      }}
                                      className={cn(
                                        'block w-full cursor-pointer rounded-sm px-1 py-0.5 text-left align-top text-xs whitespace-pre-line hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                        expanded
                                          ? 'max-h-64 overflow-y-auto bg-muted/40 ring-1 ring-border'
                                          : 'line-clamp-3',
                                      )}
                                    >
                                      {value}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      {(currentPage - 1) * pageSize + 1}–
                      {Math.min(currentPage * pageSize, sortedEntries.length)} dari{' '}
                      {sortedEntries.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        Sebelumnya
                      </Button>
                      <span className="px-2 font-mono text-xs" aria-live="polite">
                        {currentPage}/{totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        Berikutnya
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bibliography" className="mt-4">
              <Card className="relative">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3"
                  aria-label="Muat ulang daftar pustaka"
                  title="Muat ulang"
                  onClick={() => void refetchBibliography()}
                  disabled={bibliographyFetching}
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={cn(bibliographyFetching && 'animate-spin')}
                  />
                </Button>
                <CardHeader>
                  <CardTitle className="pr-8">
                    Daftar pustaka {STYLE_LABEL[style]} · {bibliography?.count ?? 0} sumber
                  </CardTitle>
                  <CardDescription>Hanya sumber berstatus “Termasuk”.</CardDescription>
                </CardHeader>
                <CardContent>
                  {bibliography?.items.length ? (
                    <ol className="space-y-3 text-sm">
                      {bibliography.items.map((item) => (
                        <li key={item.id} className="flex gap-2">
                          {item.number !== null && (
                            <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
                              [{item.number}]
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <FormattedReference text={item.reference} />
                          </span>
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

      <ConfirmDialog
        open={confirmField !== null}
        onOpenChange={(open) => !open && setConfirmField(null)}
        title="Hapus kolom sintesis ini?"
        description={`Kolom “${confirmField?.label ?? ''}” beserta catatan di semua sumber bakal hilang. Tindakan ini nggak bisa dibatalkan.`}
        pending={deleteField.isPending}
        onConfirm={() => {
          if (!confirmField) return
          const target = confirmField
          deleteField.mutate(target.id, { onSettled: () => setConfirmField(null) })
        }}
      />

      <CitationDialog
        entry={citationFor}
        style={style}
        onClose={() => setCitationFor(null)}
        researchId={id}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus sumber ini?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.title}” beserta catatan sintesisnya ikut terhapus. Tindakan ini nggak
              bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteEntry.isPending}
              onClick={() => {
                if (!deleteTarget) return
                void removeEntry(deleteTarget).then(() => setDeleteTarget(null))
              }}
            >
              {deleteEntry.isPending ? 'Menghapus…' : 'Ya, hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                Kenapa “{excludeTarget?.title}” dikecualikan? Alasannya ikut kehitung di PRISMA.
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
      toast.error('Nggak bisa nyalin ke clipboard.')
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
              {!data.included && (
                <p className="text-xs text-muted-foreground">
                  {data.number !== null
                    ? 'Sumber ini belum berstatus “Termasuk”, jadi belum masuk daftar pustaka. Nomornya masih bisa berubah.'
                    : 'Sumber ini belum berstatus “Termasuk”, jadi belum masuk daftar pustaka.'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Daftar pustaka</Label>
              <div className="flex items-start gap-2">
                <p className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm">
                  {data.number !== null && (
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      [{data.number}]{' '}
                    </span>
                  )}
                  <FormattedReference text={data.reference} />
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copy(
                      // Penanda *italic* cuma buat render; jangan ikut tersalin.
                      (data.number !== null ? `[${data.number}] ` : '') +
                        data.reference.replace(/\*/g, ''),
                      'Referensi',
                    )
                  }
                >
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
