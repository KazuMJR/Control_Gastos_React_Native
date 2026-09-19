# API Control de Gastos

Backend JSON creado con Laravel 13 y Laravel Passport. Los recursos CRUD se definen exclusivamente en `routes/api.php`; no contiene vistas Blade.

## Recursos y seguridad

- `POST /api/auth/register` y `POST /api/auth/login` validan credenciales y devuelven un token OAuth de Passport.
- Las demás rutas requieren `Authorization: Bearer {token}`.
- Cada operación protegida exige además un scope de lectura, escritura o eliminación.
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

La colección solicita tokens mediante el endpoint estándar `POST /oauth/token`. Para esta actividad se incluye la plantilla `postman/Control-Gastos.postman_environment.example.json`. Impórtala en Postman junto con la colección y completa las credenciales generadas localmente.

Si trabajas en otro equipo o pierdes ese archivo, genera un cliente de contraseña nuevo una sola vez:

```powershell
php artisan passport:client --password --name="Control Gastos Postman" --provider=users
```

Conserva el **Client ID** y **Client Secret** que muestra el comando. El secreto se muestra una sola vez y no debe guardarse en Git. En Postman crea un Environment local y define `clientId` y `clientSecret`; marca `clientSecret` como variable sensible.

La petición **Generar token OAuth completo** usa `Body > x-www-form-urlencoded` y envía:

```text
grant_type: password
client_id: {{clientId}}
client_secret: {{clientSecret}}
username: {{runEmail}}
password: {{runPassword}}
scope: {{fullScopes}}
```

La respuesta contiene `access_token`, `refresh_token` y `expires_in`. Los access tokens duran una hora. El script guarda ambos tokens y **Renovar token OAuth** usa `grant_type=refresh_token` para obtener una sesión nueva.

Los scopes disponibles son `perfil.read`, `categorias.read`, `categorias.write`, `categorias.delete`, `gastos.read`, `gastos.write` y `gastos.delete`. Un token autenticado sin el permiso requerido recibe `403 Forbidden`.

## Alcance de la entrega

Por indicacion de la tarea, la app Expo no consume todavia este backend. Laravel se prueba de forma local con Postman; la app movil consume el catalogo externo DummyJSON.

## Prueba en Postman

Importa [postman/Control-Gastos.postman_collection.json](postman/Control-Gastos.postman_collection.json), selecciona el Environment que contiene las credenciales y ejecuta la colección completa. El orden incluido comprueba:

1. Registro e inicio de sesión.
2. Generación de un token limitado y otro con todos los scopes.
3. Renovación del token mediante `refresh_token`.
4. Lectura permitida con scope, rechazo `403` sin scope y rechazo `401` sin token.
5. CRUD de categorías: crear, listar, consultar y actualizar.
6. CRUD de gastos: crear, listar, consultar, actualizar y eliminar.
7. Consulta del perfil y scopes concedidos.
8. Limpieza, cierre de sesión y comprobación de que el token revocado recibe `401`.

La ejecución completa contiene **21 peticiones y 21 pruebas**, además de aserciones sobre IDs, tokens, scopes y datos actualizados. Todas deben finalizar sin errores.

La colección usa `http://127.0.0.1:8000` como `baseUrl`; cámbialo si inicias el servidor en otro puerto.
