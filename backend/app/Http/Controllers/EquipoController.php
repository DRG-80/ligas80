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

        $request->validate([
            'nombre' => 'required',
            'id_creador' => 'required'

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
            'nombre' => 'required',

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

    public function misEquipos($id)
    {

        $equipos = Equipo::where('equipo.id_usuario', $id)->get();

        return response()->json($equipos);
    }
}
