import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

function AppLayout() {
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <Header />
      <Sidebar />
      <div className="pl-64">
        <main className="w-full min-h-screen pt-16 bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
