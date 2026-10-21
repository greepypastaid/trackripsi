export function BrandLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <img
      src="/trackripsi_logo.png"
      alt="Logo Trackripsi"
      className={`shrink-0 rounded-lg object-cover ${className}`}
    />
  )
}
