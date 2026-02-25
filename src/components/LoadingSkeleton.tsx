export default function LoadingSkeleton({ title }: { title?: string }) {
  return (
    <div style={{ padding: '24px 28px' }}>
      {title && (
        <div style={{
          width: 200, height: 28, background: 'var(--gray-200)',
          borderRadius: 6, marginBottom: 20,
          animation: 'pulse 1.4s ease-in-out infinite'
        }} />
      )}
      <div className="card">
        <div style={{
          height: 44, background: 'var(--gray-900)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
        }} />
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              height: 40, background: 'var(--gray-100)',
              borderRadius: 6, animation: `pulse 1.4s ease-in-out ${i * 0.1}s infinite`
            }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
