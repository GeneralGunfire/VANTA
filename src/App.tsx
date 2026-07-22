import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './state/AppState'
import Shell from './components/Shell'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import Chat from './pages/Chat'
import Ledger from './pages/Ledger'
import Corrections from './pages/Corrections'
import Help from './pages/Help'

export default function App() {
  const { signedIn } = useApp()

  if (!signedIn) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/app" element={<Shell />}>
        <Route index element={<Navigate to="chat" replace />} />
        <Route path="chat" element={<Chat />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="corrections" element={<Corrections />} />
        <Route path="help" element={<Help />} />
      </Route>
      <Route path="*" element={<Navigate to="/app/chat" replace />} />
    </Routes>
  )
}
