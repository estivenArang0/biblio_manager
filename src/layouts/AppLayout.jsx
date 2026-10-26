import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <Header onMenu={() => setMenuOpen(true)} />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <main className="w-full min-h-screen pt-16 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
