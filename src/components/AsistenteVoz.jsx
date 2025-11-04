
import { useEffect, useRef, useState } from 'react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

function AsistenteVoz({ onAgregar, onVender, onEliminar }) {
  const [escuchando, setEscuchando] = useState(false)
  const [ultimoComando, setUltimoComando] = useState('')
  const recognitionRef = useRef(null)

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
      console.error('❌ Error reconocimiento de voz:', e)
      hablar('Ocurrió un error con el micrófono')
      setEscuchando(false)
    }
    recognition.onend = () => {
      console.log('🛑 Reconocimiento de voz detenido')
      setEscuchando(false)
    }

    recognitionRef.current = recognition
  }, [])

  const procesarComando = async (texto) => {
    console.log('📥 Procesando comando:', texto)

    if (texto.includes('agregar')) {
      const producto = texto.match(/producto ([\wáéíóúñ\s]+)/)?.[1]?.trim()
      const fecha = texto.match(/fecha (\d{4}-\d{2}-\d{2})/)?.[1]
      const slot = texto.match(/slot (\d+)/)?.[1]
      console.log('🧩 Datos detectados:', { producto, fecha, slot })

      if (producto && fecha && slot) {
        const exito = await onAgregar(producto, fecha, slot)
        console.log('📦 Resultado agregar:', exito)
        if (exito) hablar(`Producto ${producto} agregado con éxito`)
        else hablar(`No se pudo agregar el producto ${producto}`)
      } else {
        hablar('Por favor di el nombre, la fecha y el número de slot')
      }
    }

    else if (texto.includes('vender')) {
      const producto = texto.match(/producto ([\wáéíóúñ\s]+)/)?.[1]?.trim()
      console.log('🧾 Comando vender producto:', producto)
      if (producto) {
        const exito = await onVender(producto)
        console.log('📦 Resultado vender:', exito)
        if (exito) hablar(`Producto ${producto} vendido con éxito`)
        else hablar(`No se encontró el producto ${producto}`)
      } else {
        hablar('No entendí qué producto vender')
      }
    }

    else if (texto.includes('eliminar')) {
      const producto = texto.match(/producto ([\wáéíóúñ\s]+)/)?.[1]?.trim()
      console.log('🗑️ Comando eliminar producto:', producto)
      if (producto) {
        const exito = await onEliminar(producto)
        console.log('📦 Resultado eliminar:', exito)
        if (exito) hablar(`Producto ${producto} eliminado con éxito`)
        else hablar(`No se encontró el producto ${producto}`)
      } else {
        hablar('No entendí qué producto eliminar')
      }
    }

    else {
      console.warn('⚠️ Comando no reconocido:', texto)
      hablar('No entendí el comando')
    }
  }

  const hablar = (mensaje) => {
    console.log('🗣️ Asistente dice:', mensaje)
    const synth = window.speechSynthesis
    const voz = new SpeechSynthesisUtterance(mensaje)
    voz.lang = 'es-ES'
    synth.speak(voz)
  }

  const toggleEscucha = () => {
    const recognition = recognitionRef.current
    if (!recognition) return console.error('❌ Reconocimiento no inicializado')

    if (!escuchando) {
      console.log('🎧 Activando asistente de voz...')
      recognition.start()
      setEscuchando(true)
      hablar('Te estoy escuchando')
    } else {
      console.log('🚫 Deteniendo asistente de voz...')
      recognition.stop()
      setEscuchando(false)
      hablar('Asistente desactivado')
    }
  }

  return (
    <div style={{ margin: '15px 0' }}>
      <button
        onClick={toggleEscucha}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          background: escuchando ? '#c0392b' : '#27ae60',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {escuchando ? '🛑 Detener Voz' : '🎙️ Activar Asistente'}
      </button>

      {ultimoComando && (
        <p style={{ marginTop: '10px' }}>
          <b>Último comando:</b> {ultimoComando}
        </p>
      )}
    </div>
  )
}

export default AsistenteVoz

