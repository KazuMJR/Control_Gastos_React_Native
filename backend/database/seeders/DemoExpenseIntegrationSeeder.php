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

        if ($user->gastos()->exists()) {
            return;
        }

        $month = now()->startOfMonth();
        $expenses = [
            ['descripcion' => 'Supermercado', 'monto' => 286.40, 'day' => 2, 'category' => 'Alimentación'],
            ['descripcion' => 'Transporte a la universidad', 'monto' => 75.00, 'day' => 4, 'category' => 'Transporte'],
            ['descripcion' => 'Materiales para la actividad', 'monto' => 128.50, 'day' => 6, 'category' => 'Universidad'],
            ['descripcion' => 'Servicio de internet', 'monto' => 225.00, 'day' => 8, 'category' => 'Servicios'],
        ];

        foreach ($expenses as $expense) {
            $user->gastos()->create([
                'categoria_id' => $categories[$expense['category']]->id,
                'descripcion' => $expense['descripcion'],
                'monto' => $expense['monto'],
                'fecha_gasto' => $month->copy()->addDays($expense['day'] - 1)->toDateString(),
                'notas' => 'Dato de demostración generado para la actividad.',
            ]);
        }
    }
}
