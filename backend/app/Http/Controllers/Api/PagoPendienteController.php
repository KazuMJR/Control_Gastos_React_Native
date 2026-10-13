<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PagoPendiente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PagoPendienteController extends Controller
{
    public function store(Request $request)
    {
        $payment = $request->user()->pagosPendientes()->create($this->validatedData($request));

        return response()->json($payment->load('categoria'), 201);
    }

    public function update(Request $request, PagoPendiente $pagoPendiente)
    {
        $this->ensureOwnership($request, $pagoPendiente);
        abort_if($pagoPendiente->estado !== 'pendiente', 422, 'Un pago realizado ya no se puede modificar.');

        $pagoPendiente->update($this->validatedData($request, true));

        return response()->json($pagoPendiente->fresh()->load('categoria'));
    }

    public function destroy(Request $request, PagoPendiente $pagoPendiente)
    {
        $this->ensureOwnership($request, $pagoPendiente);
        abort_if($pagoPendiente->estado !== 'pendiente', 422, 'Un pago realizado no se puede eliminar.');

        $pagoPendiente->delete();

        return response()->noContent();
    }

    public function pay(Request $request, PagoPendiente $pagoPendiente)
    {
        $this->ensureOwnership($request, $pagoPendiente);
        $data = $request->validate([
            'payment_date' => ['nullable', 'date'],
        ]);

        $payment = DB::transaction(function () use ($request, $pagoPendiente, $data) {
            $lockedPayment = $request->user()->pagosPendientes()
                ->lockForUpdate()
                ->findOrFail($pagoPendiente->id);

            abort_if($lockedPayment->estado !== 'pendiente', 409, 'Este pago ya fue registrado.');

            $paymentDate = $data['payment_date'] ?? now()->toDateString();
            $expense = $request->user()->gastos()->create([
                'categoria_id' => $lockedPayment->categoria_id,
                'descripcion' => $lockedPayment->descripcion,
                'monto' => $lockedPayment->monto,
                'fecha_gasto' => $paymentDate,
                'notas' => $lockedPayment->notas ?: 'Registrado desde pagos pendientes.',
            ]);

            $lockedPayment->update([
                'estado' => 'pagado',
                'fecha_pago' => $paymentDate,
                'gasto_id' => $expense->id,
            ]);

            return $lockedPayment->fresh()->load(['categoria', 'gasto.categoria']);
        });

        return response()->json($payment);
    }

    private function validatedData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'categoria_id' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'integer', 'exists:categorias,id'],
            'descripcion' => [$required, 'string', 'max:255'],
            'monto' => [$required, 'numeric', 'gt:0', 'max:9999999999.99'],
            'fecha_vencimiento' => [$required, 'date'],
            'notas' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:2000'],
        ]);
    }

    private function ensureOwnership(Request $request, PagoPendiente $pagoPendiente): void
    {
        abort_unless($pagoPendiente->user_id === $request->user()->id, 403, 'No tienes acceso a este pago pendiente.');
    }
}
