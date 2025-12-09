import { useState, useEffect } from 'react'
import { database } from '../config/firebase'
import { ref, set, onValue } from 'firebase/database'
import '../styles/Planes.css'

function Planes({ user, onClose }) {
  const [planActual, setPlanActual] = useState('gratuito')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.uid) {
      const planRef = ref(database, `usuarios/${user.uid}/plan`)
      onValue(planRef, (snapshot) => {
        const data = snapshot.val()
        setPlanActual(data?.tipo || 'gratuito')
        setLoading(false)
      })
    }
  }, [user])

  const cambiarPlan = async (tipoPlan) => {
    if (!window.confirm(`¿Deseas cambiar al plan ${tipoPlan === 'premium' ? 'Premium' : 'Gratuito'}?`)) {
      return
    }

    try {
      const planRef = ref(database, `usuarios/${user.uid}/plan`)
      await set(planRef, {
        tipo: tipoPlan,
        fechaCambio: new Date().toISOString(),
        limiteProductos: tipoPlan === 'gratuito' ? 100 : -1 // -1 = ilimitado
      })
      
      alert(`✅ Plan cambiado a ${tipoPlan === 'premium' ? 'Premium' : 'Gratuito'} exitosamente`)
    } catch (err) {
      alert('Error al cambiar plan: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="planes-container">
        <div className="planes-content">
          <h2>Cargando...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="planes-container">
      <div className="planes-content">
        <button className="btn-cerrar" onClick={onClose}>✕</button>
        
        <h2>Elige tu Plan</h2>
        <p className="planes-subtitulo">
          Plan actual: <strong>{planActual === 'premium' ? '✨ Premium' : '🆓 Gratuito'}</strong>
        </p>

        <div className="planes-grid">
          {/* PLAN GRATUITO */}
          <div className={`plan-card ${planActual === 'gratuito' ? 'plan-activo' : ''}`}>
            <div className="plan-header">
              <h3>🆓 Plan Gratuito</h3>
              <div className="plan-precio">
                <span className="precio-cantidad">$0</span>
                <span className="precio-periodo">/mes</span>
              </div>
            </div>

            <div className="plan-caracteristicas">
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span>Hasta 100 productos</span>
              </div>
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span>Gestión básica de inventario</span>
              </div>
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span>Historial de ventas</span>
              </div>
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span>Asistente por voz</span>
              </div>
            </div>

            {planActual === 'gratuito' ? (
              <button className="btn-plan btn-plan-actual" disabled>
                Plan Actual
              </button>
            ) : (
              <button 
                className="btn-plan btn-plan-secundario"
                onClick={() => cambiarPlan('gratuito')}
              >
                Cambiar a Gratuito
              </button>
            )}
          </div>

          {/* PLAN PREMIUM */}
          <div className={`plan-card plan-premium ${planActual === 'premium' ? 'plan-activo' : ''}`}>
            <div className="plan-badge">Popular</div>
            
            <div className="plan-header">
              <h3>✨ Plan Premium</h3>
              <div className="plan-precio">
                <span className="precio-cantidad">$5.99</span>
                <span className="precio-periodo">/mes</span>
              </div>
            </div>

            <div className="plan-caracteristicas">
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span><strong>Productos ilimitados</strong></span>
              </div>
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span>Gestión avanzada de inventario</span>
              </div>
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span>Historial de ventas completo</span>
              </div>
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span>Asistente por voz mejorado</span>
              </div>
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span>Soporte prioritario</span>
              </div>
              <div className="caracteristica">
                <span className="icono">✓</span>
                <span>Análisis y reportes detallados</span>
              </div>
            </div>

            {planActual === 'premium' ? (
              <button className="btn-plan btn-plan-actual" disabled>
                Plan Actual
              </button>
            ) : (
              <button 
                className="btn-plan btn-plan-premium"
                onClick={() => cambiarPlan('premium')}
              >
                Mejorar a Premium
              </button>
            )}
          </div>
        </div>

        <div className="planes-nota">
          <p>💡 <strong>Nota:</strong> En esta demo, el cambio de plan es instantáneo. En producción, aquí integrarías un sistema de pagos como Stripe.</p>
        </div>
      </div>
    </div>
  )
}

export default Planes