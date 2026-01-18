import { useState, useEffect } from 'react'
import '../styles/HistorialVentas.css'
import { ref, onValue } from 'firebase/database'
import { database } from '../config/firebase'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function KPI({ icon, label, value }) {
  return (
    <div className="kpi-card">
      <span>{icon} {label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function HistorialVentas({ user }) {
  const [historialVentas, setHistorialVentas] = useState([])
  const [ventasFiltradas, setVentasFiltradas] = useState([])
  const [filtroTiempo, setFiltroTiempo] = useState('todo')
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [resumenProductos, setResumenProductos] = useState([])

  /* ===== CARGA ===== */
  useEffect(() => {
    if (!user) return
    const ventasRef = ref(database, `usuarios/${user.uid}/historialVentas`)
    onValue(ventasRef, snap => {
      const data = snap.val()
      if (!data) {
        setHistorialVentas([])
        return
      }
      const lista = Object.keys(data).map(id => ({ id, ...data[id] }))
      lista.sort((a, b) => new Date(b.fechaVenta) - new Date(a.fechaVenta))
      setHistorialVentas(lista)
    })
  }, [user])

  /* ===== FILTROS ===== */
  useEffect(() => {
    let ventas = [...historialVentas]
    const hoy = new Date()

    if (filtroTiempo === 'dia') {
      const f = fechaSeleccionada ? new Date(fechaSeleccionada) : hoy
      ventas = ventas.filter(v =>
        new Date(v.fechaVenta).toDateString() === f.toDateString()
      )
    }

    if (filtroTiempo === 'semana') {
      const inicio = new Date(hoy)
      inicio.setDate(hoy.getDate() - hoy.getDay())
      inicio.setHours(0, 0, 0, 0)
      ventas = ventas.filter(v => new Date(v.fechaVenta) >= inicio)
    }

    if (filtroTiempo === 'mes') {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      ventas = ventas.filter(v => new Date(v.fechaVenta) >= inicio)
    }

    setVentasFiltradas(ventas)
    generarResumen(ventas)
  }, [historialVentas, filtroTiempo, fechaSeleccionada])

  /* ===== RESUMEN ===== */
  const generarResumen = ventas => {
    const map = {}
    ventas.forEach(v => {
      const key = `${v.tipoProducto}-${v.marcaFabricante}`
      if (!map[key]) {
        map[key] = {
          nombre: v.tipoProducto,
          marca: v.marcaFabricante,
          cantidad: 0,
          total: 0
        }
      }
      map[key].cantidad++
      map[key].total += Number(v.precio) || 0
    })
    setResumenProductos(Object.values(map).sort((a, b) => b.cantidad - a.cantidad))
  }

  /* ===== KPIs ===== */
  const totalIngresos = ventasFiltradas.reduce(
    (s, v) => s + (Number(v.precio) || 0), 0
  )
  const totalVentas = ventasFiltradas.length
  const ticketPromedio = totalVentas
    ? (totalIngresos / totalVentas).toFixed(2)
    : '0.00'

  /* ===== GRAFICAS ===== */
  const graficaProductos = resumenProductos.map(p => ({
    nombre: `${p.nombre} (${p.marca})`,
    vendidos: p.cantidad
  }))

  const graficaTendencia = Object.values(
    ventasFiltradas.reduce((acc, v) => {
      const d = new Date(v.fechaVenta).toLocaleDateString('es-EC')
      acc[d] = (acc[d] || 0) + Number(v.precio)
      return acc
    }, {})
  ).map((total, i) => ({ dia: i + 1, total }))

  const top = resumenProductos[0]
  const peor = resumenProductos[resumenProductos.length - 1]

  return (
    <div className="historial-container">

      <h2 className="historial-title">📊 Historial de Ventas</h2>

      <section className="kpis-grid">
        <KPI icon="💰" label="Ingresos" value={`$${totalIngresos.toFixed(2)}`} />
        <KPI icon="🛒" label="Ventas" value={totalVentas} />
        <KPI icon="📦" label="Productos" value={resumenProductos.length} />
        <KPI icon="📈" label="Ticket promedio" value={`$${ticketPromedio}`} />
      </section>

      <section className="historial-controles">
        <select value={filtroTiempo} onChange={e => setFiltroTiempo(e.target.value)}>
          <option value="todo">Todo</option>
          <option value="dia">Día</option>
          <option value="semana">Semana</option>
          <option value="mes">Mes</option>
        </select>

        {filtroTiempo === 'dia' && (
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={e => setFechaSeleccionada(e.target.value)}
          />
        )}
      </section>

      {top && (
        <section className="insights-box">
          🔥 Más vendido: <strong>{top.nombre}</strong> ({top.cantidad}) &nbsp;|&nbsp;
          ⚠️ Menos vendido: <strong>{peor.nombre}</strong> ({peor.cantidad})
        </section>
      )}

      <section className="graficas-grid">
        <div className="grafica-card">
          <h4>Tendencia de ingresos</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={graficaTendencia}>
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Line dataKey="total" stroke="#ff6b35" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grafica-card">
          <h4>Productos vendidos</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={graficaProductos}>
              <XAxis dataKey="nombre" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="vendidos" fill="#ff6b35" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="tabla-card">
        <table className="tabla-historial">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Marca</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.length === 0 && (
              <tr>
                <td colSpan="4" className="tabla-vacia">
                  No hay ventas en este período
                </td>
              </tr>
            )}
            {ventasFiltradas.map((v, i) => (
              <tr key={i}>
                <td>{new Date(v.fechaVenta).toLocaleString('es-EC')}</td>
                <td>{v.tipoProducto}</td>
                <td>{v.marcaFabricante}</td>
                <td>${Number(v.precio).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  )
}

export default HistorialVentas
