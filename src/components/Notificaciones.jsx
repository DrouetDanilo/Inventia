// src/components/Notificaciones.jsx
import { useState, useEffect } from 'react'
import { ref, onValue, set, push, remove } from 'firebase/database'
import { database } from '../config/firebase'
import '../styles/Notificaciones.css'

function Notificaciones({ user, onClose }) {
  const [notificaciones, setNotificaciones] = useState([])
  const [filtro, setFiltro] = useState('todas') // todas, noLeidas, leidas

  useEffect(() => {
    if (user?.uid) {
      const notifRef = ref(database, `usuarios/${user.uid}/notificaciones`)
      onValue(notifRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          const lista = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          setNotificaciones(lista)
        } else {
          setNotificaciones([])
        }
      })
    }
  }, [user])

  const marcarComoLeida = async (notifId) => {
    try {
      const notifRef = ref(database, `usuarios/${user.uid}/notificaciones/${notifId}`)
      const notif = notificaciones.find(n => n.id === notifId)
      if (notif) {
        await set(notifRef, { ...notif, leida: true })
      }
    } catch (error) {
      console.error('Error al marcar como leída:', error)
    }
  }

  const eliminarNotificacion = async (notifId) => {
    if (window.confirm('¿Eliminar esta notificación?')) {
      try {
        const notifRef = ref(database, `usuarios/${user.uid}/notificaciones/${notifId}`)
        await remove(notifRef)
      } catch (error) {
        console.error('Error al eliminar:', error)
      }
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      const noLeidas = notificaciones.filter(n => !n.leida)
      for (const notif of noLeidas) {
        const notifRef = ref(database, `usuarios/${user.uid}/notificaciones/${notif.id}`)
        await set(notifRef, { ...notif, leida: true })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const eliminarTodasLeidas = async () => {
    if (window.confirm('¿Eliminar todas las notificaciones leídas?')) {
      try {
        const leidas = notificaciones.filter(n => n.leida)
        for (const notif of leidas) {
          const notifRef = ref(database, `usuarios/${user.uid}/notificaciones/${notif.id}`)
          await remove(notifRef)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }

  const obtenerIcono = (tipo) => {
    switch (tipo) {
      case 'caducidad':
        return '⚠️'
      case 'stock_bajo':
        return '📉'
      case 'sin_stock':
        return '🚫'
      case 'exito':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '🔔'
    }
  }

  const obtenerClaseNotificacion = (tipo) => {
    switch (tipo) {
      case 'caducidad':
        return 'notif-caducidad'
      case 'stock_bajo':
        return 'notif-stock-bajo'
      case 'sin_stock':
        return 'notif-sin-stock'
      case 'exito':
        return 'notif-exito'
      case 'error':
        return 'notif-error'
      default:
        return 'notif-info'
    }
  }

  const notificacionesFiltradas = notificaciones.filter(n => {
    if (filtro === 'noLeidas') return !n.leida
    if (filtro === 'leidas') return n.leida
    return true
  })

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <div className="modal-notificaciones-overlay" onClick={onClose}>
      <div className="modal-notificaciones" onClick={(e) => e.stopPropagation()}>
        <div className="notificaciones-header">
          <h2>
            🔔 Notificaciones 
            {noLeidas > 0 && <span className="badge-no-leidas">{noLeidas}</span>}
          </h2>
          <button className="btn-cerrar-notif" onClick={onClose}>✕</button>
        </div>

        <div className="notificaciones-controles">
          <div className="filtros-notif">
            <button 
              className={`filtro-btn ${filtro === 'todas' ? 'activo' : ''}`}
              onClick={() => setFiltro('todas')}
            >
              Todas ({notificaciones.length})
            </button>
            <button 
              className={`filtro-btn ${filtro === 'noLeidas' ? 'activo' : ''}`}
              onClick={() => setFiltro('noLeidas')}
            >
              No leídas ({noLeidas})
            </button>
            <button 
              className={`filtro-btn ${filtro === 'leidas' ? 'activo' : ''}`}
              onClick={() => setFiltro('leidas')}
            >
              Leídas ({notificaciones.length - noLeidas})
            </button>
          </div>

          <div className="acciones-notif">
            {noLeidas > 0 && (
              <button className="btn-accion-notif" onClick={marcarTodasComoLeidas}>
                ✓ Marcar todas como leídas
              </button>
            )}
            {notificaciones.filter(n => n.leida).length > 0 && (
              <button className="btn-accion-notif btn-eliminar-todas" onClick={eliminarTodasLeidas}>
                🗑️ Eliminar leídas
              </button>
            )}
          </div>
        </div>

        <div className="lista-notificaciones">
          {notificacionesFiltradas.length === 0 ? (
            <div className="sin-notificaciones">
              <p>📭 No hay notificaciones</p>
            </div>
          ) : (
            notificacionesFiltradas.map((notif) => (
              <div 
                key={notif.id} 
                className={`notificacion-item ${obtenerClaseNotificacion(notif.tipo)} ${notif.leida ? 'leida' : 'no-leida'}`}
              >
                <div className="notif-icono">{obtenerIcono(notif.tipo)}</div>
                
                <div className="notif-contenido">
                  <h4 className="notif-titulo">{notif.titulo}</h4>
                  <p className="notif-mensaje">{notif.mensaje}</p>
                  <span className="notif-fecha">
                    {new Date(notif.fecha).toLocaleString('es-ES')}
                  </span>
                </div>

                <div className="notif-acciones">
                  {!notif.leida && (
                    <button 
                      className="btn-marcar-leida"
                      onClick={() => marcarComoLeida(notif.id)}
                      title="Marcar como leída"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    className="btn-eliminar-notif"
                    onClick={() => eliminarNotificacion(notif.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Notificaciones