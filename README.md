# Rosto Facturación

Sistema de facturación web para un restaurante de pollo a la brasa (Colombia, COP). Cuenta con un punto de venta (POS) con carrito en tiempo real, gestión completa de productos con imágenes, generación de facturas con PDF, exportación de reportes a Excel, un dashboard de ventas y autenticación basada en JWT. El backend es una API REST en Node.js + Express sobre una base de datos Oracle (Autonomous Database), y el frontend es una SPA en React que se despliega en GitHub Pages.

## Funcionalidades

- **Gestión de productos** con imagen (subida a Cloudinary o modo `url`, con degradación automática).
- **POS con carrito en tiempo real**: catálogo por categorías, agregar/quitar productos, vista previa de IVA y total.
- **Facturación**: cálculo 100% en el backend (precios reales desde la base de datos, IVA configurable, descuento) y **PDF** de la factura.
- **Exportación a Excel** de reportes de ventas (libro de 3 hojas: Resumen, Detalle Facturas, Detalle Productos).
- **Dashboard / historial de ventas** con resumen diario y por rango de fechas.
- **Autenticación JWT** con roles `ADMIN` y `CAJERO`, protección de rutas y control de acceso de administración.

## Stack tecnológico

| Capa      | Tecnología                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------- |
| Backend   | Node.js 24 · Express 5 · `oracledb` (driver thin) · JWT + bcryptjs · zod · multer + Cloudinary      |
| Frontend  | React 19 · Vite 8 · Tailwind v4 · react-router-dom (HashRouter) · axios                             |
| Base datos | Oracle (Autonomous Database de Oracle Cloud Free Tier recomendada, o XE)                            |
| Despliegue| Backend en Render (blueprint `render.yaml`) · Frontend en GitHub Pages (rama `gh-pages`)            |

## Arquitectura del proyecto

```
RostoFacturacion/
├── backend/                  # API REST
│   ├── server.js             # Punto de entrada: carga .env, inicializa Oracle y arranca Express
│   ├── src/
│   │   ├── app.js            # Ensambla la app Express: helmet, CORS, rutas /api, manejo de errores
│   │   ├── config/
│   │   │   ├── env.js        # Valores de entorno normalizados (IVA, CORS, almacenamiento de imágenes)
│   │   │   └── oracle.js     # Pool de conexión a Oracle (driver thin) y estado de conexión
│   │   ├── routes/           # Definición de endpoints (auth, productos, categorias, facturas, reportes)
│   │   ├── controllers/      # Lógica HTTP: validan con zod, llaman a servicios, responden el envelope
│   │   ├── services/         # Lógica de negocio: facturación, reportes, Excel, PDF, imágenes
│   │   ├── middlewares/      # Autenticación JWT, roles, subida de archivos (multer)
│   │   └── utils/            # Envelope de respuesta, manejo async, errores de Oracle, helpers de zod
│   └── sql/
│       ├── schema.sql        # Esquema de BD idempotente (tablas, secuencia, trigger, vista, índices)
│       └── seed.sql          # Datos iniciales de ejemplo (admin, categorías, productos, clientes)
├── frontend/                 # SPA React
│   └── src/
│       ├── main.jsx          # Renderiza la app con HashRouter (necesario para GitHub Pages)
│       ├── App.jsx           # Rutas: /login, / (POS), /productos, /historial (protegidas)
│       ├── pages/            # Page components: Login, POS, Productos, Historial
│       ├── components/       # UI: POS (cart, tabs, cards), modales, layout, componentes genéricos
│       ├── context/          # AuthContext (estado de sesión)
│       ├── services/         # Clientes axios por recurso + instancia api.js con interceptores
│       └── utils/            # Constantes y helpers de formato
├── .github/workflows/deploy.yml  # Build del frontend y publicación en gh-pages en cada push a main
└── render.yaml                   # Blueprint de Render para desplegar el backend
```

## Requisitos previos

- **Node.js** >= 20 (probado con 24). El backend declara `engines.node >= 20` y el frontend `>= 20.19`.
- **npm** (incluido con Node).
- Una **base de datos Oracle**: se recomienda **Autonomous Database** de Oracle Cloud Free Tier (o una instancia **XE**). Será necesaria para el backend y para el health check.
- (Opcional) Una **cuenta de Cloudinary** si se quiere almacenar imágenes de productos en la nube. Si no, se usa el modo `url` (ver `IMAGE_STORAGE`).

## Instalación local paso a paso

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/tu-usuario/RostoFacturacion.git
cd RostoFacturacion

cd backend
npm install

