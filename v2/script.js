// =====================================================
//  COMPRAFÁCIL · Compras Takolandia
// =====================================================
import * as A from './almacen.js';

const datos = A.datos;

// ----- CONFIGURACIÓN -----
const NOMBRE_NEGOCIO = 'Takolandia';

const UNIDADES = ['', 'unid', 'kg', 'lb', 'g', 'litro', 'galón', 'caja', 'funda',
                  'paq', 'docena', 'saco', 'jaba', 'botella', 'six pack', 'rollo'];

const EMOJIS = ['🛒', '🌾', '🏪', '🥩', '🐔', '🐟', '🦐', '🧀', '🥛', '🌮', '🌯', '🌶️',
                '🥑', '🍅', '🧅', '🍋', '🍍', '🥬', '🥤', '🍺', '🍹', '🧊', '🍬', '🧂',
                '🍞', '🛍️', '🥡', '🧻', '🧹', '🧽', '🔥', '📦', '⭐'];

// ----- CATÁLOGO BASE DE TAKOLANDIA -----
// Punto de partida. Lo que agregues desde la app se guarda en la base de datos.
const CATEGORIAS_BASE = {
    'Mayorista': {
        emoji: '🌾',
        productos: ['Aguacates', 'Cebolla', 'Limones', 'Pimiento rojo', 'Pimiento verde', 'Piñas', 'Tomate rojo', 'Tomate verde', 'Aji rocoto', 'Ajo', 'Hiervitas']
    },
    'Supermaxi': {
        emoji: '🏪',
        productos: ['Tortillas de tacos', 'Tortilla de burritos', 'Tortilla de Flautas', 'Esencia de coco', 'Leche condensada', 'Crema de coco', 'Crema de Leche', 'Hielo', 'Tajin', 'Achiote', 'Gomitas', 'Lechuga', 'Fréjol', 'Menta caramelo', 'Leche 6 pack', 'Menta - hierba', 'Zumo de limón', 'Sal', 'Vinagre', 'Jalapeño', 'Chamoy', 'Salsa china', 'Zumo de maracuyá', 'Zumo de Tamarindo', 'Zumo de Mango']
    },
    'Carnes': {
        emoji: '🥩',
        productos: ['Pulpa de res', 'Pulpa de cerdo', 'Pechuga', 'Estofado', 'Chorizo', 'Camarón']
    },
    'Lacteos': {
        emoji: '🧀',
        productos: ['Queso Mozarella', 'Queso Cheddar', 'Leches', 'Salsa Agria', 'Salsa Cheddar']
    },
    'Nachos': {
        emoji: '🌮',
        productos: ['1K de Nachos', '2K de Nachos', '3K de Nachos', '4K de Nachos', '5K de Nachos']
    },
    'Plasticos': {
        emoji: '🛍️',
        productos: ['Lonchera grande', 'Lonchera pequeña', 'Vasos de Michelada con tapa', 'Sorbetes', 'Botellas con tapa', 'Salseros con tapa', 'Servilletas', 'Fundas para despachar', 'Fundas de basura']
    },
    'Licores': {
        emoji: '🍺',
        productos: ['Pilsener Grande', 'Pilsener Personal', 'Club Grande', 'Club Personal', 'Corona Personal', 'Coronita', 'Tekila', 'Ron', 'Triple Seco', 'Toronja Imperial', 'Jugo de Naranja', 'Botellón de agua']
    },
    'Limpieza': {
        emoji: '🧹',
        productos: ['Cloro', 'Desinfectante', 'Quita Grasa', 'Escoba', 'Trapeador', 'Guantes', 'Balde']
    }
};

// ----- AYUDANTES -----
const $ = id => document.getElementById(id);
const igual = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
const ordenar = arr => [...arr].sort((a, b) => a.localeCompare(b, 'es'));

function el(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
}
function boton(clase, texto, alTocar, etiqueta) {
    const b = el('button', clase, texto);
    b.type = 'button';
    if (etiqueta) b.setAttribute('aria-label', etiqueta);
    if (alTocar) b.onclick = alTocar;
    return b;
}
function leerLocal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function escribirLocal(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* nada */ } }

const buscarCat = n => (datos.catalogo || []).find(c => igual(c.nombre, n));
// ----- Lista de compras: cada persona tiene su propio pedido por producto -----
const AREAS = ['Cocina', 'Cafetería / Mesas', 'Administración', 'Otra'];
const ICONO_AREA = { 'Cocina': '🍳', 'Cafetería / Mesas': '☕', 'Administración': '👑', 'Otra': '👤' };
const iconoArea = a => ICONO_AREA[a] || '👤';

const pedidosDe = e => Object.entries((e && e.pedidos) || {})
    .map(([clave, p]) => ({ clave, ...p }))
    .filter(p => Number(p.cantidad) > 0)
    .sort((a, b) => (a.fecha || 0) - (b.fecha || 0));
const totalDe = pedidos => Math.round(pedidos.reduce((s, p) => s + Number(p.cantidad || 0), 0) * 100) / 100;

