import { useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  CalendarDays,
  FileText,
  GraduationCap,
  Library,
  LayoutDashboard,
  ListChecks,
  LogOut,
  NotebookPen,
  Plus,
  Timer,
  ShieldCheck,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { GlobalSearch } from '@/components/global-search'
import { useResearch, useResearches } from '@/services/researches'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BrandLogo } from '@/components/brand-logo'
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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
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

const NAV_GROUPS = [
  {
    label: 'Penulisan',
    items: [
      { to: 'overview', label: 'Ringkasan', Icon: LayoutDashboard },
      { to: 'calendar', label: 'Kalender', Icon: CalendarDays },
      { to: 'chapters', label: 'Bab & Tugas', Icon: ListChecks },
      { to: 'documents', label: 'Berkas Draf', Icon: FileText },
    ],
  },
  {
    label: 'Riset & Bimbingan',
    items: [
      { to: 'literature', label: 'Literatur', Icon: Library },
      { to: 'guidance-logs', label: 'Log Bimbingan', Icon: NotebookPen },
      { to: 'appointments', label: 'Jadwal', Icon: CalendarClock },
      { to: 'focus', label: 'Fokus', Icon: Timer },
      { to: 'journal', label: 'Jurnal Refleksi', Icon: NotebookPen },
    ],
  },
  {
    label: 'Sidang',
    items: [
      { to: 'readiness', label: 'Kesiapan', Icon: ShieldCheck },
      { to: 'defense', label: 'Pertanyaan', Icon: GraduationCap },
    ],
  },
]

const NAV = NAV_GROUPS.flatMap((group) => group.items)

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
  const activeResearch = researches.find((r) => r.id === id)

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/dashboard">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <BrandLogo className="size-7" />
                  </span>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold">Trackripsi</span>
                    <span className="truncate text-xs text-muted-foreground">Teman nulis skripsi</span>
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
              {/* Judul riset panjang: di desktop tombolnya dinaikkan supaya
                  judul kebaca dua baris, nggak dipotong jadi satu baris. */}
              <SelectTrigger
                id="research-switcher"
                className="w-full md:data-[size=default]:h-auto md:min-h-12 md:items-start md:py-2.5 md:whitespace-normal"
              >
                <span className="line-clamp-1 text-left md:line-clamp-2">
                  {activeResearch?.title ??
                    (researches.length ? 'Pilih riset…' : 'Belum ada riset')}
                </span>
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
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              {researches.length === 0 ? (
                /* Belum ada riset sama sekali: satu pintu ke dashboard untuk membuat riset. */
                <div className="flex flex-col gap-3 px-2 py-1">
                  <p className="text-xs text-muted-foreground">
                    Belum ada riset. Bikin satu dulu, biar bab, tugas, log bimbingan, dan matriks
                    literatur kebuka.
                  </p>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.pathname === '/dashboard'} tooltip="Buat riset">
                        <NavLink to="/dashboard">
                          <Plus aria-hidden="true" />
                          Bikin riset
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </div>
              ) : !Number.isFinite(id) ? (
                /* Riset ada tapi belum dipilih (berada di dashboard). */
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  Pilih riset di atas buat buka menunya.
                </p>
              ) : (
                /* Riset aktif: menu per kelompok. */
                <div className="flex flex-col gap-1">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {group.label}
                      </p>
                      <SidebarMenu>
                        {group.items.map(({ to, label, Icon }) => (
                          <SidebarMenuItem key={to}>
                            <SidebarMenuButton
                              asChild
                              isActive={location.pathname.endsWith(to)}
                              tooltip={label}
                            >
                              <NavLink to={`/researches/${id}/${to}`}>
                                <Icon aria-hidden="true" />
                                {label}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </div>
                  ))}
                </div>
              )}
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
          <span className="text-sm font-semibold md:hidden">Trackripsi</span>

          <GlobalSearch />

          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Beranda</Link>
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
