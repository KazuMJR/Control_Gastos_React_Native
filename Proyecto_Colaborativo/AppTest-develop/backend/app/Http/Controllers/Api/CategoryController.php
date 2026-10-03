<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = auth()->user()->categories()->orderBy('created_at', 'desc')->get();
        // Mapeo para formato frontend
        $formatted = $categories->map(function ($cat) {
            return [
                'id' => (string) $cat->id,
                'name' => $cat->name,
                'color' => $cat->color,
            ];
        });
        return response()->json($formatted);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $exists = auth()->user()->categories()->where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['message' => 'UNIQUE constraint failed: Ya existe una categoría con este nombre'], 422);
        }

        $category = auth()->user()->categories()->create($request->validated());
        return response()->json([
            'id' => (string) $category->id,
            'name' => $category->name,
            'color' => $category->color,
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        if ($category->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json([
            'id' => (string) $category->id,
            'name' => $category->name,
            'color' => $category->color,
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        if ($category->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($request->has('name')) {
            $exists = auth()->user()->categories()
                ->where('name', $request->name)
                ->where('id', '!=', $category->id)
                ->exists();
            
            if ($exists) {
                return response()->json(['message' => 'UNIQUE constraint failed: Ya existe una categoría con este nombre'], 422);
            }
        }

        $category->update($request->validated());
        return response()->json([
            'id' => (string) $category->id,
            'name' => $category->name,
            'color' => $category->color,
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $category->delete();
        return response()->json(null, 204);
    }
}