// Productos de una categoría que alguien pidió: [{ nombre, unidad, pendiente, pedidos, total, mio }]
function itemsDe(catNombre) {
    const mapa = datos.lista[catNombre] || {};
    const clave = A.miClave();
    return Object.keys(mapa)
        .map(nombre => {
            const e = mapa[nombre];
            const pedidos = pedidosDe(e);
            return { nombre, unidad: e.unidad || '', pendiente: !!e.pendiente, pedidos,
                     total: totalDe(pedidos), mio: pedidos.find(p => p.clave === clave) || null };
        })
        .filter(i => i.pedidos.length)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
const itemDe = (catNombre, prod) => itemsDe(catNombre).find(i => igual(i.nombre, prod)) || null;

// Pone o cambia MI pedido de un producto
function pedir(catNombre, prod, cantidad, extra = {}) {
    const mapa = datos.lista[catNombre] || (datos.lista[catNombre] = {});
    const nombre = Object.keys(mapa).find(x => igual(x, prod)) || prod;
    const e = mapa[nombre] || (mapa[nombre] = { unidad: '', pendiente: false, pedidos: {} });
    e.pedidos = e.pedidos || {};
    if (extra.pendiente) e.pendiente = true;
    if (extra.unidad && !e.unidad) e.unidad = extra.unidad;
    const s = A.sesionActual() || {};
    e.pedidos[A.miClave()] = { cantidad, nombre: s.nombre || '', area: s.area || '', fecha: Date.now() };
    A.guardarPedido(catNombre, nombre, A.miClave());
    return nombre;
}
function quitarMiPedido(catNombre, prod) {
    const e = (datos.lista[catNombre] || {})[prod];
    if (!e || !e.pedidos) return;
    delete e.pedidos[A.miClave()];
    A.guardarPedido(catNombre, prod, A.miClave());
}
// Quita el producto completo (todos los pedidos). Lo usa el administrador.
function quitarDeLaLista(catNombre, prod) {
    const mapa = datos.lista[catNombre] || {};
    const nombre = Object.keys(mapa).find(x => igual(x, prod));
    if (!nombre) return;
    delete mapa[nombre];
    A.guardarEntrada(catNombre, nombre);
}
const stockDe = (cat, prod) => (datos.stock[cat] || {})[prod] || null;
const esBase = (cat, prod) => !!CATEGORIAS_BASE[cat] && CATEGORIAS_BASE[cat].productos.some(p => igual(p, prod));
const esAgotado = hay => /^0+([.,]0+)?(\s|$)/.test(String(hay || '').trim());

function hace(ms) {
    if (!ms) return '';
    const min = Math.round((Date.now() - ms) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ayer' : `hace ${d} días`;
}

// ----- ESTADO DE LA PANTALLA -----
let modo = ['inventario', 'admin'].includes(leerLocal('comprafacil-modo')) ? leerLocal('comprafacil-modo') : 'compras';
const editando = new Set();                       // categorías con el panel ⚙️ abierto
const borrador = { nombre: '', emoji: EMOJIS[0] }; // tarjeta "Nueva categoría"
const borradorUsuario = { nombre: '', telefono: '', area: 'Cocina' }; // formulario de usuarios (admin)
let renderPendiente = false;

// Agrega al catálogo los productos base que falten (sin revivir los que borraste)
function completarConBase() {
    let cambio = false;
    if (!Array.isArray(datos.catalogo)) { datos.catalogo = []; cambio = true; }
    datos.catalogo.forEach(c => {
        if (!c.emoji) { c.emoji = (CATEGORIAS_BASE[c.nombre] || {}).emoji || '🛒'; cambio = true; }
        if (!Array.isArray(c.productos)) { c.productos = []; cambio = true; }
    });
    const elim = new Set(datos.eliminados || []);
    for (const nombre in CATEGORIAS_BASE) {
        if (elim.has(nombre + '|')) continue;
        let cat = buscarCat(nombre);
        if (!cat) {
            cat = { nombre, emoji: CATEGORIAS_BASE[nombre].emoji, productos: [] };
            datos.catalogo.push(cat);
            cambio = true;
        }
        CATEGORIAS_BASE[nombre].productos.forEach(p => {
            if (!elim.has(nombre + '|' + p) && !cat.productos.some(x => igual(x, p))) {
                cat.productos.push(p);
                cambio = true;
            }
        });
    }
    return cambio;
}

// ----- DIBUJAR -----
// Si alguien está escribiendo, esperamos a que termine para no borrarle lo que teclea.
const escribiendo = () => {
    const a = document.activeElement;
    return !!(a && a.matches && a.matches('#contenedor-categorias input'));
};
function pedirRender() {
    if (escribiendo()) { renderPendiente = true; return; }
    render();
}
document.addEventListener('focusout', () => setTimeout(() => {
    if (renderPendiente && !escribiendo()) { renderPendiente = false; render(); }
}, 60));

function render() {
    if (!datos.catalogo) return;
    const foco = document.activeElement && document.activeElement.dataset
        ? document.activeElement.dataset.foco : null;

    const admin = A.esAdmin();
    if (modo === 'admin' && !admin) modo = 'compras';
    document.body.dataset.modo = modo;
    [['tabCompras', 'compras'], ['tabInventario', 'inventario'], ['tabAdmin', 'admin']].forEach(([id, m]) => {
        $(id).classList.toggle('activo', modo === m);
        $(id).setAttribute('aria-selected', modo === m);
    });
    $('tabAdmin').classList.toggle('oculto', !admin);
    $('btnCerrarSemana').classList.toggle('oculto', !admin);
    const pendientes = datos.solicitudes.length;
    $('badge-solicitudes').textContent = pendientes;
    $('badge-solicitudes').classList.toggle('oculto', !admin || !pendientes);

    const cont = $('contenedor-categorias');
    cont.innerHTML = '';
    if (modo === 'admin') {
        cont.appendChild(tarjetaSolicitudes());
        cont.appendChild(tarjetaUsuarios());
        cont.appendChild(tarjetaHistorial());
    } else {
        datos.catalogo.forEach(cat =>
            cont.appendChild(modo === 'compras' ? tarjetaCompras(cat) : tarjetaInventario(cat)));
        if (modo === 'compras') cont.appendChild(tarjetaNuevaCategoria());
    }

    if (foco) {
        const e = [...cont.querySelectorAll('[data-foco]')].find(x => x.dataset.foco === foco);
        if (e) e.focus({ preventScroll: true });
    }
    actualizarResumen();
}

function encabezado(cat, conEditar) {
    const head = el('div', 'cat-header');
    head.appendChild(el('h2', '', `${cat.emoji} ${cat.nombre}`));
    const der = el('div', 'cat-derecha');
    if (modo === 'compras') {
        const n = itemsDe(cat.nombre).length;
        der.appendChild(el('span', 'badge' + (n ? ' activo' : ''), n));
    } else {
        const agotados = cat.productos.filter(p => esAgotado((stockDe(cat.nombre, p) || {}).hay)).length;
        if (agotados) der.appendChild(el('span', 'badge agotado', `${agotados} agotado${agotados > 1 ? 's' : ''}`));
    }
    if (conEditar && A.esAdmin()) {
        const b = boton('btn-icono' + (editando.has(cat.nombre) ? ' activo' : ''), '⚙️', () => {
            editando.has(cat.nombre) ? editando.delete(cat.nombre) : editando.add(cat.nombre);
            render();
        }, 'Editar ' + cat.nombre);
        b.title = 'Editar productos de la categoría';
        der.appendChild(b);
    }
    head.appendChild(der);
    return head;
}

// ===== Vista COMPRAS =====
function tarjetaCompras(cat) {
    const items = itemsDe(cat.nombre);
    const card = el('section', 'categoria');
    card.dataset.cat = cat.nombre;
    card.appendChild(encabezado(cat, true));

    card.appendChild(buscador(cat, items));

    const ul = el('ul', 'items');
    items.forEach(it => ul.appendChild(filaCompra(cat, it)));
    card.appendChild(ul);

    if (editando.has(cat.nombre) && A.esAdmin()) card.appendChild(panelEditar(cat));
    return card;
}

// ----- Buscador: escribe las primeras letras o toca para ver todos -----
const normal = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
let idBuscador = 0;

function opcionesDe(cat, items, texto) {
    const q = normal(texto);
    const enLista = p => items.some(i => i.mio && igual(i.nombre, p));
    if (!q) return ordenar(cat.productos).filter(p => !enLista(p)).map(p => ({ tipo: 'prod', nombre: p }));

    const encontrados = [];
    cat.productos.forEach(p => {
        const n = normal(p);
        let puntos = -1;
        if (n.startsWith(q)) puntos = 0;                                     // empieza igual
        else if (n.split(/[\s\-\/]+/).some(w => w.startsWith(q))) puntos = 1; // alguna palabra empieza igual
        else if (n.includes(q)) puntos = 2;                                  // lo contiene
        if (puntos >= 0) encontrados.push({ tipo: enLista(p) ? 'ya' : 'prod', nombre: p, puntos });
    });
    encontrados.sort((a, b) => (a.tipo === 'ya') - (b.tipo === 'ya') || a.puntos - b.puntos
        || a.nombre.localeCompare(b.nombre, 'es'));
    if (!cat.productos.some(p => normal(p) === q)) {
        const nombre = texto.trim();
        encontrados.push({ tipo: 'nuevo', nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1) });
    }
    return encontrados;
}

function buscador(cat, items) {
    const caja = el('div', 'buscador');
    const idLista = 'opciones-' + (++idBuscador);
    const inp = el('input', 'buscar');
    const libres = cat.productos.filter(p => !items.some(i => i.mio && igual(i.nombre, p))).length;
    inp.type = 'search';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    inp.placeholder = cat.productos.length
        ? (libres ? `🔍 Buscar o elegir (${libres})` : '✔ Todo agregado · escribe para crear')
        : '🔍 Escribe el primer producto';
    inp.dataset.foco = 'dd|' + cat.nombre;
    inp.setAttribute('role', 'combobox');
    inp.setAttribute('aria-label', 'Buscar producto de ' + cat.nombre);
    inp.setAttribute('aria-controls', idLista);
    inp.setAttribute('aria-expanded', 'false');

    const lista = el('ul', 'opciones oculto');
    lista.id = idLista;
    lista.setAttribute('role', 'listbox');

    let opciones = [], activo = 0;

    const cerrar = () => { lista.classList.add('oculto'); inp.setAttribute('aria-expanded', 'false'); };
    const elegir = o => {
        if (o.tipo === 'ya') { aviso('Ya lo pediste. Cambia la cantidad en la lista.'); return; }
        inp.value = '';
        if (o.tipo === 'nuevo') A.esAdmin() ? nuevoProducto(cat, o.nombre, true) : pedirProducto(cat, o.nombre);
        else agregar(cat, o.nombre);
    };
    const pintar = () => {
        const q = normal(inp.value);
        opciones = opcionesDe(cat, items, inp.value);
        activo = Math.min(activo, Math.max(opciones.length - 1, 0));
        lista.innerHTML = '';
        if (!opciones.length) lista.appendChild(el('li', 'opcion vacia', 'Escribe el nombre del producto'));
        opciones.forEach((o, i) => {
            const li = el('li', `opcion ${o.tipo}${i === activo ? ' activa' : ''}`);
            li.setAttribute('role', 'option');
            const nombre = el('span', 'opcion-nombre');
            if (o.tipo === 'nuevo') {
                nombre.append(A.esAdmin() ? '➕ Agregar «' : '📨 Pedir «');
                nombre.appendChild(el('b', '', o.nombre));
                nombre.append(A.esAdmin() ? '» como nuevo' : '» al administrador');
            } else {
                // resalta las letras que coinciden
                const i0 = q ? normal(o.nombre).indexOf(q) : -1;
                if (i0 >= 0) {
                    nombre.append(o.nombre.slice(0, i0));
                    nombre.appendChild(el('b', '', o.nombre.slice(i0, i0 + q.length)));
                    nombre.append(o.nombre.slice(i0 + q.length));
                } else nombre.textContent = o.nombre;
            }
            li.appendChild(nombre);
            if (o.tipo === 'ya') li.appendChild(el('small', 'opcion-extra', '✓ ya lo pediste'));
            else if (o.tipo === 'prod') {
                const otros = items.find(i => igual(i.nombre, o.nombre));
                const s = stockDe(cat.nombre, o.nombre);
                if (otros) li.appendChild(el('small', 'opcion-extra otros',
                    '📝 ' + otros.pedidos.map(x => x.nombre).join(', ')));
                else if (s) li.appendChild(el('small', 'opcion-extra' + (esAgotado(s.hay) ? ' agotado' : ''),
                    esAgotado(s.hay) ? '⚠️ agotado' : 'hay ' + s.hay));
            }
            li.onmousedown = e => e.preventDefault();   // no cerrar el teclado al tocar
            li.onclick = () => elegir(o);
            lista.appendChild(li);
        });
        lista.classList.remove('oculto');
        inp.setAttribute('aria-expanded', 'true');
        const act = lista.querySelector('.activa');
        if (act) act.scrollIntoView({ block: 'nearest' });
    };

    inp.onfocus = () => { activo = 0; pintar(); };
    inp.oninput = () => { activo = 0; pintar(); };
    inp.onblur = () => setTimeout(cerrar, 150);
    inp.onkeydown = e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); activo = Math.min(activo + 1, opciones.length - 1); pintar(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); activo = Math.max(activo - 1, 0); pintar(); }
        else if (e.key === 'Enter') { e.preventDefault(); if (inp.value.trim() && opciones[activo]) elegir(opciones[activo]); }
        else if (e.key === 'Escape') { inp.value = ''; cerrar(); inp.blur(); }
    };

    caja.append(inp, lista);
    return caja;
}

