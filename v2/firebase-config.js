// =====================================================
//  CONFIGURACIÓN DE FIREBASE
// =====================================================
// Pega aquí los datos de tu proyecto de Firebase
// (Consola de Firebase → ⚙️ Configuración del proyecto → Tus apps → Web → "Configuración").
// Mientras apiKey diga "PEGA_AQUI…", la app funciona en MODO LOCAL
// (guarda todo solo en el teléfono/computadora, sin compartir).

export const firebaseConfig = {
    apiKey: "PEGA_AQUI_TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000"
};

// Identificador del restaurante dentro de la base de datos.
// Si algún día usas la app para otro local, cambia este nombre.
export const RESTAURANTE_ID = 'takolandia';

// Versión de Firebase que se descarga (no hace falta cambiarla).
export const FIREBASE_VERSION = '12.19.0';
