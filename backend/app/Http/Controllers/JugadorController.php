<?php

namespace App\Http\Controllers;


use App\Models\Jugador;
use Illuminate\Http\Request;


class JugadorController extends Controller
{
    public function index(){
        $jugadores = Jugador::all();

        return response()->json($jugadores);
    }



    public function store(Request $request)
    {

        $request->validate([
            'nombre' => 'required',
            'apellidos' => 'required',
            'precio' => 'numeric'
        ]);

        $jugador = new Jugador();
        $jugador->nombre = $request->nombre;
        $jugador->apellidos = $request->apellidos;
        $jugador->posicion = $request->posicion;
        $jugador->media = $request->media;
        $jugador->precio = $request->precio;
        $jugador->save();

        return response()->json($jugador);

    }




    public function update(Request $request, $id)
    {

        $jugador = Jugador::findOrFail($id);

        $request->validate([
            'nombre' => 'required',
            'apellidos' => 'required',
            'precio' => 'numeric'
        ]);
        $jugador->update($request->all());
        return response()->json($jugador);
    }

    public function destroy($id)
    {

        $jugador = Jugador::findOrFail($id);
        $jugador->delete();
        return response()->json(['message' => 'Jugador eliminado correctamente'], 200);
    }
}