function filaCompra(cat, it) {
    const s = stockDe(cat.nombre, it.nombre);
    const li = el('li', 'item' + (esBase(cat.nombre, it.nombre) ? '' : ' personalizado')
                     + (s && esAgotado(s.hay) ? ' agotado' : '') + (it.pendiente ? ' pendiente' : '')
                     + (it.mio ? ' mio' : ''));
    if (it.pendiente) li.title = 'Producto nuevo esperando aprobación del administrador';

    li.appendChild(el('span', 'item-nombre', it.nombre));
    // ✕ quita MI pedido. El administrador puede quitar el producto completo.
    if (it.mio) {
        li.appendChild(boton('quitar', '✕', () => {
            quitarMiPedido(cat.nombre, it.nombre);
            render();
            aviso(it.pedidos.length > 1 ? 'Quitaste tu pedido (los demás se mantienen)' : `${it.nombre} salió de la lista`);
        }, 'Quitar mi pedido'));
    } else if (A.esAdmin()) {
        const x = boton('quitar', '✕', null, 'Quitar de la lista');
        x.onclick = () => confirmarDosToques(x, '¿Quitar?', () => { quitarDeLaLista(cat.nombre, it.nombre); render(); });
        li.appendChild(x);
    } else li.appendChild(el('span', 'quitar'));

    // Hay (stock compartido)
    const campoHay = el('label', 'campo campo-hay');
    campoHay.appendChild(el('span', '', 'Hay'));
    const hay = el('input', 'input-hay');
    hay.type = 'text'; hay.placeholder = '—'; hay.maxLength = 14;
    hay.value = s ? s.hay : '';
    hay.dataset.foco = 'hay|' + cat.nombre + '|' + it.nombre;
    if (s) hay.title = `Actualizado ${hace(s.fecha)}${s.por ? ' por ' + s.por : ''}`;
    hay.onchange = () => fijarStock(cat.nombre, it.nombre, hay.value);
    campoHay.appendChild(hay);
    li.appendChild(campoHay);

    // Mi pedido
    const campoComprar = el('div', 'campo campo-comprar');
    campoComprar.appendChild(el('span', '', 'Yo pido'));
    const caja = el('div', 'cantidad');
    const q = el('input');
    q.type = 'number'; q.min = '0'; q.step = '0.5'; q.inputMode = 'decimal';
    q.setAttribute('aria-label', 'Mi cantidad');
    q.dataset.foco = 'q|' + cat.nombre + '|' + it.nombre;
    q.value = it.mio ? it.mio.cantidad : 0;
    const fijar = v => {
        v = Math.round(v * 100) / 100;
        if (v <= 0) {
            if (!it.mio) { q.value = 0; return; }
            quitarMiPedido(cat.nombre, it.nombre);
            render();
            return;
        }
        pedir(cat.nombre, it.nombre, v);
        q.value = v;
        if (!it.mio) render(); else pedirRender();
    };
    q.onchange = () => fijar(parseFloat(q.value) || 0);
    caja.append(
        boton('menos', '−', () => fijar(Math.max((parseFloat(q.value) || 0) - 1, it.mio && q.value > 1 ? 0.5 : 0)), 'Menos'),
        q,
        boton('mas', '+', () => fijar((parseFloat(q.value) || 0) + 1), 'Más'));
    campoComprar.appendChild(caja);
    li.appendChild(campoComprar);

    // Unidad (la misma para todos)
    const campoU = el('label', 'campo campo-unidad');
    campoU.appendChild(el('span', '', 'Unidad'));
    const u = el('select', 'unidad');
    u.dataset.foco = 'u|' + cat.nombre + '|' + it.nombre;
    (UNIDADES.includes(it.unidad) ? UNIDADES : [...UNIDADES, it.unidad])
        .forEach(x => u.appendChild(new Option(x || '—', x)));
    u.value = it.unidad || '';
    u.onchange = () => {
        const e = datos.lista[cat.nombre][it.nombre];
        e.unidad = u.value;
        A.guardarEntrada(cat.nombre, it.nombre);
        pedirRender();
    };
    campoU.appendChild(u);
    li.appendChild(campoU);

    // Quién lo pidió y total
    const quien = el('div', 'item-quien');
    it.pedidos.forEach(p => {
        const chip = el('span', 'quien' + (p.clave === A.miClave() ? ' yo' : ''),
            `${iconoArea(p.area)} ${p.clave === A.miClave() ? 'Yo' : p.nombre || 'Alguien'}: ${formatear(Number(p.cantidad))}`);
        chip.title = `${p.nombre || ''}${p.area ? ' · ' + p.area : ''} · ${hace(p.fecha)}`;
        quien.appendChild(chip);
    });
    if (it.pedidos.length > 1) {
        quien.appendChild(el('span', 'quien total', `Total: ${formatear(it.total)}${it.unidad ? ' ' + it.unidad : ''}`));
    }
    li.appendChild(quien);
    return li;
}

