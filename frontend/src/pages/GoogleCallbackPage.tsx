import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

const MESSAGES: Record<string, string> = {
  invalid_state: 'Sesi login Google kedaluwarsa atau tidak valid. Silakan coba lagi.',
  denied: 'Login Google dibatalkan.',
  email: 'Email Google tidak tersedia atau belum diverifikasi.',
  userinfo: 'Google tidak mengembalikan profil akun. Coba lagi.',
  invalid_client: 'Client ID atau Client Secret Google salah (invalid_client).',
  invalid_grant: 'Kode login Google sudah dipakai atau kedaluwarsa. Coba masuk lagi.',
  redirect_uri_mismatch: 'Redirect URI di Google Console tidak sama dengan GOOGLE_REDIRECT_URI.',
  token_exchange: 'Gagal menukar kode login dengan Google.',
  db: 'Server gagal menyimpan akun (kolom google_id belum ada / migrasi belum jalan).',
  failed: 'Gagal menghubungi Google. Coba lagi beberapa saat.',
}

export function GoogleCallbackPage() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('token')

    if (!token) {
      const code = params.get('error') ?? ''
      setError(MESSAGES[code] ?? `Login Google gagal (${code || 'tanpa kode'}).`)
      return
    }

    loginWithToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 401
            ? 'Token login ditolak server (401). Coba masuk lagi.'
            : 'Gagal memuat akun Google. Coba masuk lagi.',
        ),
      )
  }, [loginWithToken, navigate])

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        {error ? (
          <>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Link to="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Kembali ke halaman masuk
            </Link>
          </>
        ) : (
          <>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <p className="text-sm text-muted-foreground">Menyelesaikan login Google…</p>
          </>
        )}
      </div>
    </main>
  )
}
