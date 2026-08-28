# Guía de ejecución y evidencias de Laravel Passport

Esta guía documenta cómo ejecutar el backend y obtener evidencia de los requisitos de la tarea: instalación de Passport, credenciales OAuth, generación de tokens, seguridad de rutas y CRUD desde Postman.

> No publiques `.env`, `storage/oauth-private.key` ni el Environment local de Postman. Si la entrega es pública, oculta también Client Secret y tokens.

## 1. Abrir el backend

```powershell
cd "C:\Users\jasso\Desktop\Desarrollo Web\ControldeGastos\backend"
php -v
composer --version
newman --version
```

## 2. Comprobar Passport

```powershell
composer show laravel/passport
```

Resultado esperado: paquete `laravel/passport`, versión `v13.7.6`.

**Captura 1:** terminal mostrando el nombre y la versión del paquete.

## 3. Comprobar migraciones y claves

```powershell
php artisan migrate
php artisan migrate:status
Get-Item storage/oauth-private.key, storage/oauth-public.key |
    Select-Object Name, Length, LastWriteTime
```

Las cinco migraciones `oauth_*` deben aparecer con estado `Ran`. Muestra solamente nombre y tamaño de las claves; nunca abras la clave privada.

**Captura 2:** migraciones OAuth y metadatos de las claves.

## 4. Comprobar credenciales OAuth

Lista los clientes sin revelar sus secretos:

```powershell
php artisan tinker --execute="dump(\Laravel\Passport\Client::query()->get(['id','name','grant_types','revoked'])->toArray());"
```

Debe existir un cliente activo con `password` y `refresh_token`.

Para generar otro cliente en una instalación nueva:

```powershell
php artisan passport:client --password --name="Control Gastos Postman" --provider=users
```

**Captura 3:** cliente generado. Cubre el Client Secret si la evidencia será pública.

## 5. Comprobar la configuración del código

Revisa estos puntos:

- `composer.json`: dependencia `laravel/passport`.
- `app/Models/User.php`: `HasApiTokens` y `OAuthenticatable`.
- `config/auth.php`: guard `api` con driver `passport`.
- `app/Providers/AppServiceProvider.php`: `Passport::enablePasswordGrant()`.
- `routes/api.php`: middleware `auth:api`.

También puedes listar las rutas y sus middleware:

```powershell
php artisan route:list --path=api -v
```

**Captura 4:** código de `routes/api.php` o listado donde se vea `Authenticate:api`.

## 6. Iniciar Laravel

Mantén abierta una terminal con:

```powershell
php artisan serve
```

La API debe quedar disponible en:

```text
http://127.0.0.1:8000
```

## 7. Importar Postman

Importa:

```text
postman/Control-Gastos.postman_collection.json
postman/Control-Gastos.local.postman_environment.json
```

Selecciona el Environment **Control Gastos Local**. El segundo archivo contiene credenciales locales y está ignorado por Git; no debe subirse al repositorio.

En otro equipo, crea un Environment con:

```text
baseUrl       http://127.0.0.1:8000
clientId      ID del cliente Password Grant
clientSecret  secreto del cliente
```

## 8. Generar el token

Ejecuta en este orden:

1. **Autenticación > Registrar usuario**.
2. **Autenticación > Iniciar sesión**.
3. **Autenticación > Generar token OAuth**.

La tercera petición envía:

```text
POST {{baseUrl}}/oauth/token
grant_type: password
client_id: {{clientId}}
client_secret: {{clientSecret}}
username: {{runEmail}}
password: {{runPassword}}
scope:
```

Debe responder `200` e incluir `access_token`, `refresh_token`, `expires_in` y `token_type`. El script guarda automáticamente el access token en `{{token}}`.

**Captura 5:** respuesta `200` de `/oauth/token`.

## 9. Demostrar la seguridad

Ejecuta **Seguridad > Rechazar petición sin token**. El resultado esperado es:

```text
401 Unauthorized
{"message":"Unauthenticated."}
```

El estado `401` es correcto: la prueba debe aparecer como `PASS`.

**Captura 6:** respuesta `401` y prueba aprobada.

## 10. Ejecutar el CRUD

La colección usa este orden:

| Orden | Petición | Estado esperado |
|---:|---|---:|
| 1 | Registrar usuario | 201 |
| 2 | Iniciar sesión | 200 |
| 3 | Generar token OAuth | 200 |
| 4 | Rechazar petición sin token | 401 |
| 5 | Crear categoría | 201 |
| 6 | Listar categorías | 200 |
| 7 | Obtener categoría | 200 |
| 8 | Actualizar categoría | 200 |
| 9 | Crear gasto | 201 |
| 10 | Listar mis gastos | 200 |
| 11 | Obtener gasto | 200 |
| 12 | Actualizar gasto | 200 |
| 13 | Obtener perfil | 200 |
| 14 | Eliminar gasto | 204 |
| 15 | Eliminar categoría | 204 |

La categoría se elimina al final porque primero debe eliminarse el gasto relacionado.

**Capturas 7 a 10:** una evidencia de cada operación CRUD: `POST 201`, `GET 200`, `PATCH 200` y `DELETE 204`.

## 11. Ejecutar Collection Runner

1. Abre el menú `...` de **Control de Gastos API**.
2. Selecciona **Run collection**.
3. Confirma que estén marcadas las 15 peticiones.
4. Ejecuta la colección completa.

Resultado esperado:

```text
All tests: 15
Passed: 15
Failed: 0
Errors: 0
```

**Captura 11:** resumen del Runner con las 15 pruebas aprobadas.

## 12. Ejecutar Newman

Con Laravel funcionando en otra terminal:

```powershell
newman run "postman\Control-Gastos.postman_collection.json" `
    -e "postman\Control-Gastos.local.postman_environment.json"
```

Resultado esperado: 15 peticiones, 15 aserciones y cero fallos.

**Captura 12:** tabla final de Newman.

## 13. Ejecutar PHPUnit

```powershell
php artisan test
```

Resultado verificado:

```text
8 tests passed
50 assertions
```

**Captura 13:** resumen completo de PHPUnit.

## 14. Nombres recomendados

```text
01-passport-instalado.png
02-migraciones-claves.png
03-credenciales-oauth.png
04-rutas-protegidas.png
05-token-oauth.png
06-seguridad-401.png
07-crud-post.png
08-crud-get.png
09-crud-patch.png
10-crud-delete.png
11-postman-runner.png
12-newman.png
13-phpunit.png
```

## 15. Lista final

- [ ] Passport instalado y visible en Composer.
- [ ] Migraciones OAuth ejecutadas.
- [ ] Claves OAuth generadas sin mostrar su contenido.
- [ ] Cliente Password Grant demostrado.
- [ ] `/oauth/token` devuelve access y refresh token.
- [ ] Ruta sin token devuelve `401`.
- [ ] CRUD completo utiliza Bearer Token.
- [ ] Runner termina con 15 aprobadas y cero fallos.
- [ ] PHPUnit termina con 8 pruebas y 50 aserciones.
- [ ] No se adjuntan `.env`, claves privadas ni Environment local.
