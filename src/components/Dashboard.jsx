import { useState, useEffect } from 'react'
import "../styles/Dashboard.css"
import { ref, onValue } from 'firebase/database'
import { database } from '../config/firebase'

function Dashboard({ user }) {
  const [catalogoProductos, setCatalogoProductos] = useState([])
  const [productosStock, setProductosStock] = useState([])
  const [historialVentas, setHistorialVentas] = useState([])
  const [resumen, setResumen] = useState([])

  // ---------- CARGA DE DATOS ----------
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
        ventasLista.sort((a, b) => new Date(b.fechaVenta) - new Date(a.fechaVenta))
        setHistorialVentas(ventasLista)
      } else {
        setHistorialVentas([])
      }
    })
  }

  // ---------- RESUMEN ----------
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

        agrupados[clave] = { nombre, marca, precio, stock: 0, vendidos: 0, slotsMaximos }
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

        agrupados[clave] = { nombre, marca, precio, stock: 0, vendidos: 0, slotsMaximos }
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

  // ---------- COLOR ----------
  const obtenerColorSemaforo = (stock, slotsMaximos) => {
    const p = (stock / slotsMaximos) * 100
    if (p <= 20) return '#e74c3c'
    if (p <= 50) return '#f39c12'
    return '#27ae60'
  }

  const obtenerEstadoTexto = (stock, slotsMaximos) => {
    const p = (stock / slotsMaximos) * 100
    if (p <= 20) return 'CRÍTICO'
    if (p <= 50) return 'BAJO'
    return 'NORMAL'
  }

  // ---------- EFECTOS ----------
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

  // ---------- MÉTRICAS ----------
  const totalCategorias = new Set(catalogoProductos.map(c => c.tipoProducto?.toLowerCase())).size
  const totalProductosStock = productosStock.length
  const totalVentasRealizadas = historialVentas.length

  const valorStockTotal = resumen.reduce(
    (sum, p) => sum + (parseFloat(p.dineroStock) || 0),
    0
  ).toFixed(2)

  const valorVentasTotal = historialVentas.reduce(
    (sum, v) => sum + (parseFloat(v.precio) || 0),
    0
  ).toFixed(2)

  const productosMasVendidos = [...resumen]
    .sort((a, b) => b.vendidos - a.vendidos)
    .slice(0, 5)

  const ultimasVentas = [...historialVentas].slice(0, 5)

  const formatearFecha = (fecha) => {
    const d = new Date(fecha)
    if (isNaN(d)) return '-'
    return d.toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const avatar = (user?.displayName || user?.email || '?').charAt(0).toUpperCase()

  // ---------- NUEVO: PRODUCTOS A REPONER ----------
  const productosAReponer = [...resumen]
    .map(p => {
      const porcentaje = p.slotsMaximos
        ? (p.stock / p.slotsMaximos) * 100
        : 0
      return { ...p, porcentajeOcupacion: porcentaje }
    })
    .filter(p => p.porcentajeOcupacion <= 50) // solo críticos y bajos
    .sort((a, b) => {
      const nivel = porc => (porc <= 20 ? 0 : 1)
      const na = nivel(a.porcentajeOcupacion)
      const nb = nivel(b.porcentajeOcupacion)
      if (na !== nb) return na - nb
      return a.porcentajeOcupacion - b.porcentajeOcupacion
    })

  return (
    <div className="dashboard-page">
      {/* CABECERA */}
      <div className="dashboard-top">
        <div>
          <h1 className="dashboard-main-title">Panel de control</h1>
          <p className="dashboard-subtitle">Resumen general de tu almacén e inventario.</p>
        </div>

        <div className="dashboard-user-chip">
          <div className="dashboard-avatar">{avatar}</div>
          <div className="dashboard-user-info">
            <span className="dashboard-user-name">
              {user?.displayName || 'Usuario'}
            </span>
            <span className="dashboard-user-email">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* TARJETAS */}
      <div className="dashboard-cards-grid">
        <div className="dashboard-card card-green">
          <div className="card-icon">📂</div>
          <div className="card-label">Categorías</div>
          <div className="card-value">{totalCategorias}</div>
          <div className="card-caption">Tipos de productos</div>
        </div>

        <div className="dashboard-card card-blue">
          <div className="card-icon">📦</div>
          <div className="card-label">Productos en stock</div>
          <div className="card-value">{totalProductosStock}</div>
        </div>

        <div className="dashboard-card card-yellow">
          <div className="card-icon">💰</div>
          <div className="card-label">Valor del stock</div>
          <div className="card-value">${valorStockTotal}</div>
        </div>

        <div className="dashboard-card card-orange">
          <div className="card-icon">🧾</div>
          <div className="card-label">Ventas registradas</div>
          <div className="card-value">{totalVentasRealizadas}</div>
          <div className="card-caption">Ingresos: ${valorVentasTotal}</div>
        </div>
      </div>

      {/* BLOQUE CENTRAL */}
      <div className="dashboard-middle-grid">

        {/* Más vendidos */}
        <section className="dashboard-box">
          <h2 className="dashboard-box-title">Productos más vendidos</h2>
          {productosMasVendidos.length === 0 ? (
            <p className="dashboard-empty">Aún no hay ventas registradas.</p>
          ) : (
            <table className="dashboard-mini-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th>Vendidos</th>
                  <th>Total $</th>
                </tr>
              </thead>
              <tbody>
                {productosMasVendidos.map((p, i) => (
                  <tr key={i}>
                    <td>{p.nombre}</td>
                    <td>{p.marca}</td>
                    <td>{p.vendidos}</td>
                    <td>${p.dineroGanado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Últimas ventas */}
        <section className="dashboard-box">
          <h2 className="dashboard-box-title">Últimas ventas</h2>
          {ultimasVentas.length === 0 ? (
            <p className="dashboard-empty">No hay ventas recientes.</p>
          ) : (
            <table className="dashboard-mini-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th className="text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {ultimasVentas.map(v => (
                  <tr key={v.id}>
                    <td>{formatearFecha(v.fechaVenta)}</td>
                    <td>{v.tipoProducto}</td>
                    <td>{v.marcaFabricante}</td>
                    <td className="text-right">
                      ${parseFloat(v.precio || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* NUEVO — Productos a reponer */}
        <section className="dashboard-box">
          <h2 className="dashboard-box-title">Productos a reponer</h2>

          {productosAReponer.length === 0 ? (
            <p className="dashboard-empty">No hay productos con stock bajo o crítico.</p>
          ) : (
            <table className="dashboard-mini-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th>% Ocupación</th>
                </tr>
              </thead>

              <tbody>
                {productosAReponer.map((p, i) => {
                  const color = obtenerColorSemaforo(p.stock, p.slotsMaximos)
                  const estado = obtenerEstadoTexto(p.stock, p.slotsMaximos)

                  return (
                    <tr key={i}>
                      <td>
                        <div className="semaforo-container">
                          <div
                            className="semaforo-luz"
                            style={{
                              backgroundColor: color,
                              boxShadow: `0 0 10px ${color}`
                            }}
                          >
                            <div className="semaforo-brillo"></div>
                          </div>

                          <span className="semaforo-texto" style={{ color }}>
                            {estado}
                          </span>
                        </div>
                      </td>

                      <td>{p.nombre}</td>
                      <td>{p.marca}</td>
                      <td>{p.porcentajeOcupacion.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* DETALLE POR PRODUCTO (se mantiene igual) */}
      {/* ----------------------------------------- */}
      <div className="dashboard-detalle">
        <h2 className="dashboard-title">Detalle por producto</h2>

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
                const color = obtenerColorSemaforo(item.stock, item.slotsMaximos)
                const estado = obtenerEstadoTexto(item.stock, item.slotsMaximos)
                const p = ((item.stock / item.slotsMaximos) * 100).toFixed(1)

                return (
                  <tr
                    key={index}
                    className={`dashboard-table-row ${
                      index % 2 === 0 ? 'dashboard-row-even' : 'dashboard-row-odd'
                    }`}
                  >
                    <td className="dashboard-td dashboard-td-center">
                      <div className="semaforo-container">
                        <div
                          className="semaforo-luz"
                          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                        >
                          <div className="semaforo-brillo"></div>
                        </div>
                        <span className="semaforo-texto" style={{ color }}>
                          {estado}
                        </span>
                      </div>
                    </td>

                    <td className="dashboard-td">{item.nombre}</td>
                    <td className="dashboard-td">{item.marca}</td>
                    <td className="dashboard-td dashboard-td-center">{item.vendidos}</td>

                    <td className="dashboard-td dashboard-td-center" style={{ color }}>
                      {item.stock}
                    </td>

                    <td className="dashboard-td dashboard-td-center">{item.slotsMaximos}</td>

                    <td className="dashboard-td dashboard-td-center">{p}%</td>

                    <td className="dashboard-td dashboard-td-right">${item.dineroStock}</td>
                    <td className="dashboard-td dashboard-td-right">${item.dineroGanado}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="9" className="dashboard-loading">Cargando datos...</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="leyenda-semaforo">
          <div className="leyenda-item">
            <div className="leyenda-circulo" style={{ backgroundColor: '#27ae60' }}></div>
            <span className="leyenda-texto"><strong>Verde:</strong> Stock normal (+50%)</span>
          </div>

          <div className="leyenda-item">
            <div className="leyenda-circulo" style={{ backgroundColor: '#f39c12' }}></div>
            <span className="leyenda-texto"><strong>Amarillo:</strong> Stock bajo (21–50%)</span>
          </div>

          <div className="leyenda-item">
            <div className="leyenda-circulo" style={{ backgroundColor: '#e74c3c' }}></div>
            <span className="leyenda-texto"><strong>Rojo:</strong> Crítico (≤20%)</span>
          </div>
        </div>

        <div className="nota-info">
          💡 <strong>Nota:</strong> Si no tiene slots, se usa 100 predeterminado.
        </div>
      </div>
    </div>
  )
}

export default Dashboard
