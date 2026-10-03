<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear clientes de Passport programáticamente para evitar prompts interactivos
        $clientRepository = new ClientRepository;

        // Cliente de acceso personal
        $clientRepository->createPersonalAccessGrantClient(
            'Test Personal Access Client'
        );

        // Cliente de contraseña
        $passwordClient = $clientRepository->createPasswordGrantClient(
            'Test Password Grant Client', 'users', true
        );
        config()->set('services.passport.password_client_id', $passwordClient->id);
        config()->set('services.passport.password_client_secret', $passwordClient->plainSecret);
    }

    /**
     * Test que un usuario se puede registrar correctamente.
     */
    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'created_at', 'updated_at'],
                'access_token',
                'token_type',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
        ]);
    }

    /**
     * Test que valida la fallida del registro con datos incorrectos.
     */
    public function test_registration_validation(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => '',
            'email' => 'invalid-email',
            'password' => '123', // menos de 8 caracteres
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    /**
     * Test que un usuario registrado puede iniciar sesión.
     */
    public function test_user_can_login(): void
    {
        $user = User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user',
                'access_token',
                'token_type',
            ]);
    }

    /**
     * Test que el login falla con credenciales incorrectas.
     */
    public function test_login_fails_with_invalid_credentials(): void
    {
        $user = User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Credenciales inválidas',
            ]);
    }

    /**
     * Test que un usuario no autenticado no puede acceder a las tareas y recibe un 401 JSON
     * incluso si solicita HTML o no especifica el header Accept.
     */
    public function test_unauthenticated_request_returns_json_401_on_api_routes(): void
    {
        // GET sin Accept: application/json
        $response = $this->get('/api/tasks');

        $response->assertStatus(401);
        $response->assertJson([
            'message' => 'Unauthenticated.',
        ]);

        // GET con Accept: text/html (Laravel debe seguir retornando JSON en /api/*)
        $responseWithHtml = $this->get('/api/tasks', [
            'Accept' => 'text/html',
        ]);

        $responseWithHtml->assertStatus(401);
        $responseWithHtml->assertJson([
            'message' => 'Unauthenticated.',
        ]);
    }

    /**
     * Test que un usuario autenticado puede acceder a la ruta de usuario y tareas.
     */
    public function test_authenticated_user_can_access_protected_routes(): void
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);

        Passport::actingAs($user);

        $responseUser = $this->getJson('/api/user');
        $responseUser->assertStatus(200)
            ->assertJsonFragment([
                'email' => 'test@example.com',
            ]);

        $responseTasks = $this->getJson('/api/tasks');
        $responseTasks->assertStatus(200);
    }

    /**
     * Test que un usuario autenticado puede cerrar sesión y revocar su token.
     */
    public function test_authenticated_user_can_logout(): void
    {
        $user = User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Autenticar y crear token real para poder revocarlo
        $token = $user->createToken('TestToken')->accessToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ])->post('/api/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Sesión cerrada correctamente',
            ]);
    }

    /**
     * Test que un usuario autenticado puede consultar el endpoint /me.
     */
    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $user = User::create([
            'name' => 'Profile User',
            'email' => 'profile@example.com',
            'password' => Hash::make('password123'),
        ]);

        Passport::actingAs($user);

        $response = $this->getJson('/api/me');
        $response->assertStatus(200)
            ->assertJsonFragment([
                'email' => 'profile@example.com',
            ]);
    }
}
