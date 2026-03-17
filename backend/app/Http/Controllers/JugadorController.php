<?php

namespace App\Http\Controllers;


use App\Models\Jugador;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;


class JugadorController extends Controller
{
    public function index(){
        $jugadores = Jugador::all();

        return response()->json($jugadores);
    }



    public function store(Request $request)
    {
        // Valida que no haya un jugador con mismo nombre y apellidos
        $request->validate([
            'nombre' => [
                'required',

                Rule::unique('jugador')->where(function ($query) use ($request) {
                    return $query->where('apellidos', $request->apellidos);
                })
            ],
            'apellidos' => 'required',
            'precio' => 'numeric'
        ], [
            'nombre.unique' => 'Ya existe un jugador con este mismo nombre y apellidos.',
            'nombre.required' => 'El nombre es obligatorio.',
            'apellidos.required' => 'Los apellidos son obligatorios.',
            'precio.numeric' => 'El precio debe ser un número.'
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
            'nombre' => [
                'required',
                Rule::unique('jugador', 'nombre')
                    ->where(function ($query) use ($request) {
                        return $query->where('apellidos', $request->apellidos);
                    })
                    ->ignore($id)
            ],
            'apellidos' => 'required',
            'precio' => 'numeric'
        ], [
            'nombre.unique' => 'Ya existe otro jugador diferente con este mismo nombre y apellidos.',
            'nombre.required' => 'El nombre es obligatorio.',
            'apellidos.required' => 'Los apellidos son obligatorios.',
            'precio.numeric' => 'El precio debe ser numérico.'
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
