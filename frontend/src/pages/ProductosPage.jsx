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
import { PlusIcon, PencilIcon, TrashIcon, PackageIcon } from '../components/ui/Icons';
import { formatCOP } from '../utils/format';
import { ESTADO_PRODUCTO } from '../utils/constants';

function EstadoBadge({ estado }) {
  const info = ESTADO_PRODUCTO[estado] || { label: estado };
  const activo = estado === 'ACTIVO';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        activo ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'
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
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-2xl">
        🍗
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
      setError(errorMessage(err, 'No se pudieron cargar los productos.'));
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
      toast.error(errorMessage(err, 'No se pudo eliminar el producto.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cacao-900">Productos</h1>
          <p className="text-sm text-cacao-600">Administra el catálogo del punto de venta.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
          >
            <PlusIcon size={18} />
            Nuevo producto
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : error ? (
        <EmptyState
          icon={<PackageIcon size={26} />}
          title="No se pudieron cargar los productos"
          message={error}
          action={
            <button
              type="button"
              onClick={cargarDatos}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Reintentar
            </button>
          }
        />
      ) : productos.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={26} />}
          title="No hay productos registrados"
          message={isAdmin ? 'Crea el primer producto con el botón "Nuevo producto".' : 'El catálogo está vacío.'}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50 text-left text-[11px] font-semibold uppercase tracking-wide text-cacao-500">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Estado</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id_producto} className="border-b border-cream-100 transition hover:bg-cream-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb producto={p} />
                        <div className="min-w-0">
                          <p className="font-semibold text-cacao-900">{p.nombre}</p>
                          {p.descripcion && (
                            <p className="max-w-xs truncate text-xs text-cacao-600">{p.descripcion}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-cacao-900">
                      {formatCOP(p.precio)}
                    </td>
                    <td className="px-4 py-3 text-cacao-700">{p.categoria_nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={p.estado} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => abrirEditar(p)}
                            className="rounded-lg p-2 text-cacao-600 transition hover:bg-cream-100 hover:text-brand-600"
                            title="Editar"
                          >
                            <PencilIcon size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEliminando(p)}
                            className="rounded-lg p-2 text-cacao-600 transition hover:bg-brand-50 hover:text-brand-600"
                            title="Eliminar (inactivar)"
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
        title="¿Eliminar producto?"
        message={`"${eliminando?.nombre || ''}" pasará a estado INACTIVO; no se podrá vender en el punto de venta, pero se conserva su historial.`}
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleEliminar}
        onCancel={() => setEliminando(null)}
      />
    </div>
  );
}