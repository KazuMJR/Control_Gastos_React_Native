# API Control de Gastos

La guía paso a paso para ejecutar el proyecto y preparar las capturas de la tarea está en [GUIA_EVIDENCIAS_PASSPORT.md](GUIA_EVIDENCIAS_PASSPORT.md).

Backend JSON creado con Laravel 13 y Laravel Passport. Los recursos CRUD se definen exclusivamente en `routes/api.php`; no contiene vistas Blade.

## Recursos y seguridad

- `POST /api/auth/register` y `POST /api/auth/login` validan credenciales y devuelven un token OAuth de Passport.
- Las demás rutas requieren `Authorization: Bearer {token}`.
- `categorias` administra categorías y `gastos` entrega únicamente los gastos del usuario autenticado.
- El acceso a autenticación está limitado a 5 solicitudes por minuto por IP y el resto de la API a 60 por minuto por usuario/IP.

## Ejecutar localmente

Con PHP y Composer correctamente instalados:

```powershell
php artisan migrate
php artisan serve
```

La base local usa SQLite (`database/database.sqlite`). Passport crea las tablas `oauth_*` y las claves privadas en `storage/` durante su instalación.

## Cliente OAuth para Postman

La colección solicita tokens mediante el endpoint estándar `POST /oauth/token`. En este equipo ya existe el Environment local `postman/Control-Gastos.local.postman_environment.json` con las credenciales necesarias; está excluido de Git y no debe compartirse. Impórtalo en Postman junto con la colección.

Si trabajas en otro equipo o pierdes ese archivo, genera un cliente de contraseña nuevo una sola vez:

```powershell
php artisan passport:client --password --name="Control Gastos Postman" --provider=users
```

Conserva el **Client ID** y **Client Secret** que muestra el comando. El secreto se muestra una sola vez y no debe guardarse en Git. En Postman crea un Environment local y define `clientId` y `clientSecret`; marca `clientSecret` como variable sensible.

La petición **Generar token OAuth** usa `Body > x-www-form-urlencoded` y envía:

```text
grant_type: password
client_id: {{clientId}}
client_secret: {{clientSecret}}
username: {{runEmail}}
password: {{runPassword}}
scope:
```

La respuesta contiene `access_token`, `refresh_token` y `expires_in`. El script de Postman guarda automáticamente `access_token` en `{{token}}`, que todas las solicitudes protegidas envían como Bearer Token.

## Alcance de la entrega

Por indicacion de la tarea, la app Expo no consume todavia este backend. Laravel se prueba de forma local con Postman; la app movil consume el catalogo externo DummyJSON.

## Prueba en Postman

Importa [postman/Control-Gastos.postman_collection.json](postman/Control-Gastos.postman_collection.json), selecciona el Environment que contiene las credenciales y ejecuta la colección completa. El orden incluido comprueba:

1. Registro e inicio de sesión.
2. Generación de `access_token` y `refresh_token` mediante `/oauth/token`.
3. Rechazo con estado `401` cuando falta el Bearer Token.
4. CRUD de categorías: crear, listar, consultar y actualizar.
5. CRUD de gastos: crear, listar, consultar, actualizar y eliminar.
6. Consulta del perfil autenticado.
7. Eliminación de la categoría después de eliminar el gasto relacionado.

La ejecución completa contiene **15 peticiones y 15 pruebas de estado**, además de aserciones sobre IDs, tokens y datos actualizados. Todas deben finalizar sin errores.

La colección usa `http://127.0.0.1:8000` como `baseUrl`; cámbialo si inicias el servidor en otro puerto.

## Evidencias recomendadas

1. `composer show laravel/passport` mostrando la versión instalada.
2. `php artisan migrate:status` mostrando las migraciones `oauth_*` ejecutadas.
3. Creación del cliente OAuth, ocultando el Client Secret en la captura final.
4. Respuesta `200` de **Generar token OAuth**, ocultando los tokens.
5. Respuesta `401` de **Rechazar petición sin token**.
6. Respuestas `201`, `200`, `200` y `204` del CRUD.
7. Resumen del Collection Runner con cero fallos.
8. Resultado de `php artisan test` con toda la suite aprobada.