// ===== Vista INVENTARIO =====
function tarjetaInventario(cat) {
    const card = el('section', 'categoria inventario');
    card.dataset.cat = cat.nombre;
    card.appendChild(encabezado(cat, false));

    if (!cat.productos.length) {
        card.appendChild(el('p', 'ayuda', 'Sin productos. Agrégalos en 🛒 Compras → ⚙️'));
        return card;
    }
    const enLista = itemsDe(cat.nombre);
    const ul = el('ul', 'inv-lista');
    ordenar(cat.productos).forEach(p => {
        const s = stockDe(cat.nombre, p);
        const li = el('li', 'inv-item' + (s && esAgotado(s.hay) ? ' agotado' : '') + (s ? '' : ' sin-dato'));

        const info = el('div', 'inv-info');
        info.appendChild(el('span', 'inv-nombre', p));
        info.appendChild(el('small', 'inv-meta',
            s ? `${hace(s.fecha)}${s.por ? ' · ' + s.por : ''}` : 'sin contar'));
        li.appendChild(info);

        const hay = el('input', 'input-hay');
        hay.type = 'text'; hay.placeholder = '—'; hay.maxLength = 14;
        hay.value = s ? s.hay : '';
        hay.setAttribute('aria-label', 'Cantidad que hay de ' + p);
        hay.dataset.foco = 'inv|' + cat.nombre + '|' + p;
        hay.onchange = () => fijarStock(cat.nombre, p, hay.value);
        hay.onkeydown = e => { if (e.key === 'Enter') hay.blur(); };
        li.appendChild(hay);

        const item = enLista.find(i => igual(i.nombre, p));
        const mio = !!(item && item.mio);
        const b = boton('btn-lista' + (mio ? ' activo' : item ? ' otros' : ''), mio ? '✓' : '🛒', () => {
            if (mio) { quitarMiPedido(cat.nombre, item.nombre); render(); }
            else agregar(cat, p);
        }, mio ? `Quitar mi pedido de ${p}` : `Pedir ${p}`);
        if (item && !mio) b.title = 'Pedido por ' + item.pedidos.map(x => x.nombre).join(', ');
        b.dataset.foco = 'bl|' + cat.nombre + '|' + p;
        li.appendChild(b);
        ul.appendChild(li);
    });
    card.appendChild(ul);
    return card;
}

// ===== Editar catálogo =====
function panelEditar(cat) {
    const panel = el('div', 'panel-editar');
    const titulo = el('p', 'panel-titulo', 'Catálogo de ');
    titulo.appendChild(el('b', '', cat.nombre));
    titulo.append(` · ${cat.productos.length} productos`);
    panel.appendChild(titulo);

    const fila = el('div', 'otro');
    const inp = el('input');
    inp.type = 'text'; inp.placeholder = 'Nuevo producto para el catálogo'; inp.maxLength = 60;
    inp.dataset.foco = 'cat-nuevo|' + cat.nombre;
    const guardarProd = () => {
        const n = inp.value.trim();
        if (!n) { inp.focus(); return; }
        inp.value = '';
        nuevoProducto(cat, n, false);
    };
    inp.onkeydown = e => { if (e.key === 'Enter') guardarProd(); };
    fila.append(inp, boton('btn-mini', 'Guardar', guardarProd));
    panel.appendChild(fila);

    const chips = el('div', 'chips');
    ordenar(cat.productos).forEach(p => {
        const chip = el('span', 'chip' + (esBase(cat.nombre, p) ? '' : ' personalizado'));
        chip.appendChild(el('span', '', p));
        const x = boton('', '✕', null, 'Quitar ' + p + ' del catálogo');
        x.onclick = () => confirmarDosToques(x, '¿Quitar?', () => quitarDelCatalogo(cat, p));
        chip.appendChild(x);
        chips.appendChild(chip);
    });
    panel.appendChild(chips);

    const acciones = el('div', 'panel-acciones');
    const btnEliminar = boton('btn-peligro', '🗑️ Eliminar categoría');
    btnEliminar.onclick = () => confirmarDosToques(btnEliminar, '⚠️ Toca otra vez para eliminar', () => eliminarCategoria(cat));
    acciones.append(btnEliminar, boton('btn-secondary', '✔ Listo', () => { editando.delete(cat.nombre); render(); }));
    panel.appendChild(acciones);
    return panel;
}

function tarjetaNuevaCategoria() {
    const admin = A.esAdmin();
    const card = el('section', 'categoria nueva-categoria');
    card.appendChild(el('h2', '', admin ? '➕ Nueva categoría' : '📨 Pedir nueva categoría'));
    card.appendChild(el('p', 'ayuda', admin
        ? 'Por ejemplo: Panadería, Gas, Proveedor de pollo…'
        : 'El administrador la revisará antes de que aparezca.'));
    const fila = el('div', 'fila-nueva');
    const emo = el('select', 'emoji-sel');
    emo.setAttribute('aria-label', 'Emoji de la categoría');
    EMOJIS.forEach(e => emo.appendChild(new Option(e, e)));
    emo.value = borrador.emoji;
    emo.onchange = () => { borrador.emoji = emo.value; };
    const nom = el('input', 'nombre-cat');
    nom.type = 'text'; nom.placeholder = 'Nombre de la categoría'; nom.maxLength = 40;
    nom.dataset.foco = 'nueva-cat';
    nom.value = borrador.nombre;
    nom.oninput = () => { borrador.nombre = nom.value; };
    nom.onkeydown = e => { if (e.key === 'Enter') crearCategoria(); };
    fila.append(emo, nom);
    card.appendChild(fila);
    card.appendChild(boton('btn-primary btn-crear', admin ? 'Crear categoría' : 'Enviar solicitud', crearCategoria));

    // Solicitudes de categoría que siguen esperando
    const esperando = datos.solicitudes.filter(x => x.tipo === 'categoria');
    if (esperando.length) {
        const p = el('p', 'esperando', '⏳ Esperando aprobación: ');
        p.append(esperando.map(x => `${x.emoji || ''} ${x.nombre}`.trim()).join(', '));
        card.appendChild(p);
    }
    return card;
}

