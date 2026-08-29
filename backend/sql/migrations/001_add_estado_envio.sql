ALTER TABLE facturas ADD (
  estado_envio  VARCHAR2(15) DEFAULT 'PENDIENTE'
                CHECK (estado_envio IN ('PENDIENTE','ENVIADO')),
  fecha_envio   TIMESTAMP NULL
);