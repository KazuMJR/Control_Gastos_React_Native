<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoTaskIntegrationSeeder extends Seeder
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

        $groups = [
            'Trabajo' => '#F97316',
            'Universidad' => '#2563EB',
        ];

        foreach ($groups as $name => $color) {
            Category::query()->updateOrCreate(
                ['user_id' => $user->id, 'name' => $name],
                ['color' => $color],
            );
        }

        $tasks = [
            [
                'title' => 'Preparar informe colaborativo',
                'description' => 'Resumir los cambios realizados en la integración de ambas aplicaciones.',
                'group' => 'Trabajo',
                'completed' => true,
            ],
            [
                'title' => 'Grabar evidencia de la actividad',
                'description' => 'Mostrar el filtro por fechas y el registro de una tarea desde el teléfono.',
                'group' => 'Universidad',
                'completed' => false,
            ],
        ];

        foreach ($tasks as $demoTask) {
            $category = Category::query()
                ->where('user_id', $user->id)
                ->where('name', $demoTask['group'])
                ->firstOrFail();

            $task = Task::query()->updateOrCreate(
                ['user_id' => $user->id, 'title' => $demoTask['title']],
                [
                    'category_id' => $category->id,
                    'description' => $demoTask['description'],
                    'completed' => $demoTask['completed'],
                ],
            );

            // Mantiene los datos de demostración dentro del rango actual al iniciar la actividad.
            $task->created_at = now();
            $task->updated_at = now();
            $task->saveQuietly();
        }
    }
}
