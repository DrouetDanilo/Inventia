// src/components/Tabla.jsx
import { useState, useEffect } from 'react'
import { database } from '../config/firebase'
import { ref, push, set, onValue, remove } from 'firebase/database'
import '../styles/Tabla.css'
import AsistenteVoz from './AsistenteVoz'

function Tabla({ user }) {
  const [productos, setProductos] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState('Todos')
  const [catalogoProductos, setCatalogoProductos] = useState([])
  const [mostrarFormCatalogo, setMostrarFormCatalogo] = useState(false)
  const [mostrarFormAgregar, setMostrarFormAgregar] = useState(false)
  const [nuevoCatalogoProducto, setNuevoCatalogoProducto] = useState({
    tipoProducto: '',
    marcaFabricante: '',
    precio: '',
    slotsMaximos: ''
  })
  const [productoAgregar, setProductoAgregar] = useState({
    plantillaId: '',
    fechaCaducidad: '',
    cantidad: 1
  })
  const [cantidadVender, setCantidadVender] = useState({})
  const [cantidadEliminar, setCantidadEliminar] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [planUsuario, setPlanUsuario] = useState({ tipo: 'gratuito', limiteProductos: 100 })

  useEffect(() => {
    if (user?.uid) {
      cargarCatalogoProductos()
      cargarProductos()
      cargarPlanUsuario()
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    let filtrados = productoSeleccionado === 'Todos' 
      ? productos 
      : productos.filter(p => p.tipoProducto === productoSeleccionado)
    
    const agrupados = {}
    filtrados.forEach(producto => {
      const clave = `${producto.tipoProducto}-${producto.marcaFabricante}-${producto.precio}-${producto.fechaCaducidad}`
      
      if (!agrupados[clave]) {
        agrupados[clave] = {
          ...producto,
          cantidad: 1,
          ids: [producto.id]
        }
      } else {
        agrupados[clave].cantidad += 1
        agrupados[clave].ids.push(producto.id)
      }
    })
    
    setProductosFiltrados(Object.values(agrupados))
  }, [productoSeleccionado, productos])

  const cargarPlanUsuario = () => {
    const planRef = ref(database, `usuarios/${user.uid}/plan`)
    onValue(planRef, (snapshot) => {
      const data = snapshot.val()
      setPlanUsuario({
        tipo: data?.tipo || 'gratuito',
        limiteProductos: data?.limiteProductos || 100
      })
    })
  }

  const cargarCatalogoProductos = () => {
    const catalogoRef = ref(database, `usuarios/${user.uid}/catalogoProductos`)
    onValue(catalogoRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const items = Object.keys(data).map(key => ({ id: key, ...data[key] }))
        setCatalogoProductos(items)
      } else {
        setCatalogoProductos([])
      }
      setLoading(false)
    }, (error) => {
      setError('Error al cargar catálogo: ' + error.message)
      setLoading(false)
    })
  }

  const cargarProductos = () => {
    const productosRef = ref(database, `usuarios/${user.uid}/productos`)
    onValue(productosRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const prods = Object.keys(data).map(key => ({ id: key, ...data[key] }))
        setProductos(prods)
      } else {
        setProductos([])
      }
    }, (error) => {
      setError('Error al cargar productos: ' + error.message)
    })
  }

  const registrarCatalogoProducto = async (e) => {
    e.preventDefault()
    if (!nuevoCatalogoProducto.tipoProducto.trim() || !nuevoCatalogoProducto.marcaFabricante.trim() || !nuevoCatalogoProducto.precio || !nuevoCatalogoProducto.slotsMaximos) {
      alert('Completa todos los campos del catálogo')
      return
    }

    // VALIDACIÓN DE LÍMITE DE TIPOS DE PRODUCTOS (PLANTILLAS)
    const totalTiposProductos = catalogoProductos.length
    const limiteGlobal = planUsuario.limiteProductos

    if (limiteGlobal !== -1 && totalTiposProductos >= limiteGlobal) {
      alert(`❌ Límite de tipos de productos alcanzado!\n\nPlan ${planUsuario.tipo === 'premium' ? 'Premium' : 'Gratuito'}: ${limiteGlobal === -1 ? 'Ilimitado' : limiteGlobal} tipos de productos\nActual: ${totalTiposProductos}\n\n${planUsuario.tipo === 'gratuito' ? '💡 Mejora a Premium para tipos de productos ilimitados' : ''}`)
      return
    }

    try {
      const catalogoRef = ref(database, `usuarios/${user.uid}/catalogoProductos`)
      const nuevoRef = push(catalogoRef)
      await set(nuevoRef, {
        ...nuevoCatalogoProducto,
        fechaCreacion: new Date().toISOString()
      })
      setNuevoCatalogoProducto({ tipoProducto: '', marcaFabricante: '', precio: '', slotsMaximos: '' })
      setMostrarFormCatalogo(false)
      alert('✅ Nuevo tipo de producto creado')
    } catch (err) {
      alert('Error al crear producto: ' + err.message)
    }
  }

  const agregarProductoATabla = async (e) => {
    e.preventDefault()
    const { plantillaId, fechaCaducidad, cantidad } = productoAgregar
    
    if (!plantillaId || !fechaCaducidad || !cantidad || cantidad < 1) {
      alert('Selecciona un producto, completa fecha de caducidad y cantidad válida')
      return
    }

    try {
      const plantilla = catalogoProductos.find(p => p.id === plantillaId)
      if (!plantilla) {
        alert('Producto no encontrado')
        return
      }

      const productosDelTipo = productos.filter(p => p.tipoProducto === plantilla.tipoProducto)
      const cantidadActual = productosDelTipo.length
      const cantidadSolicitada = parseInt(cantidad)
      const slotsMaximos = parseInt(plantilla.slotsMaximos)

      if (cantidadActual + cantidadSolicitada > slotsMaximos) {
        alert(`❌ No se puede agregar. Límite: ${slotsMaximos} unidades de este producto.\nActual: ${cantidadActual}\nIntentando agregar: ${cantidadSolicitada}\nDisponibles: ${slotsMaximos - cantidadActual}`)
        return
      }

      const productosRef = ref(database, `usuarios/${user.uid}/productos`)

      const promesas = []
      for (let i = 0; i < cantidadSolicitada; i++) {
        const nuevoProductoRef = push(productosRef)
        promesas.push(
          set(nuevoProductoRef, {
            tipoProducto: plantilla.tipoProducto,
            marcaFabricante: plantilla.marcaFabricante,
            precio: plantilla.precio,
            fechaCaducidad,
            fechaRegistro: new Date().toISOString(),
            estado: 'disponible'
          })
        )
      }

      await Promise.all(promesas)

      setProductoAgregar({ plantillaId: '', fechaCaducidad: '', cantidad: 1 })
      setMostrarFormAgregar(false)
      alert(`✅ ${cantidadSolicitada} unidad(es) agregada(s) al inventario`)
    } catch (err) {
      alert('Error al agregar productos: ' + err.message)
    }
  }

  const venderProducto = async (productoAgrupado, cantidadAVender = null) => {
    const nombreProducto = productoAgrupado.tipoProducto
    const cantidadTotal = productoAgrupado.cantidad || 1
    const clave = `${productoAgrupado.tipoProducto}-${productoAgrupado.marcaFabricante}-${productoAgrupado.precio}-${productoAgrupado.fechaCaducidad}`
    
    const cantidad = cantidadAVender || cantidadVender[clave] || 1
    
    if (cantidad > cantidadTotal) {
      alert(`Solo hay ${cantidadTotal} unidad(es) disponible(s)`)
      return false
    }
    
    if (!window.confirm(`¿Deseas vender ${cantidad} unidad(es) de ${nombreProducto}?`)) return false
    
    try {
      const historialRef = ref(database, `usuarios/${user.uid}/historialVentas`)
      
      for (let i = 0; i < cantidad; i++) {
        const id = productoAgrupado.ids[i]
        const productoOriginal = productos.find(p => p.id === id)
        if (productoOriginal) {
          const nuevaVentaRef = push(historialRef)
          await set(nuevaVentaRef, { ...productoOriginal, fechaVenta: new Date().toISOString() })
          const productoRef = ref(database, `usuarios/${user.uid}/productos/${id}`)
          await remove(productoRef)
        }
      }
      
      setCantidadVender(prev => ({ ...prev, [clave]: 1 }))
      alert(`${cantidad} producto(s) vendido(s)`)
      return true
    } catch (err) {
      alert('Error al vender: ' + err.message)
      return false
    }
  }

  const eliminarProducto = async (productoAgrupado, cantidadAEliminar = null) => {
    const nombreProducto = productoAgrupado.tipoProducto
    const cantidadTotal = productoAgrupado.cantidad || 1
    const clave = `${productoAgrupado.tipoProducto}-${productoAgrupado.marcaFabricante}-${productoAgrupado.precio}-${productoAgrupado.fechaCaducidad}`
    
    const cantidad = cantidadAEliminar || cantidadEliminar[clave] || 1
    
    if (cantidad > cantidadTotal) {
      alert(`Solo hay ${cantidadTotal} unidad(es) disponible(s)`)
      return false
    }
    
    if (!window.confirm(`¿Eliminar ${cantidad} unidad(es) de "${nombreProducto}" de la tabla?`)) return false
    
    try {
      for (let i = 0; i < cantidad; i++) {
        const id = productoAgrupado.ids[i]
        const productoRef = ref(database, `usuarios/${user.uid}/productos/${id}`)
        await remove(productoRef)
      }
      
      setCantidadEliminar(prev => ({ ...prev, [clave]: 1 }))
      alert(`${cantidad} producto(s) eliminado(s)`)
      return true
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
      return false
    }
  }

  if (loading) return (
    <div className="tabla-container">
      <h2>Cargando...</h2>
    </div>
  )
  if (error) return (
    <div className="tabla-container">
      <h2 style={{ color: 'red' }}>{error}</h2>
    </div>
  )
  if (!user) return (
    <div className="tabla-container">
      <h2>Por favor inicia sesión</h2>
    </div>
  )

  const totalTiposProductos = catalogoProductos.length
  const limiteGlobal = planUsuario.limiteProductos
  const porcentajeUso = limiteGlobal !== -1 ? (totalTiposProductos / limiteGlobal) * 100 : 0

  return (
    <div className="tabla-container">
      <h2>Gestión de Productos</h2>

      {/* INDICADOR DE LÍMITE DEL PLAN - AHORA PARA TIPOS DE PRODUCTOS */}
      <div className="limite-plan-info">
        <div className="limite-texto">
          <span className="limite-label">Tipos de productos creados:</span>
          <span className="limite-valor">
            {totalTiposProductos} {limiteGlobal !== -1 ? `/ ${limiteGlobal}` : '(ilimitado)'}
          </span>
        </div>
        
        {limiteGlobal !== -1 && (
          <div className="limite-barra-container">
            <div 
              className="limite-barra-progreso" 
              style={{ 
                width: `${porcentajeUso}%`,
                background: porcentajeUso > 90 ? '#EF4444' : porcentajeUso > 70 ? '#F59E0B' : '#10B981'
              }}
            />
          </div>
        )}
        
        {planUsuario.tipo === 'gratuito' && totalTiposProductos >= limiteGlobal * 0.8 && (
          <p className="limite-advertencia">
            ⚠️ Te estás acercando al límite de tipos de productos. Considera mejorar a Premium para tipos ilimitados.
          </p>
        )}
      </div>

      <div className="controles-superiores">
        <div className="selector-producto">
          <label>Filtrar por tipo:</label>
          <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)}>
            <option value="Todos">Todos los productos</option>
            {catalogoProductos.map(tipo => (
              <option key={tipo.id} value={tipo.tipoProducto}>{tipo.tipoProducto}</option>
            ))}
          </select>
        </div>

        <div className="botones-accion">
          <button 
            className="btn-registrar-tipo"
            onClick={() => setMostrarFormCatalogo(!mostrarFormCatalogo)}
          >
            {mostrarFormCatalogo ? 'Cancelar' : '+ Crear Producto'}
          </button>
          <button 
            className="btn-agregar-producto"
            onClick={() => setMostrarFormAgregar(!mostrarFormAgregar)}
          >
            {mostrarFormAgregar ? 'Cancelar' : '+ Agregar Producto'}
          </button>
        </div>
      </div>

      {mostrarFormCatalogo && (
        <div className="formulario-modal">
          <form onSubmit={registrarCatalogoProducto}>
            <h3>Crear Nuevo Tipo de Producto</h3>
            <input
              type="text"
              placeholder="Nombre del producto"
              value={nuevoCatalogoProducto.tipoProducto}
              onChange={(e) => setNuevoCatalogoProducto({ ...nuevoCatalogoProducto, tipoProducto: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Marca del fabricante"
              value={nuevoCatalogoProducto.marcaFabricante}
              onChange={(e) => setNuevoCatalogoProducto({ ...nuevoCatalogoProducto, marcaFabricante: e.target.value })}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Precio"
              value={nuevoCatalogoProducto.precio}
              onChange={(e) => setNuevoCatalogoProducto({ ...nuevoCatalogoProducto, precio: e.target.value })}
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Cantidad máxima de unidades de este producto"
              value={nuevoCatalogoProducto.slotsMaximos}
              onChange={(e) => setNuevoCatalogoProducto({ ...nuevoCatalogoProducto, slotsMaximos: e.target.value })}
              required
            />
            <button type="submit" className="btn-guardar">Crear producto</button>
          </form>
        </div>
      )}

      {mostrarFormAgregar && (
        <div className="formulario-modal">
          <form onSubmit={agregarProductoATabla}>
            <h3>Agregar Unidades al Inventario</h3>
            <select
              value={productoAgregar.plantillaId}
              onChange={(e) => setProductoAgregar({ ...productoAgregar, plantillaId: e.target.value })}
              required
            >
              <option value="">Seleccionar producto</option>
              {catalogoProductos.map(p => {
                const productosDelTipo = productos.filter(prod => prod.tipoProducto === p.tipoProducto)
                const slotsDisponibles = parseInt(p.slotsMaximos) - productosDelTipo.length
                return (
                  <option key={p.id} value={p.id} disabled={slotsDisponibles <= 0}>
                    {p.tipoProducto} — {p.marcaFabricante} — ${parseFloat(p.precio).toFixed(2)} — {slotsDisponibles}/{p.slotsMaximos} disponibles
                  </option>
                )
              })}
            </select>
            <input
              type="date"
              value={productoAgregar.fechaCaducidad}
              onChange={(e) => setProductoAgregar({ ...productoAgregar, fechaCaducidad: e.target.value })}
              required
            />
            
            <div className="cantidad-container">
              <label className="cantidad-label">
                🔢 Cantidad de unidades a agregar:
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={productoAgregar.cantidad}
                onChange={(e) => setProductoAgregar({ ...productoAgregar, cantidad: e.target.value })}
                required
                className="cantidad-input"
              />
              <p className="cantidad-mensaje">
                {productoAgregar.cantidad > 1 
                  ? `✓ Se agregarán ${productoAgregar.cantidad} unidades idénticas` 
                  : 'Se agregará 1 unidad'}
              </p>
            </div>

            <button type="submit" className="btn-guardar">Agregar al inventario</button>
          </form>
        </div>
      )}

      <AsistenteVoz
        onAgregar={async (nombre, fecha) => {
          const plantilla = catalogoProductos.find(
            p => p.tipoProducto.toLowerCase() === nombre.toLowerCase()
          )
          if (!plantilla) return false

          const productosDelTipo = productos.filter(p => p.tipoProducto === plantilla.tipoProducto)
          if (productosDelTipo.length >= parseInt(plantilla.slotsMaximos)) return false

          try {
            const productosRef = ref(database, `usuarios/${user.uid}/productos`)
            const nuevoRef = push(productosRef)
            await set(nuevoRef, {
              tipoProducto: plantilla.tipoProducto,
              marcaFabricante: plantilla.marcaFabricante,
              precio: plantilla.precio,
              fechaCaducidad: fecha,
              fechaRegistro: new Date().toISOString(),
              estado: 'disponible'
            })
            return true
          } catch {
            return false
          }
        }}

        onVender={async (nombre) => {
          const productosCoincidentes = productos.filter(
            p => p.tipoProducto.toLowerCase() === nombre.toLowerCase()
          )
          if (productosCoincidentes.length === 0) return false
          
          const producto = productosCoincidentes[0]
          return await venderProducto({ ...producto, cantidad: 1, ids: [producto.id] }, 1)
        }}

        onEliminar={async (nombre) => {
          const productosCoincidentes = productos.filter(
            p => p.tipoProducto.toLowerCase() === nombre.toLowerCase()
          )
          if (productosCoincidentes.length === 0) return false
          
          const producto = productosCoincidentes[0]
          return await eliminarProducto({ ...producto, cantidad: 1, ids: [producto.id] }, 1)
        }}
      />

      <div className="tabla-wrapper">
        {productosFiltrados.length === 0 ? (
          <div className="tabla-vacia">
            <p>No hay productos registrados.</p>
          </div>
        ) : (
          <table className="tabla-productos">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Precio</th>
                <th>Fecha Caducidad</th>
                <th>Cantidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((producto, index) => {
                const clave = `${producto.tipoProducto}-${producto.marcaFabricante}-${producto.precio}-${producto.fechaCaducidad}`
                const cantVender = cantidadVender[clave] || 1
                const cantEliminar = cantidadEliminar[clave] || 1
                
                return (
                  <tr key={index}>
                    <td>{producto.tipoProducto}</td>
                    <td>{producto.marcaFabricante}</td>
                    <td>${parseFloat(producto.precio).toFixed(2)}</td>
                    <td>{producto.fechaCaducidad ? new Date(producto.fechaCaducidad).toLocaleDateString('es-ES') : '-'}</td>
                    <td>
                      <span className="cantidad-badge">
                        {producto.cantidad}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-container">
                        <div className="accion-row">
                          <input
                            type="number"
                            min="1"
                            max={producto.cantidad}
                            value={cantVender}
                            onChange={(e) => {
                              const valor = Math.min(Math.max(1, parseInt(e.target.value) || 1), producto.cantidad)
                              setCantidadVender(prev => ({ ...prev, [clave]: valor }))
                            }}
                            className="input-cantidad-vender"
                          />
                          <button 
                            className="btn-vender" 
                            onClick={() => venderProducto(producto)}
                          >
                            Vender
                          </button>
                        </div>
                        
                        <div className="accion-row">
                          <input
                            type="number"
                            min="1"
                            max={producto.cantidad}
                            value={cantEliminar}
                            onChange={(e) => {
                              const valor = Math.min(Math.max(1, parseInt(e.target.value) || 1), producto.cantidad)
                              setCantidadEliminar(prev => ({ ...prev, [clave]: valor }))
                            }}
                            className="input-cantidad-eliminar"
                          />
                          <button
                            className="btn-eliminar"
                            onClick={() => eliminarProducto(producto)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Tabla