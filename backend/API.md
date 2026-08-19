# API Control de Gastos

Backend JSON creado con Laravel 13 y Laravel Sanctum. No contiene rutas web ni vistas Blade.

## Recursos y seguridad

- `POST /api/auth/register` y `POST /api/auth/login` validan credenciales y devuelven un token Sanctum.
- Las demás rutas requieren `Authorization: Bearer {token}`.
- `categorias` administra categorías y `gastos` entrega únicamente los gastos del usuario autenticado.
- El acceso a autenticación está limitado a 5 solicitudes por minuto por IP y el resto de la API a 60 por minuto por usuario/IP.

## Ejecutar localmente

Con PHP y Composer correctamente instalados:

```powershell
php artisan migrate
php artisan serve
```

La base local usa SQLite (`database/database.sqlite`).

## Alcance de la entrega

Por indicacion de la tarea, la app Expo no consume todavia este backend. Laravel se prueba de forma local con Postman; la app movil consume el catalogo externo DummyJSON.

## Prueba en Postman

Importa [postman/Control-Gastos.postman_collection.json](postman/Control-Gastos.postman_collection.json). Ejecuta las solicitudes en este orden:

1. **Registrar usuario** (guarda automáticamente `token`).
2. **Crear categoría** (guarda `categoriaId`).
3. **Crear gasto**.
4. **Listar mis gastos**.

La colección usa `http://127.0.0.1:8000` como `baseUrl`; cámbialo si inicias el servidor en otro puerto.
