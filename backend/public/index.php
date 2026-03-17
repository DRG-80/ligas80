<?php

/**
 * --- BLOQUE DE EMERGENCIA CORS PARA HOSTINGER ---
 * Este bloque maneja los permisos antes de que Laravel arranque.
 */
header('Access-Control-Allow-Origin: https://drg80dev.com');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With, X-XSRF-TOKEN');
header('Access-Control-Allow-Credentials: true');


if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * --- ARRANQUE ESTÁNDAR DE LARAVEL ---
 */

define('LARAVEL_START', microtime(true));

// Comprobar si la aplicación está en mantenimiento...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Registrar el cargador automático de Composer...
require __DIR__.'/../vendor/autoload.php';

// Arrancar Laravel y manejar la petición...
$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
)->send();

$kernel->terminate($request, $response);
