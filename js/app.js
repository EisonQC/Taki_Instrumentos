/*
1. CLASES, HERENCIA Y POLIMORFISMO
*/
class Producto {
  constructor(id, nombre, categoria, precio, imagen) {
    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.precio = precio;
    this.imagen = imagen;
  }

  calcularEnvio() {
    return 20; // costo de envío genérico por defecto
  }
}

class InstrumentoAndino extends Producto {
  calcularEnvio() {
    return 15; // embalaje más simple, taller local
  }
}

class InstrumentoModerno extends Producto {
  calcularEnvio() {
    return 25; // embalaje reforzado
  }
}

// Ejemplo explícito de prototipo: además de las clases anteriores
// (que ya usan prototipos por dentro), se agrega un método directo
// al prototipo de Producto para mostrarlo de forma manual.
Producto.prototype.resumen = function resumen() {
  return `${this.nombre} — S/ ${this.precio.toFixed(2)}`;
};

/*
2. CATÁLOGO ALMACENADO EN UN MAP
*/
const catalogo = new Map([
  ['charango', new InstrumentoAndino('charango', 'Charango de diez cuerdas', 'Andino', 380, 'img/charango_h.jpg')],
  ['quena', new InstrumentoAndino('quena', 'Quena de caña', 'Andino', 65, 'img/quena2.jpg')],
  ['zampona', new InstrumentoAndino('zampona', 'Zampoña (siku)', 'Andino', 55, 'img/zampona.jpg')],
  ['bombo', new InstrumentoAndino('bombo', 'Bombo legüero', 'Andino', 420, 'img/bombo.jpg')],
  ['guitarra', new InstrumentoModerno('guitarra', 'Guitarra acústica', 'Moderno', 450, 'img/F335.png')],
  ['teclado', new InstrumentoModerno('teclado', 'Teclado digital 88 teclas', 'Moderno', 1450, 'img/teclado.jpg')],
]);

function iconoCategoria(categoria) {
  // Estructura de control: switch
  switch (categoria) {
    case 'Andino':
      return '🪕';
    case 'Moderno':
      return '🎹';
    default:
      return '🎵';
  }
}

/*
3. ENCAPSULAMIENTO CON CAMPOS PRIVADOS (#)
*/
class ItemCarrito {
  #cantidad;

  constructor(producto, cantidad = 1) {
    this.producto = producto;
    this.#cantidad = cantidad;
  }

  get cantidad() {
    return this.#cantidad;
  }

  set cantidad(valor) {
    // if / else if / else: estructura de control
    if (valor < 1) {
      this.#cantidad = 1;
    } else if (valor > 10) {
      this.#cantidad = 10;
    } else {
      this.#cantidad = valor;
    }
  }

  get subtotal() {
    return this.producto.precio * this.#cantidad;
  }
}

class Carrito {
  #items = new Map();

  agregar(idProducto, cantidad = 1) {
    const producto = catalogo.get(idProducto);
    if (!producto) return;

    if (this.#items.has(idProducto)) {
      const item = this.#items.get(idProducto);
      item.cantidad = item.cantidad + cantidad;
    } else {
      this.#items.set(idProducto, new ItemCarrito(producto, cantidad));
    }
    this.guardar();
  }

  quitar(idProducto) {
    this.#items.delete(idProducto);
    this.guardar();
  }

  cambiarCantidad(idProducto, cantidad) {
    const item = this.#items.get(idProducto);
    if (!item) return;
    item.cantidad = cantidad;
    this.guardar();
  }

  vaciar() {
    this.#items.clear();
    this.guardar();
  }

  get items() {
    return [...this.#items.values()];
  }

  get cantidadTotal() {
    return this.items.reduce((acumulado, item) => acumulado + item.cantidad, 0);
  }

  // Función recursiva: suma los subtotales uno por uno hasta el caso base.
  #sumarSubtotales(lista, indice = 0) {
    if (indice >= lista.length) return 0; // caso base
    return lista[indice].subtotal + this.#sumarSubtotales(lista, indice + 1);
  }

