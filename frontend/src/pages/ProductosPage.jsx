// ============================================================
// pages/ProductosPage.jsx — Gestión de productos (CRUD).
// Tabla con miniatura, nombre, precio, categoría y estado.
// Crear/editar (modal con drag & drop de imagen) y eliminar
// (soft delete con confirmación). Acciones restringidas a ADMIN
// (el backend también lo valida con 403).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listarProductos, eliminarProducto } from '../services/productoService';
import { listarCategorias } from '../services/categoriaService';
import { errorMessage } from '../services/api';
import { toast } from '../components/ui/Toast';
import ProductoModal from '../components/productos/ProductoModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { TableSkeleton } from '../components/ui/Skeleton';
import { PlusIcon, PencilIcon, TrashIcon, PackageIcon, FlameIcon } from '../components/ui/Icons';
import { formatCOP } from '../utils/format';
import { ESTADO_PRODUCTO } from '../utils/constants';

const MSG_SERVER =
  'No pudimos conectarnos con el servidor. Verifica que la API esté disponible y volvé a intentar.';

function EstadoBadge({ estado }) {
  const info = ESTADO_PRODUCTO[estado] || { label: estado };
  const activo = estado === 'ACTIVO';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        activo ? 'bg-mostaza-suave text-carbon' : 'bg-crema-borde text-carbon/70'
      }`}
    >
      {info.label}
    </span>
  );
}

function Thumb({ producto }) {
  const [broken, setBroken] = useState(false);
  if (!producto.imagen_url || broken) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mostaza-suave text-rojo-brasa">
        <FlameIcon size={22} />
      </span>
    );
  }
  return (
    <img
      src={producto.imagen_url}
      alt={producto.nombre}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-12 w-12 shrink-0 rounded-xl object-cover"
    />
  );
}

export default function ProductosPage() {
  const { isAdmin } = useAuth();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prods, cats] = await Promise.all([listarProductos(), listarCategorias()]);
      setProductos(prods);
      setCategorias(cats.filter((c) => c.estado === 'ACTIVO'));
    } catch (err) {
      setError(errorMessage(err, MSG_SERVER));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const abrirNuevo = () => {
    setEditando(null);
    setModalOpen(true);
  };

  const abrirEditar = (producto) => {
    setEditando(producto);
    setModalOpen(true);
  };

  const handleSaved = (mensaje) => {
    setModalOpen(false);
    setEditando(null);
    toast.success(mensaje);
    cargarDatos();
  };

  const handleEliminar = async () => {
    if (!eliminando) return;
    setDeleting(true);
    try {
      await eliminarProducto(eliminando.id_producto);
      toast.success('Producto eliminado (inactivo).');
      setEliminando(null);
      cargarDatos();
    } catch (err) {
      toast.error(errorMessage(err, MSG_SERVER));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-carbon">Productos</h1>
          <p className="mt-0.5 text-sm text-carbon/65">
            Administra el catálogo del punto de venta.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rojo-brasa px-4 py-2.5 text-sm font-semibold text-white shadow-brasa transition hover:bg-rojo-brasa-oscuro"
          >
            <PlusIcon size={18} />
            Agregar producto
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : error ? (
        <EmptyState
          icon={<PackageIcon size={26} />}
          title="No se pudo cargar el catálogo"
          message={error}
          action={
            <button
              type="button"
              onClick={cargarDatos}
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
          message={
            isAdmin
              ? 'Agrega el primer producto con el botón "Agregar producto".'
              : 'El catálogo está vacío.'
          }
          action={
            isAdmin ? (
              <button
                type="button"
                onClick={abrirNuevo}
                className="rounded-xl bg-rojo-brasa px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-rojo-brasa-oscuro"
              >
                Agregar producto
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-crema-borde bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">Listado de productos del catálogo</caption>
              <thead>
                <tr className="border-b border-crema-borde bg-crema-suave text-left text-[11px] font-semibold uppercase tracking-wide text-carbon/60">
                  <th scope="col" className="px-4 py-3">Producto</th>
                  <th scope="col" className="px-4 py-3">Precio</th>
                  <th scope="col" className="px-4 py-3">Categoría</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  {isAdmin && <th scope="col" className="px-4 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id_producto} className="border-b border-crema-borde transition hover:bg-crema-suave/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb producto={p} />
                        <div className="min-w-0">
                          <p className="font-semibold text-carbon">{p.nombre}</p>
                          {p.descripcion && (
                            <p className="max-w-xs truncate text-xs text-carbon/60">{p.descripcion}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-carbon">
                      {formatCOP(p.precio)}
                    </td>
                    <td className="px-4 py-3 text-carbon/70">{p.categoria_nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={p.estado} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => abrirEditar(p)}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-carbon/60 transition hover:bg-crema-suave-osc hover:text-dorado-oscuro"
                            title="Editar"
                            aria-label={`Editar ${p.nombre}`}
                          >
                            <PencilIcon size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEliminando(p)}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-carbon/60 transition hover:bg-brasa-suave hover:text-rojo-brasa-oscuro"
                            title="Eliminar (inactivar)"
                            aria-label={`Eliminar ${p.nombre}`}
                          >
                            <TrashIcon size={17} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditando(null);
        }}
        categorias={categorias}
        producto={editando}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(eliminando)}
        title="¿Eliminar este producto?"
        message={`"${eliminando?.nombre || ''}" pasará a estado INACTIVO; no se podrá vender en el punto de venta, pero se conserva su historial.`}
        confirmLabel="Eliminar producto"
        loading={deleting}
        onConfirm={handleEliminar}
        onCancel={() => setEliminando(null)}
      />
    </div>
  );
}