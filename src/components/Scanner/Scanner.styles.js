export const scannerStyles = `
  /* CONTENEDOR PRINCIPAL */
  .scanner-container { 
    max-width: 500px; 
    margin: 20px auto; 
    font-family: sans-serif; /* Fuente estándar segura */
    padding: 20px; 
    background-color: #f8f9fa; /* Fondo gris muy suave */
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }

  /* --- CÁMARA --- */
  .camera-box { 
    position: relative; 
    background: #000; 
    border-radius: 12px; 
    overflow: hidden; 
    height: 300px; 
    margin-bottom: 20px; 
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }
  .video-feed { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
  }
  .overlay-guide { 
    position: absolute; 
    width: 200px; 
    height: 200px; 
    border: 3px solid #4ecca3; 
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.6); /* Oscurece el resto */
    border-radius: 16px; 
    pointer-events: none; 
    z-index: 10;
  }
  .scan-text { 
    position: absolute; 
    bottom: 20px; 
    color: #fff; 
    font-weight: bold; 
    text-shadow: 0 2px 4px rgba(0,0,0,0.8); 
    z-index: 11;
    font-size: 1.1rem;
  }
  
  /* --- MENSAJES (Alertas) --- */
  .message-box { 
    padding: 15px; 
    margin-bottom: 20px; 
    border-radius: 8px; 
    text-align: center; 
    font-weight: 700; 
    font-size: 1rem;
    color: #000 !important; /* Forzar texto negro */
    border: 1px solid rgba(0,0,0,0.1);
  }
  .message-box.success { background: #dcfce7; color: #14532d !important; }
  .message-box.info { background: #e0f2fe; color: #0c4a6e !important; }
  .message-box.warning { background: #fef3c7; color: #78350f !important; }

  /* --- TARJETA DE FORMULARIO (Donde está el problema) --- */
  .action-card { 
    background: #ffffff !important; /* Fondo blanco forzado */
    border: 1px solid #ddd; 
    border-radius: 10px; 
    padding: 25px; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
    color: #000 !important;
  }
  
  .action-card h3 { 
    color: #000000 !important; /* Título NEGRO */
    margin-top: 0; 
    margin-bottom: 20px; 
    font-size: 1.4rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
  }
  
  .action-card span { 
    display: block;
    font-size: 1rem;
    color: #333 !important; /* Código QR en gris oscuro */
    margin-bottom: 20px;
    font-weight: bold;
    background: #f1f1f1;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #ccc;
  }

  /* --- INPUTS Y LABELS (Solución Definitiva) --- */
  .form-row {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
  }
  .form-group {
    flex: 1;
  }
  
  /* ETIQUETAS (Nombre, Marca, Precio...) */
  .form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 900 !important; /* Extra negrita */
    color: #000000 !important;   /* NEGRO PURO FORZADO */
    font-size: 1rem;
    text-transform: uppercase;   /* Mayúsculas para que se lea mejor */
    letter-spacing: 0.5px;
  }
  
  /* CAJAS DE TEXTO (Donde dice Fuzetea) */
  .form-control {
    display: block;
    width: 100%;
    padding: 12px;
    font-size: 1.1rem; /* Letra más grande */
    font-weight: 600;
    line-height: 1.5;
    color: #000000 !important;       /* TEXTO NEGRO */
    background-color: #ffffff !important; /* FONDO BLANCO */
    background-clip: padding-box;
    border: 2px solid #ced4da;       /* Borde gris visible */
    border-radius: 6px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    box-sizing: border-box;
  }
  
  /* Estilo cuando haces clic en el input */
  .form-control:focus {
    color: #000000 !important;
    background-color: #fff !important;
    border-color: #4ecca3;
    outline: 0;
    box-shadow: 0 0 0 4px rgba(78, 204, 163, 0.25);
  }

  /* Corrección para el autocompletado de Chrome (Fondo amarillo) */
  .form-control:-webkit-autofill,
  .form-control:-webkit-autofill:hover, 
  .form-control:-webkit-autofill:focus {
    -webkit-text-fill-color: #000 !important;
    -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  /* --- BOTONES --- */
  .btn-block { 
    display: block;
    width: 100%; 
    padding: 15px; 
    border: none; 
    border-radius: 8px; 
    font-weight: 800; 
    font-size: 1rem;
    cursor: pointer; 
    margin-top: 15px; 
    text-align: center;
    text-transform: uppercase;
  }
  .btn-confirm { 
    background-color: #4ecca3; 
    color: #000 !important; /* Texto Negro */
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  .btn-confirm:hover {
    background-color: #3cb890;
    transform: translateY(-1px);
  }
  .btn-cancel { 
    background-color: #e9ecef; 
    color: #000 !important; /* Texto Negro */
    border: 1px solid #ced4da;
  }
  .btn-cancel:hover {
    background-color: #dee2e6;
  }
  .btn-primary { background: #4ecca3; color: #000; width: 100%; }
`;