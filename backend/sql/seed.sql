-- ============================================================
-- seed.sql — Datos iniciales de ejemplo (seed data).
-- Restaurante de pollo (Colombia, COP).
--
-- Asume que schema.sql ya fue ejecutado (las tablas existen).
-- Es seguro re-ejecutarlo junto con el esquema (se recrea desde cero).
-- ============================================================

-- ------------------------------------------------------------
-- 1) USUARIO ADMINISTRADOR
--    correo: admin@rosto.com  |  password: admin123
--    ⚠️ IMPORTANTE: cambiar esta contraseña en producción.
--    El hash bcrypt (cost 10) corresponde a "admin123".
-- ------------------------------------------------------------
INSERT INTO usuarios (nombre_completo, correo, password_hash, rol, estado)
VALUES (
    'Administrador Rosto',
    'admin@rosto.com',
    '$2b$10$/SUdEyOe4lCE1cSx23oULe76b1BhBNSBkMBOf78ZLh6J8/DPSyjUe', -- admin123
    'ADMIN',
    'ACTIVO'
);

-- ------------------------------------------------------------
-- 2) CATEGORÍAS
-- ------------------------------------------------------------
INSERT INTO categorias (nombre, estado) VALUES ('Pollo Frito', 'ACTIVO');
INSERT INTO categorias (nombre, estado) VALUES ('Combos', 'ACTIVO');
INSERT INTO categorias (nombre, estado) VALUES ('Bebidas', 'ACTIVO');
INSERT INTO categorias (nombre, estado) VALUES ('Adicionales', 'ACTIVO');

-- ------------------------------------------------------------
-- 3) PRODUCTOS (precios realistas en COP)
--    id_categoria se resuelve por nombre para no depender de
--    los ids concretos de la identity.
-- ------------------------------------------------------------
-- Pollo Frito
INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('¼ de Pollo', 'Cuarto de pollo a la brasa con papas y ensalada.', 18500,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Pollo Frito'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('½ de Pollo', 'Medio pollo a la brasa con papas y ensalada.', 32000,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Pollo Frito'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Pechuga a la Brasa', 'Pechuga a la brasa con papas, arroz y ensalada.', 24500,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Pollo Frito'), 'ACTIVO');

-- Combos
INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Combo Familiar', '1 pollo entero, papas familiares, gaseosa 2L y 4 panes.', 78000,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Combos'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Combo Personal', '¼ de pollo, papas medianas y gaseosa personal.', 24000,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Combos'), 'ACTIVO');

-- Bebidas
INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Gaseosa 1.5L', 'Gaseosa personal de 1.5 litros.', 8000,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Bebidas'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Jugo Natural', 'Jugo de fruta natural (mora, mango o lulo).', 6000,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Bebidas'), 'ACTIVO');

-- Adicionales
INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Adición de Papas', 'Porción adicional de papas a la francesa.', 6000,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Adicionales'), 'ACTIVO');

-- ------------------------------------------------------------
-- 4) CLIENTES DE EJEMPLO
-- ------------------------------------------------------------
INSERT INTO clientes (nombre, documento, telefono, correo)
VALUES ('Cliente Ejemplo Uno', 'CC-1012345678', '3001234567', 'cliente1@correo.com');

INSERT INTO clientes (nombre, documento, telefono, correo)
VALUES ('Cliente Ejemplo Dos', 'CC-1098765432', '3017654321', 'cliente2@correo.com');

COMMIT;
EXIT;
