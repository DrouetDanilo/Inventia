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
          slotsMaximos
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
          slotsMaximos
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

  const obtenerColorSemaforo = (stock, slotsMaximos) => {
    const porcentaje = (stock / slotsMaximos) * 100
    
    if (porcentaje <= 20) return '#e74c3c'
    if (porcentaje <= 50) return '#f39c12'
    return '#27ae60'
  }

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
                  {/* SEMÁFORO */}
                  <td className="dashboard-td dashboard-td-center">
                    <div className="semaforo-container">
                      <div 
                        className="semaforo-luz"
                        style={{
                          backgroundColor: colorSemaforo,
                          boxShadow: `0 0 10px ${colorSemaforo}`
                        }}
                      >
                        <div className="semaforo-brillo"></div>
                      </div>
                      <span 
                        className="semaforo-texto"
                        style={{ color: colorSemaforo }}
                      >
                        {estadoTexto}
                      </span>
                    </div>
                  </td>
                  <td className="dashboard-td">{item.nombre}</td>
                  <td className="dashboard-td">{item.marca}</td>
                  <td className="dashboard-td dashboard-td-center">{item.vendidos}</td>
                  <td 
                    className="dashboard-td dashboard-td-center stock-destacado"
                    style={{ color: colorSemaforo }}
                  >
                    {item.stock}
                  </td>
                  <td className="dashboard-td dashboard-td-center slots-maximos">
                    {item.slotsMaximos}
                  </td>
                  <td className="dashboard-td dashboard-td-center">
                    <div className="porcentaje-container">
                      <span 
                        className="porcentaje-texto"
                        style={{ color: colorSemaforo }}
                      >
                        {porcentajeOcupacion}%
                      </span>
                      <div className="barra-progreso">
                        <div 
                          className="barra-progreso-fill"
                          style={{
                            width: `${porcentajeOcupacion}%`,
                            backgroundColor: colorSemaforo
                          }}
                        ></div>
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

      {/* LEYENDA DEL SEMÁFORO */}
      <div className="leyenda-semaforo">
        <div className="leyenda-item">
          <div 
            className="leyenda-circulo"
            style={{
              backgroundColor: '#27ae60',
              boxShadow: '0 0 8px #27ae60'
            }}
          ></div>
          <span className="leyenda-texto">
            <strong>Verde:</strong> Stock normal (más del 50% de slots)
          </span>
        </div>
        <div className="leyenda-item">
          <div 
            className="leyenda-circulo"
            style={{
              backgroundColor: '#f39c12',
              boxShadow: '0 0 8px #f39c12'
            }}
          ></div>
          <span className="leyenda-texto">
            <strong>Amarillo:</strong> Stock bajo (21-50% de slots)
          </span>
        </div>
        <div className="leyenda-item">
          <div 
            className="leyenda-circulo"
            style={{
              backgroundColor: '#e74c3c',
              boxShadow: '0 0 8px #e74c3c'
            }}
          ></div>
          <span className="leyenda-texto">
            <strong>Rojo:</strong> Stock crítico (≤20% de slots)
          </span>
        </div>
      </div>

      {/* NOTA SOBRE DEFAULT */}
      <div className="nota-info">
        <span className="nota-info-texto">
          💡 <strong>Nota:</strong> Los productos sin slots definidos usan 100 como valor predeterminado.
        </span>
      </div>
    </div>
  )
}

export default Dashboard