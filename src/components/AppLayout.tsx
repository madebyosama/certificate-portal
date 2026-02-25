import Sidebar from './Sidebar'
import Header from './Header'

interface AppLayoutProps {
  children: React.ReactNode
  userName?: string
}

export default function AppLayout({ children, userName }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header userName={userName} />
        <main className="page-body fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
