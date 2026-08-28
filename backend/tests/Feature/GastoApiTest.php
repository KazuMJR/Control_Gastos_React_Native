<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;
use Tests\TestCase;

class GastoApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(ClientRepository::class)->createPersonalAccessGrantClient('Pruebas', 'users');
    }

    public function test_register_returns_a_passport_token(): void
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

    public function test_protected_routes_reject_unauthenticated_requests(): void
    {
        $this->getJson('/api/categorias')->assertUnauthorized();
        $this->getJson('/api/gastos')->assertUnauthorized();
        $this->getJson('/api/usuario')->assertUnauthorized();
    }

    public function test_an_authenticated_user_can_complete_category_crud(): void
    {
        $user = User::factory()->create();

        Passport::actingAs($user);
        $createResponse = $this->postJson('/api/categorias', [
            'nombre' => 'Alimentación',
            'color' => '#F97316',
        ])->assertCreated()->assertJsonPath('nombre', 'Alimentación');

        $categoriaId = $createResponse->json('id');

        Passport::actingAs($user);
        $this->getJson('/api/categorias')
            ->assertOk()
            ->assertJsonFragment(['id' => $categoriaId, 'nombre' => 'Alimentación']);

        Passport::actingAs($user);
        $this->getJson("/api/categorias/{$categoriaId}")
            ->assertOk()
            ->assertJsonPath('id', $categoriaId);

        Passport::actingAs($user);
        $this->patchJson("/api/categorias/{$categoriaId}", [
            'nombre' => 'Alimentación actualizada',
            'color' => '#2563EB',
        ])->assertOk()
            ->assertJsonPath('nombre', 'Alimentación actualizada')
            ->assertJsonPath('color', '#2563EB');

        Passport::actingAs($user);
        $this->deleteJson("/api/categorias/{$categoriaId}")->assertNoContent();
        $this->assertDatabaseMissing('categorias', ['id' => $categoriaId]);
    }

    public function test_an_authenticated_user_can_complete_own_expense_crud(): void
    {
        $user = User::factory()->create();
        $categoria = Categoria::create(['nombre' => 'Alimentación', 'color' => '#F97316']);

        Passport::actingAs($user);

        $createResponse = $this->postJson('/api/gastos', [
            'categoria_id' => $categoria->id,
            'descripcion' => 'Almuerzo',
            'monto' => 45.50,
            'fecha_gasto' => '2026-08-18',
        ])->assertCreated()->assertJsonPath('descripcion', 'Almuerzo');

        $gastoId = $createResponse->json('id');

        Passport::actingAs($user);
        $this->getJson('/api/gastos')
            ->assertOk()
            ->assertJsonPath('data.0.descripcion', 'Almuerzo');

        Passport::actingAs($user);
        $this->getJson("/api/gastos/{$gastoId}")
            ->assertOk()
            ->assertJsonPath('id', $gastoId);

        Passport::actingAs($user);
        $this->patchJson("/api/gastos/{$gastoId}", [
            'descripcion' => 'Almuerzo actualizado',
            'monto' => 50.25,
            'notas' => 'Actualizado desde PHPUnit',
        ])->assertOk()
            ->assertJsonPath('descripcion', 'Almuerzo actualizado')
            ->assertJsonPath('monto', '50.25');

        Passport::actingAs($user);
        $this->deleteJson("/api/gastos/{$gastoId}")->assertNoContent();
        $this->assertDatabaseMissing('gastos', ['id' => $gastoId]);
    }

    public function test_a_user_cannot_access_another_users_expense(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $gasto = $owner->gastos()->create([
            'descripcion' => 'Gasto privado',
            'monto' => 25,
            'fecha_gasto' => '2026-08-18',
        ]);

        Passport::actingAs($otherUser);
        $this->getJson("/api/gastos/{$gasto->id}")->assertForbidden();

        Passport::actingAs($otherUser);
        $this->patchJson("/api/gastos/{$gasto->id}", [
            'descripcion' => 'Intento de cambio',
        ])->assertForbidden();

        Passport::actingAs($otherUser);
        $this->deleteJson("/api/gastos/{$gasto->id}")->assertForbidden();

        $this->assertDatabaseHas('gastos', [
            'id' => $gasto->id,
            'descripcion' => 'Gasto privado',
        ]);
    }

    public function test_login_is_blocked_after_five_attempts_per_minute(): void
    {
        $user = User::factory()->create(['password' => 'password123']);
        RateLimiter::clear('login:127.0.0.1');

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'password123',
                'device_name' => 'Pruebas',
            ])->assertOk();
        }

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
            'device_name' => 'Pruebas',
        ])->assertStatus(429);
    }

    public function test_a_password_grant_client_can_request_a_passport_token(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@example.com',
            'password' => 'password123',
        ]);
        $client = app(ClientRepository::class)->createPasswordGrantClient('Postman', 'users');

        $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'username' => $user->email,
            'password' => 'password123',
            'scope' => '',
        ])->assertOk()->assertJsonStructure([
            'access_token',
            'refresh_token',
            'expires_in',
        ]);
    }
}
