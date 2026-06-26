<?php

namespace Tests\Unit;

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    public function test_login_returns_unauthorized_on_failure()
    {
        $mockUser = \Mockery::mock('alias:App\Models\User');
        $mockUser->shouldReceive('where->first')->andReturn(null);

        $request = Request::create('/api/auth/login', 'POST', [
            'email' => 'test@example.com',
            'password' => 'wrong',
        ]);

        $controller = new AuthController();
        $response = $controller->login($request);

        $this->assertEquals(401, $response->getStatusCode());
    }
}

