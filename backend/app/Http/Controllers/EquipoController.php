<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use Illuminate\Http\Request;

class EquipoController extends Controller
{
    public function index()
    {

        $equipos = Equipo::join('users', 'equipo.id_usuario', '=', 'users.id')
            ->select(
                'equipo.*',
                'users.name as nombre_creador'
            )
            ->get();

        return response()->json($equipos);
    }



    public function store(Request $request)
    {

        // Valida que no haya un equipo con mismo nombre
        $request->validate([
            'nombre' => 'required|unique:equipo,nombre',
            'id_creador' => 'required'
        ], [

            'nombre.unique' => 'Ya existe un equipo registrado con ese nombre.',
            'nombre.required' => 'El nombre del equipo es obligatorio.'
        ]);


        $equipo = new Equipo();
        $equipo->id_usuario = $request->id_creador;
        $equipo->nombre = $request->nombre;
        $equipo->n_usos = 0;
        $equipo->save();

        return response()->json($equipo);
    }




    public function update(Request $request, $id)
    {
        $equipo = Equipo::findOrFail($id);

        $request->validate([
            'nombre' => 'required|unique:equipo,nombre,' . $id,
        ], [
            'nombre.required' => 'El nombre del equipo es obligatorio.',
            'nombre.unique' => 'Ya existe otro equipo con ese nombre.'
        ]);

        $equipo->update($request->all());

        return response()->json($equipo);
    }

    public function destroy($id)
    {

        $equipo = Equipo::findOrFail($id);
        $equipo->delete();
        return response()->json(['message' => 'Equipo eliminado correctamente'], 200);
    }

    // Función para obtener los equipos creados por el usuario
    public function misEquipos($id)
    {

        $equipos = Equipo::where('equipo.id_usuario', $id)->get();

        return response()->json($equipos);
    }
}
