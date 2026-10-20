import { useQueryClient } from '@tanstack/react-query'
import { BookOpen, FileText, LayoutDashboard, ListChecks, LogOut, NotebookPen } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useResearch, useResearches } from '@/services/researches'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeToggle } from '@/components/theme-toggle'

const NAV = [
  { to: 'overview', label: 'Ringkasan', Icon: LayoutDashboard },
  { to: 'chapters', label: 'Bab & Tugas', Icon: ListChecks },
  { to: 'guidance-logs', label: 'Log Bimbingan', Icon: NotebookPen },
  { to: 'documents', label: 'Berkas Draf', Icon: FileText },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const { researchId } = useParams()
  const location = useLocation()
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

  const activeNav = NAV.find(({ to }) => location.pathname.endsWith(to))

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/dashboard">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <BookOpen aria-hidden="true" className="size-4" />
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold">Skripsi Manager</span>
                    <span className="truncate text-xs text-muted-foreground">Pelacak progres TGA</span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="flex flex-col gap-1.5 px-2 pt-1 pb-2">
            <label htmlFor="research-switcher" className="text-xs font-medium text-muted-foreground">
              Riset aktif
            </label>
            <Select
              value={Number.isFinite(id) ? String(id) : undefined}
              onValueChange={(value) => navigate(`/researches/${value}/overview`)}
            >
              <SelectTrigger id="research-switcher" className="w-full">
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
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu riset</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ to, label, Icon }) => {
                  const target = Number.isFinite(id) ? `/researches/${id}/${to}` : '/dashboard'
                  return (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton asChild isActive={location.pathname.endsWith(to)} tooltip={label}>
                        <NavLink to={target}>
                          <Icon aria-hidden="true" />
                          {label}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {research && (
            <SidebarGroup>
              <SidebarGroupLabel>Progres total</SidebarGroupLabel>
              <SidebarGroupContent className="px-3">
                <p className="font-mono text-2xl font-bold" aria-live="polite">
                  {research.progress_percent ?? 0}%
                </p>
                <Progress
                  value={research.progress_percent ?? 0}
                  className="mt-2"
                  aria-label="Progres keseluruhan riset"
                />
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-sm font-medium">{user?.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
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
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger aria-label="Buka/tutup sidebar" />
          <span className="text-sm font-semibold md:hidden">Skripsi Manager</span>

          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {activeNav && Number.isFinite(id) && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeNav.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <span className="flex-1" />
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
