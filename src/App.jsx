import { useState, useEffect } from 'react'
import './App.css'

import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Tabla from './components/Tabla'
import HistorialVentas from './components/HistorialVentas'
import Contactos from './components/Contactos'
import Scanneo from './components/Scanner/Scanner'

import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './config/firebase'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('Inicio')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#fff',
          background: 'linear-gradient(180deg, #1A1A2E, #16213E)',
        }}
      >
        <p>Cargando...</p>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'Inicio':
        return <Dashboard user={user} />
      case 'Productos':
        return <Tabla user={user} />
      case 'Historial':
        return <HistorialVentas user={user} />
      case 'Contactos':
        return <Contactos user={user} />
      case 'Scanneo':
        return <Scanneo user={user} />
      default:
        return <Dashboard user={user} />
    }
  }

  if (!user) {
    return <Login />
  }

  const inicial =
    (user.displayName || user.email || '?')
      .toString()
      .charAt(0)
      .toUpperCase() || '?'

  return (
    <div className="App">
      <div className="app-layout">
        {/* ========== SIDEBAR ========== */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-mini">📦</span>
            <span className="logo-text">Inventia</span>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar">{inicial}</div>
            <div className="user-info">
              <span className="user-name">
                {user.displayName || 'Usuario'}
              </span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>

          <div className="sidebar-nav">
            <button
              className={`nav-item-sidebar ${
                activeSection === 'Inicio' ? 'activo' : ''
              }`}
              onClick={() => setActiveSection('Inicio')}
            >
              Panel de control
            </button>

            <button
              className={`nav-item-sidebar ${
                activeSection === 'Productos' ? 'activo' : ''
              }`}
              onClick={() => setActiveSection('Productos')}
            >
              Productos
            </button>

            <button
              className={`nav-item-sidebar ${
                activeSection === 'Historial' ? 'activo' : ''
              }`}
              onClick={() => setActiveSection('Historial')}
            >
              
              
              Historial de ventas
            </button>

            <button
              className={`nav-item-sidebar ${
                activeSection === 'Contactos' ? 'activo' : ''
              }`}
              onClick={() => setActiveSection('Contactos')}
            >
              Contactos / Proveedores
            </button>


            <button
              className={`nav-item-sidebar ${
                activeSection === 'Contactos' ? 'activo' : ''
              }`}
              onClick={() => setActiveSection('Scanneo')}
            >
            Scanner Inteligente
            </button>
            
          </div>

          <button
            className="btn-sidebar-logout"
            onClick={() => auth.signOut()}
          >
            Cerrar sesión
          </button>
          
        </aside>

        {/* ========== CONTENIDO PRINCIPAL ========== */}
        <main className="main-content">
          {/* reutilizamos tu clase mainSection para que respeten los paddings */}
          <div className="mainSection">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
