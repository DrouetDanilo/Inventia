// src/config/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database' 
import { getAnalytics } from 'firebase/analytics'

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBMn7bETAXB3hfSec8DnPaXLyPnXD6Z-i8",
  authDomain: "emprendimiento-7d2bc.firebaseapp.com",
  projectId: "emprendimiento-7d2bc",
  storageBucket: "emprendimiento-7d2bc.firebasestorage.app",
  messagingSenderId: "480105153534",
  appId: "1:480105153534:web:ffdcc3b8b3e97a08b236af",
  measurementId: "G-2E1ZKD02SN",
  databaseURL: "https://emprendimiento-7d2bc-default-rtdb.firebaseio.com"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar servicios
export const auth = getAuth(app)
export const database = getDatabase(app)
export const analytics = getAnalytics(app)
