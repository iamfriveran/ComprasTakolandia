// =====================================================
//  CONFIGURACIÓN DE FIREBASE Y DEL RESTAURANTE
// =====================================================
// Pega aquí los datos de tu proyecto de Firebase
// (Consola de Firebase → ⚙️ Configuración del proyecto → Tus apps → Web → "Configuración").
// Mientras apiKey diga "PEGA_AQUI…", la app funciona en MODO LOCAL de prueba
// (todo se guarda solo en ese teléfono/computadora).

export const firebaseConfig = {
  apiKey: "AIzaSyCg5pk2q9lDmQ0Qm_nwYcVwOzc_mkZU6jk",
  authDomain: "comprafacil-takolandia.firebaseapp.com",
  projectId: "comprafacil-takolandia",
  storageBucket: "comprafacil-takolandia.firebasestorage.app",
  messagingSenderId: "517359703185",
  appId: "1:517359703185:web:6193280bdd4ac9abc79b30"
};

// Correo(s) del ADMINISTRADOR (la cuenta de correo/contraseña que creaste en
// Firebase → Authentication). Debe ser el MISMO correo que pongas en firestore.rules.
export const ADMIN_EMAILS = ['iamfrivera@gmail.com'];

// Nombre que verá el administrador al entrar
export const ADMIN_NOMBRE = 'Francisco';

// Código de país para los números de celular (Ecuador = 593).
// Los usuarios pueden escribir su número como 0962737275; la app lo convierte a 593962737275.
export const CODIGO_PAIS = '593';

// Identificador del restaurante dentro de la base de datos.
export const RESTAURANTE_ID = 'takolandia';

// Versión de Firebase que se descarga (no hace falta cambiarla).
export const FIREBASE_VERSION = '12.19.0';
