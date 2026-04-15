import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import TurfDetails from './pages/TurfDetails'
import TurfPage from './pages/TurfPage'
import FooterEnd from './components/FooterEnd'

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />            
          <Route path="/turf/:id" element={<TurfPage />} />


        </Routes>
      </main>

      <Footer />
      <FooterEnd />
    </div>
  )
}

export default App