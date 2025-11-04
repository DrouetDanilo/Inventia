import { useEffect, useRef, useState, useCallback } from 'react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

function AsistenteVoz({ onAgregar, onVender, onEliminar }) {
  const [escuchando, setEscuchando] = useState(false)
  const [ultimoComando, setUltimoComando] = useState('')
  const recognitionRef = useRef(null)

  // Memorizar la función de hablar
  const hablar = useCallback((mensaje, callback) => {
    console.log('🗣️ Asistente dice:', mensaje)
    const synth = window.speechSynthesis
    const voz = new SpeechSynthesisUtterance(mensaje)
    voz.lang = 'es-ES'
    voz.onend = () => {
      console.log('💬 Voz terminó de hablar')
      if (callback) callback()
    }
    synth.speak(voz)
  }, [])

  // Función para parsear fechas de caducidad
  const parsearFecha = (texto) => {
    // Formato ISO estándar: 2025-12-31
    const fechaISO = texto.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (fechaISO) {
      return fechaISO[0]
    }
    
    // Formato día/mes/año: 31/12/2025 o 31 12 2025
    const fechaDMA = texto.match(/(\d{1,2})[\/\s-](\d{1,2})[\/\s-](\d{4})/)
    if (fechaDMA) {
      const [, dia, mes, año] = fechaDMA
      return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    }
    
    // Formato mes/año: 12/2025 (asume día 1)
    const fechaMA = texto.match(/(\d{1,2})[\/\s-](\d{4})/)
    if (fechaMA) {
      const [, mes, año] = fechaMA
      return `${año}-${mes.padStart(2, '0')}-01`
    }
    
    return null
  }

  // Memorizar procesarComando
  const procesarComando = useCallback(async (texto) => {
    console.log('📥 Procesando comando:', texto)

    if (texto.includes('agregar')) {
      // Patrón más flexible: "agregar producto [nombre] fecha [fecha] slot [número]"
      const matchProducto = texto.match(/producto\s+([\wáéíóúñ\s]+?)(?=\s+fecha|\s+slot|$)/i)
      const producto = matchProducto?.[1]?.trim()
      
      const fecha = parsearFecha(texto)
      const slot = texto.match(/slot\s+(\d+)/i)?.[1]
      
      console.log('🧩 Datos detectados:', { producto, fecha, slot })

      if (producto && fecha && slot) {
        const exito = await onAgregar(producto, fecha, slot)
        console.log('📦 Resultado agregar:', exito)
        if (exito) {
          hablar(`Producto ${producto} agregado con éxito en el slot ${slot}`)
        } else {
          hablar(`No se pudo agregar el producto ${producto}. Verifica que exista en el catálogo`)
        }
      } else {
        const faltante = !producto ? 'el nombre del producto' : !fecha ? 'la fecha' : 'el número de slot'
        hablar(`Falta ${faltante}. Intenta de nuevo diciendo: agregar producto, nombre, fecha y slot número`)
      }
    }

    else if (texto.includes('vender')) {
      const matchProducto = texto.match(/vender\s+(?:producto\s+)?([\wáéíóúñ\s]+?)$/i)
      const producto = matchProducto?.[1]?.trim()
      
      console.log('🧾 Comando vender producto:', producto)
      if (producto) {
        const exito = await onVender(producto)
        console.log('📦 Resultado vender:', exito)
        if (exito) {
          hablar(`Producto ${producto} vendido con éxito`)
        } else {
          hablar(`No se encontró el producto ${producto} en la tabla`)
        }
      } else {
        hablar('No entendí qué producto vender. Di: vender producto y el nombre')
      }
    }

    else if (texto.includes('eliminar')) {
      const matchProducto = texto.match(/eliminar\s+(?:producto\s+)?([\wáéíóúñ\s]+?)$/i)
      const producto = matchProducto?.[1]?.trim()
      
      console.log('🗑️ Comando eliminar producto:', producto)
      if (producto) {
        const exito = await onEliminar(producto)
        console.log('📦 Resultado eliminar:', exito)
        if (exito) {
          hablar(`Producto ${producto} eliminado con éxito`)
        } else {
          hablar(`No se encontró el producto ${producto} en la tabla`)
        }
      } else {
        hablar('No entendí qué producto eliminar. Di: eliminar producto y el nombre')
      }
    }

    else {
      console.warn('⚠️ Comando no reconocido:', texto)
      hablar('No entendí el comando. Puedes decir: agregar producto, vender producto, o eliminar producto')
    }
  }, [onAgregar, onVender, onEliminar, hablar])

  useEffect(() => {
    if (!SpeechRecognition) {
      console.error('❌ Tu navegador no soporta SpeechRecognition')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => console.log('🎤 Reconocimiento de voz iniciado')
    
    recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript.toLowerCase()
      console.log('✅ Texto reconocido:', texto)
      setUltimoComando(texto)
      procesarComando(texto)
    }
    
    recognition.onerror = (e) => {
      console.error('❌ Error reconocimiento de voz:', e.error)
      if (e.error === 'no-speech') {
        hablar('No escuché nada, intenta de nuevo')
      } else if (e.error === 'not-allowed') {
        hablar('Necesito permiso para usar el micrófono')
      } else {
        hablar('Ocurrió un error con el micrófono')
      }
      setEscuchando(false)
    }
    
    recognition.onend = () => {
      console.log('🛑 Reconocimiento de voz detenido')
      setEscuchando(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognition) {
        recognition.abort()
      }
    }
  }, [procesarComando, hablar])

  const toggleEscucha = () => {
    const recognition = recognitionRef.current
    if (!recognition) {
      console.error('❌ Reconocimiento no inicializado')
      return
    }

    if (!escuchando) {
      console.log('🎧 Activando asistente de voz...')
      hablar('Te estoy escuchando', () => {
        try {
          recognition.start()
          setEscuchando(true)
        } catch (error) {
          console.error('Error al iniciar reconocimiento:', error)
          hablar('No pude iniciar el micrófono')
        }
      })
    } else {
      console.log('🚫 Deteniendo asistente de voz...')
      recognition.stop()
      setEscuchando(false)
      hablar('Asistente desactivado')
    }
  }

  return (
    <div style={{ margin: '15px 0', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
      <button
        onClick={toggleEscucha}
        style={{
          padding: '12px 24px',
          borderRadius: '8px',
          background: escuchando ? '#c0392b' : '#27ae60',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {escuchando ? '🛑 Detener Voz' : '🎙️ Activar Asistente'}
      </button>

      {ultimoComando && (
        <div style={{ marginTop: '10px', padding: '10px', background: 'white', borderRadius: '6px' }}>
          <p style={{ margin: 0 }}>
            <b>Último comando:</b> <span style={{ color: '#2c3e50' }}>{ultimoComando}</span>
          </p>
        </div>
      )}
      
      <details style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>ℹ️ Comandos disponibles</summary>
        <ul style={{ marginTop: '8px' }}>
          <li>Agregar producto [nombre] fecha [dd/mm/yyyy o "hoy"] slot [número]</li>
          <li>Vender producto [nombre]</li>
          <li>Eliminar producto [nombre]</li>
        </ul>
      </details>
    </div>
  )
}

export default AsistenteVoz
