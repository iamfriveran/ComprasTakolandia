// =====================================================
//  ALMACÉN DE DATOS Y SESIÓN: Firebase (compartido) o local
// =====================================================
import { firebaseConfig, RESTAURANTE_ID, FIREBASE_VERSION, ADMIN_EMAILS, ADMIN_NOMBRE, CODIGO_PAIS }
    from './firebase-config.js';

export const configurado = Boolean(firebaseConfig.apiKey) && !/^PEGA/.test(firebaseConfig.apiKey);

// Datos que ve la app. En modo Firebase se actualizan solos cuando otro teléfono cambia algo.
//   catalogo:    [{ nombre, emoji, productos: [] }]
//   eliminados:  productos/categorías base que se quitaron ("Cat|Prod" o "Cat|")
//   stock:       { Cat: { Prod: { hay, fecha, por } } }
//   lista:       { Cat: { Prod: { unidad, pendiente, pedidos: { clave: { cantidad, nombre, area, fecha } } } } }
//                ← cada persona tiene su propio pedido; así nadie borra lo que pidió otro
//   listaInicio: fecha en que se abrió la lista de esta semana
//   habitual:    mi lista habitual { Cat: [{ nombre, cantidad, unidad }] }
//   historial:   semanas cerradas [{ id, fecha, inicio, texto, total, por }]
//   usuarios:    [{ telefono, nombre, area }]    ← los registra el administrador
//   solicitudes: [{ id, tipo, categoria, nombre, emoji, por, telefono, fecha }]
export const datos = {
    catalogo: null, eliminados: [], stock: {}, lista: {}, listaInicio: null, habitual: null,
    habituales: {}, historial: [], usuarios: [], solicitudes: []
};

// Sesión actual: { tipo: 'admin' | 'usuario', nombre, telefono, area }
let sesion = null;
export const sesionActual = () => sesion;
export const esAdmin = () => !!sesion && sesion.tipo === 'admin';
export const nombreUsuario = () => (sesion ? sesion.nombre : '');
// Identifica los pedidos de cada persona dentro de la lista
export const miClave = () => (sesion && sesion.telefono ? sesion.telefono : 'admin');

// Convierte listas de versiones anteriores (arreglos) al formato con pedidos por persona
export function convertirLista(items) {
    const r = {};
    for (const cat in items || {}) {
        const v = items[cat];
        r[cat] = {};
        if (Array.isArray(v)) {
            v.forEach(i => {
                r[cat][i.nombre] = {
                    unidad: i.unidad || '', pendiente: !!i.pendiente,
                    pedidos: { anterior: { cantidad: i.cantidad || 1, nombre: 'Lista anterior', area: '', fecha: Date.now() } }
                };
            });
        } else if (v && typeof v === 'object') {
            for (const prod in v) r[cat][prod] = { unidad: '', pendiente: false, pedidos: {}, ...v[prod] };
        }
    }
    return r;
}

const CLAVE_LOCAL = 'comprafacil-takolandia-v3';
const CLAVE_SESION_LOCAL = 'comprafacil-sesion-local';
const adminEmails = ADMIN_EMAILS.map(e => e.trim().toLowerCase());

let fb = null;
let desuscribir = [];
let entrando = false;
let avisar = { alCambiar() {}, alSesion() {}, alConexion() {} };

function leerLS(k) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function escribirLS(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ }
}
function borrarLS(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } }

