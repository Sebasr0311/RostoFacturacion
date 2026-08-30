ALTER TABLE facturas ADD (
  aplicar_iva NUMBER(1) DEFAULT 0 CHECK (aplicar_iva IN (0,1))
);
