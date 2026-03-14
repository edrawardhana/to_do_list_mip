<?php

// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_merge(
        explode(',', env('FRONTEND_URL', 'http://localhost:5173')), 
        ['http://localhost:3000', 'http://127.0.0.1:5173'] // Fallback local dev
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];