// ===== Vista ADMINISTRADOR =====
function tarjetaSolicitudes() {
    const card = el('section', 'categoria admin-card');
    const head = el('div', 'cat-header');
    head.appendChild(el('h2', '', '🔔 Solicitudes por aprobar'));
    head.appendChild(el('span', 'badge' + (datos.solicitudes.length ? ' activo' : ''), datos.solicitudes.length));
    card.appendChild(head);
    if (!datos.solicitudes.length) {
        card.appendChild(el('p', 'ayuda', 'No hay nada pendiente. Cuando alguien pida un producto o una categoría nueva, aparecerá aquí.'));
        return card;
    }
    const ul = el('ul', 'lista-admin');
    datos.solicitudes.forEach(sol => {
        const li = el('li', 'fila-admin');
        const info = el('div', 'fila-admin-info');
        const titulo = el('span', 'fila-admin-titulo');
        if (sol.tipo === 'categoria') {
            titulo.append('Categoría ');
            titulo.appendChild(el('b', '', `${sol.emoji || '🛒'} ${sol.nombre}`));
        } else {
            titulo.append('Producto ');
            titulo.appendChild(el('b', '', sol.nombre));
            titulo.append(` en ${sol.categoria}`);
        }
        info.appendChild(titulo);
        info.appendChild(el('small', 'inv-meta', `Pedido por ${sol.por || 'alguien'} · ${hace(sol.fecha)}`));
        li.appendChild(info);
        const acc = el('div', 'fila-admin-acciones');
        acc.appendChild(boton('btn-aprobar', '✔ Aprobar', () => aprobarSolicitud(sol)));
        const rech = boton('btn-rechazar', '✕', null, 'Rechazar');
        rech.onclick = () => confirmarDosToques(rech, '¿Rechazar?', () => rechazarSolicitud(sol));
        acc.appendChild(rech);
        li.appendChild(acc);
        ul.appendChild(li);
    });
    card.appendChild(ul);
    return card;
}

function tarjetaHistorial() {
    const card = el('section', 'categoria admin-card');
    card.appendChild(el('h2', 'titulo-admin', '📚 Semanas anteriores'));
    if (!datos.historial.length) {
        card.appendChild(el('p', 'ayuda', 'Cuando cierres la semana con 🧾 Cerrar semana, la lista final se guardará aquí.'));
        return card;
    }
    const ul = el('ul', 'lista-admin');
    datos.historial.slice(0, 12).forEach(h => {
        const li = el('li', 'fila-admin');
        const info = el('div', 'fila-admin-info');
        info.appendChild(el('span', 'fila-admin-titulo', `🧾 ${fechaCorta(h.fecha)}`));
        info.appendChild(el('small', 'inv-meta', `${h.total || 0} productos · cerrada por ${h.por || '—'}`));
        li.appendChild(info);
        li.appendChild(boton('btn-secondary btn-ver', 'Ver', () => {
            $('modal-titulo').textContent = '🧾 ' + fechaCorta(h.fecha);
            $('modal-texto').textContent = h.texto || '';
            $('modal').classList.remove('oculto');
        }));
        ul.appendChild(li);
    });
    card.appendChild(ul);
    return card;
}

function tarjetaUsuarios() {
    const card = el('section', 'categoria admin-card');
    const head = el('div', 'cat-header');
    head.appendChild(el('h2', '', '👥 Usuarios'));
    head.appendChild(el('span', 'badge activo', datos.usuarios.length));
    card.appendChild(head);
    card.appendChild(el('p', 'ayuda',
        'Solo estas personas pueden entrar con su número de celular. También aparecen al enviar la lista por WhatsApp.'));

    const form = el('div', 'form-usuario');
    const nom = el('input');
    nom.type = 'text'; nom.placeholder = 'Nombre'; nom.maxLength = 40; nom.autocomplete = 'off';
    nom.dataset.foco = 'u-nombre';
    nom.value = borradorUsuario.nombre;
    nom.oninput = () => { borradorUsuario.nombre = nom.value; };
    const tel = el('input');
    tel.type = 'tel'; tel.inputMode = 'tel'; tel.placeholder = 'Celular (096 273 7275)'; tel.autocomplete = 'off';
    tel.dataset.foco = 'u-tel';
    tel.value = borradorUsuario.telefono;
    tel.oninput = () => { borradorUsuario.telefono = tel.value; };
    const area = el('select', 'area-sel');
    area.setAttribute('aria-label', 'Área');
    AREAS.forEach(a => area.appendChild(new Option(`${iconoArea(a)} ${a}`, a)));
    area.value = borradorUsuario.area;
    area.onchange = () => { borradorUsuario.area = area.value; };
    const agregarUsuario = async () => {
        try {
            const existe = datos.usuarios.find(u => u.telefono === A.normalizarTelefono(tel.value));
            const u = await A.guardarUsuario(nom.value, tel.value, area.value);
            borradorUsuario.nombre = ''; borradorUsuario.telefono = '';
            nom.value = ''; tel.value = '';
            aviso(existe ? `✏️ ${u.nombre} actualizado` : `👤 ${u.nombre} agregado`);
            render();
        } catch (e) {
            aviso({ 'sin-nombre': 'Escribe el nombre', 'numero-invalido': 'Revisa el número de celular' }[e.code]
                || 'No se pudo guardar el usuario');
        }
    };
    nom.onkeydown = e => { if (e.key === 'Enter') tel.focus(); };
    tel.onkeydown = e => { if (e.key === 'Enter') agregarUsuario(); };
    form.append(nom, tel, area, boton('btn-primary', '➕ Guardar usuario', agregarUsuario));
    card.appendChild(form);

    const ul = el('ul', 'lista-admin');
    [...datos.usuarios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).forEach(u => {
        const li = el('li', 'fila-admin');
        const info = el('div', 'fila-admin-info');
        info.appendChild(el('span', 'fila-admin-titulo', `${iconoArea(u.area)} ${u.nombre}`));
        info.appendChild(el('small', 'inv-meta', A.mostrarTelefono(u.telefono) + (u.area ? ' · ' + u.area : '')));
        li.appendChild(info);
        const acc = el('div', 'fila-admin-acciones');
        acc.appendChild(boton('btn-icono', '✏️', () => {
            borradorUsuario.nombre = u.nombre;
            borradorUsuario.area = u.area || 'Otra';
            borradorUsuario.telefono = A.mostrarTelefono(u.telefono);
            render();
            aviso('Haz los cambios y toca Guardar usuario');
        }, 'Editar ' + u.nombre));
        const del = boton('btn-rechazar', '🗑️', null, 'Quitar a ' + u.nombre);
        del.onclick = () => confirmarDosToques(del, '¿Quitar?', async () => {
            try { await A.borrarUsuario(u.telefono); aviso(`${u.nombre} ya no tiene acceso`); }
            catch (e) { aviso('No se pudo quitar'); }
            render();
        });
        acc.appendChild(del);
        li.appendChild(acc);
        ul.appendChild(li);
    });
    if (!datos.usuarios.length) ul.appendChild(el('li', 'ayuda', 'Todavía no hay usuarios. Agrega el primero arriba.'));
    card.appendChild(ul);
    return card;
}

// ----- ACCIONES -----
function agregar(cat, nombre) {
    const it = itemDe(cat.nombre, nombre);
    if (it && it.mio) { aviso('Ya lo pediste. Cambia la cantidad en la lista.'); return; }
    pedir(cat.nombre, nombre, 1);
    render();
    aviso(it ? `✓ Sumaste tu pedido de ${nombre}` : `✓ ${nombre} a la lista`);
}