cd ../frontend
npm install
```

### 2. Preparar la base de datos Oracle

1. Crea un **usuario/esquema** en Oracle con permisos DDL (en Autonomous Database el usuario suele ser `ADMIN`). Por ejemplo, en SQLcl o SQL\*Plus: conectarse como administrador y, si se desea, crear un usuario dedicado.
2. Ejecuta `backend/sql/schema.sql` y, a continuación, `backend/sql/seed.sql`, en ese orden, con el usuario propietario del esquema.
   - Con **SQL\*Plus** / **SQLcl**: `@schema.sql` y luego `@seed.sql`.
   - En la **consola de Autonomous Database** (SQL Worksheet): abrir cada archivo y ejecutarlo.
3. **Notas sobre el esquema**:
   - Las claves primarias usan `GENERATED ALWAYS AS IDENTITY` (no hay una secuencia por tabla como en Oracle clásico).
   - El número de factura lo genera el **trigger** `trg_factura_numero` con el formato `FAC-YYYY-NNNNNN`, apoyado en la secuencia `seq_factura`. El valor queda disponible vía `RETURNING numero_factura` al insertar.
   - Existe la **vista** `vw_ventas_dia` que resume las facturas `PAGADA` del día (alimenta el dashboard).
   - El script es **idempotente y re-ejecutable**: elimina los objetos previos (en orden de dependencias) antes de recrearlos.

### 3. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Edita `.env` y completa cada variable:

| Variable                   | Descripción                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `PORT`                     | Puerto HTTP donde escucha la API (default: `4000`).                                                                            |
| `ORACLE_USER`              | Usuario de la base de datos (no el administrador del tenancy).                                                                 |
| `ORACLE_PASSWORD`          | Contraseña del usuario de la base de datos.                                                                                    |
| `ORACLE_CONNECT_STRING`    | Cadena de conexión. En Autonomous Database se usa el **nombre del servicio**, ej. `pollo_adw_high` (con wallet) o una cadena TCPS completa. |
| `ORACLE_WALLET_DIR`        | Directorio del **Oracle Wallet** (contiene `tnsnames.ora`, `cwallet.sso`, ...). Se usa para mTLS con Autonomous Database. Déjalo vacío si no usas wallet. **El wallet NO se commitea** (ver `.gitignore`). |
| `JWT_SECRET`               | Secreto para firmar los tokens JWT. Debe ser largo y aleatorio (genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). |
| `JWT_EXPIRES_IN`           | Expiración del token (sintaxis jsonwebtoken), ej. `8h`, `1d`.                                                                 |
| `IMAGE_STORAGE`            | Modo de almacenamiento de imágenes: `cloudinary` (default) o `url`. Si se elige `cloudinary` pero faltan credenciales, **degrada a `url`** para no romper el CRUD. |
| `CLOUDINARY_CLOUD_NAME`    | (Solo si `IMAGE_STORAGE=cloudinary`) Cloud name desde Cloudinary Console.                                                      |
| `CLOUDINARY_API_KEY`       | (Solo si `IMAGE_STORAGE=cloudinary`) API Key de Cloudinary.                                                                    |
| `CLOUDINARY_API_SECRET`    | (Solo si `IMAGE_STORAGE=cloudinary`) API Secret de Cloudinary.                                                                 |
| `CORS_ORIGIN`              | Origen permitido para peticiones del navegador. En desarrollo, `http://localhost:5173` (Vite); en producción, el dominio de GitHub Pages. |
| `IMPUESTO_PORCENTAJE`      | Porcentaje de IVA en Colombia (default: `19`).                                                                                 |

> **Importante:** el archivo `.env` no se commitea (está en `.gitignore`), y **el Oracle Wallet tampoco** (también está ignorado). En producción se sube el wallet como archivo secreto (ver sección de despliegue).

### 4. Credencial inicial

El script `seed.sql` crea el usuario administrador con:

- **Correo**: `admin@rosto.com`
- **Password**: `admin123`

> ⚠️ **Cambia esta contraseña en producción.** Es un valor de ejemplo y no debe permanecer en un entorno real.

### 5. Arrancar el proyecto

```bash
# Terminal 1 — backend (puerto 4000)
cd backend
npm run dev

# Terminal 2 — frontend (puerto 5173)
cd frontend
npm run dev
```

- El backend arranca en `http://localhost:4000` y el health check está en **`GET /api/health`**.
- El frontend arranca en `http://localhost:5173`. En desarrollo no necesita variables de entorno: el **proxy de Vite** (`vite.config.js`) redirige `/api` hacia `http://localhost:4000`, evitando CORS.
- Si el backend no logra conectar a Oracle al arrancar, **continúa sirviendo** y el health check reporta `db: "disconnected"`; las rutas que usan la BD devolverán error hasta que la conexión esté disponible.

## Scripts SQL

