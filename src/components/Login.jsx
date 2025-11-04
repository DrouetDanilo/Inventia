import '../App.css'
import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../config/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { database } from '../config/firebase' 

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setError('Credenciales incorrectas')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      
      await updateProfile(userCredential.user, {
        displayName: nombre
      })

      
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        nombre: nombre,
        email: email,
        createdAt: new Date().toISOString()
      })

      
      setNombre('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado')
      } else if (error.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido')
      } else {
        setError('Error al crear la cuenta: ' + error.message)
      }
    }
  }

  const toggleMode = () => {
    setIsRegistering(!isRegistering)
    setError('')
    setEmail('')
    setPassword('')
    setNombre('')
    setConfirmPassword('')
  }

  return (
    <div className="login">
      <img id="fondologin" src='pictures/inventialogo.jpeg' alt="Momento Offline" />
      <div className="login2">
        <h2>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        
        {!isRegistering ? (
          
          <form id="iniciarlogin" onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Entrar</button>
            {error && <p style={{color: 'red'}}>{error}</p>}
          </form>
        ) : (
          
          <form id="iniciarlogin" onSubmit={handleRegister}>
            <input 
              type="text" 
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit">Registrarse</button>
            {error && <p style={{color: 'red'}}>{error}</p>}
          </form>
        )}
        
        <a id="crearcuenta" onClick={toggleMode} style={{cursor: 'pointer'}}>
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : 'Crear cuenta'}
        </a>
      </div>
    </div>
  )
}

export default Login
