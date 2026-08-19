<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gasto;
use Illuminate\Http\Request;

class GastoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->gastos()->with('categoria')->latest('fecha_gasto')->paginate(15)
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $gasto = $request->user()->gastos()->create($this->validatedData($request));

        return response()->json($gasto->load('categoria'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Gasto $gasto)
    {
        $this->ensureOwnership($request, $gasto);

        return response()->json($gasto->load('categoria'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Gasto $gasto)
    {
        $this->ensureOwnership($request, $gasto);
        $gasto->update($this->validatedData($request, true));

        return response()->json($gasto->fresh()->load('categoria'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Gasto $gasto)
    {
        $this->ensureOwnership($request, $gasto);
        $gasto->delete();

        return response()->noContent();
    }

    private function validatedData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'categoria_id' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'integer', 'exists:categorias,id'],
            'descripcion' => $partial
                ? ['sometimes', 'required', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'monto' => [$required, 'numeric', 'gt:0'],
            'fecha_gasto' => [$required, 'date'],
            'notas' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:2000'],
        ]);
    }

    private function ensureOwnership(Request $request, Gasto $gasto): void
    {
        abort_unless($gasto->user_id === $request->user()->id, 403, 'No tienes acceso a este gasto.');
    }
}
