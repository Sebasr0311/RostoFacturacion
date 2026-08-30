// ============================================================
// pages/PosPage.jsx — Punto de venta (pantalla principal).
//
// - Catálogo de productos ACTIVOS agrupado por categorías (tabs).
// - Carrito lateral: fijo en desktop, drawer en móvil/tablet.
// - Cliente opcional, método de pago, descuento (%) y observaciones.
// - POST /api/facturas (el backend calcula totales) -> FacturaModal.
//
// NOTA DE CONTRATO: el backend espera `descuento` en COP absolutos;
// aquí el usuario ingresa un %, y se convierte a COP antes de enviar.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listarProductos } from '../services/productoService';
import { listarCategorias } from '../services/categoriaService';
import { crearFactura } from '../services/facturaService';
import { errorMessage } from '../services/api';
import { toast } from '../components/ui/Toast';
import CategoryTabs from '../components/pos/CategoryTabs';
import ProductCard from '../components/pos/ProductCard';
import CartPanel from '../components/pos/CartPanel';
import FacturaModal from '../components/facturas/FacturaModal';
import EmptyState from '../components/ui/EmptyState';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { ShoppingCartIcon, PackageIcon } from '../components/ui/Icons';
import { formatFechaSola, round2 } from '../utils/format';

// Mensaje de error estándar de conexión (accionable, con solución).
const MSG_SERVER =
  'No pudimos conectarnos con el servidor. Verifica que la API esté disponible y volvé a intentar.';

const inicialCliente = { nombre: '', documento: '', telefono: '' };

