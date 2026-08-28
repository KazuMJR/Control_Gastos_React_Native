<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\GastoController;
use App\Http\Controllers\Api\UserController;

// Registro y login generan tokens Passport y comparten el limite de cinco intentos por minuto.
Route::prefix('auth')->middleware('throttle:login')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Los recursos solo responden JSON cuando llega un token Bearer OAuth válido.
Route::middleware(['auth:api', 'throttle:api'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/usuario', [UserController::class, 'show']);
    Route::apiResource('categorias', CategoriaController::class);
    Route::apiResource('gastos', GastoController::class);
});
