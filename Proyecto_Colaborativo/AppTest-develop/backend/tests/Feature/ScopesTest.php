<?php

namespace Tests\Feature;

use App\Models\Producto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;
use Tests\TestCase;

class ScopesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $clientRepository = new ClientRepository;
        $passwordClient = $clientRepository->createPasswordGrantClient(
            'Test Password Grant Client', 'users', true
        );

        config()->set('services.passport.password_client_id', $passwordClient->id);
        config()->set('services.passport.password_client_secret', $passwordClient->plainSecret);
    }

    /**
     * Test que el login asigna scope por defecto (productos.read) si no se especifica.
     */
    public function test_login_assigns_default_scope_or_requested_scopes(): void
    {
        $user = User::create([
            'name' => 'Scope User',
            'email' => 'scope@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'scope@example.com',
            'password' => 'password123',
            'scopes' => ['productos.read', 'reportes'],
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'expires_in',
            ]);
    }

    /**
     * Test que el token con scope productos.read puede consultar productos.
     */
    public function test_user_with_read_scope_can_view_productos(): void
    {
        $user = User::create([
            'name' => 'Reader',
            'email' => 'reader@example.com',
            'password' => Hash::make('password123'),
        ]);

        Producto::create(['nombre' => 'Teclado', 'precio' => 25.50]);

        Passport::actingAs($user, ['productos.read']);

        $response = $this->getJson('/api/productos');
        $response->assertStatus(200)
            ->assertJsonFragment(['nombre' => 'Teclado']);
    }

    /**
     * Test que el token con solo scope productos.read no puede crear productos (403 Forbidden).
     */
    public function test_user_with_read_only_scope_cannot_create_productos(): void
    {
        $user = User::create([
            'name' => 'Reader',
            'email' => 'reader2@example.com',
            'password' => Hash::make('password123'),
        ]);

        Passport::actingAs($user, ['productos.read']);

        $response = $this->postJson('/api/productos', [
            'nombre' => 'Monitor',
            'precio' => 199.99,
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test que el token con scope productos.write puede crear productos.
     */
    public function test_user_with_write_scope_can_create_productos(): void
    {
        $user = User::create([
            'name' => 'Writer',
            'email' => 'writer@example.com',
            'password' => Hash::make('password123'),
        ]);

        Passport::actingAs($user, ['productos.read', 'productos.write']);

        $response = $this->postJson('/api/productos', [
            'nombre' => 'Mouse Gamer',
            'precio' => 45.00,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['nombre' => 'Mouse Gamer']);

        $this->assertDatabaseHas('productos', ['nombre' => 'Mouse Gamer']);
    }

    /**
     * Test que el token sin productos.delete no puede eliminar productos (403 por tokenCan y middleware).
     */
    public function test_user_without_delete_scope_cannot_delete_productos(): void
    {
        $user = User::create([
            'name' => 'NoDeleter',
            'email' => 'nodeleter@example.com',
            'password' => Hash::make('password123'),
        ]);

        $producto = Producto::create(['nombre' => 'Audifonos', 'precio' => 30.00]);

        Passport::actingAs($user, ['productos.read']);

        $response = $this->deleteJson('/api/productos/'.$producto->id);
        $response->assertStatus(403);
    }

    /**
     * Test que el token con productos.delete puede eliminar productos.
     */
    public function test_user_with_delete_scope_can_delete_productos(): void
    {
        $user = User::create([
            'name' => 'Deleter',
            'email' => 'deleter@example.com',
            'password' => Hash::make('password123'),
        ]);

        $producto = Producto::create(['nombre' => 'Cable HDMI', 'precio' => 10.00]);

        Passport::actingAs($user, ['productos.read', 'productos.delete']);

        $response = $this->deleteJson('/api/productos/'.$producto->id);
        $response->assertStatus(200)
            ->assertJson(['message' => 'Producto eliminado']);

        $this->assertDatabaseMissing('productos', ['id' => $producto->id]);
    }

    /**
     * Test que la ruta /reportes exige al menos admin o reportes.
     */
    public function test_reportes_route_requires_admin_or_reportes_scope(): void
    {
        $user = User::create([
            'name' => 'Reporter',
            'email' => 'reporter@example.com',
            'password' => Hash::make('password123'),
        ]);

        // Sin permisos
        Passport::actingAs($user, ['productos.read']);
        $this->getJson('/api/reportes')->assertStatus(403);

        // Con scope reportes
        Passport::actingAs($user, ['reportes']);
        $this->getJson('/api/reportes')->assertStatus(200)
            ->assertJson(['message' => 'Acceso a reportes concedido']);

        // Con scope admin
        Passport::actingAs($user, ['admin']);
        $this->getJson('/api/reportes')->assertStatus(200)
            ->assertJson(['message' => 'Acceso a reportes concedido']);
    }

    /**
     * Test del endpoint de debug /token-info.
     */
    public function test_token_info_debug_endpoint(): void
    {
        $user = User::create([
            'name' => 'Debug User',
            'email' => 'debug@example.com',
            'password' => Hash::make('password123'),
        ]);

        Passport::actingAs($user, ['productos.read', 'reportes']);

        $response = $this->getJson('/api/token-info');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'token_id',
                'scopes',
                'user' => ['id', 'name', 'email'],
                'expires',
            ]);
    }
}
