<?php

use App\Http\Controllers\JugadorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;



Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

//Jugadores
Route::get('/jugadores', [JugadorController::class, 'index'])->name('jugador.index');
Route::post('jugadores', [JugadorController::class, 'store'])->name('jugador.store'); {};
Route::delete('/jugadores/{id}', [JugadorController::class, 'destroy'])->name('jugador.destroy'); {};
Route::put('/jugadores/{id}', [JugadorController::class, 'update']);
