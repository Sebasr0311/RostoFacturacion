// ============================================================
// components/productos/ProductoModal.jsx — Crear / editar producto.
// Guarda con FormData (multipart) a POST/PUT /api/productos.
//   - imagen opcional (drag & drop + preview local).
//   - En edición, si NO se elige archivo el backend conserva la URL.
// Títulos por verbo exacto: "Agregar producto" / "Actualizar producto".
// ============================================================

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import ImageDropzone from './ImageDropzone';
import { crearProducto, actualizarProducto } from '../../services/productoService';
import { errorMessage } from '../../services/api';

const initialState = {
  nombre: '',
  descripcion: '',
  precio: '',
  id_categoria: '',
  estado: 'ACTIVO',
};

const inputCls =
  'mt-1 w-full rounded-lg border border-crema-borde bg-white px-3 py-2 text-sm text-carbon placeholder:text-carbon/60';

export default function ProductoModal({ open, onClose, categorias = [], producto = null, onSaved }) {
  const [form, setForm] = useState(initialState);
  const [imagen, setImagen] = useState(null); // { file, preview } | null
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(producto);

  // Reset del formulario cada vez que se abre con un producto distinto.
  useEffect(() => {
    if (!open) return;
    setForm(
      producto
        ? {
            nombre: producto.nombre ?? '',
            descripcion: producto.descripcion ?? '',
            precio: String(producto.precio ?? ''),
            id_categoria: String(producto.id_categoria ?? ''),
            estado: producto.estado ?? 'ACTIVO',
          }
        : initialState
    );
    setImagen(null);
    setError('');
  }, [open, producto]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nombre = form.nombre.trim();
    const precio = Number(form.precio);
    if (!nombre) return setError('El nombre del producto es obligatorio.');
    if (!Number.isFinite(precio) || precio < 0)
      return setError('Ingresa un precio válido (mayor o igual a 0).');
    if (!form.id_categoria) return setError('Selecciona una categoría.');

    const fd = new FormData();
    fd.append('nombre', nombre);
    fd.append('descripcion', form.descripcion.trim());
    fd.append('precio', String(precio));
    fd.append('id_categoria', String(form.id_categoria));
    fd.append('estado', form.estado);
    if (imagen?.file) {
      fd.append('imagen', imagen.file);
    }

    setSaving(true);
    try {
      if (isEdit) {
        await actualizarProducto(producto.id_producto, fd);
      } else {
        await crearProducto(fd);
      }
      onSaved(isEdit ? 'Producto actualizado correctamente.' : 'Producto agregado correctamente.');
    } catch (err) {
      setError(
        errorMessage(err, 'No se pudo guardar el producto. Verifica la conexión y volvé a intentar.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Actualizar producto' : 'Agregar producto'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ImageDropzone
          value={imagen?.preview}
          onFileChange={setImagen}
          existingUrl={producto?.imagen_url || ''}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-carbon/75 sm:col-span-2">
            Nombre *
            <input
              type="text"
              value={form.nombre}
              onChange={setField('nombre')}
              maxLength={150}
              placeholder="Ej: ¼ de Pollo"
              className={inputCls}
              autoFocus
            />
          </label>

          <label className="block text-xs font-medium text-carbon/75 sm:col-span-2">
            Descripción
            <textarea
              value={form.descripcion}
              onChange={setField('descripcion')}
              maxLength={500}
              rows={2}
              placeholder="Detalle del producto (opcional)"
              className={`${inputCls} resize-none`}
            />
          </label>

          <label className="block text-xs font-medium text-carbon/75">
            Precio (COP) *
            <input
              type="number"
              min="0"
              step="1"
              value={form.precio}
              onChange={setField('precio')}
              placeholder="18500"
              inputMode="numeric"
              className={`${inputCls} tabular-nums`}
            />
          </label>

          <label className="block text-xs font-medium text-carbon/75">
            Categoría *
            {categorias.length === 0 ? (
              <span className="mt-1 block rounded-lg border border-mostaza-miel/50 bg-mostaza-suave px-3 py-2 text-xs font-medium text-carbon">
                No hay categorías activas disponibles.
              </span>
            ) : (
              <select
                value={form.id_categoria}
                onChange={setField('id_categoria')}
                className={inputCls}
              >
                <option value="">Selecciona…</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria} value={String(c.id_categoria)}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            )}
          </label>

          {isEdit && (
            <label className="block text-xs font-medium text-carbon/75 sm:col-span-2">
              Estado
              <select
                value={form.estado}
                onChange={setField('estado')}
                className={inputCls}
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </label>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rojo-brasa/30 bg-brasa-suave px-3 py-2 text-sm font-medium text-rojo-brasa-oscuro"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-crema-borde bg-white px-4 py-2 text-sm font-semibold text-carbon shadow-sm transition hover:bg-crema-suave-osc disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || categorias.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rojo-brasa px-5 py-2 text-sm font-semibold text-white shadow-brasa transition hover:bg-rojo-brasa-oscuro disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Spinner size={16} light />}
            {isEdit ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}