<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\User;
use Illuminate\Database\Seeder;
use Laravel\Passport\Client;
use Laravel\Passport\ClientRepository;

class DemoExpenseIntegrationSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'integracion@controlgastos.test'],
            [
                'name' => 'Demostración Control de Gastos',
                'password' => 'Tareas2026!',
            ],
        );

        if (! Client::query()->where('name', 'Aplicación Control de Gastos')->exists()) {
            app(ClientRepository::class)->createPersonalAccessGrantClient(
                'Aplicación Control de Gastos',
                'users',
            );
        }

        Categoria::query()
            ->whereDoesntHave('gastos')
            ->where(function ($query) {
                $query->where('nombre', 'like', 'Prueba%')
                    ->orWhere('nombre', 'like', 'Test%');
            })
            ->delete();

        $categories = collect([
            ['nombre' => 'Alimentación', 'color' => '#F97316'],
            ['nombre' => 'Transporte', 'color' => '#2563EB'],
            ['nombre' => 'Universidad', 'color' => '#7C3AED'],
            ['nombre' => 'Servicios', 'color' => '#0891B2'],
            ['nombre' => 'Compras', 'color' => '#DB2777'],
        ])->mapWithKeys(function (array $category) {
            $model = Categoria::query()->updateOrCreate(
                ['nombre' => $category['nombre']],
                ['color' => $category['color']],
            );

            return [$model->nombre => $model];
        });

        $legacyFoodCategory = Categoria::query()->where('nombre', 'AlimentaciónN')->first();
        if ($legacyFoodCategory) {
            $legacyFoodCategory->gastos()->update([
                'categoria_id' => $categories['Alimentación']->id,
            ]);
            $legacyFoodCategory->delete();
        }

        $month = now()->startOfMonth();
        $expenses = [
            ['descripcion' => 'Supermercado', 'monto' => 286.40, 'day' => 2, 'category' => 'Alimentación', 'notas' => 'Compra de alimentos y artículos del hogar.'],
            ['descripcion' => 'Transporte a la universidad', 'monto' => 75.00, 'day' => 4, 'category' => 'Transporte', 'notas' => 'Traslados de la semana.'],
            ['descripcion' => 'Materiales para la actividad', 'monto' => 128.50, 'day' => 6, 'category' => 'Universidad', 'notas' => 'Materiales utilizados en clase.'],
            ['descripcion' => 'Servicio de internet', 'monto' => 225.00, 'day' => 8, 'category' => 'Servicios', 'notas' => 'Pago mensual del servicio.'],
        ];

        foreach ($expenses as $expense) {
            $date = $month->copy()->addDays($expense['day'] - 1)->toDateString();
            $matches = $user->gastos()
                ->where('descripcion', $expense['descripcion'])
                ->whereDate('fecha_gasto', $date)
                ->oldest('id')
                ->get();
            $gasto = $matches->shift();
            $data = [
                'categoria_id' => $categories[$expense['category']]->id,
                'monto' => $expense['monto'],
                'fecha_gasto' => $date,
                'notas' => $expense['notas'],
            ];

            if ($gasto) {
                $gasto->update($data);
                $matches->each(fn ($duplicate) => $duplicate->delete());
            } else {
                $user->gastos()->create([
                    ...$data,
                    'descripcion' => $expense['descripcion'],
                ]);
            }
        }
    }
}
