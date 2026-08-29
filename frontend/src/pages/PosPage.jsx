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

import { useCallback, useEffect, useMemo, useState } from 'react';
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

const inicialCliente = { nombre: '', documento: '', telefono: '' };

export default function PosPage() {
  const { usuario } = useAuth();

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
  const [generando, setGenerando] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // ---- Resultado de facturación ----
  const [facturaResultado, setFacturaResultado] = useState(null);

  const cargarCatalogo = useCallback(async () => {
    setLoading(true);
    setCatalogError('');
    try {
      const [prods, cats] = await Promise.all([
        listarProductos({ estado: 'ACTIVO' }),
        listarCategorias({ estado: 'ACTIVO' }),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch (err) {
      setCatalogError(errorMessage(err, 'No se pudo cargar el catálogo.'));
      setProductos([]);
      setCategorias([]);
    } finally {
      setLoading(false);
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
    setCliente(inicialCliente);
    setMetodoPago('EFECTIVO');
  }, []);

  const generarFactura = async () => {
    if (cart.length === 0) return;
    setGenerando(true);
    try {
      const payload = {
        items: cart.map((i) => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
        metodo_pago: metodoPago,
        descuento: descuentoCOP,
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
      toast.error(errorMessage(err, 'No se pudo generar la factura.'));
    } finally {
      setGenerando(false);
    }
  };

  // ---- Productos filtrados por categoría ----
  const productosActivos = useMemo(() => {
    const activos = productos.filter((p) => p.estado === 'ACTIVO');
    if (categoriaActiva === 'TODAS') return activos;
    return activos.filter((p) => String(p.id_categoria) === String(categoriaActiva));
  }, [productos, categoriaActiva]);

  const getCount = useCallback(
    (idCategoria) => {
      const activos = productos.filter((p) => p.estado === 'ACTIVO');
      if (idCategoria === null) return activos.length;
      return activos.filter((p) => String(p.id_categoria) === String(idCategoria)).length;
    },
    [productos]
  );

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 lg:pr-[416px]">
      {/* Encabezado del POS */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cacao-900">Punto de venta</h1>
          <p className="text-sm text-cacao-600">
            {formatFechaSola(new Date())} · Hola, {usuario?.nombre_completo?.split(' ')[0] || 'usuario'} 👋
          </p>
        </div>
        {/* Botón carrito móvil/tablet */}
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="relative inline-flex items-center gap-2 rounded-xl bg-cacao-900 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-cacao-950 lg:hidden"
        >
          <ShoppingCartIcon size={18} />
          Carrito
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <>
          <div className="mb-4 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-cream-200/80" />
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
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Reintentar
            </button>
          }
        />
      ) : productos.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={26} />}
          title="No hay productos activos"
          message="Agrega productos desde el módulo de Productos para comenzar a facturar."
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
              title="Sin productos en esta categoría"
              message="Prueba con otra categoría o agrega productos nuevos."
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
        onClose={() => setCartOpen(false)}
        cart={cart}
        cliente={cliente}
        onClienteChange={setCliente}
        metodoPago={metodoPago}
        onMetodoPagoChange={setMetodoPago}
        descuentoPct={descuentoPct}
        onDescuentoPctChange={setDescuentoPct}
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
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-soft transition hover:bg-brand-700 active:scale-95 lg:hidden"
          aria-label="Abrir carrito"
        >
          <ShoppingCartIcon size={24} />
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-cacao-900 px-1 text-xs font-bold">
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