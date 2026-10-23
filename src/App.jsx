import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Catalogo from './pages/Catalogo'
import LecturaInteractiva from './pages/LecturaInteractiva'
import Recomendaciones from './pages/Recomendaciones'
import Historial from './pages/Historial'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/lectura" element={<LecturaInteractiva />} />
        <Route path="/recomendaciones" element={<Recomendaciones />} />
        <Route path="/historial" element={<Historial />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
