<?php

use App\Http\Controllers\JugadorController;
use App\Http\Controllers\EquipoController;
use App\Http\Controllers\LigaController;
use App\Http\Controllers\LigaEquipoController;
use App\Http\Controllers\JugadoresEquipoController;


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
    Route::get('/ligas', [LigaController::class, 'index'])->name('liga.index');
    Route::get('/ligas/misLigas/{id}', [LigaController::class, 'misLigas'])->name('liga.misLigas');
    Route::get('/ligas/obtenerDatosLiga/{id}', [LigaController::class, 'obtenerDatosLiga'])->name('liga.misLigas');
    Route::post('/ligas', [LigaController::class, 'store'])->name('liga.store');
    Route::delete('/ligas/{id}', [LigaController::class, 'destroy'])->name('liga.destroy');
    Route::put('/ligas/{id}', [LigaController::class, 'update'])->name('liga.update');
    Route::put('/ligas/generarCalendario/{id}', [LigaController::class, 'generarCalendario'])->name('liga.update');
    Route::put('/ligas/iniciar/{id}', [LigaController::class, 'iniciarLiga'])->name('liga.update');
    Route::put('/ligas/simularJornada/{id}', [LigaController::class, 'simularJornada'])->name('liga.update');




    // 5. Ligas-Equipo
    Route::get('/ligasEquipo/{id}', [LigaEquipoController::class, 'index'])->name('ligaEquipo.index');
    Route::get('/ligasEquipo/obtenerEquipoElegido/{id}', [LigaEquipoController::class, 'obtenerEquipoElegido'])->name('ligaEquipo.index');
    Route::get('/ligasEquipo/obtenerPresupuesto/{id_liga}/{id_equipo}', [LigaEquipoController::class, 'obtenerPresupuesto'])->name('ligaEquipo.index');
    Route::get('/ligasEquipo/obtenerAlineacion/{id_liga}/{id_equipo}', [LigaEquipoController::class, 'obtenerAlineacion'])->name('ligaEquipo.index');


    Route::get('/ligasEquipo/hayEquipoElegido/{id}', [LigaEquipoController::class, 'hayEquipoElegido'])->name('ligaEquipo.hayEquipoElegido');
    Route::get('/ligasEquipo/perteneceLigaAlUsuario/{id_liga}/{id_usuario}', [LigaController::class, 'perteneceLigaAlUsuario'])->name('ligaEquipo.index');
    Route::get('/ligasEquipo/obtenerAlineaciones/{id}', [LigaEquipoController::class, 'obtenerAlineaciones'])->name('ligaEquipo.index');


    Route::post('/ligasEquipo', [LigaEquipoController::class, 'store'])->name('ligaEquipo.store');
    Route::post('/ligasEquipo/elegir/{id}', [LigaEquipoController::class, 'elegirEquipo'])->name('ligaEquipo.elegirEquipo');
    Route::put('/ligasEquipo/guardarAlineacion', [LigaEquipoController::class, 'guardarAlineacion'])->name('ligaEquipo.elegirEquipo');
    Route::put('/ligasEquipo/simularFichajes', [LigaEquipoController::class, 'simularFichajes'])->name('ligaEquipo.elegirEquipo');


    // 6. Jugadores-Equipo
    Route::get('/jugadoresEquipo/{id}', [JugadoresEquipoController::class, 'index'])->name('ligaEquipo.index');
    Route::get('/jugadoresEquipo/misJugadores/{idLiga}/{idEquipo}', [JugadoresEquipoController::class, 'obtenerMisJugadores'])->name('ligaEquipo.index');
    Route::post('/jugadoresEquipo', [JugadoresEquipoController::class, 'store'])->name('ligaEquipo.store');




});
