<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\GastoController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;
use Laravel\Passport\Http\Middleware\CheckToken;

// Registro y login generan tokens Passport y comparten el limite de cinco intentos por minuto.
Route::prefix('auth')->middleware('throttle:login')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Los recursos solo responden JSON cuando llega un token Bearer OAuth válido.
Route::middleware(['auth:api', 'throttle:api'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/usuario', [UserController::class, 'show'])
        ->middleware(CheckToken::using('perfil.read'));

    Route::get('/categorias', [CategoriaController::class, 'index'])
        ->middleware(CheckToken::using('categorias.read'));
    Route::get('/categorias/{categoria}', [CategoriaController::class, 'show'])
        ->middleware(CheckToken::using('categorias.read'));
    Route::post('/categorias', [CategoriaController::class, 'store'])
        ->middleware(CheckToken::using('categorias.write'));
    Route::match(['put', 'patch'], '/categorias/{categoria}', [CategoriaController::class, 'update'])
        ->middleware(CheckToken::using('categorias.write'));
    Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy'])
        ->middleware(CheckToken::using('categorias.delete'));

    Route::get('/gastos', [GastoController::class, 'index'])
        ->middleware(CheckToken::using('gastos.read'));
    Route::get('/gastos/{gasto}', [GastoController::class, 'show'])
        ->middleware(CheckToken::using('gastos.read'));
    Route::post('/gastos', [GastoController::class, 'store'])
        ->middleware(CheckToken::using('gastos.write'));
    Route::match(['put', 'patch'], '/gastos/{gasto}', [GastoController::class, 'update'])
        ->middleware(CheckToken::using('gastos.write'));
    Route::delete('/gastos/{gasto}', [GastoController::class, 'destroy'])
        ->middleware(CheckToken::using('gastos.delete'));
});
