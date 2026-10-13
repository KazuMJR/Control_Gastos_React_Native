<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gasto;
use Carbon\Carbon;
use Illuminate\Http\Request;

class GastoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = $request->user()->gastos()->with('categoria');

        if (! empty($filters['month'])) {
            $month = Carbon::createFromFormat('Y-m', $filters['month']);
            $query->whereBetween('fecha_gasto', [
                $month->copy()->startOfMonth()->toDateString(),
                $month->copy()->endOfMonth()->toDateString(),
            ]);
        }

        $total = (float) (clone $query)->sum('monto');
        $count = (clone $query)->count();
        $byCategory = (clone $query)
            ->selectRaw('categoria_id, COUNT(*) as expense_count, SUM(monto) as total_amount')
            ->groupBy('categoria_id')
            ->with('categoria:id,nombre,color')
            ->get()
            ->map(fn (Gasto $gasto) => [
                'category_id' => $gasto->categoria_id,
                'category_name' => $gasto->categoria?->nombre ?? 'Sin categoría',
                'category_color' => $gasto->categoria?->color ?? '#64748B',
                'expense_count' => (int) $gasto->expense_count,
                'total_amount' => (float) $gasto->total_amount,
            ])
            ->sortByDesc('total_amount')
            ->values();

        $paginator = $query
            ->latest('fecha_gasto')
            ->latest('id')
            ->paginate($filters['per_page'] ?? 50);
        $response = $paginator->toArray();
        $response['summary'] = [
            'expense_count' => $count,
            'total_amount' => $total,
            'average_amount' => $count > 0 ? round($total / $count, 2) : 0,
            'by_category' => $byCategory,
        ];

        return response()->json($response);
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
