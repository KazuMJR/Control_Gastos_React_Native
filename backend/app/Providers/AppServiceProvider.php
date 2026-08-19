<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

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
