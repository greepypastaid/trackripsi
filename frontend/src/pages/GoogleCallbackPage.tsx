import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/api'

const MESSAGES: Record<string, string> = {
  invalid_state: 'Sesi login Google udah kedaluwarsa. Coba masuk lagi.',
  denied: 'Login Google dibatalin.',
  email: 'Email Google-nya nggak ada atau belum diverifikasi.',
  userinfo: 'Google nggak ngirim data profilmu. Coba lagi.',
  invalid_client: 'Client ID atau Client Secret Google salah (invalid_client).',
  invalid_grant: 'Kode loginnya udah dipakai atau kedaluwarsa. Masuk lagi ya.',
  redirect_uri_mismatch: 'Redirect URI di Google Console beda sama GOOGLE_REDIRECT_URI.',
  token_exchange: 'Kode loginnya gagal ditukar sama Google.',
  db: 'Akunmu belum bisa disimpan. Kalau ini server baru, migrasi database-nya kayaknya belum jalan.',
  failed: 'Google nggak bisa dihubungi. Coba lagi beberapa saat.',
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
            ? 'Token login ditolak server (401). Masuk lagi ya.'
            : 'Akun Google-nya nggak bisa dimuat. Masuk lagi ya.',
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
