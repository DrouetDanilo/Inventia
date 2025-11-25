import React from 'react';

// Recibimos 'videoRef' como propiedad (prop) desde el Scanner
function CameraBox({ videoRef }) {
  return (
    <div className="camera-box">
      
      {/* --- ESTO ES LO QUE FALTABA --- */}
      <video 
        ref={videoRef}          // Conecta la lógica de la cámara con este elemento
        className="video-feed"  // Usa los estilos que definiste en Scanner.styles
        muted                   // OBLIGATORIO para que arranque solo
        autoPlay                // OBLIGATORIO
        playsInline             // OBLIGATORIO para iPhone
      />
      {/* ------------------------------ */}

      <div className="overlay-guide"></div>
      <div className="scan-text">📷 Escanea un código</div>
    </div>
  );
}

export default CameraBox;