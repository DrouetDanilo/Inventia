import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { onAuthStateChanged } from 'firebase/auth'  
import { auth } from './config/firebase'
import Tabla from './components/Tabla' 

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection,setActiveSection] = useState("Inicio")
  
  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [])
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Cargando...</p>
      </div>
    )
  }
  const renderContent = () => {
      switch(activeSection){
        case "Inicio":
          return<Dashboard user={user}/>
        case "Productos":
          return <Tabla user={user} />
        case "Historial":
          return <p>aqui abra el historial de contenido</p>
        case "Contactos":
          return <p>aqui estara la seccion para contactar con con los otros</p>

      }
  }
  
  return (
    <div className="App">
      {!user ? (
        <Login />
      ) : (
        <div>
         <h1 id = "encabezado">Dashboard - Gestión de Almacén</h1>
          <nav id = "menu">
           <ul>
            <li id = "lst" className= {activeSection === 'Inicio'? "active" : ""} onClick={()=>setActiveSection('Inicio')}>Inicio</li>
            <li id = "lst" className = {activeSection === 'Productos'? "active" : ""} onClick={()=>setActiveSection('Productos')}>Productos</li> 
            <li id = "lst" className = {activeSection === 'Historial'? "active" :""} onClick={()=>setActiveSection("Historial")}>Historial</li>
            <li id = "lst" className = {activeSection === 'Contactos'? "active" : ""} onClick={()=>setActiveSection('Contactos')}>Contactos</li>

           </ul>
          </nav>
         
          <p>Bienvenido: {user.displayName}</p>  
          <button onClick={() => auth.signOut()}>Cerrar Sesión</button>  
          <div className = "mainSection">{renderContent()}</div>
        </div>
      )}
    </div>
  )
}

export default App