function fijarStock(catNombre, prod, valor) {
    valor = String(valor || '').trim();
    const actual = stockDe(catNombre, prod);
    if ((actual ? actual.hay : '') === valor) return;
    datos.stock[catNombre] = datos.stock[catNombre] || {};
    if (valor) datos.stock[catNombre][prod] = { hay: valor, fecha: Date.now(), por: A.nombreUsuario() };
    else delete datos.stock[catNombre][prod];
    A.guardarStock(catNombre, prod);
    pedirRender();
}

// Un usuario pide un producto nuevo: va a la lista marcado ⏳ y espera aprobación
async function pedirProducto(cat, nombre) {
    const yaPedido = datos.solicitudes.some(x => x.tipo === 'producto'
        && igual(x.categoria, cat.nombre) && igual(x.nombre, nombre));
    const it = itemDe(cat.nombre, nombre);
    if (!it || !it.mio) pedir(cat.nombre, nombre, 1, { pendiente: true });
    render();
    if (yaPedido) { aviso('Ya fue pedido. Está en la lista con ⏳'); return; }
    try {
        await A.enviarSolicitud({ tipo: 'producto', categoria: cat.nombre, nombre });
        aviso('📨 Enviado al administrador. Ya está en tu lista (⏳)');
        pedirRender();
    } catch (e) { aviso('No se pudo enviar la solicitud'); }
}

async function aprobarSolicitud(sol) {
    if (sol.tipo === 'categoria') {
        if (!buscarCat(sol.nombre)) {
            datos.catalogo.push({ nombre: sol.nombre, emoji: sol.emoji || '🛒', productos: [] });
            datos.eliminados = (datos.eliminados || []).filter(k => k !== sol.nombre + '|');
        }
    } else {
        let cat = buscarCat(sol.categoria);
        if (!cat) {   // la categoría fue borrada: se vuelve a crear
            cat = { nombre: sol.categoria, emoji: '🛒', productos: [] };
            datos.catalogo.push(cat);
        }
        if (!cat.productos.some(p => igual(p, sol.nombre))) cat.productos.push(sol.nombre);
        datos.eliminados = (datos.eliminados || []).filter(k => k !== cat.nombre + '|' + sol.nombre);
        const mapa = datos.lista[cat.nombre] || {};
        Object.keys(mapa).filter(k => igual(k, sol.nombre) && mapa[k].pendiente).forEach(k => {
            mapa[k].pendiente = false;
            A.guardarEntrada(cat.nombre, k);
        });
    }
    A.guardarCatalogo();
    try { await A.cerrarSolicitud(sol.id); } catch (e) { /* se reintenta al volver el internet */ }
    render();
    aviso(`✔ ${sol.nombre} aprobado`);
}

async function rechazarSolicitud(sol) {
    if (sol.tipo === 'producto') {
        const mapa = datos.lista[sol.categoria] || {};
        Object.keys(mapa).filter(k => igual(k, sol.nombre) && mapa[k].pendiente)
            .forEach(k => quitarDeLaLista(sol.categoria, k));
    }
    try { await A.cerrarSolicitud(sol.id); } catch (e) { /* nada */ }
    render();
    aviso(`${sol.nombre} rechazado`);
}

function nuevoProducto(cat, nombre, tambienALaLista) {
    const existente = cat.productos.find(p => igual(p, nombre));
    if (existente) {
        if (tambienALaLista) agregar(cat, existente); else aviso('Ese producto ya existe');
        return;
    }
    cat.productos.push(nombre);
    datos.eliminados = (datos.eliminados || []).filter(k => k !== cat.nombre + '|' + nombre);
    A.guardarCatalogo();
    if (tambienALaLista) agregar(cat, nombre);
    else { render(); aviso(`💾 ${nombre} guardado en ${cat.nombre}`); }
}

function quitarDelCatalogo(cat, nombre) {
    cat.productos = cat.productos.filter(p => !igual(p, nombre));
    quitarDeLaLista(cat.nombre, nombre);
    if (datos.stock[cat.nombre]) delete datos.stock[cat.nombre][nombre];
    if (esBase(cat.nombre, nombre)) (datos.eliminados = datos.eliminados || []).push(cat.nombre + '|' + nombre);
    A.guardarCatalogo();
    A.guardarStock(cat.nombre, nombre);
    render();
    aviso(`${nombre} quitado del catálogo`);
}

function crearCategoria() {
    const nombre = borrador.nombre.trim();
    if (!nombre) { aviso('Escribe el nombre de la categoría'); return; }
    if (buscarCat(nombre)) { aviso('Esa categoría ya existe'); return; }
    if (!A.esAdmin()) {
        if (datos.solicitudes.some(x => x.tipo === 'categoria' && igual(x.nombre, nombre))) {
            aviso('Esa categoría ya fue pedida'); return;
        }
        A.enviarSolicitud({ tipo: 'categoria', nombre, emoji: borrador.emoji || '🛒' })
            .then(() => { borrador.nombre = ''; render(); aviso('📨 Solicitud enviada al administrador'); })
            .catch(() => aviso('No se pudo enviar la solicitud'));
        return;
    }
    const cat = { nombre, emoji: borrador.emoji || '🛒', productos: [] };
    datos.catalogo.push(cat);
    A.guardarCatalogo();
    borrador.nombre = '';
    editando.add(nombre);   // abre el panel para empezar a agregar productos
    render();
    const card = [...document.querySelectorAll('.categoria[data-cat]')].find(c => c.dataset.cat === nombre);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.querySelector('.panel-editar input').focus({ preventScroll: true });
    }
    aviso(`${cat.emoji} ${nombre} creada`);
}

function eliminarCategoria(cat) {
    datos.catalogo = datos.catalogo.filter(c => c !== cat);
    delete datos.lista[cat.nombre];
    delete datos.stock[cat.nombre];
    editando.delete(cat.nombre);
    if (CATEGORIAS_BASE[cat.nombre]) (datos.eliminados = datos.eliminados || []).push(cat.nombre + '|');
    A.guardarCatalogo();
    A.borrarListaCategoria(cat.nombre);
    A.borrarStockCategoria(cat.nombre);
    render();
    aviso(`${cat.nombre} eliminada`);
}

// Pide un segundo toque en vez de usar confirm()
function confirmarDosToques(btn, textoConfirmar, accion) {
    if (!btn.dataset.confirmar) {
        btn.dataset.confirmar = '1';
        btn.dataset.original = btn.textContent;
        btn.textContent = textoConfirmar;
        btn.classList.add('confirmando');
        btn._t = setTimeout(() => {
            delete btn.dataset.confirmar;
            btn.textContent = btn.dataset.original;
            btn.classList.remove('confirmando');
        }, 3000);
        return;
    }
    clearTimeout(btn._t);
    delete btn.dataset.confirmar;
    btn.textContent = btn.dataset.original;
    btn.classList.remove('confirmando');
    accion();
}

// ----- RESUMEN -----
const fechaCorta = ms => new Date(ms).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'short' });

function actualizarResumen() {
    let total = 0, mios = 0, pend = 0, agotados = 0;
    const porArea = {};
    (datos.catalogo || []).forEach(cat => {
        itemsDe(cat.nombre).forEach(i => {
            total++;
            if (i.mio) mios++;
            if (i.pendiente) pend++;
            new Set(i.pedidos.map(p => p.area || 'Sin área')).forEach(a => { porArea[a] = (porArea[a] || 0) + 1; });
        });
        cat.productos.forEach(p => { if (esAgotado((stockDe(cat.nombre, p) || {}).hay)) agotados++; });
    });
    $('total-seleccionados').textContent = total;
    $('total-mios').textContent = mios;
    $('total-personalizados').textContent = pend;
    $('total-agotados').textContent = agotados;
    $('resumen-areas').textContent = Object.keys(porArea).length
        ? 'Por área: ' + Object.entries(porArea).map(([a, n]) => `${iconoArea(a)} ${a} ${n}`).join(' · ') : '';
    $('resumen-inicio').textContent = datos.listaInicio
        ? `🗓️ Lista abierta desde el ${fechaCorta(datos.listaInicio)}` : '';
}

