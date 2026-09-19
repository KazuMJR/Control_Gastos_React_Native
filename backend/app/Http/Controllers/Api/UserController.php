<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Passport\Passport;

class UserController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        // tokenCan permite informar únicamente los scopes concedidos al token actual.
        $grantedScopes = collect(Passport::scopeIds())
            ->filter(fn (string $scope) => $user->tokenCan($scope))
            ->values();

        return response()->json([
            ...$user->toArray(),
            'scopes' => $grantedScopes,
        ]);
    }
}
