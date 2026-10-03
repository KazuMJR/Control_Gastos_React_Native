# API RESTful con Laravel Passport (Guías 1, 2 y 3)

Backend robusto de API RESTful desarrollado sobre **Laravel 13** y **Laravel Passport (OAuth2)**. Este proyecto implementa un ciclo completo de autenticación de usuarios, renovación y revocación de credenciales, y control granular de acceso a recursos basado en **Scopes**.

---

## 📑 Tabla de Contenidos

1. [Evolución Arquitectural](#evolución-arquitectural)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Mecanismos de Autenticación y Autorización](#mecanismos-de-autenticación-y-autorización)
   - [Password Grant](#1-flujo-de-inicio-de-sesión-password-grant)
   - [Expiración y Refresh Tokens](#2-flujo-de-renovación-refresh-tokens)
   - [Cierre de Sesión (Revocación)](#3-flujo-de-cierre-de-sesión-logout-seguro)
   - [Autorización por Scopes](#4-autorización-por-scopes-oauth2)
5. [Catálogo de Endpoints de la API](#catálogo-de-endpoints-de-la-api)
6. [Matriz de Scopes del Negocio](#matriz-de-scopes-del-negocio)
7. [Pruebas Manuales en Postman](#pruebas-manuales-en-postman)
   - [Casos de Prueba Guía 2](#guía-2-autenticación-expiración-y-logout)
   - [Casos de Prueba Guía 3](#guía-3-autorización-granular-por-scopes)
8. [Pruebas Automatizadas](#pruebas-automatizadas)

---

## 🚀 Evolución Arquitectural

El proyecto abarca tres fases fundamentales:

- **Guía 1 — Conexión y Guard:** Instalación de Laravel Passport, registro del guard `api` con driver `passport` en `config/auth.php`, middleware `ForceJsonResponse` para forzar salidas JSON limpias, y autenticación inicial.
- **Guía 2 — Autenticación por Usuario (Password Grant):**
  - Habilitación de `Passport::enablePasswordGrant()`.
  - Emisión de tokens vinculados a credenciales reales (`email` y `password`).
  - Configuración de tiempos estrictos de expiración: Access Tokens (1 hora), Refresh Tokens (30 días), Personal Access Tokens (6 meses).
  - Renovación dinámica de sesiones mediante `grant_type=refresh_token`.
  - Cierre de sesión seguro invalidando tanto el Access Token como su Refresh Token asociado.
  - Endpoints de autenticación: `POST /api/login`, `POST /api/logout`, `GET /api/me`.
- **Guía 3 — Autorización Granular con Scopes:**
  - Registro de permisos mediante `Passport::tokensCan()` y asignación del scope por defecto `productos.read`.
  - Selección de scopes en el momento del login.
  - Registro de middlewares de autorización en `bootstrap/app.php`: `scope` (requiere **todos** los scopes) y `scopes` (requiere **al menos uno**).
  - Protección de rutas de negocio (`/api/productos` y `/api/reportes`).
  - Verificación condicional en controladores mediante `$request->user()->tokenCan('productos.delete')`.
  - Endpoint de auditoría y depuración temporal `/api/token-info`.

---

## ⚙️ Requisitos del Sistema

- **PHP:** ^8.3 o superior (probado en PHP 8.5)
- **Extensiones PHP:** OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath, SQLite3 / PostgreSQL
- **Composer:** ^2.0
- **Base de Datos:** SQLite (desarrollo y testing) o PostgreSQL

---

## 🛠️ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/HennrryCanahui/API_CRUD.git
   cd API_CRUD
   git checkout LaravelPassport
   ```

2. **Instalar dependencias de Composer:**
   ```bash
   composer install
   ```

3. **Configurar el entorno:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Preparar la base de datos y ejecutar migraciones:**
   ```bash
   touch database/database.sqlite
   php artisan migrate
   ```

5. **Generar llaves criptográficas y clientes OAuth2:**
   ```bash
   php artisan passport:keys
   php artisan passport:client --password
   ```
   > Copia el **Client ID** y el **Client Secret** resultantes y configúralos en tu `.env`:
   > ```env
   > PASSPORT_PASSWORD_CLIENT_ID=<id_generado>
   > PASSPORT_PASSWORD_CLIENT_SECRET=<secret_generado>
   > ```

6. **Iniciar el servidor de desarrollo:**
   ```bash
   php artisan serve
   ```
   La API estará disponible en `http://localhost:8000`.

---

## 🔐 Mecanismos de Autenticación y Autorización

### 1. Flujo de Inicio de Sesión (Password Grant)
El cliente envía sus credenciales al endpoint de login. La aplicación solicita los tokens al servidor OAuth2 interno:
- **Petición:** `POST /api/login`
- **Payload:**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "password123",
    "scopes": ["productos.read", "reportes"]
  }
  ```
- **Respuesta (200 OK):**
  ```json
  {
    "token_type": "Bearer",
    "expires_in": 3600,
    "access_token": "eyJ0eXAiOiJKV1...",
    "refresh_token": "def50200...",
    "user": {
      "id": 1,
      "name": "Usuario Demo",
      "email": "usuario@ejemplo.com"
    }
  }
  ```

### 2. Flujo de Renovación (Refresh Tokens)
Cuando el `access_token` expira (código HTTP `401 Unauthorized`), el cliente no necesita solicitar credenciales nuevamente al usuario:
- **Petición:** `POST /oauth/token`
- **Headers:** `Content-Type: application/x-www-form-urlencoded` o `application/json`
- **Payload:**
  ```json
  {
    "grant_type": "refresh_token",
    "refresh_token": "<tu_refresh_token>",
    "client_id": "<PASSPORT_PASSWORD_CLIENT_ID>",
    "client_secret": "<PASSPORT_PASSWORD_CLIENT_SECRET>"
  }
  ```
- **Resultado:** Se entrega un nuevo par de `access_token` y `refresh_token`, invalidando automáticamente el anterior.

### 3. Flujo de Cierre de Sesión (Logout Seguro)
A diferencia de sistemas que solo borran el token en el cliente, el backend revoca formalmente la credencial:
- **Petición:** `POST /api/logout` con cabecera `Authorization: Bearer <access_token>`
- **Acción interna:**
  1. Revoca el access token actual en la tabla `oauth_access_tokens`.
  2. Invalida en cascada todos los refresh tokens derivados del mismo en `oauth_refresh_tokens`.
- **Resultado (200 OK):** `{"message": "Sesión cerrada correctamente"}`

### 4. Autorización por Scopes OAuth2
Los scopes restringen qué operaciones puede ejecutar un token específico:
- `middleware('scope:A,B')`: Exige que el token cuente con **TODOS** los scopes indicados.
- `middleware('scopes:A,B')`: Exige que el token cuente con **AL MENOS UNO** de los scopes.
- `$request->user()->tokenCan('scope')`: Verificación interna dentro de la lógica del controlador para decisiones contextuales.

---

## 📡 Catálogo de Endpoints de la API

| Método | Endpoint | Middleware / Protección | Descripción |
|---|---|---|---|
| `POST` | `/api/register` | Público | Registro de nuevos usuarios en el sistema |
| `POST` | `/api/login` | Público | Autenticación con Password Grant y solicitud de scopes |
| `POST` | `/api/logout` | `auth:api` | Revocación segura de access y refresh token |
| `GET` | `/api/me` | `auth:api` | Retorna el objeto del usuario autenticado |
| `GET` | `/api/user` | `auth:api` | Endpoint de perfil estándar |
| `GET` | `/api/tasks` | `auth:api` | Listado de tareas pertenecientes al usuario |
| `POST` | `/api/tasks` | `auth:api` | Creación de una nueva tarea asociada al usuario |
| `GET` | `/api/tasks/{id}` | `auth:api` | Consulta detallada de una tarea propia |
| `PUT/PATCH` | `/api/tasks/{id}` | `auth:api` | Actualización de una tarea |
| `DELETE` | `/api/tasks/{id}` | `auth:api` | Eliminación de una tarea |
| `GET` | `/api/productos` | `auth:api`, `scope:productos.read` | Listado completo de productos del catálogo |
| `POST` | `/api/productos` | `auth:api`, `scope:productos.write` | Registro de nuevos productos en catálogo |
| `DELETE` | `/api/productos/{id}` | `auth:api`, `scope:productos.delete` | Eliminación de productos (validado por middleware y `tokenCan`) |
| `GET` | `/api/reportes` | `auth:api`, `scopes:admin,reportes` | Acceso a reportes (requiere rol `admin` o scope `reportes`) |
| `GET` | `/api/token-info` | `auth:api` | **Depuración:** Muestra `token_id`, `scopes`, `user` y `expires` |

---

## 🏷️ Matriz de Scopes del Negocio

| Scope | Descripción Legible | Endpoints Asociados |
|---|---|---|
| `productos.read` | Ver listado y detalle de productos | `GET /api/productos` (Scope por defecto) |
| `productos.write` | Crear y editar productos | `POST /api/productos` |
| `productos.delete` | Eliminar productos | `DELETE /api/productos/{id}` |
| `usuarios.read` | Ver listado de usuarios | Rutas administrativas de consulta |
| `admin` | Acceso administrativo completo | Permite paso en `scopes:admin,reportes` |
| `reportes` | Acceder a reportes del sistema | `GET /api/reportes` |

---

## 🧪 Pruebas Manuales en Postman

### Guía 2 — Autenticación, Expiración y Logout

| # | Escenario | Método / URL | Headers & Body | Resultado Esperado |
|---|---|---|---|---|
| 1 | **Login Exitoso** | `POST /api/login` | Body: `{"email": "usuario@ejemplo.com", "password": "password"}` | `200 OK` con `access_token`, `refresh_token`, `expires_in: 3600` |
| 2 | **Login con Credenciales Inválidas** | `POST /api/login` | Body: `{"email": "usuario@ejemplo.com", "password": "incorrecta"}` | `401 Unauthorized` `{"message": "Credenciales inválidas"}` |
| 3 | **Perfil `/me` con Bearer Token** | `GET /api/me` | `Authorization: Bearer <access_token>` | `200 OK` con datos del usuario autenticado |
| 4 | **Renovación con Refresh Token** | `POST /oauth/token` | Body: `grant_type=refresh_token&refresh_token=<token>&client_id=...&client_secret=...` | `200 OK` con nuevo par de tokens generados |
| 5 | **Logout Seguro** | `POST /api/logout` | `Authorization: Bearer <access_token>` | `200 OK` `{"message": "Sesión cerrada correctamente"}` |
| 6 | **Reintento con Token Revocado** | `GET /api/me` | `Authorization: Bearer <token_revocado>` | `401 Unauthorized` `{"message": "Unauthenticated."}` |

---

### Guía 3 — Autorización Granular por Scopes

Para estas pruebas, genera dos tokens distintos en `/api/login`:
- **Token A (Limitado):** `"scopes": ["productos.read"]`
- **Token B (Amplio):** `"scopes": ["productos.read", "productos.write", "productos.delete", "admin"]`

| Caso | Token Utilizado | Método / URL | Resultado Esperado | Diagnóstico |
|---|---|---|---|---|
| Lectura de Productos | **Token A** | `GET /api/productos` | `200 OK` | Posee el scope `productos.read` |
| Creación sin permiso | **Token A** | `POST /api/productos` | `403 Forbidden` | Carece del scope `productos.write` |
| Borrado sin permiso | **Token A** | `DELETE /api/productos/1` | `403 Forbidden` | Carece del scope `productos.delete` |
| Reportes sin permiso | **Token A** | `GET /api/reportes` | `403 Forbidden` | Carece de `admin` o `reportes` |
| Creación permitida | **Token B** | `POST /api/productos` | `201 Created` | Posee el scope `productos.write` |
| Borrado permitido | **Token B** | `DELETE /api/productos/1` | `200 OK` | Posee el scope `productos.delete` |
| Reportes permitidos | **Token B** | `GET /api/reportes` | `200 OK` | Posee el scope `admin` |
| Inspección de Token | Cualquiera | `GET /api/token-info` | `200 OK` | Muestra `token_id`, `scopes` asignados y fecha de expiración |

---

## 🚦 Pruebas Automatizadas

La aplicación cuenta con una suite completa de pruebas unitarias y de integración que validan el 100% de los flujos de autenticación, revocación y scopes:

```bash
php artisan test
```

### Cobertura de la Suite:
1. **`Tests\Feature\AuthTest` (8 pruebas):**
   - Registro de usuario exitoso y validación de errores 422.
   - Login con Password Grant y rechazo ante credenciales erróneas (401).
   - Respuestas JSON forzadas ante solicitudes no autenticadas (evita redirecciones HTML web).
   - Acceso a rutas protegidas por usuario autenticado.
   - Consulta del endpoint `/api/me`.
   - Logout seguro revocando access y refresh token.
2. **`Tests\Feature\ScopesTest` (9 pruebas):**
   - Asignación de scope por defecto (`productos.read`) y solicitud de scopes múltiples en login.
   - Permiso concedido en lectura de productos con `productos.read` (200 OK).
   - Denegación de creación sin `productos.write` (403 Forbidden).
   - Creación exitosa con `productos.write` (201 Created).
   - Denegación de borrado sin `productos.delete` tanto por middleware como por `tokenCan()` (403 Forbidden).
   - Borrado exitoso con `productos.delete` (200 OK).
   - Evaluación del middleware `scopes` en `/reportes` (`admin` o `reportes`).
   - Verificación de la estructura del endpoint temporal de depuración `/token-info`.

---

## 🔒 Consideraciones de Seguridad para Producción

1. **Eliminación del Endpoint de Debug:**
   El endpoint `/api/token-info` en `routes/api.php` debe ser retirado antes de desplegar a entornos productivos para evitar la exposición de identificadores de token en texto claro.
2. **Variables de Entorno Seguras:**
   Los valores reales de `PASSPORT_PASSWORD_CLIENT_ID` y `PASSPORT_PASSWORD_CLIENT_SECRET` nunca deben almacenarse en el repositorio Git; deben configurarse en el administrador de secretos o archivo `.env` del servidor de producción.
3. **Rotación de Llaves:**
   Mantener las llaves `oauth-private.key` y `oauth-public.key` con permisos restringidos de solo lectura (`600`) para el usuario del servidor web.
