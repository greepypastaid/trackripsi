import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AppLayout } from './layouts/AppLayout'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { OverviewPage } from './pages/OverviewPage'
import { ChaptersPage } from './pages/ChaptersPage'
import { GuidanceLogsPage } from './pages/GuidanceLogsPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { LiteraturePage } from './pages/LiteraturePage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { ReadinessPage } from './pages/ReadinessPage'
import { DefensePage } from './pages/DefensePage'
import { FocusPage } from './pages/FocusPage'
import { JournalPage } from './pages/JournalPage'
import { CalendarPage } from './pages/CalendarPage'
import { LogbookPrintPage } from './pages/LogbookPrintPage'
import { Skeleton } from '@/components/ui/skeleton'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
})

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Skeleton className="m-8 h-64" />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <Protected>
                  <AppLayout />
                </Protected>
              }
            >
              <Route index element={<DashboardPage />} />
            </Route>
            <Route
              path="/researches/:researchId"
              element={
                <Protected>
                  <AppLayout />
                </Protected>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="chapters" element={<ChaptersPage />} />
              <Route path="guidance-logs" element={<GuidanceLogsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="literature" element={<LiteraturePage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="readiness" element={<ReadinessPage />} />
              <Route path="defense" element={<DefensePage />} />
              <Route path="focus" element={<FocusPage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="calendar" element={<CalendarPage />} />
            </Route>
            {/* Cetak logbook: tanpa sidebar agar hasil print bersih. */}
            <Route
              path="/researches/:researchId/logbook/print"
              element={
                <Protected>
                  <LogbookPrintPage />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
