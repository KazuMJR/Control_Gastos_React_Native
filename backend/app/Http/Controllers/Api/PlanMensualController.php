<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlanMensualController extends Controller
{
    public function show(Request $request)
    {
        $filters = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        return response()->json($this->planData($request, $filters['month']));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'amount' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'allocations' => ['present', 'array'],
            'allocations.*.category_id' => ['required', 'integer', 'distinct', 'exists:categorias,id'],
            'allocations.*.amount' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
        ]);

        $allocated = collect($data['allocations'])->sum(fn (array $item) => (float) $item['amount']);
        if ($allocated > (float) $data['amount']) {
            throw ValidationException::withMessages([
                'allocations' => ['La distribución por categorías no puede superar el presupuesto mensual.'],
            ]);
        }

        DB::transaction(function () use ($request, $data) {
            $budget = $request->user()->presupuestosMensuales()->updateOrCreate(
                ['mes' => $data['month']],
                ['monto' => $data['amount']],
            );

            $budget->distribuciones()->delete();
            $budget->distribuciones()->createMany(
                collect($data['allocations'])
                    ->filter(fn (array $item) => (float) $item['amount'] > 0)
                    ->map(fn (array $item) => [
                        'categoria_id' => $item['category_id'],
                        'monto' => $item['amount'],
                    ])
                    ->values()
                    ->all(),
            );
        });

        return response()->json($this->planData($request, $data['month']));
    }

    private function planData(Request $request, string $month): array
    {
        $period = Carbon::createFromFormat('Y-m', $month);
        $start = $period->copy()->startOfMonth()->toDateString();
        $end = $period->copy()->endOfMonth()->toDateString();
        $budget = $request->user()->presupuestosMensuales()
            ->with('distribuciones.categoria:id,nombre,color')
            ->where('mes', $month)
            ->first();

        $budgetAmount = (float) ($budget?->monto ?? 2500);
        $spentAmount = (float) $request->user()->gastos()
            ->whereBetween('fecha_gasto', [$start, $end])
            ->sum('monto');
        $pendingQuery = $request->user()->pagosPendientes()
            ->with('categoria:id,nombre,color')
            ->where('estado', 'pendiente')
            ->whereDate('fecha_vencimiento', '<=', $end);
        $pendingAmount = (float) (clone $pendingQuery)->sum('monto');
        $pendingPayments = $pendingQuery
            ->orderBy('fecha_vencimiento')
            ->orderBy('id')
            ->get();
        $allocations = $budget?->distribuciones ?? collect();
        $allocatedAmount = (float) $allocations->sum('monto');

        return [
            'month' => $month,
            'budget_id' => $budget?->id,
            'budget_amount' => $budgetAmount,
            'allocations' => $allocations->values(),
            'pending_payments' => $pendingPayments,
            'summary' => [
                'spent_amount' => $spentAmount,
                'pending_amount' => $pendingAmount,
                'available_amount' => $budgetAmount - $spentAmount,
                'projected_available_amount' => $budgetAmount - $spentAmount - $pendingAmount,
                'allocated_amount' => $allocatedAmount,
                'unallocated_amount' => $budgetAmount - $allocatedAmount,
            ],
        ];
    }
}
