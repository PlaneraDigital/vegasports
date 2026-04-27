import { Routes, Route } from 'react-router-dom'

// ─── User Layout ──────────────────────────────────────────────────────────────
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FooterEnd from './components/FooterEnd'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import TurfDetails from './pages/TurfDetails'
import TurfPage from './pages/TurfPage'
import BookingPage from './pages/BookingPage'
import ProfilePage from './pages/ProfilePage'
import TicketPage from './pages/TicketPage'

// ─── Admin ────────────────────────────────────────────────────────────────────
import { AdminAuthProvider } from './admin/context/AdminAuthContext'
import AdminApp from './admin/AdminApp'
import AdminLogin from './admin/pages/AdminLogin'
import ProtectedAdminRoute from './admin/components/ProtectedAdminRoute'
import Dashboard from './admin/pages/Dashboard'
import TurfManagement from './admin/pages/TurfManagement'
import SlotManagement from './admin/pages/SlotManagement'
import PricingManagement from './admin/pages/PricingManagement'
import BookingManagement from './admin/pages/BookingManagement'
import Reports from './admin/pages/Reports'

function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* ── Admin routes (no user Navbar/Footer) ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminApp />
            </ProtectedAdminRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="turfs"     element={<TurfManagement />} />
          <Route path="slots"     element={<SlotManagement />} />
          <Route path="pricing"   element={<PricingManagement />} />
          <Route path="bookings"  element={<BookingManagement />} />
          <Route path="reports"   element={<Reports />} />
        </Route>

        {/* ── User-facing routes ── */}
        <Route
          path="/*"
          element={
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/"            element={<Home />} />
                  <Route path="/login"       element={<Login />} />
                  <Route path="/signup"      element={<Signup />} />
                  <Route path="/turf/:id"    element={<TurfPage />} />
                  <Route path="/turf/:id/book" element={<BookingPage />} />
                  <Route path="/ticket/:id"  element={<TicketPage />} />
                  <Route path="/profile"     element={<ProfilePage />} />
                </Routes>
              </main>
              <Footer />
              <FooterEnd />
            </div>
          }
        />
      </Routes>
    </AdminAuthProvider>
  )
}

export default App