// ----- TEXTOS PARA COMPARTIR -----
const formatear = n => Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
const fechaHoy = () => new Date().toLocaleDateString('es-EC',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// Lista completa: suma los pedidos de todos, con quién pidió cada cosa
function textoLista() {
    let t = `🌮 *LISTA DE COMPRAS · ${NOMBRE_NEGOCIO.toUpperCase()}*\n📅 ${fechaHoy()}\n`;
    if (datos.listaInicio) t += `🗓️ Pedidos desde el ${fechaCorta(datos.listaInicio)}\n`;
    let total = 0;
    (datos.catalogo || []).forEach(cat => {
        const items = itemsDe(cat.nombre);
        if (!items.length) return;
        t += `\n${cat.emoji} *${cat.nombre.toUpperCase()}*\n`;
        items.forEach(i => {
            const s = stockDe(cat.nombre, i.nombre);
            let linea = `• ${i.nombre}${i.pendiente ? ' (nuevo)' : ''} — ${formatear(i.total)}${i.unidad ? ' ' + i.unidad : ''}`;
            if (s) linea += ` (hay: ${s.hay})`;
            linea += i.pedidos.length > 1
                ? ` · ${i.pedidos.map(p => `${p.nombre || '?'} ${formatear(Number(p.cantidad))}`).join(', ')}`
                : ` · ${i.pedidos[0].nombre || ''}`;
            t += linea + '\n';
            total++;
        });
    });
    t += `\n✅ Total: ${total} productos`;
    return total ? t : '';
}

function textoInventario() {
    let t = `📦 *INVENTARIO · ${NOMBRE_NEGOCIO.toUpperCase()}*\n📅 ${fechaHoy()}\n`;
    let total = 0;
    (datos.catalogo || []).forEach(cat => {
        const conDato = ordenar(cat.productos).filter(p => stockDe(cat.nombre, p));
        if (!conDato.length) return;
        t += `\n${cat.emoji} *${cat.nombre.toUpperCase()}*\n`;
        conDato.forEach(p => {
            const s = stockDe(cat.nombre, p);
            t += `• ${p}: ${s.hay}${esAgotado(s.hay) ? ' ⚠️' : ''}\n`;
            total++;
        });
    });
    return total ? t : '';
}

const textoActual = () => (modo === 'inventario' ? textoInventario() : textoLista());

function textoONada() {
    const t = textoActual();
    if (!t) aviso(modo === 'inventario' ? 'Todavía no hay stock anotado' : 'No hay productos seleccionados');
    return t;
}

// ----- BOTONES -----
function aviso(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(aviso._t);
    aviso._t = setTimeout(() => t.classList.remove('visible'), 2000);
}

function cambiarModo(m) {
    modo = m;
    escribirLocal('comprafacil-modo', m);
    render();
}
$('tabCompras').onclick = () => cambiarModo('compras');
$('tabInventario').onclick = () => cambiarModo('inventario');
$('tabAdmin').onclick = () => cambiarModo('admin');

$('btnVerLista').onclick = () => {
    const t = textoONada(); if (!t) return;
    $('modal-titulo').textContent = modo === 'inventario' ? '📦 Inventario' : '📋 Lista de compras';
    $('modal-texto').textContent = t;
    $('modal').classList.remove('oculto');
    $('btnCerrarModal').focus();
};
$('btnCerrarModal').onclick = () => $('modal').classList.add('oculto');
$('modal').onclick = e => { if (e.target.id === 'modal') $('modal').classList.add('oculto'); };
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { $('modal').classList.add('oculto'); $('modalEnviar').classList.add('oculto'); cerrarModalSemana(); }
});

$('btnCopiar').onclick = async () => {
    try { await navigator.clipboard.writeText($('modal-texto').textContent); aviso('📋 Copiado'); }
    catch (e) {
        const r = document.createRange(); r.selectNodeContents($('modal-texto'));
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        aviso('Texto seleccionado: cópialo');
    }
};