  get subtotalProductos() {
    return this.#sumarSubtotales(this.items);
  }

  get envio() {
    if (this.items.length === 0) return 0;
    // Polimorfismo en acción: cada item calcula su envío según su propia clase.
    return this.items.reduce((acumulado, item) => acumulado + item.producto.calcularEnvio(), 0);
  }

  get total() {
    return this.subtotalProductos + this.envio;
  }

  guardar() {
    const datos = this.items.map((item) => ({ id: item.producto.id, cantidad: item.cantidad }));
    localStorage.setItem('taki_carrito', JSON.stringify(datos));
  }

  cargar() {
    const guardado = localStorage.getItem('taki_carrito');
    if (!guardado) return;
    try {
      const datos = JSON.parse(guardado);
      datos.forEach((d) => {
        const producto = catalogo.get(d.id);
        if (producto) this.#items.set(d.id, new ItemCarrito(producto, d.cantidad));
      });
    } catch (error) {
      console.warn('No se pudo leer el carrito guardado', error);
    }
  }
}

const carrito = new Carrito();
carrito.cargar();

/*
4. "FUNCIÓN CRECIENTE": clausura que acumula un valor con cada
llamada (los puntos de fidelidad "crecen" durante la sesión).
*/
function crearAcumulador() {
  let total = 0;
  return function (monto) {
    total += monto;
    return total;
  };
}
const acumularPuntos = crearAcumulador();
let puntosTaki = 0;

/*
5. FUNCIONES DE UTILIDAD (flecha, while, do...while)
*/
const formatearPrecio = (valor) => `S/ ${valor.toFixed(2)}`;

// while: calcula en cuántas cuotas se puede pagar sin superar un monto máximo
function calcularCuotas(total, cuotaMaxima = 200) {
  let cuotas = 1;
  while (total / cuotas > cuotaMaxima && cuotas < 12) {
    cuotas++;
  }
  return cuotas;
}

// do...while: genera un código de pedido que no se repita en esta sesión
const codigosUsados = new Set();
function generarCodigoPedido() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo;
  let intento = 0;
  do {
    codigo = 'TK-';
    for (let i = 0; i < 5; i++) {
      codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    intento++;
  } while (codigosUsados.has(codigo) && intento < 20);
  codigosUsados.add(codigo);
  return codigo;
}

/*
6. RENDER DEL CARRITO (manipulación del DOM)
*/
function renderizarCarrito() {
  const lista = document.querySelector('#carrito-lista');
  const vacio = document.querySelector('#carrito-vacio');
  const totalEl = document.querySelector('#carrito-total');
  const cuotasEl = document.querySelector('#carrito-cuotas');
  const badges = document.querySelectorAll('.carrito-badge');

  if (!lista) return; // esta página no tiene panel de carrito

  lista.innerHTML = '';

  if (carrito.items.length === 0) {
    vacio.hidden = false;
  } else {
    vacio.hidden = true;
    for (const item of carrito.items) {
      const fila = document.createElement('li');
      fila.className = 'carrito-item';
      fila.dataset.id = item.producto.id;
      fila.innerHTML = `
        <img src="${item.producto.imagen}" alt="${item.producto.nombre}">
        <div class="carrito-item-info">
          <h4>${iconoCategoria(item.producto.categoria)} ${item.producto.nombre}</h4>
          <p>${formatearPrecio(item.producto.precio)} c/u</p>
          <div class="carrito-cantidad">
            <button type="button" class="qty-btn" data-accion="restar" aria-label="Restar cantidad">&minus;</button>
            <span>${item.cantidad}</span>
            <button type="button" class="qty-btn" data-accion="sumar" aria-label="Sumar cantidad">&plus;</button>
          </div>
        </div>
        <button type="button" class="carrito-quitar" aria-label="Quitar ${item.producto.nombre}">&times;</button>
      `;
      lista.appendChild(fila);
    }
  }

  totalEl.textContent = formatearPrecio(carrito.total);
  if (cuotasEl) {
    const cuotas = calcularCuotas(carrito.total);
    cuotasEl.textContent = cuotas > 1
      ? `Puedes pagarlo en ${cuotas} cuotas de ${formatearPrecio(carrito.total / cuotas)}`
      : '';
  }
  badges.forEach((b) => {
    b.textContent = String(carrito.cantidadTotal);
    b.hidden = carrito.cantidadTotal === 0;
  });

  const puntosEl = document.querySelector('#puntos-taki');
  if (puntosEl) puntosEl.textContent = String(puntosTaki);

  renderizarResumenPedido();
}

