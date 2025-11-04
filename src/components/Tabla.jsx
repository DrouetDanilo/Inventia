

import { useState, useEffect } from 'react'
import { database } from '../config/firebase'
import { ref, push, set, onValue, remove } from 'firebase/database'
import '../App.css'
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
    precio: ''
  })
  const [productoAgregar, setProductoAgregar] = useState({
    plantillaId: '',
    fechaCaducidad: '',
    slot: ''
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
    if (!nuevoCatalogoProducto.tipoProducto.trim() || !nuevoCatalogoProducto.marcaFabricante.trim() || !nuevoCatalogoProducto.precio) {
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
      setNuevoCatalogoProducto({ tipoProducto: '', marcaFabricante: '', precio: '' })
      setMostrarFormCatalogo(false)
      alert('Plantilla de producto creada')
    } catch (err) {
      alert('Error al crear plantilla: ' + err.message)
    }
  }

  const agregarProductoATabla = async (e) => {
    e.preventDefault()
    const { plantillaId, fechaCaducidad, slot } = productoAgregar
    if (!plantillaId || !fechaCaducidad || !slot) {
      alert('Selecciona una plantilla y completa fecha de caducidad y número de slot')
      return
    }
    try {
      const plantilla = catalogoProductos.find(p => p.id === plantillaId)
      if (!plantilla) {
        alert('Plantilla no encontrada')
        return
      }
      const productosRef = ref(database, `usuarios/${user.uid}/productos`)
      const nuevoProductoRef = push(productosRef)
      await set(nuevoProductoRef, {
        tipoProducto: plantilla.tipoProducto,
        marcaFabricante: plantilla.marcaFabricante,
        precio: plantilla.precio,
        fechaCaducidad,
        slot,
        fechaRegistro: new Date().toISOString(),
        estado: 'disponible'
      })
      setProductoAgregar({ plantillaId: '', fechaCaducidad: '', slot: '' })
      setMostrarFormAgregar(false)
      alert('Producto agregado a la tabla')
    } catch (err) {
      alert('Error al agregar producto: ' + err.message)
    }
  }

  const venderProducto = async (producto) => {
    if (!window.confirm(`¿Deseas vender ${producto.tipoProducto}?`)) return
    try {
      const historialRef = ref(database, `usuarios/${user.uid}/historialVentas`)
      const nuevaVentaRef = push(historialRef)
      await set(nuevaVentaRef, { ...producto, fechaVenta: new Date().toISOString() })
      const productoRef = ref(database, `usuarios/${user.uid}/productos/${producto.id}`)
      await remove(productoRef)
      alert('Producto vendido')
    } catch (err) {
      alert('Error al vender: ' + err.message)
    }
  }

  const eliminarProducto = async (id, nombre) => {
    if (!window.confirm(`Eliminar "${nombre}" de la tabla?`)) return
    try {
      const productoRef = ref(database, `usuarios/${user.uid}/productos/${id}`)
      await remove(productoRef)
      alert('Producto eliminado')
    } catch (err) {
      alert('Error al eliminar: ' + err.message)
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
          <button onClick={() => setMostrarFormCatalogo(!mostrarFormCatalogo)}>
            {mostrarFormCatalogo ? 'Cancelar' : '+ Crear Plantilla'}
          </button>
          <button onClick={() => setMostrarFormAgregar(!mostrarFormAgregar)}>
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
            <button type="submit">Guardar plantilla</button>
          </form>
        </div>
      )}

      {mostrarFormAgregar && (
        <div className="formulario-modal">
          <form onSubmit={agregarProductoATabla}>
            <h3>Agregar Producto a la Tabla</h3>
            <select
              value={productoAgregar.plantillaId}
              onChange={(e) => setProductoAgregar({ ...productoAgregar, plantillaId: e.target.value })}
              required
            >
              <option value="">Seleccionar plantilla</option>
              {catalogoProductos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.tipoProducto} — {p.marcaFabricante} — ${parseFloat(p.precio).toFixed(2)}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={productoAgregar.fechaCaducidad}
              onChange={(e) => setProductoAgregar({ ...productoAgregar, fechaCaducidad: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Número de slot"
              value={productoAgregar.slot}
              onChange={(e) => setProductoAgregar({ ...productoAgregar, slot: e.target.value })}
              required
            />
            <button type="submit">Agregar a tabla</button>
          </form>
        </div>
      )}
      <AsistenteVoz
  onAgregar={async (nombre, fecha, slot) => {
    const plantilla = catalogoProductos.find(
      p => p.tipoProducto.toLowerCase() === nombre.toLowerCase()
    )
    if (!plantilla) return false

    try {
      const productosRef = ref(database, `usuarios/${user.uid}/productos`)
      const nuevoRef = push(productosRef)
      await set(nuevoRef, {
        tipoProducto: plantilla.tipoProducto,
        marcaFabricante: plantilla.marcaFabricante,
        precio: plantilla.precio,
        fechaCaducidad: fecha,
        slot,
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
    try {
      await venderProducto(producto)
      return true
    } catch {
      return false
    }
  }}

  onEliminar={async (nombre) => {
    const producto = productos.find(
      p => p.tipoProducto.toLowerCase() === nombre.toLowerCase()
    )
    if (!producto) return false
    try {
      await eliminarProducto(producto.id, producto.tipoProducto)
      return true
    } catch {
      return false
    }
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
                <th>Slot</th>
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
                  <td>{producto.slot || '-'}</td>
                  <td>
                    <button onClick={() => venderProducto(producto)}>Vender</button>
                    <button
                      onClick={() => eliminarProducto(producto.id, producto.tipoProducto)}
                      style={{ marginLeft: '8px', backgroundColor: '#e74c3c', color: 'white' }}
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

