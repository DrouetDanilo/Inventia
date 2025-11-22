import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

// --- SONIDO BEEP (Generado internamente) ---
const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    osc.frequency.value = 1000; // 1000Hz
    gain.gain.value = 0.1;      // Volumen bajo (10%)
    
    osc.start();
    setTimeout(() => osc.stop(), 150); // Dura 150ms
  } catch (e) {
    console.warn("Error de audio:", e);
  }
};

/**
 * Hook de control de cámara - Versión Compatible para PC y Móvil
 * @param {React.RefObject} videoRef - Referencia al elemento <video>
 * @param {Function} onScan - Callback que recibe el texto del código leído
 * @param {number} scanDelay - Tiempo de espera entre lecturas (default 2000ms)
 */
export function useCamera(videoRef, onScan, scanDelay = 2000) {
  const lastScanTime = useRef(0);

  useEffect(() => {
    // Si la referencia al video no existe aún, no hacemos nada
    if (!videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();

    // Función que procesa cada frame de video
    const handleDecodeParams = (result, error) => {
      if (result) {
        const now = Date.now();
        
        // Evitamos lecturas repetidas muy rápidas (Debounce)
        if (now - lastScanTime.current > scanDelay) {
          lastScanTime.current = now;
          
          // 1. Feedback Auditivo
          playBeep();
          
          // 2. Devolver el código al componente padre
          if (onScan) onScan(result.getText());
        }
      }
      // Nota: Ignoramos los errores de "NotFoundException" que ocurren en frames vacíos
    };

    const startDecoding = async () => {
      try {
        console.log("Iniciando cámara...");

        // CORRECCIÓN: Usamos { video: true }
        // Esto permite que el navegador elija la webcam disponible (frontal o USB)
        // en lugar de buscar obligatoriamente una trasera.
        await codeReader.decodeFromConstraints(
          { video: true }, 
          videoRef.current, 
          handleDecodeParams
        );
        
      } catch (err) {
        console.error("Error al iniciar la cámara:", err);
        // Alerta visible para depuración
        alert("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
      }
    };

    startDecoding();

    // Limpieza obligatoria al desmontar el componente
    return () => {
      codeReader.reset();
    };
  }, [videoRef, onScan, scanDelay]);
}