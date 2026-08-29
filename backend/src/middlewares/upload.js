// ============================================================
// middlewares/upload.js — Configuración de subida de archivos con multer.
//
// Usa memoryStorage: la imagen llega como Buffer (req.file.buffer) y luego
// el servicio imageService la envía a Cloudinary o la guarda como URL.
// Así evitamos escribir archivos temporales en disco.
// ============================================================

const multer = require('multer');

// Límite de imagen: 5 MB. Solo imágenes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos de imagen.'));
  },
});

module.exports = { upload };
