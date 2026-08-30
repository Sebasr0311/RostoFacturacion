-- ============================================================
-- schema.sql — Esquema de base de datos para OracLE Cloud
-- (Oracle Autonomous Database / XE). Sistema de facturación para
-- restaurante de pollo (Colombia, COP).
--
-- EL SCRIPT ES IDEMPOTENTE Y RE-EJECUTABLE:
--   - Elimina los objetos previos (en orden correcto de dependencias)
--     antes de recrearlos.
--   - Usa DROP ... CASCADE CONSTRAINTS donde hace falta.
--
-- Ejecutar con un usuario con permisos DDL (p.ej. ADMIN en ADB).
-- ============================================================

-- ------------------------------------------------------------
-- 0) LIMPIEZA PREVIA (orden de dependencias)
-- ------------------------------------------------------------
DROP VIEW    vw_ventas_dia;
DROP TRIGGER trg_factura_numero;
DROP SEQUENCE seq_factura;

DROP TABLE detalle_factura CASCADE CONSTRAINTS PURGE;
DROP TABLE facturas       CASCADE CONSTRAINTS PURGE;
DROP TABLE productos      CASCADE CONSTRAINTS PURGE;
DROP TABLE categorias     CASCADE CONSTRAINTS PURGE;
DROP TABLE clientes       CASCADE CONSTRAINTS PURGE;
DROP TABLE usuarios       CASCADE CONSTRAINTS PURGE;

-- ------------------------------------------------------------
-- 1) TABLA: categorias
-- ------------------------------------------------------------
CREATE TABLE categorias (
    id_categoria NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre       VARCHAR2(100) NOT NULL UNIQUE,
    estado       VARCHAR2(10) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','INACTIVO'))
);

-- ------------------------------------------------------------
-- 2) TABLA: productos
-- ------------------------------------------------------------
CREATE TABLE productos (
    id_producto          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre               VARCHAR2(150) NOT NULL,
    descripcion          VARCHAR2(500),
    precio               NUMBER(10,2) NOT NULL CHECK (precio >= 0),
    imagen_url           VARCHAR2(500),
    id_categoria         NUMBER REFERENCES categorias(id_categoria),
    estado               VARCHAR2(10) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','INACTIVO')),
    fecha_creacion       TIMESTAMP DEFAULT SYSTIMESTAMP,
    fecha_actualizacion  TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- ------------------------------------------------------------
-- 3) TABLA: usuarios (administradores / cajeros del sistema)
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_completo VARCHAR2(150) NOT NULL,
    correo          VARCHAR2(150) NOT NULL UNIQUE,
    password_hash   VARCHAR2(255) NOT NULL,
    rol             VARCHAR2(20) DEFAULT 'ADMIN' CHECK (rol IN ('ADMIN','CAJERO')),
    estado          VARCHAR2(10) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','INACTIVO')),
    fecha_creacion  TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- ------------------------------------------------------------
-- 4) TABLA: clientes
-- ------------------------------------------------------------
CREATE TABLE clientes (
    id_cliente NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre     VARCHAR2(150),
    documento  VARCHAR2(30),
    telefono   VARCHAR2(30),
    correo     VARCHAR2(150)
);

-- ------------------------------------------------------------
-- 5) SECUENCIA para el número consecutivo de factura
-- ------------------------------------------------------------
CREATE SEQUENCE seq_factura
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

