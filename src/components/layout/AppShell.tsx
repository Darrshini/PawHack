import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNavigation } from './BottomNavigation'
import { Outlet } from 'react-router-dom'

interface AppShellProps {
  alertCount?: number
}

export function AppShell({ alertCount = 0 }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      {/* Overlay for mobile sidebar */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`app-sidebar${sidebarOpen ? ' open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <Sidebar onClose={() => setSidebarOpen(false)} alertCount={alertCount} />
      </div>

      {/* Main */}
      <div className="app-main">
        <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} alertCount={alertCount} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <BottomNavigation />
    </div>
  )
}
