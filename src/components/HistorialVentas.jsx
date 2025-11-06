import { useState, useEffect } from 'react'
import '../styles/HistorialVentas.css'
import { ref, onValue } from 'firebase/database'
import { database } from '../config/firebase'


function HistorialVentas({ user }) {
  const [historialVentas, setHistorialVentas] = useState([])
  const [ventasFiltradas, setVentasFiltradas] = useState([])
  const [filtroTiempo, setFiltroTiempo] = useState('todo') // 'dia', 'semana', 'mes', 'todo'
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [resumenProductos, setResumenProductos] = useState([])

  const CargarHistorialVentas = () => {
    const ventasRef = ref(database, `usuarios/${user.uid}/historialVentas`)
    onValue(ventasRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const ventasLista = Object.keys(data).map(key => ({ 
          id: key, 
          ...data[key] 
        }))
        // Ordenar por fecha mas  reciente primero
        ventasLista.sort((a, b) => new Date(b.fechaVenta) - new Date(a.fechaVenta))
        setHistorialVentas(ventasLista)
      } else {
        setHistorialVentas([])
      }
    })
  }

  const FiltrarVentas = () => {
    let ventas = [...historialVentas]
    const hoy = new Date()

    if (filtroTiempo === 'dia') {
      const fecha = fechaSeleccionada ? new Date(fechaSeleccionada) : hoy
      ventas = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fechaVenta)
        return fechaVenta.toDateString() === fecha.toDateString()
      })
    } else if (filtroTiempo === 'semana') {
      const inicioSemana = new Date(hoy)
      inicioSemana.setDate(hoy.getDate() - hoy.getDay())
      inicioSemana.setHours(0, 0, 0, 0)
      
      ventas = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fechaVenta)
        return fechaVenta >= inicioSemana
      })
    } else if (filtroTiempo === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      
      ventas = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fechaVenta)
        return fechaVenta >= inicioMes
      })
    }

    setVentasFiltradas(ventas)
    GenerarResumen(ventas)
  }

  const GenerarResumen = (ventas) => {
    const agrupados = {}

    ventas.forEach(venta => {
      const clave = `${venta.tipoProducto}-${venta.marcaFabricante}`
      
      if (!agrupados[clave]) {
        agrupados[clave] = {
          nombre: venta.tipoProducto,
          marca: venta.marcaFabricante,
          precio: parseFloat(venta.precio) || 0,
          cantidad: 0,
          total: 0
        }
      }
      
      agrupados[clave].cantidad += 1
      agrupados[clave].total += parseFloat(venta.precio) || 0
    })

    const resultado = Object.values(agrupados)
      .map(p => ({
        ...p,
        total: p.total.toFixed(2)
      }))
      .sort((a, b) => b.cantidad - a.cantidad) // Ordenar por cantidad vendida

    setResumenProductos(resultado)
  }

  const FormatearFecha = (fecha) => {
    const date = new Date(fecha)
    return date.toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const CalcularTotalGeneral = () => {
    return ventasFiltradas.reduce((sum, venta) => sum + (parseFloat(venta.precio) || 0), 0).toFixed(2)
  }

  useEffect(() => {
    if (user) {
      CargarHistorialVentas()
    }
  }, [user])

  useEffect(() => {
    FiltrarVentas()
  }, [historialVentas, filtroTiempo, fechaSeleccionada])

  return (
    <div className="historial-container">
      <h2 className="historial-title">Historial de Ventas</h2>

      {/* Controles de filtro */}
      <div className="historial-controles">
        <div className="filtro-tiempo">
          <label>Filtrar por:</label>
          <select 
            value={filtroTiempo} 
            onChange={(e) => setFiltroTiempo(e.target.value)}
          >
            <option value="todo">Todo el historial</option>
            <option value="dia">Día específico</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>
        </div>

        {filtroTiempo === 'dia' && (
          <div className="selector-fecha">
            <label>Seleccionar fecha:</label>
            <input 
              type="date" 
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}

        <div className="total-periodo">
          <strong>Total del período:</strong> ${CalcularTotalGeneral()}
        </div>
      </div>

      {/* Grid con dos columnas */}
      <div className="historial-grid">
        {/* Resumen de productos */}
        <div className="resumen-productos-card">
          <h3>Resumen por Producto</h3>
          <div className="resumen-lista">
            {resumenProductos.length > 0 ? (
              resumenProductos.map((producto, index) => (
                <div key={index} className="producto-resumen-item">
                  <div className="producto-info">
                    <div className="producto-nombre">{producto.nombre}</div>
                    <div className="producto-marca">{producto.marca}</div>
                  </div>
                  <div className="producto-stats">
                    <div className="stat-item">
                      <span className="stat-label">Vendidos:</span>
                      <span className="stat-valor cantidad">{producto.cantidad}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total:</span>
                      <span className="stat-valor dinero">${producto.total}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="sin-datos">No hay ventas en este período</div>
            )}
          </div>
        </div>

        {/* Tabla detallada de ventas */}
        <div className="ventas-detalle-card">
          <h3>Detalle de Ventas</h3>
          <div className="tabla-wrapper-historial">
            <table className="tabla-historial">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th>Slot</th>
                  <th className="texto-derecha">Precio</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.length > 0 ? (
                  ventasFiltradas.map((venta, index) => (
                    <tr key={index}>
                      <td className="fecha-cell">{FormatearFecha(venta.fechaVenta)}</td>
                      <td>{venta.tipoProducto}</td>
                      <td>{venta.marcaFabricante}</td>
                      <td className="texto-centro">{venta.slot}</td>
                      <td className="texto-derecha precio-cell">${parseFloat(venta.precio).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="tabla-vacia-historial">
                      No hay ventas registradas en este período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistorialVentas
