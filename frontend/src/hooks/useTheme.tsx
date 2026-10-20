import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// ponytail: pengganti next-themes yang me-render <script> dalam tree React
// (React 19 menolaknya). Ceiling: bila butuh multi-tema custom, pakai lib.
type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

function systemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && systemDark())
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

function readStored(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage bisa terblokir (private mode) — fallback ke system.
  }
  return 'system'
}

const ThemeContext = createContext<{ theme: Theme; resolvedTheme: 'light' | 'dark'; setTheme: (theme: Theme) => void }>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStored)

  useEffect(() => {
    apply(theme)
    if (theme !== 'system') return
    // Ikuti perubahan OS saat mode system.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Abaikan: preferensi tetap berlaku untuk sesi ini.
    }
  }, [])

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemDark() ? 'dark' : 'light') : theme
  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
