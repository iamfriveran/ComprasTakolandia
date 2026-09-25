// =====================================================
//  ALMACÉN DE DATOS: Firebase (compartido) o local
// =====================================================
import { firebaseConfig, RESTAURANTE_ID, FIREBASE_VERSION } from './firebase-config.js';

export const configurado = Boolean(firebaseConfig.apiKey) && !/^PEGA/.test(firebaseConfig.apiKey);

// Datos que ve la app. En modo Firebase se actualizan solos cuando otro teléfono cambia algo.
//   catalogo:  [{ nombre, emoji, productos: [] }]
//   eliminados: productos/categorías base que se quitaron ("Cat|Prod" o "Cat|")
//   stock:     { Cat: { Prod: { hay, fecha, por } } }
//   lista:     { Cat: [{ nombre, cantidad, unidad }] }
//   habitual:  igual que lista
export const datos = { catalogo: null, eliminados: [], stock: {}, lista: {}, habitual: null };

const CLAVE_LOCAL = 'comprafacil-takolandia-v3';
let fb = null;
let usuario = null;
let desuscribir = [];
let avisar = { alCambiar() {}, alSesion() {}, alConexion() {} };

function leerLS(k) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function escribirLS(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ }
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

// ----- ARRANQUE -----
export async function iniciar(callbacks) {
    avisar = { ...avisar, ...callbacks };

    if (!configurado) {
        Object.assign(datos, datosLocales() || {});
        avisar.alSesion(null, 'local');
        avisar.alConexion('local');
        avisar.alCambiar();
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
            // Guarda una copia en el teléfono: funciona sin internet y sincroniza al volver
            db = fs.initializeFirestore(aplicacion, {
                localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
            });
        } catch (e) {
            db = fs.getFirestore(aplicacion);
        }
        const ref = nombre => fs.doc(db, 'restaurantes', RESTAURANTE_ID, 'datos', nombre);
        fb = { auth, au, fs, db, refs: {
            catalogo: ref('catalogo'), stock: ref('stock'), lista: ref('lista'), habitual: ref('habitual') } };

        auth.onAuthStateChanged(au, u => {
            usuario = u;
            cancelar();
            if (u) suscribir(); else datos.catalogo = null;
            avisar.alSesion(u, 'firebase');
        });
    } catch (e) {
        console.error(e);
        avisar.alSesion(null, 'error');
        avisar.alConexion('error', 'No se pudo cargar Firebase. Revisa el internet.');
    }
}

function cancelar() { desuscribir.forEach(f => f()); desuscribir = []; }

function errorLectura(e) {
    console.error(e);
    avisar.alConexion('error', e.code === 'permission-denied'
        ? 'Sin permiso: revisa las reglas de Firestore' : 'Error al leer datos');
}

function suscribir() {
    const { fs, refs } = fb;
    let listo = false;
    const notificar = () => { if (listo) avisar.alCambiar(); };

    desuscribir.push(fs.onSnapshot(refs.catalogo, async snap => {
        if (!snap.exists()) {
            if (snap.metadata.fromCache) return;   // esperar la respuesta del servidor
            await sembrar();                       // primera vez: sube lo que hay en este aparato
            return;
        }
        const d = snap.data();
        datos.catalogo = d.categorias || [];
        datos.eliminados = d.eliminados || [];
        listo = true;
        avisar.alCambiar();
    }, errorLectura));

    desuscribir.push(fs.onSnapshot(refs.stock, snap => {
        datos.stock = snap.data() || {}; notificar();
    }, errorLectura));
    desuscribir.push(fs.onSnapshot(refs.lista, snap => {
        datos.lista = (snap.data() || {}).items || {}; notificar();
    }, errorLectura));
    desuscribir.push(fs.onSnapshot(refs.habitual, snap => {
        datos.habitual = (snap.data() || {}).items || null; notificar();
    }, errorLectura));
}

async function sembrar() {
    const local = datosLocales() || {};
    const { fs, db, refs } = fb;
    const lote = fs.writeBatch(db);
    lote.set(refs.catalogo, { categorias: local.catalogo || [], eliminados: local.eliminados || [] });
    lote.set(refs.stock, local.stock || {});
    lote.set(refs.lista, { items: local.lista || {} });
    if (local.habitual) lote.set(refs.habitual, { items: local.habitual });
    try { await lote.commit(); } catch (e) { errorLectura(e); }
}

// ----- ESCRITURAS -----
function escribir(nombre, valor, merge = true) {
    if (!configurado) { escribirLS(CLAVE_LOCAL, datos); return; }
    if (!fb || !usuario) return;
    fb.fs.setDoc(fb.refs[nombre], valor, { merge }).catch(e => {
        console.error(e);
        avisar.alConexion('error', e.code === 'permission-denied' ? 'Sin permiso para guardar' : 'No se pudo guardar');
    });
}
const borrar = () => (fb ? fb.fs.deleteField() : null);

export function guardarCatalogo() {
    escribir('catalogo', { categorias: datos.catalogo, eliminados: datos.eliminados || [] }, false);
}
export function guardarStock(cat, prod) {
    const v = (datos.stock[cat] || {})[prod];
    escribir('stock', { [cat]: { [prod]: v ? { hay: v.hay, fecha: v.fecha, por: v.por || '' } : borrar() } });
}
export function borrarStockCategoria(cat) {
    escribir('stock', { [cat]: borrar() });
}
export function guardarLista(cat) {
    const arr = datos.lista[cat];
    escribir('lista', { items: { [cat]: arr && arr.length ? arr : borrar() } });
}
export function borrarLista() {
    escribir('lista', { items: {} }, false);
}
export function guardarHabitual() {
    escribir('habitual', { items: datos.habitual || {} }, false);
}

// ----- SESIÓN -----
export function entrar(email, clave) {
    if (!fb) return Promise.reject({ code: 'no-cargado' });
    return fb.auth.signInWithEmailAndPassword(fb.au, email, clave);
}
export function salir() { return fb ? fb.auth.signOut(fb.au) : Promise.resolve(); }
export function recuperarClave(email) {
    if (!fb) return Promise.reject({ code: 'no-cargado' });
    return fb.auth.sendPasswordResetEmail(fb.au, email);
}
export function nombreUsuario() {
    if (!usuario) return '';
    return usuario.displayName || (usuario.email || '').split('@')[0];
}
