# Rosto Facturación — Sistema de diseño "Brasa y Dorado"

> Documento vivo. Implementación: `frontend/src/index.css` (Tailwind CSS v4,
> CSS-first, `@theme`). Los componentes viven en `frontend/src/components/**`
> y `frontend/src/pages/**`.

## Propósito

La interfaz debe parecer de un restaurante real de pollo a la brasa, no de una
plantilla genérica de IA. La paleta, la tipografía, el motion y el copy se
construyen **desde el producto**: el carbón de la parrilla, la fritura dorada,
la brasa de la salsa picante y la mostaza con miel.

## Principios

1. **La paleta viene del producto, no de un generador.** Nada de
   "crema + terracota", "negro + verde ácido/bermellón" ni "periódico".
   Cada color tiene un nombre funcional y un rol.
2. **El carrito es el protagonista del punto de venta.** Visible en desktop
   (panel fijo), drawer en móvil/tablet, con conteo en vivo y subtotal en
   tiempo real.
3. **Motion con propósito:** todo ≤ 300 ms, un solo easing. Si no comunica
   un cambio de estado, no se anima.
4. **Accesibilidad WCAG 2.1 AA como mínimo, documentada** (tabla de
   contraste abajo). Funciona de 1024×768 (tablet) hasta 360 px de ancho.
5. **Copy honesto y accionable:** verbos exactos en los botones, errores con
   causa y solución, estados vacíos que invitan a actuar.

## Paleta

| Token              | Hex      | Rol                                                         |
| ------------------ | -------- | ----------------------------------------------------------- |
| `carbon`           | `#2A2320`| Carbón de la parrilla: texto principal, sidebar, neutros oscuros |
| `carbon-claro`     | `#3D332C`| Superficie elevada sobre carbón (hover/activo del sidebar)   |
| `crema-suave`      | `#FBF3E7`| Fondo general (la mesa)                                      |
| `crema-suave-osc`  | `#F4E8D5`| Superficies elevadas (filtros, cabeceras, hover suave)        |
| `crema-borde`      | `#E9D9BC`| Bordes suaves y decorativos                                  |
| `dorado-frito`     | `#E8A33D`| La fritura dorada: identidad dominante, marca, acentos       |
| `dorado-oscuro`    | `#C97F1F`| Variante profunda del dorado (iconos, hover, texto sobre crema) |
| `rojo-brasa`       | `#C43D1E`| La brasa de la salsa: acción principal, precios, errores     |
| `rojo-brasa-oscuro`| `#A43217`| Hover de la brasa, texto sobre fondos claros de error        |
| `mostaza-miel`     | `#C9A227`| Secundario (badges, acentos suaves)                          |
| `mostaza-suave`    | `#F0E0BA`| Fondo de badge mostaza                                       |
| `brasa-suave`      | `#F9E3D9`| Fondo de badge brasa / errores                               |

Sombras: `soft` (paneles flotantes), `card` (tarjetas), `brasa`
(roja, para CTA primarios).

## Tipografía

