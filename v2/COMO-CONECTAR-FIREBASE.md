# Cómo conectar CompraFácil a Firebase

Toma unos 15 minutos. Todo es gratis con el plan **Spark** de Firebase.

## 1. Crear el proyecto
1. Entra a https://console.firebase.google.com con tu cuenta de Google.
2. **Agregar proyecto** → nombre: `comprafacil-takolandia` → puedes desactivar Google Analytics → **Crear**.

## 2. Activar la base de datos
1. Menú **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: la más cercana (ej. `southamerica-east1` o `us-east1`).
3. Elige **modo de producción** → **Crear**.
4. Pestaña **Reglas**: borra lo que hay, pega el contenido de `firestore.rules` y toca **Publicar**.

## 3. Activar el inicio de sesión
1. **Compilación → Authentication → Comenzar**.
2. En **Método de acceso** activa **Correo electrónico/contraseña** → Guardar.
3. Pestaña **Usuarios → Agregar usuario**: crea uno para ti y uno por cada persona del equipo
   (ej. `cocina@takolandia.com`). Tú eliges la contraseña.
4. **Configuración → Acciones del usuario**: desactiva **Habilitar creación (registro)**,
   para que nadie más pueda crearse una cuenta.
5. **Configuración → Dominios autorizados**: agrega el dominio donde está la app
   (ej. `tuusuario.github.io`).

## 4. Conectar la app
1. En la consola: ⚙️ **Configuración del proyecto → Tus apps → icono web `</>`**.
   Nombre: `CompraFácil` (no marques Hosting) → **Registrar app**.
2. Copia los valores de `firebaseConfig` y pégalos en el archivo **`firebase-config.js`**.
3. Sube los cambios a GitHub.

## 5. Probar
Abre la app: debe pedir correo y contraseña. Arriba debe decir **🟢 En línea · compartido**.

- La primera vez que entras, la app sube a la nube el catálogo, el stock y la lista que tenías guardados en ese teléfono.
- Si se va el internet, la app sigue funcionando y se sincroniza sola cuando vuelve.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | La pantalla |
| `styles.css` | Colores y diseño Takolandia |
| `script.js` | Catálogo, compras, inventario, WhatsApp |
| `almacen.js` | Guarda y sincroniza con Firebase (o local si no está configurado) |
| `firebase-config.js` | **Aquí pegas tus datos de Firebase** |
| `firestore.rules` | Reglas de seguridad para pegar en Firebase |
| `takolandia-logo.png` | Logo de respaldo |

> Importante: la app usa módulos de JavaScript, así que debe abrirse desde internet
> (GitHub Pages) y no haciendo doble clic en el archivo.
