<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GastoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_returns_a_sanctum_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ana López',
            'email' => 'ana@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'device_name' => 'Pruebas',
        ]);

        $response->assertCreated()->assertJsonStructure([
            'token',
            'token_type',
            'user' => ['id', 'name', 'email'],
        ]);
    }

    public function test_an_authenticated_user_can_create_and_list_own_expenses(): void
    {
        $user = User::factory()->create();
        $categoria = Categoria::create(['nombre' => 'Alimentación', 'color' => '#F97316']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/gastos', [
            'categoria_id' => $categoria->id,
            'descripcion' => 'Almuerzo',
            'monto' => 45.50,
            'fecha_gasto' => '2026-08-18',
        ]);

        $response->assertCreated()->assertJsonPath('descripcion', 'Almuerzo');
        $this->actingAs($user, 'sanctum')->getJson('/api/gastos')
            ->assertOk()
            ->assertJsonPath('data.0.descripcion', 'Almuerzo');
    }
}
