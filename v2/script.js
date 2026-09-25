// =====================================================
//  COMPRAFÁCIL · Compras Takolandia
// =====================================================
import * as A from './almacen.js';

const datos = A.datos;

// ----- CONFIGURACIÓN -----
const TELEFONO_WHATSAPP = '593962737275';   // solo números, con código de país
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
const itemsDe = n => datos.lista[n] || (datos.lista[n] = []);
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
let modo = leerLocal('comprafacil-modo') === 'inventario' ? 'inventario' : 'compras';
const editando = new Set();                       // categorías con el panel ⚙️ abierto
const borrador = { nombre: '', emoji: EMOJIS[0] }; // tarjeta "Nueva categoría"
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

    document.body.dataset.modo = modo;
    $('tabCompras').classList.toggle('activo', modo === 'compras');
    $('tabInventario').classList.toggle('activo', modo === 'inventario');
    $('tabCompras').setAttribute('aria-selected', modo === 'compras');
    $('tabInventario').setAttribute('aria-selected', modo === 'inventario');

    const cont = $('contenedor-categorias');
    cont.innerHTML = '';
    datos.catalogo.forEach(cat =>
        cont.appendChild(modo === 'compras' ? tarjetaCompras(cat) : tarjetaInventario(cat)));
    if (modo === 'compras') cont.appendChild(tarjetaNuevaCategoria());

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
    if (conEditar) {
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
    items.forEach((it, idx) => ul.appendChild(filaCompra(cat, it, idx)));
    card.appendChild(ul);

    if (editando.has(cat.nombre)) card.appendChild(panelEditar(cat));
    return card;
}

// ----- Buscador: escribe las primeras letras o toca para ver todos -----
const normal = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
let idBuscador = 0;

