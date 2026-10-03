<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (requires Passport token)
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // User profile route
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // El reporte debe declararse antes del apiResource para que "progress"
    // no se interprete como el identificador de una tarea.
    Route::get('/tasks/progress', [TaskController::class, 'progress']);

    // CRUD routes for Tasks and Categories
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('categories', CategoryController::class);

    // Rutas protegidas por scopes para Productos
    Route::get('/productos', [ProductoController::class, 'index'])
        ->middleware('scope:productos.read');

    Route::post('/productos', [ProductoController::class, 'store'])
        ->middleware('scope:productos.write');

    Route::delete('/productos/{id}', [ProductoController::class, 'destroy'])
        ->middleware('scope:productos.delete');

    // Reportes: exige admin O reportes (al menos uno)
    Route::get('/reportes', function () {
        return response()->json(['message' => 'Acceso a reportes concedido']);
    })->middleware('scopes:admin,reportes');

    // TEMPORAL — endpoint de debug para inspeccionar los scopes de un token.
    // Eliminar antes de pasar a producción (ver MEMORY.md).
    Route::get('/token-info', function (Request $request) {
        $token = $request->user()->token();

        return response()->json([
            'token_id' => $token->id,
            'scopes' => $token->scopes,
            'user' => $request->user()->only('id', 'name', 'email'),
            'expires' => $token->expires_at,
        ]);
    });
});
