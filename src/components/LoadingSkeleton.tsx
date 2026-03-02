export default function LoadingSkeleton({ title }: { title?: string }) {
  return (
    <>
      {/* Sidebar skeleton */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'linear-gradient(180deg, var(--blue-700) 0%, var(--blue-800) 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
      }}>
        {/* Logo area */}
        <div style={{
          padding: '20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            animation: 'pulse 1.4s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <div style={{
            width: 80, height: 18,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.15)',
            animation: 'pulse 1.4s ease-in-out 0.1s infinite',
          }} />
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{
              margin: '2px 8px',
              height: 40,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.1)',
              animation: `pulse 1.4s ease-in-out ${i * 0.08}s infinite`,
            }} />
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <div style={{ marginLeft: 'var(--sidebar-width)', padding: '24px 28px' }}>
        {title && (
          <div style={{
            width: 200, height: 28, background: 'var(--gray-200)',
            borderRadius: 6, marginBottom: 20,
            animation: 'pulse 1.4s ease-in-out infinite',
          }} />
        )}
        <div className="card">
          <div style={{
            height: 44, background: 'var(--gray-900)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          }} />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                height: 40, background: 'var(--gray-100)',
                borderRadius: 6, animation: `pulse 1.4s ease-in-out ${i * 0.1}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  )
}
