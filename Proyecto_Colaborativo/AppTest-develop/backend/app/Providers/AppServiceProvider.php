<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;
use Carbon\CarbonInterval;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Habilitar el flujo Password Grant
        Passport::enablePasswordGrant();

        // Access token expira en 1 hora
        Passport::tokensExpireIn(CarbonInterval::hours(1));

        // Refresh token expira en 30 días
        Passport::refreshTokensExpireIn(CarbonInterval::days(30));

        // Personal access tokens expiran en 6 meses
        Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));

        // Definir todos los scopes disponibles en la aplicación
        Passport::tokensCan([
            'productos.read'   => 'Ver listado y detalle de productos',
            'productos.write'  => 'Crear y editar productos',
            'productos.delete' => 'Eliminar productos',
            'usuarios.read'    => 'Ver listado de usuarios',
            'admin'            => 'Acceso administrativo completo',
            'reportes'         => 'Acceder a reportes del sistema',
        ]);

        // Scope por defecto si no se especifica ninguno
        Passport::setDefaultScope('productos.read');
    }
}
