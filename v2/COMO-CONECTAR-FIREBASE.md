# Cómo conectar CompraFácil a Firebase

Toma unos 20 minutos. Todo es gratis con el plan **Spark** de Firebase.

## 1. Crear el proyecto
1. Entra a https://console.firebase.google.com con tu cuenta de Google.
2. **Agregar proyecto** → nombre: `comprafacil-takolandia` → puedes desactivar Google Analytics → **Crear**.

## 2. Activar la base de datos
1. Menú **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: la más cercana (ej. `southamerica-east1`).
3. Elige **modo de producción** → **Crear**.

## 3. Activar el inicio de sesión
1. **Compilación → Authentication → Comenzar**.
2. En **Método de acceso** activa estos dos:
   - **Correo electrónico/contraseña** (para ti, el administrador).
   - **Anónimo** (para que tu equipo entre solo con su número de celular).
3. Pestaña **Usuarios → Agregar usuario**: crea **solo tu cuenta de administrador**
   (tu correo y una contraseña). A tu equipo lo registras después desde la app.
4. **Configuración → Dominios autorizados**: agrega `iamfriveran.github.io`.
5. **Configuración → Acciones del usuario**: deja activado **Habilitar creación (registro)**.
   (Es necesario para el acceso con número. La seguridad la dan las reglas del paso 5.)

## 4. Conectar la app
1. En la consola: ⚙️ **Configuración del proyecto → Tus apps → icono web `</>`**.
   Nombre: `CompraFácil` (no marques Hosting) → **Registrar app**.
2. Abre **`firebase-config.js`** y:
   - Pega los valores de `firebaseConfig`.
   - En `ADMIN_EMAILS` pon tu correo de administrador.
   - En `ADMIN_NOMBRE` pon tu nombre.
3. Sube el archivo a GitHub.

## 5. Reglas de seguridad
1. Abre **`firestore.rules`** y cambia `tu-correo@gmail.com` por tu correo de administrador
   (el mismo del paso 4).
2. En Firebase: **Firestore Database → Reglas** → borra lo que hay, pega el contenido → **Publicar**.

## 6. Primer uso
1. Abre la app → **👑 Soy el administrador** → entra con tu correo y contraseña.
   La primera vez, la app sube a la nube el catálogo y el stock que tenías en ese teléfono.
2. Ve a la pestaña **👑 Admin** → agrega a cada persona con su **nombre, número de celular y área**
   (🍳 Cocina, ☕ Cafetería / Mesas…). Agrégate también tú, para aparecer en la lista de WhatsApp.
3. En los otros celulares: escriben su número → la app les da la bienvenida con su nombre.

## La semana de compras
1. **De martes a domingo**: la encargada de cocina y la de cafetería/mesas agregan lo que necesitan
   cuando se dan cuenta. Cada una tiene **su propio pedido**: si las dos piden Limones, la app muestra
   "🍳 Ana: 2 · ☕ Luis: 1 · Total: 3". Nadie puede borrar lo que pidió la otra.
2. **Lunes**: tú tocas **🧾 Cerrar semana** → revisas la lista final (con totales y quién pidió qué)
   → la envías por WhatsApp → **✅ Cerrar semana**.
3. La lista se guarda en **👑 Admin → 📚 Semanas anteriores** y queda vacía para la semana siguiente.
   El stock no se borra.
4. Cada persona puede guardar su **⭐ lista habitual** y cargarla con un toque al empezar la semana.

## Cómo funciona
- **Tu equipo** (entra con su número): ve y cambia el stock y la lista de compras, envía por WhatsApp.
  Si necesita un producto o categoría nueva, la **pide** y queda esperando tu aprobación
  (el producto ya aparece en la lista con ⏳).
- **Tú** (administrador): apruebas o rechazas pedidos, agregas/quitas productos y categorías,
  y registras o quitas usuarios. Si quitas a alguien, pierde el acceso de inmediato.
- Arriba debe decir **🟢 En línea · compartido**. Sin internet la app sigue funcionando y se
  sincroniza al volver.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | La pantalla |
| `styles.css` | Colores y diseño Takolandia |
| `script.js` | Catálogo, compras, inventario, administración, WhatsApp |
| `almacen.js` | Guarda y sincroniza con Firebase (o local si no está configurado) |
| `firebase-config.js` | **Aquí pegas tus datos de Firebase y tu correo de administrador** |
| `firestore.rules` | Reglas de seguridad para pegar en Firebase |
| `takolandia-logo.png` | Logo de respaldo |
