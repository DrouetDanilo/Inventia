import "../styles/AsistenteVoz.css"

function AsistenteVentas({ resumen, historialVentas }) {
  if (!resumen.length) {
    return (
      <div className="asistente-card">
        🤖 El asistente se activará cuando tengas ventas registradas.
      </div>
    )
  }

  const topProducto = [...resumen].sort((a, b) => b.vendidos - a.vendidos)[0]
  const stockCritico = resumen.filter(p => p.ocupacion <= 20)
  const sinVentas = resumen.filter(p => p.vendidos === 0 && p.stock > 0)

  return (
    <div className="asistente-card">
      <h3>🤖 Asistente de Ventas</h3>

      <ul>
        {topProducto && (
          <li>
            🔥 <strong>{topProducto.nombre}</strong> es tu producto más vendido
            ({topProducto.vendidos} ventas).
          </li>
        )}

        {stockCritico.length > 0 && (
          <li>
            ⚠️ Tienes <strong>{stockCritico.length}</strong> productos en stock
            crítico. Reposición recomendada.
          </li>
        )}

        {sinVentas.length > 0 && (
          <li>
            💤 Hay <strong>{sinVentas.length}</strong> productos que no se han
            vendido aún.
          </li>
        )}

        {historialVentas.length >= 5 && (
          <li>
            📊 Has realizado <strong>{historialVentas.length}</strong> ventas en total.
          </li>
        )}
      </ul>
    </div>
  )
}

export default AsistenteVentas
