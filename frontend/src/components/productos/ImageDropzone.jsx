// ============================================================
// components/productos/ImageDropzone.jsx — Subida de imagen con
// drag & drop + preview (FileReader) antes de enviar al servidor.
//
// Contrato backend: campo multipart 'imagen' (multer, 5 MB, image/*).
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
      setError('Solo se permiten archivos de imagen.');
      onFileChange(null);
      return;
    }
    if (file.size > IMAGEN_MAX_BYTES) {
      setError(`La imagen supera el tamaño máximo (${IMAGEN_MAX_MB} MB).`);
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
            ? 'border-brand-500 bg-brand-50'
            : 'border-cream-300 bg-cream-50 hover:border-brand-400 hover:bg-cream-100/60'
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Vista previa" className="max-h-48 rounded-lg object-contain shadow-card" />
            <p className="text-xs font-medium text-cacao-600">
              Vista previa — click para reemplazar o arrastra otra imagen
            </p>
          </>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-card">
              <UploadIcon size={22} />
            </span>
            <p className="text-sm font-semibold text-cacao-800">Arrastra la imagen aquí o haz click</p>
            <p className="text-xs text-cacao-500">PNG, JPG o WEBP · máx. {IMAGEN_MAX_MB} MB</p>
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

      {error && <p className="mt-1.5 text-xs font-medium text-brand-600">{error}</p>}

      {preview && (
        <button
          type="button"
          onClick={removeImage}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-cream-200 bg-white px-3 py-1.5 text-xs font-semibold text-cacao-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          <TrashIcon size={14} />
          Quitar imagen
        </button>
      )}
    </div>
  );
}