// 0962737275 · +593 96 273 7275 · 962737275  →  593962737275
export function normalizarTelefono(texto) {
    let d = String(texto || '').replace(/\D/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    if (d.startsWith(CODIGO_PAIS) && d.length > 10) return d;
    if (d.startsWith('0')) return CODIGO_PAIS + d.slice(1);
    if (d.length === 9) return CODIGO_PAIS + d;
    return d;
}
// 593962737275 → 096 273 7275
export function mostrarTelefono(tel) {
    const t = String(tel || '');
    if (!t.startsWith(CODIGO_PAIS)) return '+' + t;
    const local = '0' + t.slice(CODIGO_PAIS.length);
    return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : local;
}

const limpiarItems = obj => {
    const r = {};
    for (const cat in obj || {}) {
        r[cat] = (obj[cat] || []).map(i => ({ nombre: i.nombre, cantidad: i.cantidad || 1, unidad: i.unidad || '' }));
    }
    return r;
};

// Lo que haya guardado en este aparato, incluyendo versiones anteriores de la app
function datosLocales() {
    const v3 = leerLS(CLAVE_LOCAL);
    if (v3 && Array.isArray(v3.catalogo)) return v3;

    const res = { catalogo: null, eliminados: [], stock: {}, lista: {}, habitual: null };
    const v2 = leerLS('comprafacil-takolandia-v2');
    if (v2 && Array.isArray(v2.catalogo)) {
        res.catalogo = v2.catalogo;
        res.eliminados = v2.eliminados || [];
        for (const cat in v2.seleccion || {}) {
            v2.seleccion[cat].forEach(i => {
                if (i.disponible) (res.stock[cat] ||= {})[i.nombre] = { hay: String(i.disponible), fecha: Date.now(), por: '' };
            });
        }
        res.lista = limpiarItems(v2.seleccion);
        const h = leerLS('comprafacil-habitual-v2');
        if (h) res.habitual = limpiarItems(h);
        return res;
    }

    const v1 = leerLS('compras-takolandia');   // primera versión de la app
    if (v1 && typeof v1 === 'object') {
        res.catalogo = [];
        for (const cat in v1) {
            const productos = [];
            for (const prod in v1[cat]) {
                const d = v1[cat][prod] || {};
                productos.push(prod);
                if (d.disponible) (res.stock[cat] ||= {})[prod] = { hay: String(d.disponible), fecha: Date.now(), por: '' };
                if (d.seleccionado) (res.lista[cat] ||= []).push({ nombre: prod, cantidad: parseFloat(d.cantidad) || 1, unidad: '' });
            }
            res.catalogo.push({ nombre: cat, emoji: null, productos });
        }
        return res;
    }
    return null;
}

function guardarLocal() {
    if (sesion) datos.habituales[miClave()] = datos.habitual;
    const { catalogo, eliminados, stock, lista, listaInicio, habituales, historial, usuarios, solicitudes } = datos;
    escribirLS(CLAVE_LOCAL, { catalogo, eliminados, stock, lista, listaInicio, habituales, historial, usuarios, solicitudes });
}

// =====================================================
//  ARRANQUE
// =====================================================
export async function iniciar(callbacks) {
    avisar = { ...avisar, ...callbacks };

    if (!configurado) {
        const local = datosLocales() || {};
        Object.assign(datos, local);
        datos.lista = convertirLista(local.lista);
        datos.usuarios = datos.usuarios || [];
        datos.solicitudes = datos.solicitudes || [];
        datos.historial = datos.historial || [];
        datos.habituales = local.habituales || {};
        const s = leerLS(CLAVE_SESION_LOCAL);
        if (s && s.tipo === 'admin') sesion = s;
        else if (s) {
            const u = datos.usuarios.find(x => x.telefono === s.telefono);
            sesion = u ? { tipo: 'usuario', nombre: u.nombre, telefono: u.telefono, area: u.area || '' } : null;
        }
        datos.habitual = sesion ? datos.habituales[miClave()] || null : null;
        avisar.alConexion('local');
        avisar.alSesion(sesion, 'local');
        if (sesion) avisar.alCambiar();
        return;
    }

    window.addEventListener('online', () => avisar.alConexion('online'));
    window.addEventListener('offline', () => avisar.alConexion('offline'));
    avisar.alConexion(navigator.onLine ? 'online' : 'offline');

    try {
        const url = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
        const [app, auth, fs] = await Promise.all([
            import(url + 'firebase-app.js'),
            import(url + 'firebase-auth.js'),
            import(url + 'firebase-firestore.js'),
        ]);
        const aplicacion = app.initializeApp(firebaseConfig);
        const au = auth.getAuth(aplicacion);
        let db;
        try {
            // Copia en el teléfono: funciona sin internet y sincroniza al volver
            db = fs.initializeFirestore(aplicacion, {
                localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
            });
        } catch (e) {
            db = fs.getFirestore(aplicacion);
        }
        const R = ['restaurantes', RESTAURANTE_ID];
        const ref = nombre => fs.doc(db, ...R, 'datos', nombre);
        fb = {
            auth, au, fs, db,
            refs: { catalogo: ref('catalogo'), stock: ref('stock'), lista: ref('lista') },
            habitualDe: clave => ref('habitual_' + clave),
            historial: fs.collection(db, ...R, 'historial'),
            usuarios: fs.collection(db, ...R, 'usuarios'),
            solicitudes: fs.collection(db, ...R, 'solicitudes'),
            usuario: tel => fs.doc(db, ...R, 'usuarios', tel),
            sesionDoc: uid => fs.doc(db, ...R, 'sesiones', uid),
        };

        auth.onAuthStateChanged(au, u => revisarSesion(u));
    } catch (e) {
        console.error(e);
        avisar.alSesion(null, 'firebase', { error: 'No se pudo cargar Firebase. Revisa el internet.' });
        avisar.alConexion('error', 'No se pudo cargar Firebase');
    }
}

async function revisarSesion(u) {
    if (entrando) return;          // el inicio con teléfono se encarga
    cancelar();
    sesion = null;
    datos.catalogo = null;
    if (!u) { avisar.alSesion(null, 'firebase'); return; }
    const { fs } = fb;
    try {
        if (!u.isAnonymous) {
            // Administrador: cuenta de correo y contraseña
            if (!adminEmails.includes((u.email || '').toLowerCase())) {
                await fb.auth.signOut(fb.au);
                avisar.alSesion(null, 'firebase', { error: 'Ese correo no es de administrador' });
                return;
            }
            sesion = { tipo: 'admin', nombre: ADMIN_NOMBRE, telefono: '', area: '' };
        } else {
            // Usuario: sesión anónima vinculada a un número registrado
            const ses = await fs.getDoc(fb.sesionDoc(u.uid));
            if (!ses.exists()) { avisar.alSesion(null, 'firebase'); return; }
            const tel = ses.data().telefono;
            const us = await fs.getDoc(fb.usuario(tel));
            if (!us.exists()) {
                await salir();
                avisar.alSesion(null, 'firebase', { error: 'Tu número ya no está registrado' });
                return;
            }
            sesion = { tipo: 'usuario', nombre: us.data().nombre, telefono: tel, area: us.data().area || '' };
        }
        suscribir();
        avisar.alSesion(sesion, 'firebase');
    } catch (e) {
        console.error(e);
        avisar.alSesion(null, 'firebase', { error: 'No se pudo verificar tu acceso. Revisa el internet.' });
    }
}

// =====================================================
//  ENTRAR / SALIR
// =====================================================
export async function entrarConTelefono(texto) {
    const tel = normalizarTelefono(texto);
    if (tel.length < 10) throw { code: 'numero-invalido' };

    if (!configurado) {
        const u = datos.usuarios.find(x => x.telefono === tel);
        if (!u) throw { code: 'no-registrado' };
        sesion = { tipo: 'usuario', nombre: u.nombre, telefono: tel, area: u.area || '' };
        datos.habitual = datos.habituales[miClave()] || null;
        escribirLS(CLAVE_SESION_LOCAL, sesion);
        avisar.alSesion(sesion, 'local');
        avisar.alCambiar();
        return sesion;
    }

    if (!fb) throw { code: 'no-cargado' };
    const { auth, au, fs } = fb;
    entrando = true;
    try {
        if (!au.currentUser || !au.currentUser.isAnonymous) {
            if (au.currentUser) await auth.signOut(au);
            await auth.signInAnonymously(au);
        }
        const us = await fs.getDoc(fb.usuario(tel));
        if (!us.exists()) throw { code: 'no-registrado' };
        await fs.setDoc(fb.sesionDoc(au.currentUser.uid), { telefono: tel, fecha: Date.now() });
        cancelar();
        sesion = { tipo: 'usuario', nombre: us.data().nombre, telefono: tel, area: us.data().area || '' };
        suscribir();
        avisar.alSesion(sesion, 'firebase');
        return sesion;
    } finally {
        entrando = false;
    }
}

export async function entrarAdmin(email, clave) {
    if (!configurado) {
        sesion = { tipo: 'admin', nombre: ADMIN_NOMBRE, telefono: '', area: '' };
        datos.habitual = datos.habituales[miClave()] || null;
        escribirLS(CLAVE_SESION_LOCAL, sesion);
        avisar.alSesion(sesion, 'local');
        avisar.alCambiar();
        return sesion;
    }
    if (!fb) throw { code: 'no-cargado' };
    if (!adminEmails.includes(String(email).trim().toLowerCase())) throw { code: 'no-admin' };
    await fb.auth.signInWithEmailAndPassword(fb.au, email, clave);
    return null;   // revisarSesion() completa el ingreso
}

export async function salir() {
    cancelar();
    if (!configurado) {
        sesion = null;
        borrarLS(CLAVE_SESION_LOCAL);
        avisar.alSesion(null, 'local');
        return;
    }
    if (!fb) return;
    const u = fb.au.currentUser;
    if (u && u.isAnonymous) {
        try { await fb.fs.deleteDoc(fb.sesionDoc(u.uid)); } catch (e) { /* sin conexión */ }
    }
    sesion = null;
    await fb.auth.signOut(fb.au);
}

export function recuperarClave(email) {
    if (!fb) return Promise.reject({ code: 'no-cargado' });
    return fb.auth.sendPasswordResetEmail(fb.au, email);
}

// =====================================================
//  LECTURAS EN VIVO
// =====================================================
function cancelar() { desuscribir.forEach(f => f()); desuscribir = []; }

let avisoRetirado = false;
function errorLectura(e) {
    console.error(e);
    if (e.code === 'permission-denied' && sesion && sesion.tipo === 'usuario') {
        if (avisoRetirado) return;
        avisoRetirado = true;
        salir().finally(() => {
            avisoRetirado = false;
            avisar.alSesion(null, 'firebase', { error: 'El administrador retiró tu acceso' });
        });
        return;
    }
    avisar.alConexion('error', e.code === 'permission-denied'
        ? 'Sin permiso: revisa las reglas de Firestore' : 'Error al leer datos');
}

function suscribir() {
    const { fs, refs } = fb;
    let listo = false;
    const notificar = () => { if (listo) avisar.alCambiar(); };

    desuscribir.push(fs.onSnapshot(refs.catalogo, async snap => {
        if (!snap.exists()) {
            if (snap.metadata.fromCache) return;          // esperar la respuesta del servidor
            if (esAdmin()) { await sembrar(); return; }   // primera vez: sube lo de este aparato
            datos.catalogo = [];                          // el catálogo base se muestra igual
        } else {
            const d = snap.data();
            datos.catalogo = d.categorias || [];
            datos.eliminados = d.eliminados || [];
        }
        listo = true;
        avisar.alCambiar();
    }, errorLectura));

    desuscribir.push(fs.onSnapshot(refs.stock, snap => {
        datos.stock = snap.data() || {}; notificar();
    }, errorLectura));
    desuscribir.push(fs.onSnapshot(refs.lista, snap => {
        const d = snap.data() || {};
        datos.lista = convertirLista(d.items);
        datos.listaInicio = d.inicio || null;
        notificar();
    }, errorLectura));
    desuscribir.push(fs.onSnapshot(fb.habitualDe(miClave()), snap => {
        datos.habitual = (snap.data() || {}).items || null; notificar();
    }, errorLectura));
    desuscribir.push(fs.onSnapshot(fb.historial, snap => {
        datos.historial = snap.docs.map(d => ({ ...d.data(), id: d.id }))
            .sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
        notificar();
    }, errorLectura));
    desuscribir.push(fs.onSnapshot(fb.usuarios, snap => {
        datos.usuarios = snap.docs.map(d => ({ ...d.data(), telefono: d.id }));
        notificar();
    }, errorLectura));
    desuscribir.push(fs.onSnapshot(fb.solicitudes, snap => {
        datos.solicitudes = snap.docs.map(d => ({ ...d.data(), id: d.id }))
            .sort((a, b) => (a.fecha || 0) - (b.fecha || 0));
        notificar();
    }, errorLectura));
}

async function sembrar() {
    const local = datosLocales() || {};
    const { fs, db, refs } = fb;
    const lote = fs.writeBatch(db);
    lote.set(refs.catalogo, { categorias: local.catalogo || [], eliminados: local.eliminados || [] });
    lote.set(refs.stock, local.stock || {});
    lote.set(refs.lista, { items: convertirLista(local.lista), inicio: Date.now() });
    try { await lote.commit(); } catch (e) { errorLectura(e); }
}

// =====================================================
//  ESCRITURAS
// =====================================================
function avisarErrorEscritura(e) {
    console.error(e);
    avisar.alConexion('error', e.code === 'permission-denied' ? 'Sin permiso para guardar' : 'No se pudo guardar');
}
function escribir(nombre, valor, merge = true) {
    if (!configurado) { guardarLocal(); return; }
    if (!fb || !sesion) return;
    fb.fs.setDoc(fb.refs[nombre], valor, { merge }).catch(avisarErrorEscritura);
}
const borrar = () => (fb ? fb.fs.deleteField() : null);

export function guardarCatalogo() {
    if (!esAdmin()) return;   // solo el administrador cambia el catálogo
    escribir('catalogo', { categorias: datos.catalogo, eliminados: datos.eliminados || [] }, false);
}
export function guardarStock(cat, prod) {
    const v = (datos.stock[cat] || {})[prod];
    escribir('stock', { [cat]: { [prod]: v ? { hay: v.hay, fecha: v.fecha, por: v.por || '' } : borrar() } });
}
export function borrarStockCategoria(cat) {
    escribir('stock', { [cat]: borrar() });
}
// Guarda SOLO el pedido de una persona para un producto (no toca los pedidos de los demás)
export function guardarPedido(cat, prod, clave) {
    const e = (datos.lista[cat] || {})[prod];
    if (!e) return;
    const p = (e.pedidos || {})[clave];
    escribir('lista', { items: { [cat]: { [prod]: {
        unidad: e.unidad || '', pendiente: !!e.pendiente,
        pedidos: { [clave]: p ? { cantidad: p.cantidad, nombre: p.nombre || '', area: p.area || '', fecha: p.fecha || Date.now() } : borrar() }
    } } } });
}
// Guarda unidad/pendiente de un producto, o lo quita de la lista si ya no está
export function guardarEntrada(cat, prod) {
    const e = (datos.lista[cat] || {})[prod];
    escribir('lista', { items: { [cat]: { [prod]: e ? { unidad: e.unidad || '', pendiente: !!e.pendiente } : borrar() } } });
}
export function borrarListaCategoria(cat) {
    escribir('lista', { items: { [cat]: borrar() } });
}
// Empieza una lista nueva (al cerrar la semana)
export function borrarLista() {
    datos.listaInicio = Date.now();
    escribir('lista', { items: {}, inicio: datos.listaInicio }, false);
}
export function guardarHabitual() {
    if (!configurado) { guardarLocal(); return; }
    if (!fb || !sesion) return;
    fb.fs.setDoc(fb.habitualDe(miClave()), { items: datos.habitual || {} }).catch(avisarErrorEscritura);
}
// Guarda la lista de la semana en el historial
export async function guardarHistorial(registro) {
    const r = { ...registro, fecha: Date.now(), por: nombreUsuario() };
    if (!configurado) {
        datos.historial.unshift({ ...r, id: 'H' + Date.now() });
        datos.historial = datos.historial.slice(0, 30);
        guardarLocal();
        return;
    }
    await fb.fs.addDoc(fb.historial, r);
}

// ----- Usuarios (solo administrador) -----
export async function guardarUsuario(nombre, telefonoTexto, area) {
    const telefono = normalizarTelefono(telefonoTexto);
    nombre = String(nombre || '').trim();
    area = String(area || '').trim();
    if (!nombre) throw { code: 'sin-nombre' };
    if (telefono.length < 10) throw { code: 'numero-invalido' };
    const u = { nombre, telefono, area, creado: Date.now() };
    datos.usuarios = datos.usuarios.filter(x => x.telefono !== telefono).concat(u);
    if (!configurado) { guardarLocal(); return u; }
    await fb.fs.setDoc(fb.usuario(telefono), { nombre, area, creado: u.creado });
    return u;
}
export async function borrarUsuario(telefono) {
    datos.usuarios = datos.usuarios.filter(x => x.telefono !== telefono);
    if (!configurado) { guardarLocal(); return; }
    await fb.fs.deleteDoc(fb.usuario(telefono));
}

// ----- Solicitudes de productos/categorías nuevas -----
export async function enviarSolicitud(sol) {
    const s = { ...sol, por: nombreUsuario(), telefono: sesion ? sesion.telefono : '', fecha: Date.now() };
    if (!configurado) {
        datos.solicitudes.push({ ...s, id: 'L' + Date.now() + Math.random().toString(36).slice(2, 6) });
        guardarLocal();
        return;
    }
    await fb.fs.addDoc(fb.solicitudes, s);
}
export async function cerrarSolicitud(id) {
    datos.solicitudes = datos.solicitudes.filter(s => s.id !== id);
    if (!configurado) { guardarLocal(); return; }
    await fb.fs.deleteDoc(fb.fs.doc(fb.solicitudes, id));
}
