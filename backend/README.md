# API Control de Gastos

API REST desarrollada como actividad académica con Laravel 13 para registrar usuarios y administrar categorías y gastos. Laravel Passport funciona como servidor OAuth2 y valida los Bearer Tokens de las rutas protegidas.

## Requisitos

- PHP 8.3 o superior con `openssl`, `pdo_sqlite`, `mbstring`, `curl` y `fileinfo`.
- Composer.
- SQLite.
- Postman o Newman para ejecutar la colección.

## Instalación desde un clon nuevo

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Configura SQLite en `.env`:

```dotenv
DB_CONNECTION=sqlite
DB_DATABASE=C:\ruta\absoluta\al\proyecto\backend\database\database.sqlite
```

Crea la base de datos si todavía no existe y ejecuta las migraciones:

```powershell
New-Item database\database.sqlite -ItemType File -Force
php artisan migrate
```

## Configurar Passport

Genera las claves de firma OAuth y los clientes requeridos:

```powershell
php artisan passport:keys
php artisan passport:client --personal --name="Control Gastos API" --provider=users
php artisan passport:client --password --name="Control Gastos Postman" --provider=users
```

El último comando muestra un Client ID y Client Secret. El secreto solo se muestra una vez y debe mantenerse fuera de Git.

La integración está distribuida en:

- `app/Models/User.php`: implementa `OAuthenticatable` y usa `HasApiTokens`.
- `config/auth.php`: define el guard `api` con driver `passport`.
- `app/Providers/AppServiceProvider.php`: habilita Password Grant, tiempos de expiración y scopes.
- `routes/api.php`: protege los recursos con `auth:api` y el scope correspondiente.
- `app/Http/Controllers/Api/AuthController.php`: emite tokens personales y revoca access/refresh tokens.

## Ejecutar la API

```powershell
php artisan serve
```

URL predeterminada:

```text
http://127.0.0.1:8000
```

Todas las respuestas son JSON.

## Autenticación

### Registro

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Ana López",
  "email": "ana@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "device_name": "Postman"
}
```

### Inicio de sesión

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "ana@example.com",
  "password": "password123",
  "device_name": "Postman"
}
```

### Password Grant

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded
```

```text
grant_type=password
client_id={client-id}
client_secret={client-secret}
username=ana@example.com
password=password123
scope=perfil.read categorias.read categorias.write categorias.delete gastos.read gastos.write gastos.delete
```

La respuesta incluye `access_token`, `refresh_token`, `expires_in` y `token_type`.

### Renovar la sesión

```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded
```

```text
grant_type=refresh_token
client_id={client-id}
client_secret={client-secret}
refresh_token={refresh-token}
scope=perfil.read categorias.read categorias.write categorias.delete gastos.read gastos.write gastos.delete
```

El access token dura una hora, el refresh token 30 días y los tokens personales seis meses. El endpoint de cierre de sesión revoca tanto el access token como el refresh token asociado.

### Scopes disponibles

| Recurso | Lectura | Crear/actualizar | Eliminar |
|---|---|---|---|
| Perfil | `perfil.read` | — | — |
| Categorías | `categorias.read` | `categorias.write` | `categorias.delete` |
| Gastos | `gastos.read` | `gastos.write` | `gastos.delete` |

Si no se solicita ningún scope, Passport concede únicamente los scopes predeterminados de lectura. El endpoint de perfil usa `tokenCan()` y devuelve la lista de scopes concedidos al token actual.

### Consumir rutas protegidas

```http
Accept: application/json
Authorization: Bearer {access-token}
```

Sin un token válido, Laravel responde con `401 Unauthorized`.

## Endpoints

| Método | Endpoint | Resultado esperado |
|---|---|---|
| POST | `/api/auth/register` | Usuario y token, estado `201` |
| POST | `/api/auth/login` | Usuario y token, estado `200` |
| POST | `/oauth/token` | Access/refresh token, estado `200` |
| POST | `/api/auth/logout` | Revocación del token, estado `200` |
| GET | `/api/usuario` | Perfil autenticado, estado `200` |
| GET | `/api/categorias` | Lista de categorías, estado `200` |
| POST | `/api/categorias` | Categoría creada, estado `201` |
| GET | `/api/categorias/{categoria}` | Categoría solicitada, estado `200` |
| PATCH | `/api/categorias/{categoria}` | Categoría actualizada, estado `200` |
| DELETE | `/api/categorias/{categoria}` | Sin contenido, estado `204` |
| GET | `/api/gastos` | Gastos del usuario, estado `200` |
| POST | `/api/gastos` | Gasto creado, estado `201` |
| GET | `/api/gastos/{gasto}` | Gasto propio, estado `200` |
| PATCH | `/api/gastos/{gasto}` | Gasto actualizado, estado `200` |
| DELETE | `/api/gastos/{gasto}` | Sin contenido, estado `204` |

Las acciones sobre un gasto ajeno responden con `403 Forbidden`.

## Postman y Newman

Importa `postman/Control-Gastos.postman_collection.json` y `postman/Control-Gastos.postman_environment.example.json`. Completa `clientId` y `clientSecret`, selecciona el Environment y ejecuta toda la colección.

También puede ejecutarse desde la terminal:

```powershell
newman run "postman\Control-Gastos.postman_collection.json" `
    -e "postman\Control-Gastos.local.postman_environment.json"
```

Resultado verificado: 21 peticiones y 21 aserciones, sin fallos.

## Pruebas automatizadas

```powershell
php artisan test
```

La suite cubre:

- Registro y emisión de Passport Tokens.
- Rechazo de rutas sin autenticar.
- CRUD completo de categorías.
- CRUD completo de gastos del usuario.
- Bloqueo de acceso a gastos ajenos.
- Límite de cinco intentos de login por minuto.
- Generación de tokens mediante Password Grant.
- Expiración de una hora y renovación mediante `refresh_token`.
- Autorización por scopes y rechazo `403` de operaciones no permitidas.
- Revocación conjunta del access token y el refresh token al cerrar sesión.

Resultado verificado: 11 pruebas y 65 aserciones aprobadas.

## Más documentación

- [Referencia resumida de la API](API.md).
- [Laravel Passport 13](https://laravel.com/framework/docs/13.x/passport).

## Nota académica

La actividad incluye las migraciones, configuración, colección y plantilla de Postman necesarias para comprobar Passport. Cada instalación genera sus propias claves y credenciales mediante los comandos documentados anteriormente.
