# Publicación de la API de gastos en Azure

El repositorio ya contiene el flujo `.github/workflows/deploy-expenses-api.yml`, la configuración de Nginx y el arranque de Laravel para Azure App Service.

## 1. Crear los recursos

Para la demostración se usa una arquitectura sin costo mensual:

- Grupo de recursos: `rg-control-gastos`.
- App Service Plan: Linux, SKU gratuito `F1`.
- Web App: un nombre único, por ejemplo `control-gastos-api-mikejasso`.
- Publicación: código.
- Sistema operativo: Linux.
- Runtime: PHP 8.4.
- Región: Spain Central.

La base SQLite se conserva en `/home/data/database.sqlite`, fuera de la carpeta
que se reemplaza en cada despliegue. Para una actividad universitaria evita
crear un servidor MySQL de pago. En producción conviene migrar a un servicio de
base de datos administrado.

## 2. Configurar las variables del App Service

En **Configuración > Variables de entorno**, copia las variables de `backend/.env.azure.example` y reemplaza los valores de ejemplo. Genera `APP_KEY` localmente con:

```powershell
cd backend
php artisan key:generate --show
```

No subas `APP_KEY` ni el perfil de publicación al repositorio.

## 3. Configurar el comando de inicio

En **Configuración > Configuración general > Comando de inicio** escribe:

```text
bash /home/site/wwwroot/azure/startup.sh
```

Este comando configura la carpeta `public`, ejecuta migraciones, conserva las claves de Passport fuera del despliegue y, cuando `RUN_DEMO_SEEDER=true`, prepara la cuenta de demostración.

## 4. Conectar GitHub Actions

En el App Service descarga el **perfil de publicación**. Si la opción está deshabilitada, habilita temporalmente la autenticación básica de publicación en la configuración del App Service.

En GitHub abre **Settings > Secrets and variables > Actions** y crea:

- Variable `AZURE_WEBAPP_NAME`: nombre exacto del App Service.
- Secreto `AZURE_WEBAPP_PUBLISH_PROFILE`: contenido completo del archivo descargado.

Después abre **Actions > Publicar API de gastos en Azure > Run workflow**.

## 5. Verificar y conectar Expo

Comprueba estas direcciones:

```text
https://NOMBRE-DE-TU-APP.azurewebsites.net/up
https://NOMBRE-DE-TU-APP.azurewebsites.net/api/auth/login
```

La primera debe responder correctamente. La segunda acepta `POST`; verla con el navegador puede devolver `405`, lo cual confirma que la ruta existe.

Finalmente configura `.env.local`:

```env
EXPO_PUBLIC_EXPENSES_API_URL=https://NOMBRE-DE-TU-APP.azurewebsites.net/api
EXPO_PUBLIC_TASKS_API_URL=https://aplicacionweb-bjbhbqgxfefjgph4.spaincentral-01.azurewebsites.net/api
```

Con ambas API publicadas inicia únicamente Expo:

```powershell
npx expo start --tunnel --clear
```
