// src/components/Scanner/RestockForm.jsx
function RestockForm({
  productData,
  stockToAdd,
  setStockToAdd,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="action-card">
      <h3>📦 Reposición</h3>
      <p>
        {productData.tipoProducto} ({productData.marcaFabricante})<br />
        Stock actual: <strong>{productData.stock}</strong>
      </p>

      <div className="stock-controls">
        <button className="btn-circle" onClick={() => setStockToAdd(Math.max(1, stockToAdd - 1))}>-</button>
        <div style={{ fontSize: "22px", fontWeight: "bold" }}>{stockToAdd}</div>
        <button className="btn-circle" onClick={() => setStockToAdd(stockToAdd + 1)}>+</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button className="btn-block btn-cancel" onClick={onCancel}>Cancelar</button>
        <button className="btn-block btn-confirm" onClick={onConfirm}>Confirmar</button>
      </div>
    </div>
  );
}

export default RestockForm;
