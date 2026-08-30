-- ============================================================
-- 003_carta_descripciones.sql
-- Menú Rosto (carta como fuente de verdad): completa las
-- descripciones que faltan y precisa el contenido del combo X8.
-- NO destructivo: solo UPDATE de descripciones por nombre.
-- Re-ejecución segura (idempotente).
-- ============================================================

UPDATE productos
SET descripcion = '4 Tenders de pechuga de pollo crispy, pan de papa, pepinillos agridulce, queso mozzarella y salsa especial de la casa.'
WHERE nombre = 'Classic Chicken Burger';

UPDATE productos
SET descripcion = '4 Tenders de pechuga de pollo crispy, pan de papa, lechuga crespa, tomate, aros de cebolla blanca, queso mozzarella y salsa especial de la casa.'
WHERE nombre = 'Rosto Chicken Burger';

UPDATE productos
SET descripcion = '1 Tender grande de pechuga de pollo crispy, pan de papa, cebolla blanca picada, maíz dulce, queso mozzarella y salsa especial de la casa.'
WHERE nombre = 'Rosto Chicken Dog';

UPDATE productos
SET descripcion = 'Tenders de pechuga de pollo crispy, con papas a la francesa, más 2 tostadas de pan, 2 gaseosas Coca-Cola (250ml) y salsa especial de la casa.'
WHERE nombre = 'Tenders X8 Combo';

COMMIT;
EXIT;