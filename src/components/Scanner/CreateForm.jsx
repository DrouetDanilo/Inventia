// src/components/Scanner/CreateForm.jsx
function CreateForm({
  scanId,
  newProductForm,
  setNewProductForm,
  onCancel,
  onSave,
}) {
  return (
    <div className="action-card">
      <h3>✨ Nuevo Producto</h3>
      <span>Código: {scanId}</span>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            className="form-control"
            value={newProductForm.tipoProducto}
            onChange={(e) =>
              setNewProductForm({ ...newProductForm, tipoProducto: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">Marca</label>
          <input
            className="form-control"
            value={newProductForm.marcaFabricante}
            onChange={(e) =>
              setNewProductForm({ ...newProductForm, marcaFabricante: e.target.value })
            }
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Precio</label>
          <input
            type="number"
            className="form-control"
            value={newProductForm.precio}
            onChange={(e) =>
              setNewProductForm({ ...newProductForm, precio: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">Stock Inicial</label>
          <input
            type="number"
            className="form-control"
            value={newProductForm.stock}
            onChange={(e) =>
              setNewProductForm({
                ...newProductForm,
                stock: parseInt(e.target.value) || 1,
              })
            }
          />
        </div>
      </div>

      <label className="form-label">Descripción</label>
      <input
        className="form-control"
        value={newProductForm.descripcion}
        onChange={(e) =>
          setNewProductForm({ ...newProductForm, descripcion: e.target.value })
        }
      />

      <div style={{ marginTop: "20px" }}>
        <button className="btn-block btn-cancel" onClick={onCancel}>Cancelar</button>
        <button className="btn-block btn-confirm" onClick={onSave}>Guardar</button>
      </div>
    </div>
  );
}

export default CreateForm;