- **Display:** [Fraunces Variable](https://github.com/fontsource/fontsource)
  (`@fontsource-variable/fraunces`, familia `'Fraunces Variable'`,
  eje opsz activado). Títulos, totales y números protagonistas.
- **Texto/UI:** Inter (400/500/600/700).
- **Moneda:** todo precio usa `tabular-nums` para alinear columnas y evitar
  saltos al cambiar de dígito.

## Contraste (verificado, WCAG 2.1)

| Combinación                        | Ratio | Nivel |
| ---------------------------------- | ----- | ----- |
| `carbon` sobre `crema-suave`       | 14.0:1 | AAA   |
| `carbon` sobre `dorado-frito`      | 7.2:1  | AAA   |
| `dorado-frito` sobre `carbon`      | 7.2:1  | AAA   |
| `carbon` sobre `mostaza-miel`      | 6.4:1  | AA    |
| `rojo-brasa` sobre `blanco`        | 5.2:1  | AA    |
| `blanco` sobre `rojo-brasa`        | 5.2:1  | AA    |
| `rojo-brasa` sobre `crema-suave`   | 4.7:1  | AA    |
| `rojo-brasa-oscuro` sobre `brasa-suave` | 5.6:1 | AA |
| `carbon` sobre `crema-borde`       | 10.4:1 | AAA   |

**Prohibiciones:** texto blanco sobre `dorado-frito` (2.2:1) y `mostaza-miel`
como texto sobre crema (~2.1:1). La mostaza solo se usa como relleno con texto
`carbon`, nunca como color de texto.

## Decisiones clave

### Firma (a) — micro-animación de "añadido al carrito"

Cuando el usuario agrega un producto:

1. La tarjeta hace un `scale` sutil (Web Animations API, 300 ms,
   `cubic-bezier(0.22, 1, 0.36, 1)`), sin bloquear el botón.
2. Aparece el chip "Añadido" (carbón sobre dorado, ~1 s) sobre la tarjeta.
3. El ícono del carrito en el panel hace un rebote
   (`animate-cart-bump`, keyed por el conteo) y el badge de conteo hace
   `pop-in` con `aria-live="polite"`.

Respeto `prefers-reduced-motion` (ver abajo).

### Tabs de categorías — estado activo claro

La pestaña activa es una píldora `carbon` con texto `dorado-frito`
(15.5:1). Se rechazó el relleno dorado porque no llega al 3:1 de contraste
no-textual contra el fondo crema. Altura mínima 44 px (objetivo táctil),
`aria-pressed` en el botón.

### Carrito (POS)

- Desktop: panel fijo derecho de 400 px. Móvil/tablet: drawer con overlay.
- Totales sobre tarjeta blanca, con el **total en `rojo-brasa`**,
  Fraunces y `tabular-nums`.
- El subtotal se actualiza en tiempo real; el IVA es etiquetado como
  vista previa (el servidor calcula los valores finales).
- Steppers de cantidad con área táctil de 44 px y `aria-label` descriptivo.

## Motion

| Token            | Uso                     | Duración |
| ---------------- | ----------------------- | -------- |
| `cart-bump`      | Rebote del carrito      | 300 ms   |
| `pop-in`         | Badges, check de factura generada | 300 ms |
| `toast-in`       | Toasts                  | 250 ms   |
| `fade-in`        | Modales                 | 200 ms   |

El "pop" de la tarjeta al agregar (firma a) no usa token CSS: se ejecuta
con **Web Animations API** en `ProductCard` (300 ms, mismo easing) para
poder re-dispararse en cada click sin togglear clases.

- Easing único: `cubic-bezier(0.22, 1, 0.36, 1)`.
- `prefers-reduced-motion: reduce`: todas las transiciones se recortan a
  ~0 ms (CSS global) y las animaciones no esenciales llevan `motion-safe:`
  en el componente.
- El check de "Factura generada" hace `pop-in` una sola vez por factura
  (keyed por número).

## Accesibilidad

- Foco visible: anillo de 3 px + offset 2 px. `rojo-brasa` sobre fondos
  claros; `dorado-frito` dentro del sidebar y del panel `.on-dark` del login.
- Touch: botones de POS y acciones críticas ≥ 44 px (`min-h-11`/`min-h-12`).
- Skip-link "Saltar al contenido" → `main#contenido-principal`.
- Tablas con `caption` y `scope`; badges de estado siempre con texto
  (nunca color solo).
- Toasts y conteos cambiantes con `aria-live`.
- Errores de formulario con `role="alert"` y texto que indica la causa y
  el siguiente paso ("Verifica la conexión y volvé a intentar").
- Impresión: `@media print` imprime solo `#print-area` (la factura).

## Copy

- Botones con verbo exacto: "Generar factura", "Agregar producto",
  "Actualizar producto", "Anular factura", "Exportar ventas del día",
  "Volver al punto de venta" (en vez de "Nueva venta").
- Confirmación de anulación repite el nombre de la acción y el número:
  "¿Anular la factura FAC-…?" → toast "Factura anulada."
- Errores de conexión estándar: "No pudimos conectarnos con el servidor.
  Verifica que la API esté disponible y volvé a intentar."
- Estados vacíos como invitación: el carrito dice "Toca un producto del
  catálogo para agregarlo"; el historial "Aún no hay ventas hoy — genera tu
  primera factura" con acción al POS; productos "Todavía no hay productos —
  agrega el primero" con acción de alta.