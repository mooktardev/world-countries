import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CountryDetail from './pages/CountryDetail'

const GlobePage = lazy(() => import('./pages/GlobePage'))

export default function App() {
  return (
    <HashRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/country/:code" element={<CountryDetail />} />
        <Route
          path="/globe"
          element={
            <Suspense fallback={<p className="status" style={{ padding: '1.5rem 5vw' }}>Chargement du globe…</p>}>
              <GlobePage />
            </Suspense>
          }
        />
      </Routes>
      <Footer />
    </HashRouter>
  )
}