- **`backend/sql/schema.sql`** — Crea (de forma idempotente):
  - Tablas: `categorias`, `productos`, `usuarios`, `clientes`, `facturas`, `detalle_factura`.
  - Secuencia `seq_factura` (consecutivo del número de factura).
  - Trigger `trg_factura_numero`: genera `numero_factura` en formato `FAC-YYYY-NNNNNN` antes de insertar.
  - Índices: `idx_facturas_fecha`, `idx_detalle_factura`, `idx_productos_estado`.
  - Vista `vw_ventas_dia`: total de ventas, nº de facturas, ticket promedio y producto más vendido del día (solo facturas `PAGADA`).
- **`backend/sql/seed.sql`** — Datos iniciales de ejemplo:
  - Usuario administrador (`admin@rosto.com` / `admin123`).
  - 4 categorías (Pollo Frito, Combos, Bebidas, Adicionales).
  - 8 productos con precios realistas en COP.
  - 2 clientes de ejemplo.

## Despliegue

### Backend en Render

Hay dos caminos:

1. **Blueprint (recomendado)**: en Render, `New + → Blueprint` y apunta a este repositorio. Usa `render.yaml`, que ya configura el Web Service `rosto-facturacion-api`.
2. **Web Service manual**: crea un Web Service apuntando al directorio `backend` (`rootDir: backend`), con:
   - Build: `npm install`
   - Start: `npm start`
   - Health Check Path: `/api/health`
   - Plan: Free

Todas las variables del backend deben estar configuradas (ver tabla de la sección 3): `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING`, `ORACLE_WALLET_DIR`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `IMAGE_STORAGE`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CORS_ORIGIN`, `IMPUESTO_PORCENTAJE`, `PORT`.

**Cómo subir el Oracle Wallet como archivo secreto en Render:**

1. Descarga el wallet de tu Autonomous Database (un `.zip`).
2. En el Dashboard del servicio en Render → **Environment → Secret Files**.
3. Agrega un archivo secreto y crea la carpeta `wallet/` con los archivos del wallet descomprimidos (ej. `tnsnames.ora`, `cwallet.sso`, `ewallet.p12`, `keystore.jks`, `truststore.jks`).
4. En la variable `ORACLE_WALLET_DIR`, indica la ruta donde Render extrae los archivos secretos (p. ej. `/etc/secrets/wallet`).
5. `ORACLE_CONNECT_STRING` debe ser el **nombre del servicio** de tu base (el mismo que aparece en `tnsnames.ora`), ej. `pollo_adw_high`.

> El wallet **no va en el repositorio**: se inyecta como secreto en tiempo de ejecución.

### Frontend en GitHub Pages

El frontend ya usa `HashRouter` (ver `main.jsx`) y `vite.config.js` define `base` como `/RostoFacturacion/` (se puede sobrescribir con la variable `VITE_BASE`).

Pasos:

1. En el repositorio: **Settings → Pages → Source: "Deploy from a branch" → rama `gh-pages`**.
2. El workflow `.github/workflows/deploy.yml` compila el frontend y publica en la rama `gh-pages` **en cada push a `main`** (también hay `workflow_dispatch`).
3. Configura la **variable de repositorio** `VITE_API_URL` con la URL pública del backend en Render: **Settings → Secrets and variables → Actions → Variables** → `VITE_API_URL = https://tu-api.onrender.com/api`. El workflow la inyecta como `VITE_API_URL` en el build (`${{ vars.VITE_API_URL }}`).

### CORS en producción

El backend debe permitir el origen del frontend publicado. Configura `CORS_ORIGIN` con el dominio de **GitHub Pages** (ej. `https://tu-usuario.github.io`). Si queda vacío, solo se permite `http://localhost:5173` (desarrollo).

## Endpoints API

Base URL: `/api` (local: `http://localhost:4000/api`).

