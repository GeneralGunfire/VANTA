import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './state/AppState'
import Shell from './components/Shell'
import Landing from './pages/Landing'
import SignUp from './pages/SignUp'
import Onboarding from './pages/Onboarding'
import Chat from './pages/Chat'
import Ledger from './pages/Ledger'
import Snapshot from './pages/Snapshot'
import Assets from './pages/Assets'
import Invoices from './pages/Invoices'
import Compliance from './pages/Compliance'
import Profile from './pages/Profile'
import Help from './pages/Help'
import More from './pages/More'

export default function App() {
  const { signedIn, onboarded } = useApp()

  if (!signedIn) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  if (!onboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/app" element={<Shell />}>
        <Route index element={<Navigate to="chat" replace />} />
        <Route path="chat" element={<Chat />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="snapshot" element={<Snapshot />} />
        <Route path="assets" element={<Assets />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="profile" element={<Profile />} />
        <Route path="help" element={<Help />} />
        <Route path="more" element={<More />} />
      </Route>
      <Route path="*" element={<Navigate to="/app/chat" replace />} />
    </Routes>
  )
}