// WhatsApp: elegir a cuál de los usuarios registrados se envía
function elegirContacto(texto, titulo) {
    $('enviar-titulo').textContent = titulo;
    const ul = $('lista-contactos');
    ul.innerHTML = '';
    const yo = (A.sesionActual() || {}).telefono;
    const contactos = [...datos.usuarios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const enviar = tel => {
        const base = tel ? `https://wa.me/${tel}` : 'https://wa.me/';
        window.open(`${base}?text=${encodeURIComponent(texto)}`, '_blank');
        $('modalEnviar').classList.add('oculto');
    };
    contactos.forEach(u => {
        const li = el('li');
        const b = boton('contacto', '', () => enviar(u.telefono));
        b.appendChild(el('span', 'contacto-nombre',
            `${iconoArea(u.area)} ${u.nombre}${u.telefono === yo ? ' (yo)' : ''}${u.area ? ' · ' + u.area : ''}`));
        b.appendChild(el('span', 'contacto-tel', A.mostrarTelefono(u.telefono)));
        li.appendChild(b);
        ul.appendChild(li);
    });
    if (!contactos.length) {
        ul.appendChild(el('li', 'ayuda', A.esAdmin()
            ? 'Aún no hay usuarios. Agrégalos en la pestaña 👑 Admin.'
            : 'El administrador aún no ha registrado contactos.'));
    }
    const li = el('li');
    const otro = boton('contacto otro', '', () => enviar(''));
    otro.appendChild(el('span', 'contacto-nombre', '📇 Elegir otro contacto en WhatsApp'));
    li.appendChild(otro);
    ul.appendChild(li);
    $('modalEnviar').classList.remove('oculto');
}
$('btnEnviarWhatsApp').onclick = () => {
    const t = textoONada(); if (!t) return;
    elegirContacto(t, modo === 'inventario' ? '📱 ¿A quién le envías el inventario?' : '📱 ¿A quién le envías la lista?');
};
$('btnCerrarEnviar').onclick = () => $('modalEnviar').classList.add('oculto');
$('modalEnviar').onclick = e => { if (e.target.id === 'modalEnviar') $('modalEnviar').classList.add('oculto'); };

$('btnDescargar').onclick = () => {
    const t = textoONada(); if (!t) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const blob = new Blob([t.replace(/\*/g, '')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${modo === 'inventario' ? 'inventario' : 'lista-compras'}-takolandia-${hoy}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

// ----- Cierre de la semana (solo administrador) -----
// Durante la semana cocina y cafetería van agregando sus pedidos.
// El lunes el administrador revisa la lista final, la envía y cierra la semana.
const cerrarModalSemana = () => $('modalSemana').classList.add('oculto');
$('btnCerrarSemana').onclick = () => {
    const t = textoLista();
    if (!t) { aviso('La lista está vacía'); return; }
    $('semana-texto').textContent = t;
    $('modalSemana').classList.remove('oculto');
};
$('btnSemanaCancelar').onclick = cerrarModalSemana;
$('modalSemana').onclick = e => { if (e.target.id === 'modalSemana') cerrarModalSemana(); };
$('btnSemanaWhatsApp').onclick = () => elegirContacto(textoLista(), '📱 ¿A quién le envías la lista final?');
$('btnSemanaCerrar').onclick = function () {
    confirmarDosToques(this, '⚠️ Toca otra vez para cerrar', async () => {
        const texto = textoLista();
        const total = (datos.catalogo || []).reduce((n, c) => n + itemsDe(c.nombre).length, 0);
        try {
            await A.guardarHistorial({ texto, total, inicio: datos.listaInicio || null });
        } catch (e) { aviso('No se pudo guardar en el historial. Revisa el internet.'); return; }
        datos.lista = {};
        A.borrarLista();
        cerrarModalSemana();
        render();
        aviso('✅ Semana cerrada. La lista nueva está lista para pedidos.');
    });
};

// Lista habitual: cada persona guarda la suya (cocina y cafetería piden cosas distintas)
function misPedidos() {
    const r = {};
    (datos.catalogo || []).forEach(cat => {
        const mios = itemsDe(cat.nombre).filter(i => i.mio)
            .map(i => ({ nombre: i.nombre, cantidad: Number(i.mio.cantidad), unidad: i.unidad || '' }));
        if (mios.length) r[cat.nombre] = mios;
    });
    return r;
}
$('btnGuardarHabitual').onclick = () => {
    const mios = misPedidos();
    if (!Object.keys(mios).length) { aviso('Primero agrega tus pedidos'); return; }
    datos.habitual = mios;
    A.guardarHabitual();
    aviso('💾 Guardada como tu lista habitual');
};

$('btnCargarHabitual').onclick = () => {
    const habitual = datos.habitual;
    if (!habitual || !Object.keys(habitual).length) { aviso('Agrega tus pedidos y toca 💾 Guardar como habitual'); return; }
    let nuevos = 0;
    for (const catNombre in habitual) {
        const cat = buscarCat(catNombre);
        if (!cat || !Array.isArray(habitual[catNombre])) continue;
        habitual[catNombre].forEach(h => {
            if (!cat.productos.some(p => igual(p, h.nombre))) return;   // ya no está en el catálogo
            const it = itemDe(cat.nombre, h.nombre);
            if (it && it.mio) return;
            pedir(cat.nombre, h.nombre, h.cantidad || 1, { unidad: h.unidad });
            nuevos++;
        });
    }
    render();
    aviso(nuevos ? `⭐ ${nuevos} pedidos agregados` : 'Ya tienes todo lo habitual');
};

// ----- SESIÓN Y CONEXIÓN -----
const MENSAJES_LOGIN = {
    'no-registrado': 'Ese número no está registrado. Pídele al administrador que te agregue.',
    'numero-invalido': 'Revisa el número de celular',
    'no-admin': 'Ese correo no es de administrador',
    'auth/invalid-credential': 'Correo o contraseña incorrectos',
    'auth/wrong-password': 'Correo o contraseña incorrectos',
    'auth/user-not-found': 'Correo o contraseña incorrectos',
    'auth/invalid-email': 'El correo no es válido',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed': 'Sin internet. Revisa la conexión.',
    'auth/admin-restricted-operation': 'Falta activar el acceso "Anónimo" en Firebase',
    'auth/operation-not-allowed': 'Falta activar el acceso "Anónimo" en Firebase',
    'unavailable': 'Sin internet. Revisa la conexión.',
    'permission-denied': 'Sin permiso: revisa las reglas de Firestore',
    'no-cargado': 'Firebase aún no carga. Revisa el internet.',
};
const errorLogin = (e, porDefecto) => { $('loginError').textContent = MENSAJES_LOGIN[e && e.code] || porDefecto; };

function mostrarFormulario(cual) {
    $('formTelefono').classList.toggle('oculto', cual !== 'telefono');
    $('formAdmin').classList.toggle('oculto', cual !== 'admin');
    $('loginError').textContent = '';
    (cual === 'admin' ? (A.configurado ? $('loginEmail') : null) : $('loginTelefono'))?.focus();
}
$('btnModoAdmin').onclick = () => mostrarFormulario('admin');
$('btnModoTelefono').onclick = () => mostrarFormulario('telefono');
document.body.classList.toggle('con-firebase', A.configurado);

async function conBoton(form, accion) {
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    $('loginError').textContent = '';
    try { await accion(); } finally { btn.disabled = false; }
}

$('formTelefono').onsubmit = e => {
    e.preventDefault();
    conBoton($('formTelefono'), async () => {
        try { await A.entrarConTelefono($('loginTelefono').value); }
        catch (err) { console.error(err); errorLogin(err, 'No se pudo entrar'); }
    });
};
$('formAdmin').onsubmit = e => {
    e.preventDefault();
    conBoton($('formAdmin'), async () => {
        try {
            await A.entrarAdmin($('loginEmail').value.trim(), $('loginClave').value);
            $('loginClave').value = '';
        } catch (err) { console.error(err); errorLogin(err, 'No se pudo entrar'); }
    });
};
$('btnOlvide').onclick = async () => {
    const email = $('loginEmail').value.trim();
    if (!email) { $('loginError').textContent = 'Escribe tu correo primero'; return; }
    try { await A.recuperarClave(email); $('loginError').textContent = '📧 Te enviamos un correo para cambiar la contraseña'; }
    catch (err) { errorLogin(err, 'No se pudo enviar el correo'); }
};
$('btnSalir').onclick = () => A.salir();

let ultimaBienvenida = '';
A.iniciar({
    alCambiar() {
        if (completarConBase() && A.esAdmin()) A.guardarCatalogo();
        pedirRender();
    },
    alSesion(sesion, tipo, info) {
        $('pantalla-login').classList.toggle('oculto', !!sesion);
        $('usuario-actual').classList.toggle('oculto', !sesion);
        $('btnSalir').classList.toggle('oculto', !sesion);
        $('saludo').classList.toggle('oculto', !sesion);
        if (info && info.error) $('loginError').textContent = info.error;

        if (!sesion) {
            $('contenedor-categorias').innerHTML = '<p class="cargando">Entra con tu número para ver los productos.</p>';
            ultimaBienvenida = '';
            if (modo === 'admin') modo = 'compras';
            return;
        }
        const admin = sesion.tipo === 'admin';
        $('usuario-actual').textContent = (admin ? '👑 ' : '👤 ') + sesion.nombre;
        $('saludo').textContent = admin
            ? `👋 ¡Hola, ${sesion.nombre}! Eres el administrador.`
            : `👋 ¡Bienvenido, ${sesion.nombre}!${sesion.area ? ` ${iconoArea(sesion.area)} ${sesion.area}` : ''}`;
        $('loginTelefono').value = '';
        mostrarFormulario('telefono');
        const clave = sesion.tipo + sesion.telefono;
        if (ultimaBienvenida !== clave) { ultimaBienvenida = clave; aviso(`¡Bienvenido, ${sesion.nombre}! 🌮`); }
        if (datos.catalogo) { completarConBase(); render(); }
        else $('contenedor-categorias').innerHTML = '<p class="cargando">Cargando productos…</p>';
    },
    alConexion(tipo, mensaje) {
        const p = $('estado-conexion');
        const textos = {
            local: '💾 Modo local · solo este aparato',
            online: '🟢 En línea · compartido',
            offline: '🟠 Sin internet · se guarda y sincroniza al volver',
            error: '🔴 ' + (mensaje || 'Error'),
        };
        p.textContent = textos[tipo] || tipo;
        p.dataset.tipo = tipo;
    },
});
