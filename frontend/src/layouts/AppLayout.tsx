import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, FileText, LayoutDashboard, ListChecks, LogOut, NotebookPen } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useResearch, useResearches } from '@/services/researches'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const NAV = [
  { to: 'overview', label: 'Ringkasan', Icon: LayoutDashboard },
  { to: 'chapters', label: 'Bab & Tugas', Icon: ListChecks },
  { to: 'guidance-logs', label: 'Log Bimbingan', Icon: NotebookPen },
  { to: 'documents', label: 'Berkas Draf', Icon: FileText },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const { researchId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: researches = [] } = useResearches()
  const id = Number(researchId)
  const { data: research } = useResearch(id)

  const handleLogout = async () => {
    await logout()
    qc.clear()
    navigate('/login')
  }

  const initials = (user?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground md:w-60 md:border-r md:border-b-0">
        <Link to="/dashboard" className="flex items-center gap-2 rounded-md text-base font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen aria-hidden="true" className="size-4" />
          </span>
          Skripsi Manager
        </Link>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="research-switcher" className="text-xs font-medium text-muted-foreground">
            Riset aktif
          </label>
          <Select
            value={Number.isFinite(id) ? String(id) : undefined}
            onValueChange={(value) => navigate(`/researches/${value}/overview`)}
          >
            <SelectTrigger id="research-switcher" className="w-full md:max-w-full">
              <SelectValue placeholder={researches.length ? 'Pilih riset…' : 'Belum ada riset'} />
            </SelectTrigger>
            <SelectContent>
              {researches.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  <span className="max-w-52 truncate">{r.title}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <nav aria-label="Navigasi riset" className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV.map(({ to, label, Icon }) => {
            const target = Number.isFinite(id) ? `/researches/${id}/${to}` : '/dashboard'
            return (
              <NavLink
                key={to}
                to={target}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </NavLink>
          )
          })}
        </nav>

        {research && (
          <Card size="sm" className="mt-auto hidden md:flex">
            <CardContent className="w-full space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Progres total</p>
              <p className="font-mono text-2xl font-bold" aria-live="polite">
                {research.progress_percent ?? 0}%
              </p>
              <Progress value={research.progress_percent ?? 0} aria-label="Progres keseluruhan riset" />
            </CardContent>
          </Card>
        )}

        <Separator className="hidden md:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto justify-start gap-2 px-2 py-1.5">
              <Avatar className="size-7">
                <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden truncate text-sm md:inline">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate">{user?.name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut aria-hidden="true" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