-- ------------------------------------------------------------
-- 6) TABLA: facturas
-- ------------------------------------------------------------
CREATE TABLE facturas (
    id_factura     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_factura VARCHAR2(30) NOT NULL UNIQUE,   -- FAC-YYYY-NNNNNN
    id_cliente     NUMBER REFERENCES clientes(id_cliente),
    id_usuario     NUMBER NOT NULL REFERENCES usuarios(id_usuario), -- quién factura
    fecha_factura  TIMESTAMP DEFAULT SYSTIMESTAMP,
    subtotal       NUMBER(10,2) NOT NULL,
    impuestos      NUMBER(10,2) DEFAULT 0,
    descuento      NUMBER(10,2) DEFAULT 0,
    total          NUMBER(10,2) NOT NULL,
    metodo_pago    VARCHAR2(20) CHECK (metodo_pago IN ('EFECTIVO','TARJETA','TRANSFERENCIA','MIXTO')),
    estado         VARCHAR2(15) DEFAULT 'PAGADA' CHECK (estado IN ('PAGADA','ANULADA')),
    estado_envio   VARCHAR2(15) DEFAULT 'PENDIENTE' CHECK (estado_envio IN ('PENDIENTE','ENVIADO')),
    fecha_envio    TIMESTAMP NULL,
    aplicar_iva    NUMBER(1) DEFAULT 0 CHECK (aplicar_iva IN (0,1)),
    observaciones  VARCHAR2(500)
);

-- ------------------------------------------------------------
-- 7) TRIGGER: genera el número de factura antes del insert
--    Formato: 'FAC-' || año || '-' || consecutivo 6 dígitos
--    El valor queda disponible vía RETURNING numero_factura en el INSERT.
-- ------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_factura_numero
    BEFORE INSERT ON facturas
    FOR EACH ROW
BEGIN
    IF :NEW.numero_factura IS NULL THEN
        :NEW.numero_factura := 'FAC-' || TO_CHAR(SYSDATE,'YYYY') || '-' || LPAD(seq_factura.NEXTVAL, 6, '0');
    END IF;
END;
/

-- ------------------------------------------------------------
-- 8) TABLA: detalle_factura (líneas de la factura)
-- ------------------------------------------------------------
CREATE TABLE detalle_factura (
    id_detalle       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_factura       NUMBER NOT NULL REFERENCES facturas(id_factura) ON DELETE CASCADE,
    id_producto      NUMBER NOT NULL REFERENCES productos(id_producto),
    cantidad         NUMBER(6) NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMBER(10,2) NOT NULL,
    subtotal_linea   NUMBER(10,2) NOT NULL  -- cantidad * precio_unitario
);

-- ------------------------------------------------------------
-- 9) ÍNDICES sugeridos
-- ------------------------------------------------------------
CREATE INDEX idx_facturas_fecha       ON facturas(fecha_factura);
CREATE INDEX idx_detalle_factura      ON detalle_factura(id_factura);
CREATE INDEX idx_productos_estado     ON productos(estado);

-- ------------------------------------------------------------
-- 10) VISTA: vw_ventas_dia
--     Facturas PAGADA del día: total ventas, nº facturas, ticket
--     promedio y producto más vendido. Alimenta el dashboard.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vw_ventas_dia AS
SELECT
    TRUNC(SYSDATE)                                             AS dia,
    NVL(SUM(f.total), 0)                                       AS total_ventas,
    COUNT(f.id_factura)                                        AS numero_facturas,
    ROUND(NVL(AVG(f.total), 0), 2)                             AS ticket_promedio,
    (SELECT p.nombre
       FROM detalle_factura d
       JOIN facturas f2 ON f2.id_factura = d.id_factura
       JOIN productos p  ON p.id_producto = d.id_producto
      WHERE f2.estado = 'PAGADA'
        AND TRUNC(f2.fecha_factura) = TRUNC(SYSDATE)
      GROUP BY p.nombre
      ORDER BY SUM(d.cantidad) DESC
      FETCH FIRST 1 ROWS ONLY)                                 AS producto_mas_vendido
FROM facturas f
WHERE f.estado = 'PAGADA'
  AND TRUNC(f.fecha_factura) = TRUNC(SYSDATE)
GROUP BY TRUNC(SYSDATE);

-- ------------------------------------------------------------
-- Fin del esquema
-- ------------------------------------------------------------
EXIT;
