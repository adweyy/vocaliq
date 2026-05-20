import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Prepare from './pages/Prepare'
import Record from './pages/Record'
import Processing from './pages/Processing'
import Results from './pages/Results'
import Dashboard from './pages/Dashboard'
import { SessionProvider } from './context/SessionContext'

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/prepare" element={<Prepare />} />
        <Route path="/record" element={<Record />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </SessionProvider>
  )
}