export default function PosPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  // ---- Catálogo ----
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('TODAS');

  // ---- Carrito ----
  const [cart, setCart] = useState([]);
  const [cliente, setCliente] = useState(inicialCliente);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [descuentoPct, setDescuentoPct] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [aplicarIva, setAplicarIva] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // ---- Resultado de facturación ----
  const [facturaResultado, setFacturaResultado] = useState(null);

  // ---- Anuncio accesible al agregar producto (móvil/tablet) ----
  const [ultimoAgregado, setUltimoAgregado] = useState('');
  const anuncioTimer = useRef(null);
  useEffect(() => () => clearTimeout(anuncioTimer.current), []);

  // ---- Guarda de desmontaje para cargas asíncronas ----
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const cargarCatalogo = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setCatalogError('');
    try {
      const [prods, cats] = await Promise.all([
        listarProductos({ estado: 'ACTIVO' }),
        listarCategorias({ estado: 'ACTIVO' }),
      ]);
      if (!mountedRef.current) return;
      setProductos(prods);
      setCategorias(cats);
    } catch (err) {
      if (!mountedRef.current) return;
      setCatalogError(MSG_SERVER);
      setProductos([]);
      setCategorias([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  // ---- Derivados del carrito ----
  const subtotal = useMemo(
    () => round2(cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0)),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + i.cantidad, 0), [cart]);
  const descuentoCOP = round2((subtotal * (Number(descuentoPct) || 0)) / 100);

  // ---- Acciones del carrito ----
  const addProducto = useCallback((producto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id_producto === producto.id_producto);
      if (existing) {
        return prev.map((i) =>
          i.id_producto === producto.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen_url: producto.imagen_url,
          cantidad: 1,
        },
      ];
    });
    // Anuncio accesible (una sola vez, no por cada clic repetido).
    setUltimoAgregado(`${producto.nombre} agregado al carrito`);
    clearTimeout(anuncioTimer.current);
    anuncioTimer.current = setTimeout(() => setUltimoAgregado(''), 2000);
  }, []);

  const incrementar = useCallback((id) => {
    setCart((prev) =>
      prev.map((i) => (i.id_producto === id ? { ...i, cantidad: i.cantidad + 1 } : i))
    );
  }, []);

  const decrementar = useCallback((id) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id_producto === id ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0)
    );
  }, []);

  const quitarProducto = useCallback((id) => {
    setCart((prev) => prev.filter((i) => i.id_producto !== id));
  }, []);

  const vaciarCarrito = useCallback(() => {
    setCart([]);
    setDescuentoPct('');
    setObservaciones('');
    setAplicarIva(false);
    setCliente(inicialCliente);
    setMetodoPago('EFECTIVO');
  }, []);

  const generarFactura = useCallback(async () => {
    if (cart.length === 0) return;
    setGenerando(true);
    try {
      const payload = {
        items: cart.map((i) => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
        metodo_pago: metodoPago,
        descuento: descuentoCOP,
        aplicar_iva: aplicarIva,
      };
      const tieneCliente = Object.values(cliente).some((v) => v.trim());
      if (tieneCliente) {
        payload.cliente = {
          nombre: cliente.nombre.trim() || undefined,
          documento: cliente.documento.trim() || undefined,
          telefono: cliente.telefono.trim() || undefined,
        };
      }
      if (observaciones.trim()) payload.observaciones = observaciones.trim();

      const factura = await crearFactura(payload);
      setFacturaResultado(factura);
      vaciarCarrito();
      toast.success(`Factura ${factura.numero_factura} generada.`);
    } catch (err) {
      toast.error(errorMessage(err, MSG_SERVER));
    } finally {
      setGenerando(false);
    }
  }, [cart, metodoPago, descuentoCOP, cliente, observaciones, aplicarIva, vaciarCarrito]);

  const cerrarCarrito = useCallback(() => setCartOpen(false), []);

  // ---- Productos filtrados por categoría ----
  const productosActivos = useMemo(() => {
    const activos = productos.filter((p) => p.estado === 'ACTIVO');
    if (categoriaActiva === 'TODAS') return activos;
    return activos.filter((p) => String(p.id_categoria) === String(categoriaActiva));
  }, [productos, categoriaActiva]);

  // ---- Conteos por categoría (O(1) por pestaña) ----
  const conteosPorCategoria = useMemo(() => {
    const m = new Map();
    let total = 0;
    for (const p of productos) {
      if (p.estado !== 'ACTIVO') continue;
      total += 1;
      const key = String(p.id_categoria);
      m.set(key, (m.get(key) || 0) + 1);
    }
    m.set('__TOTAL__', total);
    return m;
  }, [productos]);

  const getCount = useCallback(
    (idCategoria) => {
      if (idCategoria === null) return conteosPorCategoria.get('__TOTAL__') || 0;
      return conteosPorCategoria.get(String(idCategoria)) || 0;
    },
    [conteosPorCategoria]
  );

  const nombreCajero = usuario?.nombre_completo?.split(' ')[0] || '';

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 lg:pr-[416px]">
      {/* Región en vivo: anuncia en móvil/tablet qué se agregó al carrito */}
      <p className="sr-only" aria-live="polite">{ultimoAgregado}</p>
      {/* Encabezado del POS */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-carbon">Punto de venta</h1>
          <p className="mt-0.5 text-sm text-carbon/65">
            {formatFechaSola(new Date())}
            {nombreCajero ? ` · Hola, ${nombreCajero}` : ''}
          </p>
        </div>
        {/* Botón carrito móvil/tablet */}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative inline-flex min-h-11 items-center gap-2 rounded-xl bg-carbon px-4 py-2.5 text-sm font-semibold text-crema-suave shadow-card transition hover:bg-carbon-claro active:scale-95 motion-reduce:active:scale-100 lg:hidden"
        >
          <ShoppingCartIcon size={18} />
          Carrito
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-dorado-frito px-1 text-xs font-bold tabular-nums text-carbon">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <>
          <div className="mb-4 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-11 w-24 motion-reduce:animate-none animate-pulse rounded-full bg-crema-suave-osc" />
            ))}
          </div>
          <ProductCardSkeleton count={8} />
        </>
      ) : catalogError ? (
        <EmptyState
          icon={<PackageIcon size={26} />}
          title="No se pudo cargar el catálogo"
          message={catalogError}
          action={
            <button
              type="button"
              onClick={cargarCatalogo}
              className="rounded-xl bg-rojo-brasa px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-rojo-brasa-oscuro"
            >
              Reintentar
            </button>
          }
        />
      ) : productos.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={26} />}
          title="Todavía no hay productos"
          message="Agrega el primer producto para comenzar a facturar desde el punto de venta."
          action={
            <button
              type="button"
              onClick={() => navigate('/productos')}
              className="rounded-xl bg-carbon px-5 py-2.5 text-sm font-semibold text-crema-suave shadow-card transition hover:bg-carbon-claro"
            >
              Ir a productos
            </button>
          }
        />
      ) : (
        <>
          <div className="mb-5">
            <CategoryTabs
              categorias={categorias}
              active={categoriaActiva}
              onSelect={setCategoriaActiva}
              getCount={getCount}
            />
          </div>

          {productosActivos.length === 0 ? (
            <EmptyState
              icon={<PackageIcon size={26} />}
              title="Esta categoría aún no tiene productos"
              message="Probá con otra categoría del catálogo."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {productosActivos.map((p) => (
                <ProductCard key={p.id_producto} producto={p} onAdd={addProducto} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Carrito: fixed desktop + drawer móvil */}
      <CartPanel
        open={cartOpen}
        onClose={cerrarCarrito}
        cart={cart}
        cliente={cliente}
        onClienteChange={setCliente}
        metodoPago={metodoPago}
        onMetodoPagoChange={setMetodoPago}
        descuentoPct={descuentoPct}
        onDescuentoPctChange={setDescuentoPct}
        aplicarIva={aplicarIva}
        onAplicarIvaChange={setAplicarIva}
        observaciones={observaciones}
        onObservacionesChange={setObservaciones}
        subtotal={subtotal}
        onIncrement={incrementar}
        onDecrement={decrementar}
        onRemove={quitarProducto}
        onClear={vaciarCarrito}
        onGenerar={generarFactura}
        generating={generando}
      />

      {/* Botón flotante carrito móvil */}
      {cart.length > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-rojo-brasa text-white shadow-brasa transition hover:bg-rojo-brasa-oscuro active:scale-95 motion-reduce:active:scale-100 lg:hidden"
          aria-label="Abrir carrito"
        >
          <ShoppingCartIcon size={24} />
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-carbon px-1 text-xs font-bold tabular-nums text-dorado-frito">
            {cartCount}
          </span>
        </button>
      )}

      {/* Factura generada */}
      <FacturaModal
        open={Boolean(facturaResultado)}
        factura={facturaResultado}
        onClose={() => setFacturaResultado(null)}
        onNewSale={() => setFacturaResultado(null)}
      />
    </div>
  );
}