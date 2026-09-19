# Control de Gastos

Actividad académica compuesta por una aplicación móvil Expo y una API REST en Laravel. El backend administra usuarios, categorías y gastos, y protege sus rutas mediante OAuth2 con Laravel Passport.

## Tecnologías

- Expo SDK 54 y React Native.
- Laravel 13 y PHP 8.3 o superior.
- Laravel Passport 13.
- SQLite para desarrollo local.
- Postman y Newman para probar la API.
- PHPUnit para pruebas automatizadas.

## Estructura

```text
.
├── app/                 Aplicación Expo y sus pantallas
├── components/          Componentes reutilizables de React Native
├── backend/             API REST de Laravel
│   ├── app/             Modelos, proveedores y controladores
│   ├── database/        Migraciones y base SQLite local
│   ├── postman/         Colección importable de Postman
│   ├── routes/api.php   Rutas públicas y protegidas
│   └── tests/Feature/   Pruebas de autenticación y CRUD
└── postman/             Workspace local de Postman
```

## Aplicación Expo

Instala las dependencias y arranca Expo:

```powershell
npm install
npx expo start
```

Desde la terminal de Expo puedes abrir el proyecto en Expo Go, Android, iOS o navegador, según las herramientas disponibles en tu equipo.

## API Laravel

En otra terminal:

```powershell
cd backend
composer install
php artisan migrate
php artisan serve
```

La API queda disponible de forma predeterminada en `http://127.0.0.1:8000`.

Para instalar el backend desde un clon nuevo, consulta [la documentación del backend](backend/README.md), que incluye la generación de claves y clientes Passport.

## Autenticación OAuth2

Passport proporciona dos flujos utilizados por el proyecto:

- **Personal Access Token:** los endpoints de registro e inicio de sesión emiten un Bearer Token para la aplicación.
- **Password Grant:** Postman solicita `access_token` y `refresh_token` mediante `POST /oauth/token` usando un cliente OAuth.
- **Expiración y renovación:** los access tokens duran una hora, los refresh tokens 30 días y los tokens personales seis meses.
- **Scopes:** las operaciones de perfil, categorías y gastos se autorizan con permisos de lectura, escritura o eliminación.

Las rutas de categorías, gastos, perfil y cierre de sesión están agrupadas bajo los middleware `auth:api` y `throttle:api`. Las operaciones CRUD también validan el scope requerido. Una petición sin token válido recibe `401 Unauthorized`; un token válido sin el scope necesario recibe `403 Forbidden`.

## API principal

| Método | Ruta | Descripción | Seguridad |
|---|---|---|---|
| POST | `/api/auth/register` | Registrar usuario | Pública |
| POST | `/api/auth/login` | Iniciar sesión | Pública |
| POST | `/oauth/token` | Generar tokens OAuth | Credenciales OAuth |
| POST | `/api/auth/logout` | Revocar access y refresh token | Bearer Token |
| GET | `/api/usuario` | Consultar el perfil | `perfil.read` |
| GET/POST | `/api/categorias` | Listar o crear categorías | `categorias.read` / `categorias.write` |
| GET/PATCH/DELETE | `/api/categorias/{id}` | Consultar, actualizar o eliminar una categoría | `categorias.read` / `categorias.write` / `categorias.delete` |
| GET/POST | `/api/gastos` | Listar o crear gastos propios | `gastos.read` / `gastos.write` |
| GET/PATCH/DELETE | `/api/gastos/{id}` | Consultar, actualizar o eliminar un gasto propio | `gastos.read` / `gastos.write` / `gastos.delete` |

Los gastos están asociados al usuario autenticado. Un usuario no puede consultar, modificar ni eliminar gastos pertenecientes a otra cuenta.

## Postman

Importa la colección:

```text
backend/postman/Control-Gastos.postman_collection.json
```

En un Environment local define:

```text
baseUrl       http://127.0.0.1:8000
clientId      ID del cliente Password Grant
clientSecret  secreto del cliente, marcado como sensible
```

La colección ejecuta registro, login, tokens limitados y completos, renovación con `refresh_token`, comprobaciones `401`/`403`, CRUD completo y cierre de sesión. Su resultado verificado es:

```text
21 peticiones
21 aserciones
0 fallos
```

## Pruebas

Desde `backend/` ejecuta:

```powershell
php artisan test
```

Resultado verificado:

```text
11 pruebas aprobadas
65 aserciones
```

Las pruebas cubren registro, generación y renovación de tokens, expiración, scopes, revocación de access/refresh tokens, límites de login, rutas sin autenticar, CRUD y propiedad de los gastos.

## Documentación

- [Referencia de la API](backend/API.md).
- [Documentación oficial de Laravel Passport 13](https://laravel.com/framework/docs/13.x/passport).

## Credenciales de la actividad

El repositorio incluye plantillas y los comandos necesarios para generar las credenciales localmente. Después de clonar, cada equipo debe crear su `.env`, claves OAuth, base SQLite y cliente Passport.

El Environment `backend/postman/Control-Gastos.postman_environment.example.json` puede importarse en Postman y completarse con el Client ID y Client Secret generados localmente. Las credenciales reales permanecen excluidas mediante `.gitignore`.
