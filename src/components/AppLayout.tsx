import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout({ children, userName }: { children: React.ReactNode; userName?: string }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header userName={userName} />
        <main className="page-body">{children}</main>
      </div>
    </div>
  )
}
