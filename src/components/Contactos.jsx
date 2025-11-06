import { useState, useEffect } from 'react'
import "../styles/Contactos.css"
import { ref, onValue, push, set, remove } from 'firebase/database'
import { database } from '../config/firebase'

function Contactos({ user }) {
  const [distribuidores, setDistribuidores] = useState([])
  const [catalogoProductos, setCatalogoProductos] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [distribuidorSeleccionado, setDistribuidorSeleccionado] = useState(null)
  const [mostrarPedido, setMostrarPedido] = useState(false)
  
  // Datos del formulario de distribuidor
  const [nuevoDistribuidor, setNuevoDistribuidor] = useState({
    nombre: '',
    empresa: '',
    telefono: '',
    marcaRepresentada: '',
    email: ''
  })

  // Pedido actual
  const [pedidoActual, setPedidoActual] = useState([])

  const CargarDistribuidores = () => {
    const distribuidoresRef = ref(database, `usuarios/${user.uid}/distribuidores`)
    onValue(distribuidoresRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const lista = Object.keys(data).map(key => ({ id: key, ...data[key] }))
        setDistribuidores(lista)
      } else {
        setDistribuidores([])
      }
    })
  }

  const CargarCatalogo = () => {
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

  const GuardarDistribuidor = (e) => {
    e.preventDefault()
    
    if (!nuevoDistribuidor.nombre || !nuevoDistribuidor.telefono || !nuevoDistribuidor.marcaRepresentada) {
      alert('Por favor completa los campos obligatorios: Nombre, Teléfono y Marca')
      return
    }

    // Validar formato de teléfono (solo números)
    const telefonoLimpio = nuevoDistribuidor.telefono.replace(/\D/g, '')
    if (telefonoLimpio.length < 10) {
      alert('El teléfono debe tener al menos 10 dígitos')
      return
    }

    const distribuidoresRef = ref(database, `usuarios/${user.uid}/distribuidores`)
    const nuevoDistribuidorRef = push(distribuidoresRef)
    
    set(nuevoDistribuidorRef, {
      ...nuevoDistribuidor,
      telefono: telefonoLimpio,
      fechaCreacion: new Date().toISOString()
    })
    .then(() => {
      alert('Distribuidor registrado exitosamente')
      setNuevoDistribuidor({
        nombre: '',
        empresa: '',
        telefono: '',
        marcaRepresentada: '',
        email: ''
      })
      setMostrarFormulario(false)
    })
    .catch((error) => {
      alert('Error al guardar: ' + error.message)
    })
  }

  const EliminarDistribuidor = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este distribuidor?')) {
      const distribuidorRef = ref(database, `usuarios/${user.uid}/distribuidores/${id}`)
      remove(distribuidorRef)
        .then(() => alert('Distribuidor eliminado'))
        .catch((error) => alert('Error: ' + error.message))
    }
  }

  const IniciarPedido = (distribuidor) => {
    setDistribuidorSeleccionado(distribuidor)
    
    // Filtrar productos de la marca del distribuidor
    const productosMarca = catalogoProductos.filter(
      prod => prod.marcaFabricante.toLowerCase() === distribuidor.marcaRepresentada.toLowerCase()
    )
    
    if (productosMarca.length === 0) {
      alert('No hay productos registrados para esta marca en el catálogo')
      return
    }

    // Inicializar pedido con cantidad 0
    const pedidoInicial = productosMarca.map(prod => ({
      tipoProducto: prod.tipoProducto,
      marcaFabricante: prod.marcaFabricante,
      precio: prod.precio,
      cantidad: 0
    }))
    
    setPedidoActual(pedidoInicial)
    setMostrarPedido(true)
  }

  const ActualizarCantidad = (index, cantidad) => {
    const nuevoPedido = [...pedidoActual]
    nuevoPedido[index].cantidad = Math.max(0, parseInt(cantidad) || 0)
    setPedidoActual(nuevoPedido)
  }

  const EnviarMensajeWhatsApp = () => {
    const productosConCantidad = pedidoActual.filter(item => item.cantidad > 0)
    
    if (productosConCantidad.length === 0) {
      alert('Debes seleccionar al menos un producto con cantidad mayor a 0')
      return
    }

    // Construir mensaje
    let mensaje = `¡Hola! Quisiera realizar el siguiente pedido:\n\n`
    
    productosConCantidad.forEach((item, index) => {
      mensaje += `${index + 1}. ${item.tipoProducto} - ${item.marcaFabricante}\n`
      mensaje += `   Cantidad: ${item.cantidad} unidades\n`
      mensaje += `   Precio unitario: $${item.precio}\n`
      mensaje += `   Subtotal: $${(item.cantidad * parseFloat(item.precio)).toFixed(2)}\n\n`
    })

    const total = productosConCantidad.reduce(
      (sum, item) => sum + (item.cantidad * parseFloat(item.precio)), 
      0
    )
    
    mensaje += `*TOTAL: $${total.toFixed(2)}*\n\n`
    mensaje += `Gracias por tu atención.`

    // Codificar mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje)
    
    // Formato internacional de Ecuador (+593)
    const telefonoFormato = distribuidorSeleccionado.telefono.startsWith('593') 
      ? distribuidorSeleccionado.telefono 
      : '593' + distribuidorSeleccionado.telefono

    // Abrir WhatsApp
    const urlWhatsApp = `https://wa.me/${telefonoFormato}?text=${mensajeCodificado}`
    window.open(urlWhatsApp, '_blank')

    // Resetear pedido
    setMostrarPedido(false)
    setDistribuidorSeleccionado(null)
    setPedidoActual([])
  }

  const ObtenerMarcasUnicas = () => {
    const marcas = catalogoProductos.map(prod => prod.marcaFabricante)
    return [...new Set(marcas)].sort()
  }

  useEffect(() => {
    if (user) {
      CargarDistribuidores()
      CargarCatalogo()
    }
  }, [user])

  return (
    <div className="contactos-container">
      <h2 className="contactos-title">Gestión de Distribuidores</h2>

      {/* Botón para mostrar formulario */}
      <div className="contactos-header">
        <button 
          className="btn-nuevo-distribuidor"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo Distribuidor'}
        </button>
      </div>

      {/* Formulario de nuevo distribuidor */}
      {mostrarFormulario && (
        <div className="formulario-distribuidor">
          <h3>Registrar Nuevo Distribuidor</h3>
          <form onSubmit={GuardarDistribuidor}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre del contacto *</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={nuevoDistribuidor.nombre}
                  onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, nombre: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Empresa</label>
                <input
                  type="text"
                  placeholder="Ej: Distribuidora XYZ"
                  value={nuevoDistribuidor.empresa}
                  onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, empresa: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Teléfono (WhatsApp) *</label>
                <input
                  type="tel"
                  placeholder="0987654321"
                  value={nuevoDistribuidor.telefono}
                  onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, telefono: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="contacto@ejemplo.com"
                  value={nuevoDistribuidor.email}
                  onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Marca que representa *</label>
                <select
                  value={nuevoDistribuidor.marcaRepresentada}
                  onChange={(e) => setNuevoDistribuidor({...nuevoDistribuidor, marcaRepresentada: e.target.value})}
                  required
                >
                  <option value="">Seleccionar marca</option>
                  {ObtenerMarcasUnicas().map((marca, index) => (
                    <option key={index} value={marca}>{marca}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-guardar-distribuidor">
              Guardar Distribuidor
            </button>
          </form>
        </div>
      )}

      {/* Lista de distribuidores */}
      <div className="distribuidores-grid">
        {distribuidores.length > 0 ? (
          distribuidores.map((dist) => (
            <div key={dist.id} className="distribuidor-card">
              <div className="distribuidor-header">
                <div className="distribuidor-marca-badge">{dist.marcaRepresentada}</div>
                <button 
                  className="btn-eliminar-dist"
                  onClick={() => EliminarDistribuidor(dist.id)}
                  title="Eliminar distribuidor"
                >
                  ✕
                </button>
              </div>

              <div className="distribuidor-info">
                <h3>{dist.nombre}</h3>
                {dist.empresa && <p className="empresa-nombre">{dist.empresa}</p>}
                
                <div className="contacto-detalles">
                  <div className="detalle-item">
                    <span className="detalle-icono">📱</span>
                    <span>{dist.telefono}</span>
                  </div>
                  {dist.email && (
                    <div className="detalle-item">
                      <span className="detalle-icono">✉️</span>
                      <span>{dist.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <button 
                className="btn-hacer-pedido"
                onClick={() => IniciarPedido(dist)}
              >
                Hacer Pedido por WhatsApp
              </button>
            </div>
          ))
        ) : (
          <div className="sin-distribuidores">
            <p>No hay distribuidores registrados</p>
            <p>Agrega un nuevo distribuidor para comenzar</p>
          </div>
        )}
      </div>

      {/* Modal de pedido */}
      {mostrarPedido && distribuidorSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarPedido(false)}>
          <div className="modal-pedido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Realizar Pedido</h3>
              <button 
                className="btn-cerrar-modal"
                onClick={() => setMostrarPedido(false)}
              >
                ✕
              </button>
            </div>

            <div className="pedido-info">
              <p><strong>Distribuidor:</strong> {distribuidorSeleccionado.nombre}</p>
              <p><strong>Marca:</strong> {distribuidorSeleccionado.marcaRepresentada}</p>
            </div>

            <div className="pedido-productos">
              <h4>Selecciona los productos y cantidades:</h4>
              {pedidoActual.map((item, index) => (
                <div key={index} className="pedido-producto-item">
                  <div className="producto-pedido-info">
                    <span className="producto-pedido-nombre">{item.tipoProducto}</span>
                    <span className="producto-pedido-precio">${item.precio}</span>
                  </div>
                  <div className="cantidad-control">
                    <button 
                      onClick={() => ActualizarCantidad(index, item.cantidad - 1)}
                      className="btn-cantidad"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={item.cantidad}
                      onChange={(e) => ActualizarCantidad(index, e.target.value)}
                      className="input-cantidad"
                    />
                    <button 
                      onClick={() => ActualizarCantidad(index, item.cantidad + 1)}
                      className="btn-cantidad"
                    >
                      +
                    </button>
                  </div>
                  {item.cantidad > 0 && (
                    <div className="subtotal-item">
                      Subtotal: ${(item.cantidad * parseFloat(item.precio)).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pedido-total">
              <strong>Total: </strong>
              ${pedidoActual.reduce((sum, item) => sum + (item.cantidad * parseFloat(item.precio)), 0).toFixed(2)}
            </div>

            <button 
              className="btn-enviar-whatsapp"
              onClick={EnviarMensajeWhatsApp}
            >
              📱 Enviar Pedido por WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Contactos
