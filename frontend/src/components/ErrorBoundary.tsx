import { Component, type ErrorInfo, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Komponen gagal dirender', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-6 text-sm text-rose-800">
          <p className="font-semibold">Terjadi kesalahan pada tampilan.</p>
          <button type="button" onClick={() => this.setState({ hasError: false })} className="mt-2 underline">
            Coba muat ulang bagian ini
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
