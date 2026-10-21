import { createContext } from 'react'
import type { User } from '../services/types'

export interface AuthValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, passwordConfirm: string) => Promise<void>
  startGoogleLogin: () => Promise<void>
  loginWithToken: (token: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)
