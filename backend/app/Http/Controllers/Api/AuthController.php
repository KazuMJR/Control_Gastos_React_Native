<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Laravel\Passport\Passport;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'scopes' => ['sometimes', 'array'],
            'scopes.*' => ['string', Rule::in(Passport::scopeIds())],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        return response()->json($this->tokenResponse(
            $user,
            $data['device_name'] ?? 'postman',
            $data['scopes'] ?? Passport::scopeIds(),
        ), 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'scopes' => ['sometimes', 'array'],
            'scopes.*' => ['string', Rule::in(Passport::scopeIds())],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas.'], 422);
        }

        return response()->json($this->tokenResponse(
            $user,
            $data['device_name'] ?? 'postman',
            $data['scopes'] ?? Passport::scopeIds(),
        ));
    }

    public function logout(Request $request)
    {
        $token = $request->user()->token();

        // Revoca el access token y también su refresh token, cuando exista.
        $token?->refreshToken?->revoke();
        $token?->revoke();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    private function tokenResponse(User $user, string $deviceName, array $scopes): array
    {
        $token = $user->createToken($deviceName, $scopes);

        return [
            'token' => $token->accessToken,
            'token_type' => 'Bearer',
            'scopes' => $scopes,
            'user' => $user,
        ];
    }
}
