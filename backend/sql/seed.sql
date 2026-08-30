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
-- 2) CATEGORÍAS — Menú oficial Rosto (carta)
-- ------------------------------------------------------------
INSERT INTO categorias (nombre, estado) VALUES ('Tenders', 'ACTIVO');
INSERT INTO categorias (nombre, estado) VALUES ('Tenders Combo', 'ACTIVO');
INSERT INTO categorias (nombre, estado) VALUES ('Hamburguesas', 'ACTIVO');
INSERT INTO categorias (nombre, estado) VALUES ('Chicken Dog', 'ACTIVO');

-- ------------------------------------------------------------
-- 3) PRODUCTOS — Menú oficial Rosto (carta), precios en COP.
--    id_categoria se resuelve por nombre para no depender de
--    los ids concretos de la identity.
--    Los combos son SKU separados (la arquitectura no soporta
--    variantes): nombre con sufijo "Combo" y contenido indicado
--    en la descripción según la carta.
-- ------------------------------------------------------------
-- Tenders
INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Tenders X4', 'Tenders de pechuga de pollo crispy, con papas a la francesa, más una tostada de pan y salsa especial de la casa.', 20900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Tenders'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Tenders X6', 'Tenders de pechuga de pollo crispy, con papas a la francesa, más una tostada de pan y salsa especial de la casa.', 29900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Tenders'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Tenders X8', 'Tenders de pechuga de pollo crispy, con papas a la francesa, más una tostada de pan y salsa especial de la casa. Incluye 2 tostadas de pan.', 38900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Tenders'), 'ACTIVO');

-- Tenders Combo
INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Tenders X4 Combo', 'Tenders de pechuga de pollo crispy, con papas a la francesa, más tostada de pan, gaseosa Coca-Cola (250ml) y salsa especial de la casa.', 22900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Tenders Combo'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Tenders X6 Combo', 'Tenders de pechuga de pollo crispy, con papas a la francesa, más tostada de pan, gaseosa Coca-Cola (250ml) y salsa especial de la casa.', 31900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Tenders Combo'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Tenders X8 Combo', 'Tenders de pechuga de pollo crispy, con papas a la francesa, más 2 tostadas de pan, 2 gaseosas Coca-Cola (250ml) y salsa especial de la casa.', 41900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Tenders Combo'), 'ACTIVO');

-- Hamburguesas
INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Classic Chicken Burger', '4 Tenders de pechuga de pollo crispy, pan de papa, pepinillos agridulce, queso mozzarella y salsa especial de la casa.', 21900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Hamburguesas'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Classic Chicken Burger Combo', 'Classic chicken burger con papas a la francesa y gaseosa Coca-Cola (250ml).', 25900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Hamburguesas'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Rosto Chicken Burger', '4 Tenders de pechuga de pollo crispy, pan de papa, lechuga crespa, tomate, aros de cebolla blanca, queso mozzarella y salsa especial de la casa.', 23900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Hamburguesas'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Rosto Chicken Burger Combo', 'Rosto chicken burger con papas a la francesa y gaseosa Coca-Cola (250ml).', 27900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Hamburguesas'), 'ACTIVO');

-- Chicken Dog
INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Rosto Chicken Dog', '1 Tender grande de pechuga de pollo crispy, pan de papa, cebolla blanca picada, maíz dulce, queso mozzarella y salsa especial de la casa.', 14900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Chicken Dog'), 'ACTIVO');

INSERT INTO productos (nombre, descripcion, precio, id_categoria, estado)
VALUES ('Rosto Chicken Dog Combo', 'Rosto chicken dog con gaseosa Coca-Cola (250ml).', 16900,
        (SELECT id_categoria FROM categorias WHERE nombre = 'Chicken Dog'), 'ACTIVO');

-- ------------------------------------------------------------
-- 4) CLIENTES DE EJEMPLO
-- ------------------------------------------------------------
INSERT INTO clientes (nombre, documento, telefono, correo)
VALUES ('Cliente Ejemplo Uno', 'CC-1012345678', '3001234567', 'cliente1@correo.com');

INSERT INTO clientes (nombre, documento, telefono, correo)
VALUES ('Cliente Ejemplo Dos', 'CC-1098765432', '3017654321', 'cliente2@correo.com');

COMMIT;
EXIT;