function opcionesDe(cat, items, texto) {
    const q = normal(texto);
    const enLista = p => items.some(i => igual(i.nombre, p));
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
    const libres = cat.productos.filter(p => !items.some(i => igual(i.nombre, p))).length;
    inp.type = 'search';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    inp.placeholder = cat.productos.length
        ? (libres ? `🔍 Escribe o toca para elegir (${libres})` : '✔ Todo agregado · escribe para crear')
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
        if (o.tipo === 'ya') { aviso('Ya está en la lista'); return; }
        inp.value = '';
        if (o.tipo === 'nuevo') nuevoProducto(cat, o.nombre, true);
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
                nombre.append('➕ Agregar «');
                nombre.appendChild(el('b', '', o.nombre));
                nombre.append('» como nuevo');
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
            if (o.tipo === 'ya') li.appendChild(el('small', 'opcion-extra', '✓ en la lista'));
            else if (o.tipo === 'prod') {
                const s = stockDe(cat.nombre, o.nombre);
                if (s) li.appendChild(el('small', 'opcion-extra' + (esAgotado(s.hay) ? ' agotado' : ''),
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

function filaCompra(cat, it, idx) {
    const s = stockDe(cat.nombre, it.nombre);
    const li = el('li', 'item' + (esBase(cat.nombre, it.nombre) ? '' : ' personalizado')
                     + (s && esAgotado(s.hay) ? ' agotado' : ''));

    li.appendChild(el('span', 'item-nombre', it.nombre));
    li.appendChild(boton('quitar', '✕', () => {
        itemsDe(cat.nombre).splice(idx, 1);
        A.guardarLista(cat.nombre);
        render();
    }, 'Quitar de la lista'));

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

    // Comprar
    const campoComprar = el('div', 'campo campo-comprar');
    campoComprar.appendChild(el('span', '', 'Comprar'));
    const caja = el('div', 'cantidad');
    const q = el('input');
    q.type = 'number'; q.min = '0'; q.step = '0.5'; q.inputMode = 'decimal';
    q.setAttribute('aria-label', 'Cantidad a comprar');
    q.dataset.foco = 'q|' + cat.nombre + '|' + it.nombre;
    q.value = it.cantidad;
    const fijar = v => {
        v = Math.max(0.5, Math.round(v * 100) / 100);
        it.cantidad = v; q.value = v;
        A.guardarLista(cat.nombre);
    };
    q.onchange = () => fijar(parseFloat(q.value) || 1);
    caja.append(
        boton('menos', '−', () => fijar((parseFloat(q.value) || 0) - 1), 'Menos'),
        q,
        boton('mas', '+', () => fijar((parseFloat(q.value) || 0) + 1), 'Más'));
    campoComprar.appendChild(caja);
    li.appendChild(campoComprar);

    // Unidad
    const campoU = el('label', 'campo campo-unidad');
    campoU.appendChild(el('span', '', 'Unidad'));
    const u = el('select', 'unidad');
    u.dataset.foco = 'u|' + cat.nombre + '|' + it.nombre;
    (UNIDADES.includes(it.unidad) ? UNIDADES : [...UNIDADES, it.unidad])
        .forEach(x => u.appendChild(new Option(x || '—', x)));
    u.value = it.unidad || '';
    u.onchange = () => { it.unidad = u.value; A.guardarLista(cat.nombre); };
    campoU.appendChild(u);
    li.appendChild(campoU);
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

        const esta = enLista.some(i => igual(i.nombre, p));
        const b = boton('btn-lista' + (esta ? ' activo' : ''), esta ? '✓' : '🛒', () => {
            if (esta) {
                datos.lista[cat.nombre] = enLista.filter(i => !igual(i.nombre, p));
                A.guardarLista(cat.nombre);
                render();
            } else agregar(cat, p);
        }, esta ? `Quitar ${p} de la lista` : `Agregar ${p} a la lista`);
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
    const card = el('section', 'categoria nueva-categoria');
    card.appendChild(el('h2', '', '➕ Nueva categoría'));
    card.appendChild(el('p', 'ayuda', 'Por ejemplo: Panadería, Gas, Proveedor de pollo…'));
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
    card.appendChild(boton('btn-primary btn-crear', 'Crear categoría', crearCategoria));
    return card;
}

// ----- ACCIONES -----
function agregar(cat, nombre) {
    const items = itemsDe(cat.nombre);
    if (items.some(i => igual(i.nombre, nombre))) { aviso('Ya está en la lista'); return; }
    items.push({ nombre, cantidad: 1, unidad: '' });
    A.guardarLista(cat.nombre);
    render();
    aviso(`✓ ${nombre} a la lista`);
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
    datos.lista[cat.nombre] = itemsDe(cat.nombre).filter(i => !igual(i.nombre, nombre));
    if (datos.stock[cat.nombre]) delete datos.stock[cat.nombre][nombre];
    if (esBase(cat.nombre, nombre)) (datos.eliminados = datos.eliminados || []).push(cat.nombre + '|' + nombre);
    A.guardarCatalogo();
    A.guardarLista(cat.nombre);
    A.guardarStock(cat.nombre, nombre);
    render();
    aviso(`${nombre} quitado del catálogo`);
}

function crearCategoria() {
    const nombre = borrador.nombre.trim();
    if (!nombre) { aviso('Escribe el nombre de la categoría'); return; }
    if (buscarCat(nombre)) { aviso('Esa categoría ya existe'); return; }
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
    A.guardarLista(cat.nombre);
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
function actualizarResumen() {
    let total = 0, pers = 0, agotados = 0;
    (datos.catalogo || []).forEach(cat => {
        itemsDe(cat.nombre).forEach(i => { total++; if (!esBase(cat.nombre, i.nombre)) pers++; });
        cat.productos.forEach(p => { if (esAgotado((stockDe(cat.nombre, p) || {}).hay)) agotados++; });
    });
    $('total-seleccionados').textContent = total;
    $('total-personalizados').textContent = pers;
    $('total-agotados').textContent = agotados;
}

// ----- TEXTOS PARA COMPARTIR -----
const formatear = n => Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
const fechaHoy = () => new Date().toLocaleDateString('es-EC',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function textoLista() {
    let t = `🌮 *LISTA DE COMPRAS · ${NOMBRE_NEGOCIO.toUpperCase()}*\n📅 ${fechaHoy()}\n`;
    let total = 0;
    (datos.catalogo || []).forEach(cat => {
        const items = itemsDe(cat.nombre);
        if (!items.length) return;
        t += `\n${cat.emoji} *${cat.nombre.toUpperCase()}*\n`;
        items.forEach(i => {
            const s = stockDe(cat.nombre, i.nombre);
            let linea = `• ${i.nombre} — comprar: ${formatear(i.cantidad)}${i.unidad ? ' ' + i.unidad : ''}`;
            if (s) linea += ` (hay: ${s.hay})`;
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

$('btnVerLista').onclick = () => {
    const t = textoONada(); if (!t) return;
    $('modal-titulo').textContent = modo === 'inventario' ? '📦 Inventario' : '📋 Lista de compras';
    $('modal-texto').textContent = t;
    $('modal').classList.remove('oculto');
    $('btnCerrarModal').focus();
};
$('btnCerrarModal').onclick = () => $('modal').classList.add('oculto');
$('modal').onclick = e => { if (e.target.id === 'modal') $('modal').classList.add('oculto'); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('modal').classList.add('oculto'); });

$('btnCopiar').onclick = async () => {
    try { await navigator.clipboard.writeText($('modal-texto').textContent); aviso('📋 Copiado'); }
    catch (e) {
        const r = document.createRange(); r.selectNodeContents($('modal-texto'));
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        aviso('Texto seleccionado: cópialo');
    }
};

$('btnEnviarWhatsApp').onclick = () => {
    const t = textoONada(); if (!t) return;
    const base = TELEFONO_WHATSAPP ? `https://wa.me/${TELEFONO_WHATSAPP}` : 'https://wa.me/';
    window.open(`${base}?text=${encodeURIComponent(t)}`, '_blank');
};

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

$('btnLimpiar').onclick = function () {
    confirmarDosToques(this, '⚠️ ¿Borrar la lista? Toca otra vez', () => {
        datos.lista = {};
        A.borrarLista();
        render();
        aviso('🗑️ Lista de compras limpia (el stock se mantiene)');
    });
};

$('btnGuardarHabitual').onclick = () => {
    if (!textoLista()) { aviso('Primero arma una lista'); return; }
    const copia = {};
    for (const c in datos.lista) {
        if (datos.lista[c].length) copia[c] = datos.lista[c].map(i => ({ ...i }));
    }
    datos.habitual = copia;
    A.guardarHabitual();
    aviso('💾 Guardada como lista habitual');
};

$('btnCargarHabitual').onclick = () => {
    const habitual = datos.habitual;
    if (!habitual || !Object.keys(habitual).length) { aviso('Arma tu lista y toca 💾 Guardar como habitual'); return; }
    let nuevos = 0, catalogoCambio = false;
    for (const catNombre in habitual) {
        const cat = buscarCat(catNombre);
        if (!cat) continue;
        const items = itemsDe(cat.nombre);
        let cambio = false;
        habitual[catNombre].forEach(h => {
            if (!cat.productos.some(p => igual(p, h.nombre))) { cat.productos.push(h.nombre); catalogoCambio = true; }
            if (!items.some(i => igual(i.nombre, h.nombre))) { items.push({ ...h }); nuevos++; cambio = true; }
        });
        if (cambio) A.guardarLista(cat.nombre);
    }
    if (catalogoCambio) A.guardarCatalogo();
    render();
    aviso(nuevos ? `⭐ ${nuevos} productos agregados` : 'Ya tienes todo lo habitual');
};

// ----- SESIÓN Y CONEXIÓN -----
const MENSAJES_LOGIN = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos',
    'auth/wrong-password': 'Correo o contraseña incorrectos',
    'auth/user-not-found': 'Correo o contraseña incorrectos',
    'auth/invalid-email': 'El correo no es válido',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed': 'Sin internet. Revisa la conexión.',
    'no-cargado': 'Firebase aún no carga. Revisa el internet.',
};

$('formLogin').onsubmit = async e => {
    e.preventDefault();
    $('loginError').textContent = '';
    const btn = e.submitter || $('formLogin').querySelector('[type=submit]');
    btn.disabled = true;
    try {
        await A.entrar($('loginEmail').value.trim(), $('loginClave').value);
        $('loginClave').value = '';
    } catch (err) {
        $('loginError').textContent = MENSAJES_LOGIN[err.code] || 'No se pudo entrar';
    }
    btn.disabled = false;
};
$('btnOlvide').onclick = async () => {
    const email = $('loginEmail').value.trim();
    if (!email) { $('loginError').textContent = 'Escribe tu correo primero'; return; }
    try { await A.recuperarClave(email); $('loginError').textContent = '📧 Te enviamos un correo para cambiar la contraseña'; }
    catch (err) { $('loginError').textContent = MENSAJES_LOGIN[err.code] || 'No se pudo enviar el correo'; }
};
$('btnSalir').onclick = () => A.salir();

A.iniciar({
    alCambiar() {
        if (completarConBase()) A.guardarCatalogo();
        pedirRender();
    },
    alSesion(usuario, tipo) {
        const conLogin = tipo === 'firebase' || tipo === 'error';
        $('pantalla-login').classList.toggle('oculto', !(conLogin && !usuario));
        $('usuario-actual').classList.toggle('oculto', !usuario);
        $('btnSalir').classList.toggle('oculto', !usuario);
        if (usuario) $('usuario-actual').textContent = '👤 ' + A.nombreUsuario();
        if (conLogin && !usuario) {
            $('contenedor-categorias').innerHTML = '<p class="cargando">Inicia sesión para ver los productos.</p>';
        } else if (usuario) {
            $('contenedor-categorias').innerHTML = '<p class="cargando">Cargando productos…</p>';
        }
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
