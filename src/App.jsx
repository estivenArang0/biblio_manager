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
import Perfil from './pages/Perfil'
import Favoritos from './pages/Favoritos'
import MisNotas from './pages/MisNotas'
import Comprension from './pages/Comprension'
import Panel from './pages/Panel'
import NotFound from './pages/NotFound'

const READERS = ['Lector']
const STAFF = ['Bibliotecario']

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
          path="/panel"
          element={
            <RequireRole roles={STAFF}>
              <Panel />
            </RequireRole>
          }
        />
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
        <Route
          path="/favoritos"
          element={
            <RequireRole roles={READERS}>
              <Favoritos />
            </RequireRole>
          }
        />
        <Route
          path="/mis-notas"
          element={
            <RequireRole roles={READERS}>
              <MisNotas />
            </RequireRole>
          }
        />
        <Route
          path="/comprension"
          element={
            <RequireRole roles={READERS}>
              <Comprension />
            </RequireRole>
          }
        />
        <Route path="/historial" element={<Historial />} />
        <Route path="/perfil" element={<Perfil />} />
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
          path="/chat-bandeja"
          element={
            <RequireRole roles={STAFF}>
              <AdminChat />
            </RequireRole>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RequireRole roles={STAFF}>
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
