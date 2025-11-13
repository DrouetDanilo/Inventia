import { useState, useEffect } from 'react'
import "../styles/Dashboard.css"
import { ref, onValue } from 'firebase/database'
import { database } from '../config/firebase'

function Dashboard({ user }) {
  const [catalogoProductos, setCatalogoProductos] = useState([])
  const [productosStock, setProductosStock] = useState([])
  const [historialVentas, setHistorialVentas] = useState([])
  const [resumen, setResumen] = useState([])

  const CargarCatalogos = () => {
    const catalogoRef = ref(database, `usuarios/${user.uid}/catalogoProductos`)
    onValue(catalogoRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const catalogos = Object.keys(data).map(key => ({ id: key, ...data[key] }))
        setCatalogoProductos(catalogos)
      } else {
        setCatalogoProductos([])
      }
    })
  }

  const CargarProductosStock = () => {
    const productosRef = ref(database, `usuarios/${user.uid}/productos`)
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const productosLista = Object.keys(data).map(key => ({ id: key, ...data[key] }))
        setProductosStock(productosLista)
      } else {
        setProductosStock([])
      }
    })
  }

  const CargarHistorialVentas = () => {
    const ventasRef = ref(database, `usuarios/${user.uid}/historialVentas`)
    onValue(ventasRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const ventasLista = Object.keys(data).map(key => ({ id: key, ...data[key] }))
        setHistorialVentas(ventasLista)
      } else {
        setHistorialVentas([])
      }
    })
  }
  
  const GenerarResumen = () => {
    const agrupados = {}
  
    productosStock.forEach(prod => {
      const nombre = prod.tipoProducto
      const marca = prod.marcaFabricante
      const precio = parseFloat(prod.precio) || 0
      const clave = `${nombre}-${marca}`
      
      if (!agrupados[clave]) {
        // 🔥 Buscar los slots máximos del catálogo
        const plantilla = catalogoProductos.find(
          cat => cat.tipoProducto === nombre && cat.marcaFabricante === marca
        )
        const slotsMaximos = plantilla?.slotsMaximos ? parseInt(plantilla.slotsMaximos) : 100
        
        agrupados[clave] = {
          nombre,
          marca,
          precio,
          stock: 0,
          vendidos: 0,
          slotsMaximos // 🔥 NUEVO: guardamos los slots máximos
        }
      }
      agrupados[clave].stock += 1
    })
  
    historialVentas.forEach(venta => {
      const nombre = venta.tipoProducto
      const marca = venta.marcaFabricante
      const precio = parseFloat(venta.precio) || 0
      const clave = `${nombre}-${marca}`
      
      if (!agrupados[clave]) {
        // 🔥 Buscar los slots máximos del catálogo
        const plantilla = catalogoProductos.find(
          cat => cat.tipoProducto === nombre && cat.marcaFabricante === marca
        )
        const slotsMaximos = plantilla?.slotsMaximos ? parseInt(plantilla.slotsMaximos) : 100
        
        agrupados[clave] = {
          nombre,
          marca,
          precio,
          stock: 0,
          vendidos: 0,
          slotsMaximos // 🔥 NUEVO: guardamos los slots máximos
        }
      }
      agrupados[clave].vendidos += 1
    })
  
    const resultado = Object.values(agrupados).map(p => ({
      ...p,
      dineroStock: (p.stock * p.precio).toFixed(2),
      dineroGanado: (p.vendidos * p.precio).toFixed(2)
    }))
    
    setResumen(resultado)
  }

  // 🚦 Función para obtener el color del semáforo basado en slots máximos
  const obtenerColorSemaforo = (stock, slotsMaximos) => {
    const porcentaje = (stock / slotsMaximos) * 100
    
    if (porcentaje <= 20) return '#e74c3c' // Rojo - Crítico (≤20%)
    if (porcentaje <= 50) return '#f39c12' // Amarillo - Medio (21-50%)
    return '#27ae60' // Verde - Completo (>50%)
  }

  // Obtener el estado en texto basado en slots máximos
  const obtenerEstadoTexto = (stock, slotsMaximos) => {
    const porcentaje = (stock / slotsMaximos) * 100
    
    if (porcentaje <= 20) return 'CRÍTICO'
    if (porcentaje <= 50) return 'BAJO'
    return 'NORMAL'
  }
  
  useEffect(() => {
    if (user) {
      CargarCatalogos()
      CargarProductosStock()
      CargarHistorialVentas()
    }
  }, [user])
  
  useEffect(() => {
    if (catalogoProductos.length > 0) {
      GenerarResumen()
    }
  }, [productosStock, historialVentas, catalogoProductos])
  
  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Resumen general de productos</h2>
      
      <table className="dashboard-table">
        <thead>
          <tr className="dashboard-table-header">
            <th className="dashboard-th dashboard-th-center">Estado</th>
            <th className="dashboard-th dashboard-th-left">Nombre</th>
            <th className="dashboard-th dashboard-th-left">Marca</th>
            <th className="dashboard-th dashboard-th-center">Vendidos</th>
            <th className="dashboard-th dashboard-th-center">Stock</th>
            <th className="dashboard-th dashboard-th-center">Slots Máx.</th>
            <th className="dashboard-th dashboard-th-center">% Ocupación</th>
            <th className="dashboard-th dashboard-th-right">Dinero en stock ($)</th>
            <th className="dashboard-th dashboard-th-right">Dinero ganado ($)</th>
          </tr>
        </thead>
        <tbody>
          {resumen.length > 0 ? (
            resumen.map((item, index) => {
              const colorSemaforo = obtenerColorSemaforo(item.stock, item.slotsMaximos)
              const estadoTexto = obtenerEstadoTexto(item.stock, item.slotsMaximos)
              const porcentajeOcupacion = ((item.stock / item.slotsMaximos) * 100).toFixed(1)
              
              return (
                <tr key={index} className={`dashboard-table-row ${index % 2 === 0 ? 'dashboard-row-even' : 'dashboard-row-odd'}`}>
                  {/* 🚦 SEMÁFORO */}
                  <td className="dashboard-td dashboard-td-center">
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: colorSemaforo,
                        boxShadow: `0 0 10px ${colorSemaforo}`,
                        border: '3px solid rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '60%',
                          height: '60%',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.3)'
                        }}></div>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: colorSemaforo
                      }}>
                        {estadoTexto}
                      </span>
                    </div>
                  </td>
                  <td className="dashboard-td">{item.nombre}</td>
                  <td className="dashboard-td">{item.marca}</td>
                  <td className="dashboard-td dashboard-td-center">{item.vendidos}</td>
                  <td className="dashboard-td dashboard-td-center" style={{
                    fontWeight: '700',
                    fontSize: '16px',
                    color: colorSemaforo
                  }}>
                    {item.stock}
                  </td>
                  <td className="dashboard-td dashboard-td-center" style={{
                    fontWeight: '600',
                    color: '#7f8c8d'
                  }}>
                    {item.slotsMaximos}
                  </td>
                  <td className="dashboard-td dashboard-td-center">
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{
                        fontWeight: '600',
                        color: colorSemaforo
                      }}>
                        {porcentajeOcupacion}%
                      </span>
                      {/* Barra de progreso */}
                      <div style={{
                        width: '80px',
                        height: '6px',
                        backgroundColor: '#ecf0f1',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${porcentajeOcupacion}%`,
                          height: '100%',
                          backgroundColor: colorSemaforo,
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="dashboard-td dashboard-td-right">${item.dineroStock}</td>
                  <td className="dashboard-td dashboard-td-right">${item.dineroGanado}</td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan="9" className="dashboard-loading">
                Cargando datos...
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 📋 LEYENDA DEL SEMÁFORO ACTUALIZADA */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#27ae60',
            boxShadow: '0 0 8px #27ae60'
          }}></div>
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            <strong>Verde:</strong> Stock normal (más del 50% de slots)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#f39c12',
            boxShadow: '0 0 8px #f39c12'
          }}></div>
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            <strong>Amarillo:</strong> Stock bajo (21-50% de slots)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#e74c3c',
            boxShadow: '0 0 8px #e74c3c'
          }}></div>
          <span style={{ fontSize: '14px', color: '#2c3e50' }}>
            <strong>Rojo:</strong> Stock crítico (≤20% de slots)
          </span>
        </div>
      </div>

      {/* 💡 NOTA SOBRE DEFAULT */}
      <div style={{
        marginTop: '15px',
        padding: '12px',
        backgroundColor: '#fff9e6',
        borderLeft: '4px solid #f39c12',
        borderRadius: '4px'
      }}>
        <span style={{ fontSize: '13px', color: '#7f8c8d' }}>
          💡 <strong>Nota:</strong> Los productos sin slots definidos usan 100 como valor predeterminado.
        </span>
      </div>
    </div>
  )
}

export default Dashboard