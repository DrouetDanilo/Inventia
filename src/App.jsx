// src/App.jsx
import { useState, useEffect } from 'react'
import './App.css'

import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Tabla from './components/Tabla'
import HistorialVentas from './components/HistorialVentas'
import Contactos from './components/Contactos'
import Scanneo from './components/Scanner/Scanner'
import Planes from './components/Planes'
import Notificaciones from './components/Notificaciones'

import { onAuthStateChanged } from 'firebase/auth'
import { auth, database } from './config/firebase'
import { ref, onValue, push, set } from 'firebase/database'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('Inicio')
  const [mostrarPlanes, setMostrarPlanes] = useState(false)
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false)
  const [planActual, setPlanActual] = useState('gratuito')
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Cargar plan del usuario
  useEffect(() => {
    if (user?.uid) {
      const planRef = ref(database, `usuarios/${user.uid}/plan`)
      onValue(planRef, (snapshot) => {
        const data = snapshot.val()
        setPlanActual(data?.tipo || 'gratuito')
      })
    }
  }, [user])

  // Contador de notificaciones no leídas
  useEffect(() => {
    if (user?.uid) {
      const notifRef = ref(database, `usuarios/${user.uid}/notificaciones`)
      onValue(notifRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const noLeidas = Object.values(data).filter(n => !n.leida).length
          setNotificacionesNoLeidas(noLeidas)
        } else {
          setNotificacionesNoLeidas(0)
        }
      })
    }
  }, [user])

  // Sistema de verificación de productos (caducidad y stock)
  useEffect(() => {
    if (!user?.uid) return

    const productosRef = ref(database, `usuarios/${user.uid}/productos`)
    const catalogoRef = ref(database, `usuarios/${user.uid}/catalogoProductos`)

    let unsubscribeProductos
    let unsubscribeCatalogo

    const verificarProductos = () => {
      // Cargar productos
      unsubscribeProductos = onValue(productosRef, (snapshotProductos) => {
        // Cargar catálogo
        unsubscribeCatalogo = onValue(catalogoRef, (snapshotCatalogo) => {
          const productos = snapshotProductos.val()
          const catalogo = snapshotCatalogo.val()

          const productosArray = productos 
            ? Object.keys(productos).map(key => ({ id: key, ...productos[key] })) 
            : []
          
          const catalogoArray = catalogo 
            ? Object.keys(catalogo).map(key => ({ id: key, ...catalogo[key] })) 
            : []

          const ahora = new Date()

          // ===== VERIFICAR PRODUCTOS PRÓXIMOS A CADUCAR =====
          productosArray.forEach(producto => {
            if (producto.fechaCaducidad) {
              const fechaCad = new Date(producto.fechaCaducidad)
              const diasRestantes = Math.ceil((fechaCad - ahora) / (1000 * 60 * 60 * 24))

              // Productos que caducan en 7 días o menos (pero no caducados)
              if (diasRestantes > 0 && diasRestantes <= 7) {
                crearNotificacion({
                  tipo: 'caducidad',
                  titulo: '⚠️ Producto próximo a caducar',
                  mensaje: `"${producto.tipoProducto}" - ${producto.marcaFabricante} caduca en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}. Fecha: ${fechaCad.toLocaleDateString('es-ES')}`,
                  clave: `caducidad_${producto.tipoProducto}_${producto.marcaFabricante}_${diasRestantes}`
                })
              } 
              // Productos ya caducados
              else if (diasRestantes <= 0) {
                crearNotificacion({
                  tipo: 'caducidad',
                  titulo: '🚨 Producto caducado',
                  mensaje: `"${producto.tipoProducto}" - ${producto.marcaFabricante} ya ha caducado. Fecha de caducidad: ${fechaCad.toLocaleDateString('es-ES')}`,
                  clave: `caducado_${producto.tipoProducto}_${producto.marcaFabricante}`
                })
              }
            }
          })

          // ===== VERIFICAR STOCK (SEMÁFORO) =====
          // Agrupar productos por tipo y marca (igual que Dashboard)
          const agrupados = {}

          productosArray.forEach(prod => {
            const nombre = prod.tipoProducto
            const marca = prod.marcaFabricante
            const clave = `${nombre}-${marca}`

            if (!agrupados[clave]) {
              const plantilla = catalogoArray.find(
                cat => cat.tipoProducto === nombre && cat.marcaFabricante === marca
              )
              const slotsMaximos = plantilla?.slotsMaximos ? parseInt(plantilla.slotsMaximos) : 100

              agrupados[clave] = { 
                nombre, 
                marca, 
                stock: 0, 
                slotsMaximos,
                plantillaId: plantilla?.id 
              }
            }
            agrupados[clave].stock += 1
          })

          // Agregar productos del catálogo que tienen 0 stock
          catalogoArray.forEach(plantilla => {
            const clave = `${plantilla.tipoProducto}-${plantilla.marcaFabricante}`
            if (!agrupados[clave]) {
              agrupados[clave] = {
                nombre: plantilla.tipoProducto,
                marca: plantilla.marcaFabricante,
                stock: 0,
                slotsMaximos: parseInt(plantilla.slotsMaximos) || 100,
                plantillaId: plantilla.id
              }
            }
          })

          // Verificar cada producto agrupado
          Object.values(agrupados).forEach(producto => {
            const stockActual = producto.stock
            const stockMaximo = producto.slotsMaximos
            const porcentaje = (stockActual / stockMaximo) * 100

            // CRÍTICO: 0-20% (SEMÁFORO ROJO)
            if (porcentaje <= 20) {
              if (stockActual === 0) {
                crearNotificacion({
                  tipo: 'sin_stock',
                  titulo: '🚫 Sin stock (Semáforo Rojo)',
                  mensaje: `"${producto.nombre}" - ${producto.marca} no tiene unidades disponibles (0/${stockMaximo})`,
                  clave: `sin_stock_${producto.nombre}_${producto.marca}`
                })
              } else {
                crearNotificacion({
                  tipo: 'stock_bajo',
                  titulo: '🔴 Stock crítico (Semáforo Rojo)',
                  mensaje: `"${producto.nombre}" - ${producto.marca} tiene stock crítico: ${stockActual}/${stockMaximo} unidades (${porcentaje.toFixed(1)}%)`,
                  clave: `critico_${producto.nombre}_${producto.marca}_${stockActual}`
                })
              }
            }
            // BAJO: 21-50% (SEMÁFORO AMARILLO)
            else if (porcentaje > 20 && porcentaje <= 50) {
              crearNotificacion({
                tipo: 'stock_bajo',
                titulo: '🟡 Stock bajo (Semáforo Amarillo)',
                mensaje: `"${producto.nombre}" - ${producto.marca} tiene stock bajo: ${stockActual}/${stockMaximo} unidades (${porcentaje.toFixed(1)}%)`,
                clave: `bajo_${producto.nombre}_${producto.marca}_${stockActual}`
              })
            }
            // NORMAL: >50% (SEMÁFORO VERDE) - no envía notificación
          })
        })
      })
    }

    // Verificar inmediatamente al cargar
    verificarProductos()
    
    // Verificar cada 2 minutos
    const intervalo = setInterval(verificarProductos, 2 * 60 * 1000)

    return () => {
      clearInterval(intervalo)
      if (unsubscribeProductos) unsubscribeProductos()
      if (unsubscribeCatalogo) unsubscribeCatalogo()
    }
  }, [user])

  const crearNotificacion = async (datos) => {
    if (!user?.uid) return

    try {
      const notifRef = ref(database, `usuarios/${user.uid}/notificaciones`)
      
      // Verificar si ya existe una notificación similar reciente (últimas 2 horas)
      onValue(notifRef, (snapshot) => {
        const notificaciones = snapshot.val()
        const hace2h = new Date(Date.now() - 2 * 60 * 60 * 1000)
        
        let existeReciente = false
        if (notificaciones) {
          existeReciente = Object.values(notificaciones).some(n => {
            // Comparar por clave única
            const claveCoincide = datos.clave && n.clave === datos.clave
            const fechaReciente = new Date(n.fecha) > hace2h
            return claveCoincide && fechaReciente
          })
        }

        if (!existeReciente) {
          const nuevaNotifRef = push(notifRef)
          set(nuevaNotifRef, {
            tipo: datos.tipo,
            titulo: datos.titulo,
            mensaje: datos.mensaje,
            clave: datos.clave,
            fecha: new Date().toISOString(),
            leida: false
          })
        }
      }, { onlyOnce: true })
    } catch (error) {
      console.error('Error al crear notificación:', error)
    }
  }

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

          {/* INDICADOR DE PLAN ACTUAL */}
          <div className="plan-badge-sidebar">
            <span className="plan-icono">
              {planActual === 'premium' ? '✨' : '🆓'}
            </span>
            <span className="plan-texto">
              {planActual === 'premium' ? 'Premium' : 'Gratuito'}
            </span>
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
                activeSection === 'Scanneo' ? 'activo' : ''
              }`}
              onClick={() => setActiveSection('Scanneo')}
            >
              Scanner Inteligente
            </button>

            {/* BOTÓN DE NOTIFICACIONES */}
            <button
              className="nav-item-sidebar nav-item-notificaciones"
              onClick={() => setMostrarNotificaciones(true)}
            >
              🔔 Notificaciones
              {notificacionesNoLeidas > 0 && (
                <span className="notif-badge">{notificacionesNoLeidas}</span>
              )}
            </button>

            {/* BOTÓN DE CAMBIO DE TEMA */}
            <button
              className="theme-toggle nav-item-sidebar"
              onClick={toggleTheme}
            >
              <span className="theme-icon">
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
              {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            </button>

            {/* BOTÓN DE PLANES */}
            <button
              className="nav-item-sidebar btn-planes"
              onClick={() => setMostrarPlanes(true)}
            >
              🎯 Mejorar Plan
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
          <div className="mainSection">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* MODAL DE PLANES */}
      {mostrarPlanes && (
        <Planes 
          user={user} 
          onClose={() => setMostrarPlanes(false)} 
        />
      )}

      {/* MODAL DE NOTIFICACIONES */}
      {mostrarNotificaciones && (
        <Notificaciones
          user={user}
          onClose={() => setMostrarNotificaciones(false)}
        />
      )}
    </div>
  )
}

export default App