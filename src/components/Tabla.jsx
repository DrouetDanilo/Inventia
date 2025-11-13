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
    slotsMaximos: '' // 🔥 NUEVO: cantidad máxima de productos de este tipo
  })
  const [productoAgregar, setProductoAgregar] = useState({
    plantillaId: '',
    fechaCaducidad: '',
    cantidad: 1
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.uid) {
      cargarCatalogoProductos()
      cargarProductos()
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (productoSeleccionado === 'Todos') {
      setProductosFiltrados(productos)
    } else {
      const filtrados = productos.filter(p => p.tipoProducto === productoSeleccionado)
      setProductosFiltrados(filtrados)
    }
  }, [productoSeleccionado, productos])

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
    try {
      const catalogoRef = ref(database, `usuarios/${user.uid}/catalogoProductos`)
      const nuevoRef = push(catalogoRef)
      await set(nuevoRef, {
        ...nuevoCatalogoProducto,
        fechaCreacion: new Date().toISOString()
      })
      setNuevoCatalogoProducto({ tipoProducto: '', marcaFabricante: '', precio: '', slotsMaximos: '' })
      setMostrarFormCatalogo(false)
      alert('Plantilla de producto creada')
    } catch (err) {
      alert('Error al crear plantilla: ' + err.message)
    }
  }

  // 🔥 FUNCIÓN MODIFICADA: Ahora agrega múltiples productos y valida slots máximos
  const agregarProductoATabla = async (e) => {
    e.preventDefault()
    const { plantillaId, fechaCaducidad, cantidad } = productoAgregar
    
    if (!plantillaId || !fechaCaducidad || !cantidad || cantidad < 1) {
      alert('Selecciona una plantilla, completa fecha de caducidad y cantidad válida')
      return
    }

    try {
      const plantilla = catalogoProductos.find(p => p.id === plantillaId)
      if (!plantilla) {
        alert('Plantilla no encontrada')
        return
      }

      // 🔥 VALIDAR SLOTS DISPONIBLES
      const productosDelTipo = productos.filter(p => p.tipoProducto === plantilla.tipoProducto)
      const cantidadActual = productosDelTipo.length
      const cantidadSolicitada = parseInt(cantidad)
      const slotsMaximos = parseInt(plantilla.slotsMaximos)

      if (cantidadActual + cantidadSolicitada > slotsMaximos) {
        alert(`❌ No se puede agregar. Límite: ${slotsMaximos} productos.\nActual: ${cantidadActual}\nIntentando agregar: ${cantidadSolicitada}\nDisponibles: ${slotsMaximos - cantidadActual}`)
        return
      }

      const productosRef = ref(database, `usuarios/${user.uid}/productos`)

      // 🔥 Agregar múltiples productos idénticos
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
      alert(`✅ ${cantidadSolicitada} producto(s) agregado(s).\nTotal ahora: ${cantidadActual + cantidadSolicitada}/${slotsMaximos}`)
    } catch (err) {
      alert('Error al agregar productos: ' + err.message)
    }
  }

  // 🔧 Modificado para aceptar parámetro desdeVoz
  const venderProducto = async (producto, desdeVoz = false) => {
    if (!desdeVoz && !window.confirm(`¿Deseas vender ${producto.tipoProducto}?`)) return false
    try {
      const historialRef = ref(database, `usuarios/${user.uid}/historialVentas`)
      const nuevaVentaRef = push(historialRef)
      await set(nuevaVentaRef, { ...producto, fechaVenta: new Date().toISOString() })
      const productoRef = ref(database, `usuarios/${user.uid}/productos/${producto.id}`)
      await remove(productoRef)
      if (!desdeVoz) alert('Producto vendido')
      return true
    } catch (err) {
      if (!desdeVoz) alert('Error al vender: ' + err.message)
      return false
    }
  }

  // 🔧 Modificado para aceptar parámetro desdeVoz
  const eliminarProducto = async (id, nombre, desdeVoz = false) => {
    if (!desdeVoz && !window.confirm(`Eliminar "${nombre}" de la tabla?`)) return false
    try {
      const productoRef = ref(database, `usuarios/${user.uid}/productos/${id}`)
      await remove(productoRef)
      if (!desdeVoz) alert('Producto eliminado')
      return true
    } catch (err) {
      if (!desdeVoz) alert('Error al eliminar: ' + err.message)
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

  return (
    <div className="tabla-container">
      <h2>Gestión de Productos</h2>

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
            {mostrarFormCatalogo ? 'Cancelar' : '+ Crear Plantilla'}
          </button>
          <button 
            className="btn-agregar-producto"
            onClick={() => setMostrarFormAgregar(!mostrarFormAgregar)}
          >
            {mostrarFormAgregar ? 'Cancelar' : '+ Agregar a Tabla'}
          </button>
        </div>
      </div>

      {mostrarFormCatalogo && (
        <div className="formulario-modal">
          <form onSubmit={registrarCatalogoProducto}>
            <h3>Crear Plantilla de Producto</h3>
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
              placeholder="Slots máximos (cantidad máxima de productos)"
              value={nuevoCatalogoProducto.slotsMaximos}
              onChange={(e) => setNuevoCatalogoProducto({ ...nuevoCatalogoProducto, slotsMaximos: e.target.value })}
              required
            />
            <button type="submit" className="btn-guardar">Guardar plantilla</button>
          </form>
        </div>
      )}

      {mostrarFormAgregar && (
        <div className="formulario-modal">
          <form onSubmit={agregarProductoATabla}>
            <h3>Agregar Producto(s) a la Tabla</h3>
            <select
              value={productoAgregar.plantillaId}
              onChange={(e) => setProductoAgregar({ ...productoAgregar, plantillaId: e.target.value })}
              required
            >
              <option value="">Seleccionar plantilla</option>
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
            
            {/* 🔥 CAMPO DE CANTIDAD CON VALIDACIÓN DE SLOTS */}
            <div style={{ 
              backgroundColor: 'rgba(247, 184, 1, 0.15)', 
              padding: '1.5rem', 
              borderRadius: '8px',
              border: '2px solid #F7B801',
              marginTop: '1rem'
            }}>
              <label style={{ 
                display: 'block', 
                fontWeight: 'bold', 
                color: '#F7B801',
                marginBottom: '0.75rem',
                fontSize: '1rem'
              }}>
                🔢 Cantidad de productos a agregar:
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={productoAgregar.cantidad}
                onChange={(e) => setProductoAgregar({ ...productoAgregar, cantidad: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textAlign: 'center',
                  border: '2px solid #F7B801',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ 
                margin: '0.75rem 0 0 0', 
                fontSize: '0.9rem', 
                color: '#F7B801',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                {productoAgregar.cantidad > 1 
                  ? `✓ Se agregarán ${productoAgregar.cantidad} productos idénticos` 
                  : 'Se agregará 1 producto'}
              </p>
            </div>

            <button type="submit" className="btn-guardar">Agregar a tabla</button>
          </form>
        </div>
      )}

      <AsistenteVoz
        onAgregar={async (nombre, fecha) => {
          const plantilla = catalogoProductos.find(
            p => p.tipoProducto.toLowerCase() === nombre.toLowerCase()
          )
          if (!plantilla) return false

          // Validar slots disponibles
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
          const producto = productos.find(
            p => p.tipoProducto.toLowerCase() === nombre.toLowerCase()
          )
          if (!producto) return false
          return await venderProducto(producto, true)
        }}

        onEliminar={async (nombre) => {
          const producto = productos.find(
            p => p.tipoProducto.toLowerCase() === nombre.toLowerCase()
          )
          if (!producto) return false
          return await eliminarProducto(producto.id, producto.tipoProducto, true)
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map(producto => (
                <tr key={producto.id}>
                  <td>{producto.tipoProducto}</td>
                  <td>{producto.marcaFabricante}</td>
                  <td>${parseFloat(producto.precio).toFixed(2)}</td>
                  <td>{producto.fechaCaducidad ? new Date(producto.fechaCaducidad).toLocaleDateString('es-ES') : '-'}</td>
                  <td>
                    <button className="btn-vender" onClick={() => venderProducto(producto)}>
                      Vender
                    </button>
                    <button
                      onClick={() => eliminarProducto(producto.id, producto.tipoProducto)}
                      style={{ 
                        marginLeft: '8px', 
                        padding: '0.5rem 1rem',
                        backgroundColor: '#dc3545', 
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Tabla