| Método | Ruta                            | Descripción                                                    | Auth        |
| ------ | ------------------------------- | -------------------------------------------------------------- | ----------- |
| POST   | `/auth/login`                   | Inicia sesión y devuelve el JWT y el usuario.                  | Público     |
| POST   | `/auth/registrar`               | Registra un usuario (`ADMIN` o `CAJERO`).                      | Admin       |
| GET    | `/health`                       | Health check: `{ status, db }`.                                | Público     |
| GET    | `/productos`                    | Lista productos (filtros: `estado`, `id_categoria`).           | Autenticado |
| GET    | `/productos/:id`                | Obtiene un producto.                                           | Autenticado |
| POST   | `/productos`                    | Crea un producto (multipart `imagen` u `imagen_url`).          | Admin       |
| PUT    | `/productos/:id`                | Actualiza un producto (multipart `imagen`).                    | Admin       |
| DELETE | `/productos/:id`                | Elimina producto (soft delete → `INACTIVO`).                   | Admin       |
| GET    | `/categorias`                   | Lista categorías (filtro: `estado`).                           | Autenticado |
| POST   | `/categorias`                   | Crea una categoría.                                            | Admin       |
| PUT    | `/categorias/:id`               | Actualiza una categoría.                                       | Admin       |
| DELETE | `/categorias/:id`               | Elimina categoría (soft delete → `INACTIVO`).                  | Admin       |
| POST   | `/facturas`                     | Crea una factura (cálculo 100% en backend).                    | Autenticado |
| GET    | `/facturas`                     | Lista facturas (filtros: `fecha` YYYY-MM-DD, `estado`).        | Autenticado |
| GET    | `/facturas/:id`                 | Detalle completo (cabecera + cliente + líneas).                | Autenticado |
| GET    | `/facturas/:id/pdf`             | Genera y devuelve el PDF de la factura.                        | Autenticado |
| PUT    | `/facturas/:id/anular`          | Anula una factura (solo si está `PAGADA`).                     | Autenticado |
| GET    | `/reportes/ventas-dia`          | Resumen de ventas del día (JSON).                              | Autenticado |
| GET    | `/reportes/ventas-dia/excel`    | Exporta ventas del día a Excel (.xlsx, 3 hojas).               | Autenticado |
| GET    | `/reportes/ventas-rango`        | Resumen de ventas por rango `?desde&hasta` (JSON).             | Autenticado |
| GET    | `/reportes/ventas-rango/excel`  | Exporta ventas por rango a Excel (.xlsx, 3 hojas).             | Autenticado |

> El prefijo `/api` se aplica a todas las rutas. El health check completo es `GET /api/health`.

## Pruebas de la API

En la carpeta `docs/` hay una colección **`docs/API.http`** para la **extensión REST Client de VS Code**:

1. Instala la extensión **REST Client** en VS Code.
2. Abre `docs/API.http`.
3. Ejecuta primero la petición de **login** (marcada con `# @name login`); el token se captura automáticamente y se aplica a las peticiones protegidas mediante `Authorization: Bearer {{token}}`.
4. Ejecuta el resto de peticiones en el orden que prefieras (los recursos dependientes, como obtener un producto para usarlo en una factura, asumen que antes creaste los datos).

Si no usas REST Client, puedes usar **Postman**: crea una colección, define la variable de entorno `host = http://localhost:4000/api`, añade una petición `POST /auth/login` y en las peticiones protegidas usa un header `Authorization: Bearer <token>` (o una variable de entorno que captures desde la respuesta del login, p. ej. `{{token}}`).

## Estructura de respuesta

Toda la API usa un **envelope JSON consistente** (`utils/apiResponse.js`):

- **Éxito (HTTP 2xx)**:
  ```json
  { "success": true, "message": "string", "data": ... }
  ```
- **Error (HTTP 4xx/5xx)**:
  ```json
  { "success": false, "message": "string", "errors": [...] }
  ```
  El campo `errors` es opcional y aparece en los errores de validación (zod).

Códigos de error comunes:

| Código | Significado                                                                 |
| ------ | --------------------------------------------------------------------------- |
| `400`  | Datos inválidos (validación zod), archivo no permitido, etc.                |
| `401`  | Credenciales incorrectas o token no proporcionado/inválido/expirado.        |
| `403`  | Rol insuficiente (se requiere `ADMIN`) o usuario inactivo.                  |
| `404`  | Recurso no encontrado.                                                      |
| `409`  | Conflicto (ej. factura ya anulada o no anulable).                           |
| `503`  | Base de datos no disponible.                                                |

## Seguridad

- **bcryptjs** para el hash de contraseñas (cost 10 en el registro y el seed).
- **JWT** para sesiones: firma con `JWT_SECRET`, expiración configurable (`JWT_EXPIRES_IN`).
- **zod** para validación de entrada en todas las mutaciones.
- **Bind variables** en todas las consultas SQL (previene inyección SQL).
- **helmet** para headers de seguridad HTTP.
- **express-rate-limit** en el login (máx. 20 intentos / 15 min) para mitigar fuerza bruta.
- **CORS** restringido por variable de entorno (`CORS_ORIGIN`).
- **Secretos en `.env`** (nunca commitear) y **Oracle Wallet** inyectado como secreto en producción.

## Roadmap / pendientes

- Validar el flujo E2E completo contra una Oracle real (Autonomous Database).
- Ampliar roles/permisos (p. ej. permisos granulares por módulo).
- Extender el almacenamiento de imágenes a **BLOB en Oracle** (el servicio `imageService.js` ya está preparado para ello, ver comentarios en el código).
- Facturación electrónica (DIAN / resolución) si se requiere para el contexto colombiano.
- Pruebas automatizadas (unitarias e integración) del backend.
