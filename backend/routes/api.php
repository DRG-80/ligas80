<?php

use App\Http\Controllers\JugadorController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\LigaController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;



Route::middleware(['auth:sanctum'])->group(function () {

    // 1. Obtener usuario actual
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // 2. Jugadores
    Route::get('/jugadores', [JugadorController::class, 'index'])->name('jugador.index');
    Route::post('/jugadores', [JugadorController::class, 'store'])->name('jugador.store');
    Route::delete('/jugadores/{id}', [JugadorController::class, 'destroy'])->name('jugador.destroy');
    Route::put('/jugadores/{id}', [JugadorController::class, 'update'])->name('jugador.update');

    // 3. Equipos
    Route::get('/equipos', [EquipoController::class, 'index'])->name('equipo.index');
    Route::get('/equipos/misEquipos/{id}', [EquipoController::class, 'misEquipos'])->name('equipo.misEquipos');
    Route::post('/equipos', [EquipoController::class, 'store'])->name('equipo.store');
    Route::delete('/equipos/{id}', [EquipoController::class, 'destroy'])->name('equipo.destroy');
    Route::put('/equipos/{id}', [EquipoController::class, 'update'])->name('equipo.update');

    // 4. Ligas
    // He corregido los nombres (name) que tenias copiados de 'equipo'
    Route::get('/ligas', [LigaController::class, 'index'])->name('liga.index');
    Route::get('/ligas/misLigas', [LigaController::class, 'misLigas'])->name('liga.misLigas');
    Route::post('/ligas', [LigaController::class, 'store'])->name('liga.store');
    Route::delete('/ligas/{id}', [LigaController::class, 'destroy'])->name('liga.destroy');
    Route::put('/ligas/{id}', [LigaController::class, 'update'])->name('liga.update');

});
