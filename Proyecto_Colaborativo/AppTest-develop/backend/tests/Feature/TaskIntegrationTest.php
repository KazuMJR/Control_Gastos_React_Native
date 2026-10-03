<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

class TaskIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_a_task_through_the_api(): void
    {
        $user = User::factory()->create();
        $category = Category::create([
            'user_id' => $user->id,
            'name' => 'Universidad',
            'color' => '#2563EB',
        ]);

        Passport::actingAs($user);

        $response = $this->postJson('/api/tasks', [
            'title' => 'Preparar presentación',
            'description' => 'Crear las diapositivas para la clase.',
            'category_id' => $category->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('title', 'Preparar presentación')
            ->assertJsonPath('description', 'Crear las diapositivas para la clase.')
            ->assertJsonPath('categoryId', (string) $category->id)
            ->assertJsonPath('completed', false)
            ->assertJsonStructure(['id', 'created_at', 'updated_at']);

        $this->assertDatabaseHas('tasks', [
            'user_id' => $user->id,
            'title' => 'Preparar presentación',
            'description' => 'Crear las diapositivas para la clase.',
            'category_id' => $category->id,
        ]);
    }

    public function test_progress_is_grouped_and_filtered_by_date_range(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $work = Category::create([
            'user_id' => $user->id,
            'name' => 'Trabajo',
            'color' => '#F97316',
        ]);

        Passport::actingAs($user);

        $this->createTaskAt($user, 'Informe terminado', true, '2026-10-02 10:00:00', $work);
        $this->createTaskAt($user, 'Reunión pendiente', false, '2026-10-03 15:00:00', $work);
        $this->createTaskAt($user, 'Tarea personal', true, '2026-10-04 08:00:00');
        $this->createTaskAt($user, 'Fuera del rango', true, '2026-09-20 08:00:00', $work);
        $this->createTaskAt($otherUser, 'No pertenece al usuario', true, '2026-10-02 08:00:00');

        $response = $this->getJson('/api/tasks/progress?from=2026-10-01&to=2026-10-05');

        $response
            ->assertOk()
            ->assertJsonPath('range.from', '2026-10-01')
            ->assertJsonPath('range.to', '2026-10-05')
            ->assertJsonPath('summary.total_tasks', 3)
            ->assertJsonPath('summary.completed_tasks', 2)
            ->assertJsonPath('summary.pending_tasks', 1)
            ->assertJsonPath('summary.percentage', 67)
            ->assertJsonCount(2, 'groups')
            ->assertJsonFragment([
                'title' => 'Informe terminado',
                'description' => 'Descripción de Informe terminado',
                'completed' => true,
            ])
            ->assertJsonFragment([
                'title' => 'Reunión pendiente',
                'description' => 'Descripción de Reunión pendiente',
                'completed' => false,
            ])
            ->assertJsonMissing(['title' => 'Fuera del rango'])
            ->assertJsonMissing(['title' => 'No pertenece al usuario'])
            ->assertJsonFragment([
                'category_name' => 'Trabajo',
                'total_tasks' => 2,
                'completed_tasks' => 1,
                'pending_tasks' => 1,
                'percentage' => 50,
            ])
            ->assertJsonFragment([
                'category_name' => 'Sin categoría',
                'total_tasks' => 1,
                'completed_tasks' => 1,
                'pending_tasks' => 0,
                'percentage' => 100,
            ]);
    }

    public function test_progress_rejects_an_invalid_range(): void
    {
        Passport::actingAs(User::factory()->create());

        $this->getJson('/api/tasks/progress?from=2026-10-10&to=2026-10-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('to');
    }

    private function createTaskAt(
        User $user,
        string $title,
        bool $completed,
        string $createdAt,
        ?Category $category = null,
    ): Task {
        $task = Task::create([
            'user_id' => $user->id,
            'category_id' => $category?->id,
            'title' => $title,
            'description' => 'Descripción de '.$title,
            'completed' => $completed,
        ]);

        $task->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->saveQuietly();

        return $task;
    }
}
