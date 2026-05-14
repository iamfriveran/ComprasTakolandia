// Base de datos de productos por categoría
const categorias = {
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

// Sistema de almacenamiento local
class GestorProductos {
    constructor() {
        this.datos = this.cargarDatos();
    }

    cargarDatos() {
        const datosGuardados = localStorage.getItem('compras-takolandia');
        if (!datosGuardados) {
            return {};
        }

        try {
            return JSON.parse(datosGuardados) || {};
        } catch (error) {
            console.warn('LocalStorage de compras-takolandia inválido, reiniciando datos.', error);
            localStorage.removeItem('compras-takolandia');
            return {};
        }
    }

    guardarDatos() {
        try {
            localStorage.setItem('compras-takolandia', JSON.stringify(this.datos));
        } catch (error) {
            console.warn('No se pudo guardar la lista en LocalStorage.', error);
        }
    }

    agregarProducto(categoria, producto, cantidad = '') {
        if (!this.datos[categoria]) {
            this.datos[categoria] = {};
        }
        this.datos[categoria][producto] = {
            seleccionado: false,
            cantidad: cantidad,
            personalizado: false
        };
        this.guardarDatos();
    }

    actualizarProducto(categoria, producto, seleccionado, cantidad) {
        if (this.datos[categoria] && this.datos[categoria][producto]) {
            this.datos[categoria][producto].seleccionado = seleccionado;
            this.datos[categoria][producto].cantidad = cantidad;
            this.guardarDatos();
        }
    }

    eliminarProducto(categoria, producto) {
        if (this.datos[categoria] && this.datos[categoria][producto]) {
            delete this.datos[categoria][producto];
            if (Object.keys(this.datos[categoria]).length === 0) {
                delete this.datos[categoria];
            }
            this.guardarDatos();
        }
    }

    obtenerProducto(categoria, producto) {
        return this.datos[categoria] && this.datos[categoria][producto];
    }

    limpiarSeleccion() {
        for (let categoria in this.datos) {
            for (let producto in this.datos[categoria]) {
                this.datos[categoria][producto].seleccionado = false;
            }
        }
        this.guardarDatos();
    }

    obtenerResumen() {
        let totalSeleccionados = 0;
        let totalPersonalizados = 0;

        for (let categoria in this.datos) {
            for (let producto in this.datos[categoria]) {
                if (this.datos[categoria][producto].seleccionado) {
                    totalSeleccionados++;
                    if (this.datos[categoria][producto].personalizado) {
                        totalPersonalizados++;
                    }
                }
            }
        }

        return { totalSeleccionados, totalPersonalizados };
    }
}

const gestor = new GestorProductos();

// Inicializar productos en la primera carga
function inicializarProductos() {
    let datosIniciales = gestor.cargarDatos();
    
    for (let categoria in categorias) {
        if (!datosIniciales[categoria]) {
            datosIniciales[categoria] = {};
        }
        
        for (let producto of categorias[categoria].productos) {
            if (!datosIniciales[categoria][producto]) {
                datosIniciales[categoria][producto] = {
                    seleccionado: false,
                    cantidad: '',
                    personalizado: false
                };
            }
        }
    }
    
    gestor.datos = datosIniciales;
    gestor.guardarDatos();
}

// Renderizar las categorías y productos
function renderizarCategorias() {
    const contenedor = document.getElementById('contenedor-categorias');
    contenedor.innerHTML = '';

    for (let nombreCategoria in categorias) {
        const categoria = categorias[nombreCategoria];
        const datos = gestor.datos[nombreCategoria] || {};

        const divCategoria = document.createElement('div');
        divCategoria.className = 'categoria';
        divCategoria.setAttribute('data-categoria', nombreCategoria);

        // Encabezado de la categoría
        const h2 = document.createElement('h2');
        h2.innerHTML = `${categoria.emoji} ${nombreCategoria}`;
        divCategoria.appendChild(h2);

        // Lista de productos
        const listProductos = document.createElement('div');
        listProductos.className = 'lista-productos';

        // Productos predefinidos
        for (let producto of categoria.productos) {
            const datosProducto = datos[producto] || { seleccionado: false, cantidad: '', personalizado: false };
            const itemDiv = crearItemProducto(nombreCategoria, producto, datosProducto, false);
            listProductos.appendChild(itemDiv);
        }

        // Productos personalizados
        for (let producto in datos) {
            if (!categoria.productos.includes(producto) && datos[producto].personalizado) {
                const itemDiv = crearItemProducto(nombreCategoria, producto, datos[producto], true);
                listProductos.appendChild(itemDiv);
            }
        }

        divCategoria.appendChild(listProductos);

        // Sección de agregar producto
        const divAgregar = document.createElement('div');
        divAgregar.className = 'agregar-producto';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Agregar nuevo producto...';
        input.className = 'input-producto';

        const btnAgregar = document.createElement('button');
        btnAgregar.type = 'button';
        btnAgregar.className = 'btn-agregar';
        btnAgregar.textContent = '➕ Agregar';
        btnAgregar.onclick = () => agregarProductoPersonalizado(nombreCategoria, input);

        divAgregar.appendChild(input);
        divAgregar.appendChild(btnAgregar);
        divCategoria.appendChild(divAgregar);

        contenedor.appendChild(divCategoria);
    }

    actualizarResumen();
}

// Crear un item de producto
function crearItemProducto(categoria, producto, datos, esPersonalizado = false) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-producto';
    if (datos.seleccionado) {
        itemDiv.classList.add('seleccionado');
    }
    itemDiv.setAttribute('data-categoria', categoria);
    itemDiv.setAttribute('data-producto', producto);

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = datos.seleccionado;
    checkbox.onchange = (e) => {
        actualizarProducto(categoria, producto, e.target.checked, inputCantidad.value);
        itemDiv.classList.toggle('seleccionado');
    };

    // Nombre del producto
    const nombreSpan = document.createElement('span');
    nombreSpan.className = 'nombre-producto';
    nombreSpan.textContent = producto;

    // Input de cantidad
    const divCantidad = document.createElement('div');
    divCantidad.className = 'cantidad-disponible';

    const labelCantidad = document.createElement('label');
    labelCantidad.className = 'cantidad-label';
    labelCantidad.textContent = 'Cantidad';

    const inputCantidad = document.createElement('input');
    inputCantidad.type = 'number';
    inputCantidad.className = 'cantidad-input';
    inputCantidad.value = datos.cantidad;
    inputCantidad.placeholder = '1';
    inputCantidad.min = '0';
    inputCantidad.onchange = (e) => {
        actualizarProducto(categoria, producto, checkbox.checked, e.target.value);
    };

    divCantidad.appendChild(labelCantidad);
    divCantidad.appendChild(inputCantidad);

    // Botón eliminar (solo para productos personalizados)
    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(nombreSpan);
    itemDiv.appendChild(divCantidad);

    if (esPersonalizado) {
        const btnEliminar = document.createElement('button');
        btnEliminar.type = 'button';
        btnEliminar.className = 'btn-eliminar';
        btnEliminar.textContent = '❌';
        btnEliminar.onclick = () => eliminarProducto(categoria, producto);
        itemDiv.appendChild(btnEliminar);
    }

    return itemDiv;
}

