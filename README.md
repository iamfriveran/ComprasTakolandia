# ComprasTakolandia
Lista de compras para el restaurant Takolandia

## Página Web de Selección de Productos

Esta página web permite seleccionar los productos necesarios para la semana, organizados por categorías. Los empleados pueden acceder desde cualquier lugar para crear listas de compras.

### Características
- ✅ Selección de productos por categorías
- ✅ Agregar productos personalizados
- ✅ Especificar cantidades disponibles
- ✅ Vista previa de la lista en formato amigable
- ✅ Descarga de la lista como archivo de texto
- ✅ Envío directo por WhatsApp
- ✅ Diseño responsivo para móviles y desktop
- ✅ Logo de Takolandia en todas las páginas

### Cómo usar
1. Abre `index.html` en tu navegador web.
2. Marca los checkboxes de los productos que necesitas.
3. Especifica las cantidades disponibles si es necesario.
4. Agrega productos personalizados si faltan en las listas.
5. Usa "Ver Lista" para ver una vista previa bonita.
6. Envía por WhatsApp o descarga la lista.

### Categorías y Productos
- **🌾 Mayorista**: Aguacates, Cebolla, Limones, Pimiento rojo, Pimiento verde, Piñas, Tomate rojo, Tomate verde, Aji rocoto
- **🏪 Supermaxi**: Tortillas de tacos, Tortilla de burritos, Tortilla de Flautas, Esencia de coco, Leche condensada, Crema de coco, Crema de Leche, Hielo, Tajin, Achiote, Gomitas
- **🥩 Carnes**: Pulpa de res, Pulpa de cerdo, Pechuga, Estofado, Chorizo, Camarón
- **🧀 Lácteos**: Queso Mozarella, Queso Cheddar, Leches, Salsa Agria, Salsa Cheddar
- **🌮 Nachos**: 1K de Nachos, 2K de Nachos, 3K de Nachos, 4K de Nachos, 5K de Nachos
- **🛍️ Plásticos**: Lonchera grande, Lonchera pequeña, Vasos de Michelada con tapa, Sorbetes, Botellas con tapa, Salseros con tapa, Servilletas
- **🍺 Licores**: Pilsener Grande, Pilsener Personal, Club Grande, Club Personal, Corona Personal, Coronita, Tekila, Ron, Triple Seco, Toronja Imperial, Jugo de Naranja
- **🧹 Limpieza**: Cloro, Desinfectante, Quita Grasa, Escoba, Trapeador, Guantes, Balde

## Despliegue Web

### Opción 1: GitHub Pages (Recomendado)
1. Sube este repositorio a GitHub
2. Ve a Settings > Pages
3. Selecciona "Deploy from a branch"
4. Elige la rama `main` y carpeta `/ (root)`
5. Haz clic en Save
6. Tu sitio estará disponible en `https://tu-usuario.github.io/ComprasTakolandia`

### Opción 2: Netlify
1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta del proyecto o conecta tu repositorio de GitHub
3. El sitio se desplegará automáticamente

### Opción 3: Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. El sitio se desplegará automáticamente

### Opción 4: Servidor Local para Desarrollo
```bash
python3 -m http.server 8000
```
Luego abre http://localhost:8000 en tu navegador.

## Tecnologías
- HTML5
- CSS3
- JavaScript (Vanilla)
- Local Storage para persistencia de datos

## Estructura de Archivos
```
ComprasTakolandia/
├── index.html          # Página principal de selección
├── lista.html          # Página de vista previa de lista
├── script.js           # Lógica de la página principal
├── lista.js            # Lógica de la página de lista
├── styles.css          # Estilos CSS
├── takolandia-logo.svg # Logo del restaurante
└── README.md           # Este archivo
```
