import { useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Download, FileText, FileUp, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useResearch, useUploadDraft } from '@/services/researches'
import { EmptyState } from '@/components/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { cn } from 'cn'

const MAX_BYTES = 15 * 1024 * 1024

export function DocumentsPage() {
  const { researchId } = useParams()
  const id = Number(researchId)
  const { data: research, isLoading, error } = useResearch(id)
  const upload = useUploadDraft(id)
  const inputRef = useRef<HTMLInputElement>(null)
  const [chapterId, setChapterId] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  if (!Number.isFinite(id)) return <Navigate to="/dashboard" replace />
  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Berkas drafnya nggak bisa dimuat.</AlertDescription>
      </Alert>
    )
  }

  const chapters = research?.chapters ?? []
  const drafts = chapters.flatMap((chapter) =>
    (chapter.drafts ?? []).map((draft) => ({ ...draft, chapterTitle: chapter.title })),
  )
  const target = chapterId || String(chapters[0]?.id ?? '')

  const handleFile = (file: File | undefined) => {
    setFileError(null)
    if (!file) return
    if (file.size > MAX_BYTES) {
      setFileError('Berkasnya kegedean, maksimal 15 MB.')
      return
    }
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      setFileError('Formatnya harus PDF atau DOC/DOCX.')
      return
    }
    if (!target) return
    upload.mutate(
      { chapterId: Number(target), file },
      {
        onSuccess: () => toast.success('Draf udah diunggah.'),
        onError: () => setFileError('Unggahnya gagal. Cek lagi format dan ukurannya.'),
      },
    )
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="w-full space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Berkas Draf</h1>
        <p className="text-sm text-muted-foreground">
          Simpan draf tiap bab di sini. Tiap upload jadi versi baru, jadi naskah lama masih bisa
          dibuka.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <section aria-label="Unggah draf" className="lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle>Unggah draf</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="upload-chapter">Simpan ke bab</Label>
                <Select value={target} onValueChange={setChapterId}>
                  <SelectTrigger id="upload-chapter" className="w-full">
                    <SelectValue placeholder="Pilih bab" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label
                htmlFor="draft-file"
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-input bg-background p-6 text-center text-sm text-muted-foreground transition-colors focus-within:ring-3 focus-within:ring-ring/50',
                  dragging
                    ? 'border-primary bg-secondary/50 text-foreground'
                    : 'hover:border-primary hover:bg-secondary/50',
                )}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  handleFile(e.dataTransfer.files?.[0])
                }}
              >
                <FileUp aria-hidden="true" className="size-5 text-primary" />
                <span>
                  <span className="font-medium text-foreground">Pilih berkas</span> atau seret ke sini
                </span>
                <span className="text-xs">PDF atau DOC/DOCX, maksimal 15 MB</span>
                <input
                  ref={inputRef}
                  id="draft-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>

              {upload.isPending && <p className="text-sm text-muted-foreground">Mengunggah…</p>}
              {fileError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {fileError}
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-label="Daftar draf" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Riwayat versi</h2>
            {drafts.length > 0 && <p className="text-sm text-muted-foreground">{drafts.length} versi</p>}
          </div>
          {drafts.length === 0 && (
            <EmptyState
              icon={Upload}
              title="Belum ada berkas draf"
              description="Unggah draf bab pertamamu. Versi berikutnya otomatis kesimpen sebagai riwayat."
            />
          )}
          {drafts.length > 0 && (
            <Card>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Versi</TableHead>
                        <TableHead>Berkas</TableHead>
                        <TableHead className="w-24 text-right">Ukuran</TableHead>
                        <TableHead className="w-24 text-right">
                          <span className="sr-only">Unduh</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drafts.map((draft) => (
                        <TableRow key={draft.id}>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">
                              {draft.version_label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="flex items-center gap-1.5 text-sm font-medium">
                              <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                              <span className="truncate">{draft.file_name}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{draft.chapterTitle}</p>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {(draft.file_size_bytes / 1024).toFixed(0)} KB
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const { apiRaw } = await import('@/services/download')
                                await apiRaw(draft.download_url, draft.file_name)
                              }}
                            >
                              <Download data-icon="inline-start" aria-hidden="true" />
                              Unduh
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}
