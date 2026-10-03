<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        $tasks = auth()->user()->tasks()->with('category')->orderBy('created_at', 'desc')->get();

        $formatted = $tasks->map(fn (Task $task) => $this->formatTask($task));

        return response()->json($formatted);
    }

    /**
     * Resume el avance de las tareas del usuario, agrupadas por categoría,
     * dentro de un rango inclusivo de fechas de creación.
     */
    public function progress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $timezone = config('app.timezone');
        $from = CarbonImmutable::createFromFormat('Y-m-d', $validated['from'], $timezone)->startOfDay();
        $to = CarbonImmutable::createFromFormat('Y-m-d', $validated['to'], $timezone)->endOfDay();

        $tasks = auth()->user()->tasks()
            ->with('category')
            ->whereBetween('created_at', [$from, $to])
            ->get();

        $groups = $tasks
            ->groupBy(fn (Task $task) => $task->category_id ? 'category:'.$task->category_id : 'uncategorized')
            ->map(function ($group) {
                /** @var Task $firstTask */
                $firstTask = $group->first();
                $total = $group->count();
                $completed = $group->where('completed', true)->count();

                return [
                    'category_id' => $firstTask->category_id ? (string) $firstTask->category_id : null,
                    'category_name' => $firstTask->category?->name ?? 'Sin categoría',
                    'category_color' => $firstTask->category?->color ?? '#94A3B8',
                    'total_tasks' => $total,
                    'completed_tasks' => $completed,
                    'pending_tasks' => $total - $completed,
                    'percentage' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
                    'tasks' => $group
                        ->sortByDesc('created_at')
                        ->values()
                        ->map(fn (Task $task) => [
                            'id' => (string) $task->id,
                            'title' => $task->title,
                            'description' => $task->description,
                            'completed' => (bool) $task->completed,
                            'created_at' => $task->created_at?->toIso8601String(),
                        ]),
                ];
            })
            ->sortBy('category_name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        $total = $tasks->count();
        $completed = $tasks->where('completed', true)->count();

        return response()->json([
            'range' => [
                'from' => $validated['from'],
                'to' => $validated['to'],
            ],
            'summary' => [
                'total_tasks' => $total,
                'completed_tasks' => $completed,
                'pending_tasks' => $total - $completed,
                'percentage' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            ],
            'groups' => $groups,
        ]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        if ($request->category_id) {
            $category = auth()->user()->categories()->find($request->category_id);
            if (! $category) {
                return response()->json(['message' => 'Category not found or unauthorized'], 422);
            }
        }

        $task = auth()->user()->tasks()->create($request->validated());
        $task->load('category');

        return response()->json($this->formatTask($task), 201);
    }

    public function show(Task $task): JsonResponse
    {
        if ($task->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->load('category');

        return response()->json($this->formatTask($task));
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        if ($task->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($request->has('category_id') && $request->category_id) {
            $category = auth()->user()->categories()->find($request->category_id);
            if (! $category) {
                return response()->json(['message' => 'Category not found or unauthorized'], 422);
            }
        }

        // Handle case where category_id is explicitly set to null
        if ($request->has('category_id') && $request->category_id === null) {
            $task->category_id = null;
        }

        $task->update($request->validated());
        $task->load('category');

        return response()->json($this->formatTask($task));
    }

    public function destroy(Task $task): JsonResponse
    {
        if ($task->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task->delete();

        return response()->json(null, 204);
    }

    private function formatTask(Task $task): array
    {
        return [
            'id' => (string) $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'categoryId' => $task->category_id ? (string) $task->category_id : null,
            'completed' => (bool) $task->completed,
            'category_name' => $task->category?->name,
            'category_color' => $task->category?->color,
            'created_at' => $task->created_at?->toIso8601String(),
            'updated_at' => $task->updated_at?->toIso8601String(),
        ];
    }
}
