<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;
use Laravel\Passport\Token;
use Tests\TestCase;

class GastoApiTest extends TestCase
{
    use RefreshDatabase;

    private const FULL_SCOPES = [
        'perfil.read',
        'categorias.read',
        'categorias.write',
        'categorias.delete',
        'gastos.read',
        'gastos.write',
        'gastos.delete',
    ];

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

        Passport::actingAs($user, self::FULL_SCOPES);
        $createResponse = $this->postJson('/api/categorias', [
            'nombre' => 'Alimentación',
            'color' => '#F97316',
        ])->assertCreated()->assertJsonPath('nombre', 'Alimentación');

        $categoriaId = $createResponse->json('id');

        Passport::actingAs($user, self::FULL_SCOPES);
        $this->getJson('/api/categorias')
            ->assertOk()
            ->assertJsonFragment(['id' => $categoriaId, 'nombre' => 'Alimentación']);

        Passport::actingAs($user, self::FULL_SCOPES);
        $this->getJson("/api/categorias/{$categoriaId}")
            ->assertOk()
            ->assertJsonPath('id', $categoriaId);

        Passport::actingAs($user, self::FULL_SCOPES);
        $this->patchJson("/api/categorias/{$categoriaId}", [
            'nombre' => 'Alimentación actualizada',
            'color' => '#2563EB',
        ])->assertOk()
            ->assertJsonPath('nombre', 'Alimentación actualizada')
            ->assertJsonPath('color', '#2563EB');

