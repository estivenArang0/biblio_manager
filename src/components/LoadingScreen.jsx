function LoadingScreen({ label = 'Cargando…' }) {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-on-surface-variant">
      <span className="material-symbols-outlined text-3xl animate-spin text-secondary">progress_activity</span>
      <span className="font-label-md text-label-md">{label}</span>
    </div>
  )
}

export default LoadingScreen