// Agregar producto personalizado
function agregarProductoPersonalizado(categoria, inputElement) {
    const producto = inputElement.value.trim();
    if (producto === '') {
        alert('Por favor ingresa un nombre de producto');
        return;
    }

    const datosExistentes = gestor.datos[categoria] || {};
    if (datosExistentes[producto]) {
        alert('Este producto ya existe en la categoría');
        return;
    }

    gestor.datos[categoria] = datosExistentes;
    gestor.datos[categoria][producto] = {
        seleccionado: false,
        cantidad: '',
        personalizado: true
    };
    gestor.guardarDatos();

    inputElement.value = '';
    renderizarCategorias();
}

// Actualizar un producto
function actualizarProducto(categoria, producto, seleccionado, cantidad) {
    if (!gestor.datos[categoria]) {
        gestor.datos[categoria] = {};
    }
    if (!gestor.datos[categoria][producto]) {
        gestor.datos[categoria][producto] = { personalizado: false };
    }

    gestor.datos[categoria][producto].seleccionado = seleccionado;
    gestor.datos[categoria][producto].cantidad = cantidad;
    gestor.guardarDatos();
    actualizarResumen();
}

// Eliminar un producto
function eliminarProducto(categoria, producto) {
    if (confirm(`¿Estás seguro de que deseas eliminar "${producto}"?`)) {
        gestor.eliminarProducto(categoria, producto);
        renderizarCategorias();
    }
}

