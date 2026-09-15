import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import { AuctionProvider } from './contexts/AuctionContext'
import { QuotaProvider } from './contexts/QuotaContext'
import { VoiceProvider } from './contexts/VoiceContext'
import QuotaExceededModal from './components/QuotaExceededModal'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import LandingPage from './pages/LandingPage'
// Heavy routes load on demand so first paint stays light on low-end devices.
// Retry wrapper: flaky networks often fail a chunk fetch once; a fresh
// deploy also invalidates old chunk URLs, in which case we hard-reload once
// to fetch the new index.html instead of spinning forever.
const lazyWithRetry = (factory) => lazy(async () => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const mod = await factory();
      sessionStorage.removeItem('chunk-reload-at');
      return mod;
    } catch (err) {
      lastErr = err;
      await sleep(800 * (attempt + 1));
    }
  }
  const lastReload = Number(sessionStorage.getItem('chunk-reload-at') || 0);
  if (Date.now() - lastReload > 60000) {
    sessionStorage.setItem('chunk-reload-at', String(Date.now()));
    window.location.reload();
    return new Promise(() => {}); // never resolves; reload takes over
  }
  throw lastErr;
});
const Lobby = lazyWithRetry(() => import('./pages/Lobby'))
const AuctionRoom = lazyWithRetry(() => import('./pages/AuctionRoom'))
const AuctionSummary = lazyWithRetry(() => import('./pages/AuctionSummary'))
const FantasyAdmin = lazyWithRetry(() => import('./pages/FantasyAdmin'))

// Featherweight route fallback (no timers/animations to resolve).
const RouteFallback = () => (
  <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-[#050505]">
    <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-orange-500 animate-spin" />
    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.25em]">Loading arena…</p>
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
              <Suspense fallback={<RouteFallback />}>
              <ErrorBoundary>
              <Routes>
                 <Route path="/" element={<LandingPage />} />
                 <Route path="/lobby/:id" element={<Lobby />} />
                 <Route path="/auction/:id" element={<AuctionRoom />} />
                 <Route path="/summary/:id" element={<AuctionSummary />} />
                 <Route path="/admin/fantasy" element={<FantasyAdmin />} />
              </Routes>
              </ErrorBoundary>
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

