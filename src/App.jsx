import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { RequireAuth, RequireRole } from './components/RequireAuth'
import Login from './pages/Login'
import Catalogo from './pages/Catalogo'
import MisPrestamos from './pages/MisPrestamos'
import Prestamos from './pages/Prestamos'
import LecturaInteractiva from './pages/LecturaInteractiva'
import Lector from './pages/Lector'
import Recomendaciones from './pages/Recomendaciones'
import Historial from './pages/Historial'
import Reportes from './pages/Reportes'
import Chat from './pages/Chat'
import AdminChat from './pages/AdminChat'
import Usuarios from './pages/Usuarios'
import NotFound from './pages/NotFound'

const READERS = ['Estudiante', 'Docente']
const STAFF = ['Bibliotecario', 'Administrador']

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/catalogo" element={<Catalogo />} />
        <Route
          path="/mis-prestamos"
          element={
            <RequireRole roles={READERS}>
              <MisPrestamos />
            </RequireRole>
          }
        />
        <Route
          path="/prestamos"
          element={
            <RequireRole roles={STAFF}>
              <Prestamos />
            </RequireRole>
          }
        />
        <Route
          path="/lectura"
          element={
            <RequireRole roles={READERS}>
              <LecturaInteractiva />
            </RequireRole>
          }
        />
        <Route
          path="/lectura/:bookId"
          element={
            <RequireRole roles={READERS}>
              <Lector />
            </RequireRole>
          }
        />
        <Route
          path="/recomendaciones"
          element={
            <RequireRole roles={READERS}>
              <Recomendaciones />
            </RequireRole>
          }
        />
        <Route path="/historial" element={<Historial />} />
        <Route
          path="/reportes"
          element={
            <RequireRole roles={STAFF}>
              <Reportes />
            </RequireRole>
          }
        />
        <Route
          path="/chat"
          element={
            <RequireRole roles={READERS}>
              <Chat />
            </RequireRole>
          }
        />
        <Route
          path="/admin/chat"
          element={
            <RequireRole roles={['Administrador']}>
              <AdminChat />
            </RequireRole>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RequireRole roles={['Administrador']}>
              <Usuarios />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