        Passport::actingAs($user, self::FULL_SCOPES);
        $this->deleteJson("/api/categorias/{$categoriaId}")->assertNoContent();
        $this->assertDatabaseMissing('categorias', ['id' => $categoriaId]);
    }

    public function test_an_authenticated_user_can_complete_own_expense_crud(): void
    {
        $user = User::factory()->create();
        $categoria = Categoria::create(['nombre' => 'Alimentación', 'color' => '#F97316']);

        Passport::actingAs($user, self::FULL_SCOPES);

        $createResponse = $this->postJson('/api/gastos', [
            'categoria_id' => $categoria->id,
            'descripcion' => 'Almuerzo',
            'monto' => 45.50,
            'fecha_gasto' => '2026-08-18',
        ])->assertCreated()->assertJsonPath('descripcion', 'Almuerzo');

        $gastoId = $createResponse->json('id');

        Passport::actingAs($user, self::FULL_SCOPES);
        $this->getJson('/api/gastos')
            ->assertOk()
            ->assertJsonPath('data.0.descripcion', 'Almuerzo');

        Passport::actingAs($user, self::FULL_SCOPES);
        $this->getJson("/api/gastos/{$gastoId}")
            ->assertOk()
            ->assertJsonPath('id', $gastoId);

        Passport::actingAs($user, self::FULL_SCOPES);
        $this->patchJson("/api/gastos/{$gastoId}", [
            'descripcion' => 'Almuerzo actualizado',
            'monto' => 50.25,
            'notas' => 'Actualizado desde PHPUnit',
        ])->assertOk()
            ->assertJsonPath('descripcion', 'Almuerzo actualizado')
            ->assertJsonPath('monto', '50.25');

        Passport::actingAs($user, self::FULL_SCOPES);
        $this->deleteJson("/api/gastos/{$gastoId}")->assertNoContent();
        $this->assertDatabaseMissing('gastos', ['id' => $gastoId]);
    }

    public function test_expenses_can_be_filtered_and_summarized_by_month(): void
    {
        $user = User::factory()->create();
        $categoria = Categoria::create(['nombre' => 'Transporte', 'color' => '#2563EB']);

        $user->gastos()->createMany([
            [
                'categoria_id' => $categoria->id,
                'descripcion' => 'Bus de septiembre',
                'monto' => 20,
                'fecha_gasto' => '2026-09-10',
            ],
            [
                'categoria_id' => $categoria->id,
                'descripcion' => 'Taxi de septiembre',
                'monto' => 35.50,
                'fecha_gasto' => '2026-09-18',
            ],
            [
                'descripcion' => 'Gasto de octubre',
                'monto' => 80,
                'fecha_gasto' => '2026-10-01',
            ],
        ]);

        Passport::actingAs($user, self::FULL_SCOPES);

        $this->getJson('/api/gastos?month=2026-09&per_page=100')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('summary.expense_count', 2)
            ->assertJsonPath('summary.total_amount', 55.5)
            ->assertJsonPath('summary.average_amount', 27.75)
            ->assertJsonPath('summary.by_category.0.category_name', 'Transporte')
            ->assertJsonPath('summary.by_category.0.expense_count', 2)
            ->assertJsonMissing(['descripcion' => 'Gasto de octubre']);
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

        Passport::actingAs($otherUser, self::FULL_SCOPES);
        $this->getJson("/api/gastos/{$gasto->id}")->assertForbidden();

        Passport::actingAs($otherUser, self::FULL_SCOPES);
        $this->patchJson("/api/gastos/{$gasto->id}", [
            'descripcion' => 'Intento de cambio',
        ])->assertForbidden();

        Passport::actingAs($otherUser, self::FULL_SCOPES);
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

        $response = $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'username' => $user->email,
            'password' => 'password123',
            'scope' => implode(' ', self::FULL_SCOPES),
        ])->assertOk()->assertJsonStructure([
            'access_token',
            'refresh_token',
            'expires_in',
        ]);

        $this->assertGreaterThanOrEqual(3599, $response->json('expires_in'));
        $this->assertLessThanOrEqual(3600, $response->json('expires_in'));
    }

    public function test_a_refresh_token_can_renew_the_oauth_session(): void
    {
        $user = User::factory()->create([
            'email' => 'refresh@example.com',
            'password' => 'password123',
        ]);
        $client = app(ClientRepository::class)->createPasswordGrantClient('Postman', 'users');
        $scope = implode(' ', self::FULL_SCOPES);

        $initialResponse = $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'username' => $user->email,
            'password' => 'password123',
            'scope' => $scope,
        ])->assertOk();

        $this->post('/oauth/token', [
            'grant_type' => 'refresh_token',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'refresh_token' => $initialResponse->json('refresh_token'),
            'scope' => $scope,
        ])->assertOk()->assertJsonStructure([
            'access_token',
            'refresh_token',
            'expires_in',
        ])->assertJsonPath('expires_in', 3600);
    }

    public function test_scopes_allow_reading_and_reject_unauthorized_writes(): void
    {
        $user = User::factory()->create([
            'email' => 'scopes@example.com',
            'password' => 'password123',
        ]);
        $client = app(ClientRepository::class)->createPasswordGrantClient('Postman', 'users');

        $response = $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'username' => $user->email,
            'password' => 'password123',
            'scope' => 'categorias.read',
        ])->assertOk();

        $headers = ['Authorization' => 'Bearer '.$response->json('access_token')];

        $this->withHeaders($headers)->getJson('/api/categorias')->assertOk();
        $this->withHeaders($headers)->postJson('/api/categorias', [
            'nombre' => 'No autorizada',
            'color' => '#EF4444',
        ])->assertForbidden();
    }

    public function test_logout_revokes_access_and_refresh_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'logout@example.com',
            'password' => 'password123',
        ]);
        $client = app(ClientRepository::class)->createPasswordGrantClient('Postman', 'users');

        $response = $this->post('/oauth/token', [
            'grant_type' => 'password',
            'client_id' => $client->id,
            'client_secret' => $client->plainSecret,
            'username' => $user->email,
            'password' => 'password123',
            'scope' => implode(' ', self::FULL_SCOPES),
        ])->assertOk();

        $token = Token::query()
            ->where('user_id', $user->id)
            ->where('client_id', $client->id)
            ->firstOrFail();
        $refreshToken = $token->refreshToken()->firstOrFail();

        $this->withToken($response->json('access_token'))
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Sesión cerrada correctamente.');

        $this->assertTrue($token->refresh()->revoked);
        $this->assertTrue($refreshToken->refresh()->revoked);
    }
}
