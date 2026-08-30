// ============================================================
// components/productos/ImageDropzone.jsx — Subida de imagen con
// drag & drop + preview (FileReader) antes de enviar al servidor.
//
// Contrato backend: campo multipart 'imagen' (multer, 5 MB, image/*).
// Errores accionables con role="alert" para lectores de pantalla.
// ============================================================

import { useRef, useState } from 'react';
import { UploadIcon, TrashIcon } from '../ui/Icons';
import { IMAGEN_MAX_MB, IMAGEN_MAX_BYTES } from '../../utils/constants';

export default function ImageDropzone({ value, onFileChange, existingUrl = '' }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const preview = value || existingUrl || '';

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    setError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen. Elegí un PNG, JPG o WEBP.');
      onFileChange(null);
      return;
    }
    if (file.size > IMAGEN_MAX_BYTES) {
      setError(`La imagen supera el tamaño máximo (${IMAGEN_MAX_MB} MB). Elegí un archivo más liviano.`);
      onFileChange(null);
      return;
    }

    // Preview local con FileReader (no se sube nada todavía).
    const reader = new FileReader();
    reader.onload = () => onFileChange({ file, preview: reader.result });
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    onFileChange(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Subir imagen del producto"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`group relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed p-4 text-center transition ${
          dragOver
            ? 'border-rojo-brasa bg-brasa-suave'
            : 'border-crema-borde bg-crema-suave hover:border-dorado-frito hover:bg-crema-suave-osc'
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Vista previa de la imagen del producto" className="max-h-48 rounded-lg object-contain shadow-card" />
            <p className="text-xs font-medium text-carbon/70">
              Vista previa — elegí otro archivo para reemplazarla
            </p>
          </>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-dorado-oscuro shadow-card">
              <UploadIcon size={22} />
            </span>
            <p className="text-sm font-semibold text-carbon">Arrastrá la imagen aquí o elegí un archivo</p>
            <p className="text-xs text-carbon/75">PNG, JPG o WEBP · máx. {IMAGEN_MAX_MB} MB (opcional)</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-rojo-brasa-oscuro">
          {error}
        </p>
      )}

      {preview && (
        <button
          type="button"
          onClick={removeImage}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-crema-borde bg-white px-3 py-1.5 text-xs font-semibold text-carbon/75 transition hover:border-rojo-brasa/40 hover:text-rojo-brasa-oscuro"
        >
          <TrashIcon size={14} />
          Quitar imagen
        </button>
      )}
    </div>
  );
}