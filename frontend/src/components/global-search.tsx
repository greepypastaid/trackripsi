import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { api } from '@/services/api'
import type { Response } from '@/services/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SearchResult {
  type: 'task' | 'draft' | 'supervision_log' | 'journal'
  id: number
  title: string
  research_id: number
  research_title: string
}

const TYPE_ROUTE: Record<SearchResult['type'], string> = {
  task: 'chapters',
  draft: 'documents',
  supervision_log: 'guidance-logs',
  journal: 'journal',
}

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  task: 'Tugas',
  draft: 'Draf',
  supervision_log: 'Log bimbingan',
  journal: 'Jurnal',
}

function useSearch(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => api<Response<SearchResult[]>>(`/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
    enabled: enabled && q.trim().length >= 2,
  })
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { data: results, isFetching } = useSearch(debounced, open)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebounced(q.trim()), 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [q])

  const go = (result: SearchResult) => {
    setOpen(false)
    setQ('')
    setDebounced('')
    navigate(`/researches/${result.research_id}/${TYPE_ROUTE[result.type]}`)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Cari di seluruh data"
      >
        <Search aria-hidden="true" />
        <span className="hidden md:inline">Cari…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] md:inline">Ctrl K</kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-16 translate-y-0 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">Pencarian global</DialogTitle>
            <DialogDescription className="sr-only">
              Cari tugas, draf, log bimbingan, dan jurnal di semua riset Anda.
            </DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari tugas, draf, catatan…"
            aria-label="Kata kunci pencarian"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <div aria-live="polite" className="max-h-80 overflow-y-auto">
            {debounced.length < 2 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Ketik minimal 2 karakter.</p>
            ) : isFetching ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Mencari…</p>
            ) : !results || results.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada hasil.</p>
            ) : (
              <ul className="space-y-1">
                {results.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      type="button"
                      onClick={() => go(result)}
                      className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="truncate font-medium">{result.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {TYPE_LABEL[result.type]} · {result.research_title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
