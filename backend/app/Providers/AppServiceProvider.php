<?php

namespace App\Providers;

use Carbon\CarbonInterval;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

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
        // Guía 2: habilita Password Grant y define la vigencia de cada tipo de token.
        Passport::enablePasswordGrant();
        Passport::tokensExpireIn(CarbonInterval::hour());
        Passport::refreshTokensExpireIn(CarbonInterval::days(30));
        Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));

        // Guía 3: cada scope representa una operación permitida en la API.
        Passport::tokensCan([
            'perfil.read' => 'Consultar el perfil autenticado',
            'categorias.read' => 'Consultar categorías',
            'categorias.write' => 'Crear y actualizar categorías',
            'categorias.delete' => 'Eliminar categorías',
            'gastos.read' => 'Consultar gastos propios',
            'gastos.write' => 'Crear y actualizar gastos propios',
            'gastos.delete' => 'Eliminar gastos propios',
        ]);

        // Cuando no se solicitan scopes, el token queda limitado a operaciones de lectura.
        Passport::defaultScopes([
            'perfil.read',
            'categorias.read',
            'gastos.read',
        ]);

        // Login and registration share a strict limit to slow credential attacks.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)
            ->by('login:'.$request->ip())
            ->response(fn () => response()->json([
                'message' => 'Demasiados intentos. Espera un minuto antes de volver a intentarlo.',
            ], 429)));

        // Authenticated clients get a separate, less restrictive API quota.
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip()));
    }
}
