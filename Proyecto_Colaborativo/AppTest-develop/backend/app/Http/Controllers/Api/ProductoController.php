<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    /**
     * Listado de productos.
     */
    public function index(Request $request)
    {
        return response()->json(Producto::all(), 200);
    }

    /**
     * Crear un nuevo producto.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'precio' => 'required|numeric|min:0',
        ]);

        $producto = Producto::create($validated);

        return response()->json($producto, 201);
    }

    /**
     * Eliminar un producto con verificación explícita via tokenCan().
     */
    public function destroy(Request $request, $id)
    {
        // Verificación adicional manual con tokenCan(), además del middleware de ruta
        if (!$request->user()->tokenCan('productos.delete')) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar productos',
            ], 403);
        }

        $producto = Producto::find($id);

        if (!$producto) {
            return response()->json([
                'message' => 'Producto no encontrado',
            ], 404);
        }

        $producto->delete();

        return response()->json([
            'message' => 'Producto eliminado',
        ], 200);
    }
}
