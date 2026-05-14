// Cargar y mostrar la lista
function cargarLista() {
    const datosLista = localStorage.getItem('lista-compras-vista');
    if (!datosLista) {
        document.getElementById('contenedor-lista').innerHTML = '<p>No hay lista disponible. Vuelve a la página principal y selecciona productos.</p>';
        return;
    }

    try {
        const lista = JSON.parse(datosLista);
        mostrarLista(lista);
    } catch (error) {
        console.warn('LocalStorage de lista-compras-vista inválido, vuelva a generar la lista.', error);
        document.getElementById('contenedor-lista').innerHTML = '<p>La lista guardada está dañada. Vuelve a la página principal y haz clic en "Ver Lista" nuevamente.</p>';
    }
}

// Mostrar la lista en el DOM
function mostrarLista(lista) {
    const contenedor = document.getElementById('contenedor-lista');
    contenedor.innerHTML = '';

    // Encabezado con fecha
    const headerDiv = document.createElement('div');
    headerDiv.className = 'lista-header';
    headerDiv.innerHTML = `<h2>Fecha: ${lista.fecha}</h2>`;
    contenedor.appendChild(headerDiv);

    // Categorías
    for (let categoria of lista.categorias) {
        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'categoria-lista';

        const titulo = document.createElement('h3');
        titulo.innerHTML = `${categoria.emoji} ${categoria.nombre}`;
        categoriaDiv.appendChild(titulo);

        const listaProductos = document.createElement('ul');
        listaProductos.className = 'productos-lista';

        for (let producto of categoria.productos) {
            const item = document.createElement('li');
            item.className = 'producto-item';
            item.innerHTML = `
                <span class="producto-nombre">${producto.nombre}</span>
                ${producto.disponible ? `<span class="producto-cantidad">(Disponible: ${producto.disponible})</span>` : ''}
                ${producto.cantidad ? `<span class="producto-cantidad">(Comprar: ${producto.cantidad})</span>` : ''}
                ${producto.personalizado ? '<span class="producto-personalizado">⭐ Personalizado</span>' : ''}
            `;
            listaProductos.appendChild(item);
        }

        categoriaDiv.appendChild(listaProductos);
        contenedor.appendChild(categoriaDiv);
    }

    // Resumen
    const resumenDiv = document.createElement('div');
    resumenDiv.className = 'resumen-lista';
    resumenDiv.innerHTML = `
        <h3>📊 Resumen</h3>
        <p>Total de productos: <strong>${lista.resumen.totalSeleccionados}</strong></p>
        <p>Productos personalizados: <strong>${lista.resumen.totalPersonalizados}</strong></p>
    `;
    contenedor.appendChild(resumenDiv);
}

// Generar contenido de texto para WhatsApp/descarga
function generarContenidoLista() {
    const datosLista = localStorage.getItem('lista-compras-vista');
    if (!datosLista) return null;

    const lista = JSON.parse(datosLista);
    let contenido = `Fecha: ${lista.fecha}\n\n`;

    for (let categoria of lista.categorias) {
        contenido += `${categoria.nombre}:\n`;
        for (let producto of categoria.productos) {
            let linea = `☑ ${producto.nombre}`;
            if (producto.disponible) {
                linea += ` (Disponible: ${producto.disponible})`;
            }
            if (producto.cantidad) {
                linea += ` - Comprar: ${producto.cantidad}`;
            }
            contenido += linea + '\n';
        }
        contenido += '\n';
    }

    contenido += `Total de productos: ${lista.resumen.totalSeleccionados}\n`;
    contenido += `Productos personalizados: ${lista.resumen.totalPersonalizados}\n`;

    return contenido;
}

// Event listeners
document.getElementById('btnImprimir').addEventListener('click', () => {
    window.print();
});

document.getElementById('btnEnviarWhatsApp').addEventListener('click', () => {
    const contenido = generarContenidoLista();
    if (!contenido) {
        alert('No hay lista disponible');
        return;
    }

    const numero = '593962737275';
    const mensaje = encodeURIComponent(`Lista de Compras - Takolandia\n\n${contenido}`);
    const url = `https://wa.me/${numero}?text=${mensaje}`;
    window.open(url, '_blank');
});

document.getElementById('btnDescargar').addEventListener('click', () => {
    const contenido = generarContenidoLista();
    if (!contenido) {
        alert('No hay lista disponible');
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
});

document.getElementById('btnVolver').addEventListener('click', () => {
    window.close();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cargarLista();
});