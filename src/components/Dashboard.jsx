import { useState, useEffect } from 'react'
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
  
    // Contar productos en STOCK (tabla productos)
    productosStock.forEach(prod => {
      const nombre = prod.tipoProducto
      const marca = prod.marcaFabricante
      const precio = parseFloat(prod.precio) || 0
      const clave = `${nombre}-${marca}`
      
      if (!agrupados[clave]) {
        agrupados[clave] = {
          nombre,
          marca,
          precio,
          stock: 0,
          vendidos: 0
        }
      }
      agrupados[clave].stock += 1
    })
  
    // Contar productos VENDIDOS (historialVentas)
    historialVentas.forEach(venta => {
      const nombre = venta.tipoProducto
      const marca = venta.marcaFabricante
      const precio = parseFloat(venta.precio) || 0
      const clave = `${nombre}-${marca}`
      
      if (!agrupados[clave]) {
        agrupados[clave] = {
          nombre,
          marca,
          precio,
          stock: 0,
          vendidos: 0
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
  
  useEffect(() => {
    if (user) {
      CargarCatalogos()
      CargarProductosStock()
      CargarHistorialVentas()
    }
  }, [user])
  
  useEffect(() => {
    GenerarResumen()
  }, [productosStock, historialVentas])
  
  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Resumen general de productos</h2>
      <table className="dashboard-table">
        <thead>
          <tr className="dashboard-table-header">
            <th className="dashboard-th dashboard-th-left">Nombre</th>
            <th className="dashboard-th dashboard-th-left">Marca</th>
            <th className="dashboard-th dashboard-th-center">Vendidos</th>
            <th className="dashboard-th dashboard-th-center">Stock</th>
            <th className="dashboard-th dashboard-th-right">Dinero en stock ($)</th>
            <th className="dashboard-th dashboard-th-right">Dinero ganado ($)</th>
          </tr>
        </thead>
        <tbody>
          {resumen.length > 0 ? (
            resumen.map((item, index) => (
              <tr key={index} className={`dashboard-table-row ${index % 2 === 0 ? 'dashboard-row-even' : 'dashboard-row-odd'}`}>
                <td className="dashboard-td">{item.nombre}</td>
                <td className="dashboard-td">{item.marca}</td>
                <td className="dashboard-td dashboard-td-center">{item.vendidos}</td>
                <td className="dashboard-td dashboard-td-center">{item.stock}</td>
                <td className="dashboard-td dashboard-td-right">${item.dineroStock}</td>
                <td className="dashboard-td dashboard-td-right">${item.dineroGanado}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="dashboard-loading">
                Cargando datos...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Dashboard
