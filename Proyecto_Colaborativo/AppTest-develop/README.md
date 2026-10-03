# AppTest - Sistema de Gestión de Tareas & Exploración NASA

## Descripción del Proyecto
Este proyecto es una aplicación Full-Stack estructurada en dos partes principales:
- **Backend (`/backend`)**: Desarrollado en **Laravel 11**, proporciona una API RESTful segura utilizando PostgreSQL y autenticación basada en JWT con Laravel Passport.
- **Frontend (`/frontend`)**: Desarrollado en **React Native usando Expo Router**, ofreciendo una interfaz de usuario fluida para web y dispositivos móviles.

La aplicación permite a los usuarios registrarse, iniciar sesión, y administrar tareas organizadas por categorías de color. Además, incluye una pestaña de integración con la API de la NASA (APOD) donde el usuario puede visualizar fotos e información astronómica.

---

## Documentación de la API REST (Backend)

Todas las rutas del backend operan bajo el prefijo `/api` (Por defecto en local: `http://localhost:8000/api`).

**🔒 Rutas Protegidas:**
Todas las rutas (a excepción de `/register` y `/login`) requieren autenticación. Debes enviar el token recibido durante el login en los *Headers* de tus peticiones:
```http
Authorization: Bearer <tu_access_token>
Accept: application/json
Content-Type: application/json
```

---

### 1. Autenticación (`AuthController`)

#### Registro de Usuario
- **Endpoint:** `POST /api/register`
- **Acceso:** Público
- **Payload (JSON):**
  ```json
  {
    "name": "Juan Perez",
    "email": "juan@ejemplo.com",
    "password": "password123",
    "password_confirmation": "password123"
  }
  ```
- **Respuesta (200 OK):** Crea la cuenta y devuelve la información del usuario junto con un `access_token`.

#### Inicio de Sesión (Login)
- **Endpoint:** `POST /api/login`
- **Acceso:** Público
- **Payload (JSON):**
  ```json
  {
    "email": "juan@ejemplo.com",
    "password": "password123"
  }
  ```
- **Respuesta (200 OK):** Devuelve el `access_token` necesario para interactuar con la plataforma.

#### Perfil de Usuario Actual
- **Endpoint:** `GET /api/me`
- **Acceso:** Protegido
- **Respuesta (200 OK):** Devuelve la información básica del usuario autenticado (`id`, `name`, `email`).

---

### 2. Categorías (`CategoryController`)
Las categorías permiten organizar visualmente las tareas por nombres y colores.

#### Listar Categorías
- **Endpoint:** `GET /api/categories`
- **Acceso:** Protegido
- **Respuesta:** Array con todas las categorías pertenecientes al usuario activo.

#### Crear Categoría
- **Endpoint:** `POST /api/categories`
- **Acceso:** Protegido
- **Payload (JSON):**
  ```json
  {
    "name": "Trabajo",
    "color": "#FF5733"
  }
  ```

#### Actualizar Categoría
- **Endpoint:** `PUT /api/categories/{id}`
- **Acceso:** Protegido
- **Payload (JSON):**
  ```json
  {
    "name": "Hogar (Editado)",
    "color": "#00FF00"
  }
  ```

#### Eliminar Categoría
- **Endpoint:** `DELETE /api/categories/{id}`
- **Acceso:** Protegido

---

### 3. Tareas (`TaskController`)
Las tareas son la funcionalidad principal; un usuario puede crearlas con o sin categoría asociada y marcarlas como completadas.

#### Listar Tareas
- **Endpoint:** `GET /api/tasks`
- **Acceso:** Protegido
- **Respuesta:** Array de tareas. Las tareas incluyen la categoría asociada y las fechas `created_at` y `updated_at`.

#### Progreso por grupo y rango de fechas
- **Endpoint:** `GET /api/tasks/progress?from=AAAA-MM-DD&to=AAAA-MM-DD`
- **Acceso:** Protegido
- **Descripción:** Filtra las tareas del usuario por su fecha de creación y devuelve un resumen general y el progreso agrupado por categoría. Las fechas inicial y final son inclusivas.
- **Respuesta:** Incluye `total_tasks`, `completed_tasks`, `pending_tasks`, `percentage` y un arreglo `groups` con esos mismos indicadores para cada categoría.

#### Crear Tarea
- **Endpoint:** `POST /api/tasks`
- **Acceso:** Protegido
- **Payload (JSON):**
  ```json
  {
    "title": "Revisar correos importantes",
    "category_id": 1 
  }
  ```
  *(Nota: `category_id` puede enviarse como `null` si la tarea no tiene una categoría).*

#### Actualizar Tarea / Marcar Completada
- **Endpoint:** `PUT /api/tasks/{id}`
- **Acceso:** Protegido
- **Payload (JSON):**
  ```json
  {
    "title": "Revisar correos importantes (Actualizado)",
    "category_id": 2,
    "completed": true
  }
  ```
  *(Nota: Puedes enviar solo el campo a modificar, por ejemplo, solo `"completed": true` para cambiar su estado).*

#### Eliminar Tarea
- **Endpoint:** `DELETE /api/tasks/{id}`
- **Acceso:** Protegido

---

## Integración Externa (NASA APOD)
El proyecto incluye un flujo en el frontend que consume la **[API Pública de la NASA](https://api.nasa.gov/)**. 
Para que funcione:
- No requiere intervención en el Backend.
- El Frontend maneja el almacenamiento (mediante `AsyncStorage`) de una **API Key**. 
- Existe una clave de demostración precargada, pero el usuario puede actualizar su propia API Key localmente desde la aplicación si excede la cuota de la NASA.

---

## Cómo Ejecutar el Proyecto

### 1. Iniciar el Backend (Laravel)
```bash
cd backend
composer install
php artisan migrate
php artisan passport:install
php artisan serve --port=8000
```
*Asegúrate de tener un archivo `.env` configurado con tus credenciales de PostgreSQL (`DB_CONNECTION=pgsql`, etc).*

### 2. Iniciar el Frontend (Expo)
```bash
cd frontend
npm install
npm start
```
*Una vez se inicie Metro Bundler, puedes presionar `w` en tu teclado para abrir la app en el navegador, o usar la app Expo Go en Android/iOS para escanear el código QR.*
