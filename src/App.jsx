import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import { AuctionProvider } from './contexts/AuctionContext'
import { QuotaProvider } from './contexts/QuotaContext'
import { VoiceProvider } from './contexts/VoiceContext'
import QuotaExceededModal from './components/QuotaExceededModal'
import VoiceFloatBar from './components/VoiceFloatBar'
import './index.css'
import LandingPage from './pages/LandingPage'
// Heavy routes load on demand so first paint stays light on low-end devices.
const Lobby = lazy(() => import('./pages/Lobby'))
const AuctionRoom = lazy(() => import('./pages/AuctionRoom'))
const AuctionSummary = lazy(() => import('./pages/AuctionSummary'))
const FantasyAdmin = lazy(() => import('./pages/FantasyAdmin'))

// Featherweight route fallback (no timers/animations to resolve).
const RouteFallback = () => (
  <div className="min-h-dvh flex items-center justify-center bg-[#050505]">
    <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-orange-500 animate-spin" />
  </div>
)

function App() {
  return (
    <Router>
      <QuotaProvider>
        <AuthProvider>
          <AuctionProvider>
            <VoiceProvider>
              <MotionConfig reducedMotion="user">
              <div className="min-h-dvh bg-ipl-dark text-white overflow-x-clip">
              <QuotaExceededModal />
              <VoiceFloatBar />
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                 <Route path="/" element={<LandingPage />} />
                 <Route path="/lobby/:id" element={<Lobby />} />
                 <Route path="/auction/:id" element={<AuctionRoom />} />
                 <Route path="/summary/:id" element={<AuctionSummary />} />
                 <Route path="/admin/fantasy" element={<FantasyAdmin />} />
              </Routes>
              </Suspense>
            </div>
              </MotionConfig>
            </VoiceProvider>
          </AuctionProvider>
        </AuthProvider>
      </QuotaProvider>
    </Router>
  )
}

export default App