// Actualizar resumen
function actualizarResumen() {
    const resumen = gestor.obtenerResumen();
    document.getElementById('total-seleccionados').textContent = resumen.totalSeleccionados;
    document.getElementById('total-personalizados').textContent = resumen.totalPersonalizados;
}

// Limpiar selección
document.getElementById('btnLimpiar').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas limpiar toda la selección?')) {
        gestor.limpiarSeleccion();
        renderizarCategorias();
    }
});

// Ver lista
document.getElementById('btnVerLista').addEventListener('click', () => {
    verLista();
});

// Enviar WhatsApp
document.getElementById('btnEnviarWhatsApp').addEventListener('click', () => {
    enviarWhatsApp();
});

// Descargar lista
document.getElementById('btnDescargar').addEventListener('click', () => {
    generarListaDescarga();
});

// Ver lista
function verLista() {
    const lista = generarContenidoLista();
    if (!lista) {
        alert('No hay productos seleccionados');
        return;
    }
    
    // Guardar la lista en localStorage para la página de vista
    localStorage.setItem('lista-compras-vista', JSON.stringify(generarDatosLista()));
    
    // Abrir nueva ventana con la lista
    window.open('lista.html', '_blank');
}

// Enviar WhatsApp
function enviarWhatsApp() {
    const lista = generarContenidoLista();
    if (!lista) {
        alert('No hay productos seleccionados');
        return;
    }
    
    const numero = '593962737275';
    const mensaje = encodeURIComponent(`Lista de Compras - Takolandia\n\n${lista}`);
    const url = `https://wa.me/${numero}?text=${mensaje}`;
    window.open(url, '_blank');
}

// Generar contenido de la lista como texto
function generarContenidoLista() {
    let contenido = `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;

    let haySeleccionados = false;
    for (let nombreCategoria in categorias) {
        const datos = gestor.datos[nombreCategoria];
        if (!datos) continue;

        let productosSeleccionados = [];
        for (let producto in datos) {
            if (datos[producto].seleccionado) {
                let linea = `☑ ${producto}`;
                if (datos[producto].cantidad) {
                    linea += ` (Cantidad: ${datos[producto].cantidad})`;
                }
                productosSeleccionados.push(linea);
                haySeleccionados = true;
            }
        }

        if (productosSeleccionados.length > 0) {
            contenido += `${nombreCategoria}:\n`;
            contenido += productosSeleccionados.join('\n') + '\n\n';
        }
    }

    if (!haySeleccionados) return null;

    const resumen = gestor.obtenerResumen();
    contenido += `Total de productos: ${resumen.totalSeleccionados}\n`;
    contenido += `Productos personalizados: ${resumen.totalPersonalizados}\n`;

    return contenido;
}

// Generar datos de la lista para la vista
function generarDatosLista() {
    const lista = {
        fecha: new Date().toLocaleDateString('es-ES'),
        categorias: [],
        resumen: gestor.obtenerResumen()
    };

    for (let nombreCategoria in categorias) {
        const datos = gestor.datos[nombreCategoria];
        if (!datos) continue;

        const productosSeleccionados = [];
        for (let producto in datos) {
            if (datos[producto].seleccionado) {
                productosSeleccionados.push({
                    nombre: producto,
                    cantidad: datos[producto].cantidad,
                    personalizado: datos[producto].personalizado
                });
            }
        }

        if (productosSeleccionados.length > 0) {
            lista.categorias.push({
                nombre: nombreCategoria,
                emoji: categorias[nombreCategoria].emoji,
                productos: productosSeleccionados
            });
        }
    }

    return lista;
}

// Generar archivo de descarga
function generarListaDescarga() {
    const contenido = generarContenidoLista();
    if (!contenido) {
        alert('No hay productos seleccionados');
        return;
    }

    const blob = new Blob([`LISTA DE COMPRAS - TAKOLANDIA\n${contenido}`], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista-compras-takolandia-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    inicializarProductos();
    renderizarCategorias();
});