/*
7. NOTIFICACIONES "TOAST" (setTimeout)
*/
function mostrarToast(mensaje) {
  const contenedor = document.querySelector('#toast-contenedor');
  if (!contenedor) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = mensaje;
  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-salir');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/*
8. FILTRO DE PRODUCTOS (for + estructuras de control)
*/
function filtrarProductos(texto) {
  const tarjetas = document.querySelectorAll('.product-card');
  const buscado = texto.trim().toLowerCase();
  let visibles = 0;
  for (let i = 0; i < tarjetas.length; i++) {
    const tarjeta = tarjetas[i];
    const nombre = (tarjeta.dataset.nombre || '').toLowerCase();
    const categoria = (tarjeta.dataset.categoria || '').toLowerCase();
    const coincide = nombre.includes(buscado) || categoria.includes(buscado);
    tarjeta.hidden = !coincide;
    if (coincide) visibles++;
  }
  const sinResultados = document.querySelector('#sin-resultados');
  if (sinResultados) sinResultados.hidden = visibles !== 0;
}

/* 
9. BANNER DESTACADO GIRATORIO (setInterval)
*/
function iniciarBannerDestacados() {
  const frases = document.querySelectorAll('.destacado-frase');
  if (frases.length === 0) return;
  let indice = 0;
  frases[0].classList.add('activa');
  setInterval(() => {
    frases[indice].classList.remove('activa');
    indice = (indice + 1) % frases.length;
    frases[indice].classList.add('activa');
  }, 4000);
}

/*
10. RESUMEN DE PEDIDO EN LA PÁGINA DE CONTACTO
*/
function renderizarResumenPedido() {
  const resumen = document.querySelector('#resumen-pedido');
  if (!resumen) return;

  if (carrito.items.length === 0) {
    resumen.innerHTML = '<p>Tu carrito está vacío. Agrega instrumentos desde el <a href="catalogo.html">catálogo</a> antes de enviar tu pedido.</p>';
    return;
  }

  const filas = carrito.items
    .map((item) => `<li>${item.cantidad} &times; ${item.producto.nombre} &mdash; ${formatearPrecio(item.subtotal)}</li>`)
    .join('');

  resumen.innerHTML = `
    <ul class="resumen-lista">${filas}</ul>
    <p class="resumen-linea">Envío: ${formatearPrecio(carrito.envio)}</p>
    <p class="resumen-total">Total: ${formatearPrecio(carrito.total)}</p>
  `;

  const mensaje = document.querySelector('#mensaje');
  const codigoInput = document.querySelector('#codigo-pedido');
  if (mensaje && codigoInput && !codigoInput.value) {
    const codigo = generarCodigoPedido();
    codigoInput.value = codigo;
    const detalle = carrito.items.map((item) => `- ${item.cantidad} x ${item.producto.nombre}`).join('\n');
    mensaje.value = `Pedido ${codigo}:\n${detalle}\nTotal estimado: ${formatearPrecio(carrito.total)}`;
  }
}

/*
11. EVENTOS: clic (con delegación/propagación), teclado, foco,
scroll y carga de la página.
*/
document.addEventListener('DOMContentLoaded', () => {
  // --- Delegación de eventos: un solo listener en el contenedor
  // capta los clics de TODOS los botones "Agregar al carrito",
  // porque el clic se propaga (burbujea) desde el botón hasta el
  // contenedor .product-grid.
  document.querySelectorAll('.product-grid').forEach((grid) => {
    grid.addEventListener('click', (evento) => {
      const boton = evento.target.closest('.agregar-carrito');
      if (!boton) return;
      const tarjeta = boton.closest('.product-card');
      carrito.agregar(tarjeta.dataset.id, 1);
      puntosTaki = acumularPuntos(Math.round(catalogo.get(tarjeta.dataset.id).precio * 0.1));
      mostrarToast(`${tarjeta.dataset.nombre} se añadió al carrito`);
      renderizarCarrito();
    });
  });

  // --- Clics dentro del carrito: quitar producto o cambiar cantidad.
  const listaCarrito = document.querySelector('#carrito-lista');
  if (listaCarrito) {
    listaCarrito.addEventListener('click', (evento) => {
      const fila = evento.target.closest('.carrito-item');
      if (!fila) return;
      const id = fila.dataset.id;

      if (evento.target.matches('.carrito-quitar')) {
        // Detiene la propagación: este clic no debe disparar nada
        // en un contenedor superior que también escuche clics.
        evento.stopPropagation();
        carrito.quitar(id);
        renderizarCarrito();
        return;
      }

      if (evento.target.matches('.qty-btn')) {
        const item = carrito.items.find((i) => i.producto.id === id);
        if (!item) return;
        const accion = evento.target.dataset.accion;
        const nuevaCantidad = accion === 'sumar' ? item.cantidad + 1 : item.cantidad - 1;
        if (nuevaCantidad <= 0) {
          carrito.quitar(id);
        } else {
          carrito.cambiarCantidad(id, nuevaCantidad);
        }
        renderizarCarrito();
      }
    });
  }

  // --- Abrir / cerrar el panel del carrito.
  const abrirBtn = document.querySelector('#abrir-carrito');
  const cerrarBtn = document.querySelector('#cerrar-carrito');
  const panel = document.querySelector('#carrito-panel');
  const fondo = document.querySelector('#carrito-fondo');

  function abrirCarrito() {
    panel?.classList.add('abierto');
    fondo?.classList.add('visible');
    panel?.setAttribute('aria-hidden', 'false');
  }
  function cerrarCarrito() {
    panel?.classList.remove('abierto');
    fondo?.classList.remove('visible');
    panel?.setAttribute('aria-hidden', 'true');
  }
  abrirBtn?.addEventListener('click', abrirCarrito);
  cerrarBtn?.addEventListener('click', cerrarCarrito);
  fondo?.addEventListener('click', cerrarCarrito);

  // --- Evento de teclado: cerrar el carrito con la tecla Escape.
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrarCarrito();
  });

  // --- Eventos de foco y teclado en el buscador del catálogo.
  const buscador = document.querySelector('#buscador');
  if (buscador) {
    buscador.addEventListener('focus', () => buscador.classList.add('buscador-activo'));
    buscador.addEventListener('blur', () => buscador.classList.remove('buscador-activo'));
    buscador.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') {
        evento.preventDefault();
        filtrarProductos(buscador.value);
      }
    });
    buscador.addEventListener('input', () => filtrarProductos(buscador.value));
  }

  // --- Evento de scroll: botón flotante "volver arriba".
  const volverArriba = document.querySelector('#volver-arriba');
  if (volverArriba) {
    window.addEventListener('scroll', () => {
      volverArriba.classList.toggle('visible', window.scrollY > 400);
    });
    volverArriba.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  iniciarBannerDestacados();
  renderizarCarrito();
});

// --- Evento "load": se dispara cuando TODO terminó de cargar
// (incluidas las imágenes), a diferencia de DOMContentLoaded.
window.addEventListener('load', () => {
  const loader = document.querySelector('#cargando');
  if (loader) loader.classList.add('oculto');
});
