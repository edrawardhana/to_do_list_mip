import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Absen from './pages/Absen'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const [currentPage, setCurrentPage] = useState('dashboard') // dashboard | absen

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="app-main">
      {currentPage === 'dashboard' ? (
        <Dashboard
          onLogout={handleLogout}
          onStartAbsen={() => setCurrentPage('absen')}
        />
      ) : (
        <Absen onBack={() => setCurrentPage('dashboard')} />
      )}
    </div>
  )
}

export default App
