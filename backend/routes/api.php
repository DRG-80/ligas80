<?php

use App\Http\Controllers\JugadorController;
use App\Http\Controllers\EquipoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;



Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

//Jugadores
Route::get('/jugadores', [JugadorController::class, 'index'])->name('jugador.index');
Route::post('/jugadores', [JugadorController::class, 'store'])->name('jugador.store'); {};
Route::delete('/jugadores/{id}', [JugadorController::class, 'destroy'])->name('jugador.destroy'); {};
Route::put('/jugadores/{id}', [JugadorController::class, 'update']);

//Equipos
Route::get('/equipos', [EquipoController::class, 'index'])->name('equipo.index');
Route::get('/equipos/misEquipos', [EquipoController::class, 'misEquipos'])->name('equipo.misEquipos');
Route::post('/equipos', [EquipoController::class, 'store'])->name('equipo.store'); {};
Route::delete('/equipos/{id}', [EquipoController::class, 'destroy'])->name('equipo.destroy'); {};
Route::put('/equipos/{id}', [EquipoController::class, 'update']);
