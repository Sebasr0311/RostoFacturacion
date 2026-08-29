// ============================================================
// services/imageService.js — Almacenamiento de imágenes de productos.
//
// Soporta dos modos (configurados por env IMAGE_STORAGE):
//   - 'cloudinary' (DEFAULT): sube el buffer a Cloudinary y devuelve la URL.
//     Si IMAGE_STORAGE=cloudinary pero faltan credenciales, DECRADA a 'url'
//     para no romper el CRUD.
//   - 'url': el campo imagen se guarda como URL directa (string).
//
// EXTENDER A BLOB EN ORACLE:
//   Para guardar la imagen como BLOB dentro de Oracle en lugar de Cloudinary,
//   basta con: (1) añadir una columna BLOB a `productos` (ej. imagen_blob),
//   (2) en uploadProductImage() cuando el modo no sea 'url' ni 'cloudinary',
//   devolver el buffer crudo y guardarlo con bind de tipo BLOB en el insert/update.
//   El resto del flujo (controlador -> servicio) no cambia: solo hay que mapear
//   el valor retornado al campo real de la BD.
// ============================================================

const { imageStorage } = require('../config/env');

let cloudinaryInstance = null;
let cloudinaryAvailable = false;

try {
  // Requiere credenciales de entorno. Si no están, cloudinary no se configura
  // y degradamos a 'url'.
  const hasCreds =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (hasCreds || process.env.CLOUDINARY_URL) {
    cloudinaryInstance = require('cloudinary').v2;
    cloudinaryInstance.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryAvailable = true;
  }
} catch (err) {
  // Si falla la configuración, seguimos en modo 'url'.
  cloudinaryAvailable = false;
  cloudinaryInstance = null;
}

/**
 * Modo efectivo de almacenamiento (respeta la degradación).
 */
function effectiveMode() {
  if (imageStorage() === 'cloudinary') {
    return cloudinaryAvailable ? 'cloudinary' : 'url';
  }
  return 'url';
}

/**
 * Sube un buffer de imagen y devuelve una URL.
 * @param {Buffer} buffer contenido de la imagen (multer memoryStorage)
 * @param {string} [folder] carpeta Cloudinary opcional
 * @param {string} [publicId] id público opcional (para reemplazos)
 * @returns {Promise<string|null>} URL de la imagen o null si no aplica
 */
function uploadProductImage(buffer, folder = 'rosto/productos', publicId) {
  const mode = effectiveMode();

  if (mode === 'cloudinary' && cloudinaryInstance) {
    return new Promise((resolve, reject) => {
      const opts = { folder };
      if (publicId) opts.public_id = publicId;
      const stream = cloudinaryInstance.uploader.upload_stream(opts, (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url || result.url || null);
      });
      stream.end(buffer);
    });
  }

  // Modo 'url': el controlador ya pasó un string en `buffer` (o campo texto).
  // Devolvemos tal cual; no hay streaming real que hacer aquí.
  return Promise.resolve(buffer && typeof buffer === 'string' ? buffer : null);
}

module.exports = {
  uploadProductImage,
  effectiveMode,
  cloudinaryAvailable,
};
