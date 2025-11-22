import { useState, useRef } from "react";
import { scannerStyles } from "./Scanner.styles";
import { useCamera } from "../../hooks/useCamera";

// --- FIREBASE IMPORTS ---
import { database } from "../../config/firebase";
import { ref, push, set, get } from "firebase/database";

import CameraBox from "./CameraBox";
import ScanInput from "./ScanInput";
import MessageBox from "./MessageBox";
import RestockForm from "./RestockForm";
import CreateForm from "./CreateForm";

function Scanner({ user }) {
  const [scanId, setScanId] = useState("");
  const [activeMode, setActiveMode] = useState("SCAN"); // SCAN / RESTOCK / CREATE
  const [productData, setProductData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [stockToAdd, setStockToAdd] = useState(1);
  
  const [newProductForm, setNewProductForm] = useState({
    tipoProducto: "",
    marcaFabricante: "",
    precio: "",
    descripcion: "", // Este campo solo es visual en el form, no se guardará en DB
    stock: 1,
  });

  const videoRef = useRef();
  const inputRef = useRef();

  // =====================================================
  //  INTEGRACIÓN API: OPEN FOOD FACTS (Solo lectura para llenar form)
  // =====================================================
  const fetchProductData = async (barcode) => {
    console.log("📡 Consultando API externa para:", barcode);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1) { 
        const product = data.product;
        return {
          found: true,
          name: product.product_name_es || product.product_name || "Producto sin nombre",
          brand: product.brands || "Marca desconocida",
          category: product.categories || "",
        };
      }
      return { found: false };
    } catch (error) {
      console.error("🔥 Error API:", error);
      return { found: false, error: true };
    }
  };

  // =====================================================
  //  BÚSQUEDA EN FIREBASE
  // =====================================================
  const searchInFirebase = async (barcode) => {
    if (!user) return null;
    
    // NOTA: Al no guardar 'codigoBarras' en la DB, esta búsqueda por código
    // no encontrará productos nuevos que registres desde aquí.
    // El escáner funcionará principalmente como una herramienta de "Ingreso Rápido".
    // Si deseas que encuentre productos por nombre/tipo en el futuro, habría que cambiar esta lógica.
    
    return null; 
  };

  // =============================
  //  MOTOR DE BÚSQUEDA PRINCIPAL
  // =============================
  const executeSearch = async (codigoEscaneado) => {
    if (!codigoEscaneado || !codigoEscaneado.trim()) return;
    if (!user) return setMsg({ type: "warning", text: "Inicia sesión para usar el escáner." });

    setLoading(true);
    setMsg(null);
    
    // PASO 1: Intentar buscar en DB (Retornará null ahora que no guardamos barcode, pasando al paso 2)
    const localProduct = await searchInFirebase(codigoEscaneado);

    if (localProduct) {
      setProductData({ id: codigoEscaneado, ...localProduct });
      setActiveMode("RESTOCK");
      setMsg({ type: "success", text: `Producto encontrado en inventario.` });
      setLoading(false);
      return;
    }

    // PASO 2: Consultar API Mundial para llenar el formulario
    setMsg({ type: "info", text: "Buscando información del producto..." });
    const apiResult = await fetchProductData(codigoEscaneado);

    if (apiResult.found) {
      setNewProductForm({
        tipoProducto: apiResult.name,
        marcaFabricante: apiResult.brand,
        precio: "", 
        stock: 1,
        descripcion: apiResult.category ? `Categoría: ${apiResult.category.substring(0, 50)}...` : ""
      });
      setMsg({ type: "success", text: "¡Datos encontrados! Confirma el precio." });
    } else {
      setNewProductForm({
        tipoProducto: "", marcaFabricante: "", precio: "", descripcion: "", stock: 1
      });
      setMsg({ type: "warning", text: "Producto desconocido. Regístralo manualmente." });
    }
    
    setScanId(codigoEscaneado);
    setActiveMode("CREATE");
    setLoading(false);
  };

  // =============================
  //  INTEGRACIÓN CÁMARA
  // =============================
  const onQrDetected = (code) => {
    if (activeMode === "SCAN" && !loading) {
      console.log("📸 Detectado:", code);
      setScanId(code);
      executeSearch(code);
    }
  };

  useCamera(videoRef, onQrDetected);

  const handleManualScan = () => executeSearch(scanId);

  // =====================================================
  //  GUARDAR PRODUCTO (Respetando estructura de Tabla.jsx)
  // =====================================================
  const handleCreate = async () => {
    if (!user) return;
    if (!newProductForm.tipoProducto || !newProductForm.precio) {
      alert("Por favor completa el nombre y el precio.");
      return;
    }

    setLoading(true);
    try {
      const productosRef = ref(database, `usuarios/${user.uid}/productos`);
      
      // Estructura EXACTA a la que usas en Tabla.jsx
      // Eliminamos 'codigoBarras' y 'descripcion' para no alterar tu DB.
      const nuevoProducto = {
        tipoProducto: newProductForm.tipoProducto,
        marcaFabricante: newProductForm.marcaFabricante || "Genérico",
        precio: parseFloat(newProductForm.precio),
        fechaRegistro: new Date().toISOString(),
        estado: 'disponible',
        // Asignamos 1 año de caducidad por defecto ya que el formulario rápido no pide fecha
        fechaCaducidad: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() 
      };

      // Creamos tantas entradas individuales como diga el stock (igual que en Tabla.jsx)
      const promises = [];
      const cantidad = parseInt(newProductForm.stock) || 1;
      
      for (let i = 0; i < cantidad; i++) {
        const nuevoRef = push(productosRef);
        promises.push(set(nuevoRef, nuevoProducto));
      }

      await Promise.all(promises);

      setMsg({ type: "success", text: `¡${cantidad} productos agregados al inventario!` });
      resetScanner();
    } catch (error) {
      console.error("Error guardando:", error);
      setMsg({ type: "warning", text: "Error al guardar en la base de datos." });
    }
    setLoading(false);
  };

  // Mantenemos handleRestock por si en el futuro decides usar lógica de reabastecimiento
  const handleRestock = async () => {
    if (!user || !productData) return;
    setLoading(true);
    
    try {
      const productosRef = ref(database, `usuarios/${user.uid}/productos`);
      
      const productoBase = {
        tipoProducto: productData.tipoProducto,
        marcaFabricante: productData.marcaFabricante,
        precio: parseFloat(productData.precio),
        fechaRegistro: new Date().toISOString(),
        estado: 'disponible',
        fechaCaducidad: productData.fechaCaducidad || ""
      };

      const promises = [];
      for (let i = 0; i < stockToAdd; i++) {
        const nuevoRef = push(productosRef);
        promises.push(set(nuevoRef, productoBase));
      }

      await Promise.all(promises);
      
      setMsg({ type: "success", text: `Stock actualizado (+${stockToAdd}).` });
      resetScanner();
    } catch (error) {
      console.error("Error reponiendo:", error);
      setMsg({ type: "warning", text: "Error al actualizar stock." });
    }
    setLoading(false);
  };

  const resetScanner = () => {
    setScanId("");
    setActiveMode("SCAN");
    setProductData(null);
    setStockToAdd(1);
    setNewProductForm({ tipoProducto: "", marcaFabricante: "", precio: "", descripcion: "", stock: 1 });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="scanner-container">
      <style>{scannerStyles}</style>

      <CameraBox videoRef={videoRef} />

      {msg && <MessageBox type={msg.type} text={msg.text} />}

      {activeMode === "SCAN" && (
        <ScanInput
          scanId={scanId}
          setScanId={setScanId}
          loading={loading}
          onScan={handleManualScan}
          inputRef={inputRef}
        />
      )}

      {activeMode === "RESTOCK" && productData && (
        <RestockForm
          productData={{
            ...productData, 
            stock: productData.stock 
          }}
          stockToAdd={stockToAdd}
          setStockToAdd={setStockToAdd}
          onCancel={resetScanner}
          onConfirm={handleRestock}
        />
      )}

      {activeMode === "CREATE" && (
        <CreateForm
          scanId={scanId}
          newProductForm={newProductForm}
          setNewProductForm={setNewProductForm}
          onCancel={resetScanner}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}

export default Scanner;