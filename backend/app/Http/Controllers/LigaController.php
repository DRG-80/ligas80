<?php

namespace App\Http\Controllers;

use App\Models\LigaEquipo;
use Illuminate\Http\Request;
use App\Models\Liga;


class LigaController extends Controller
{
    public function index(){
        $ligas = Liga::all();

        return response()->json($ligas);
    }



    public function store(Request $request)
    {

        $request->validate([
            'nombre' => 'required',
            'id_creador' => 'required'
        ]);

        $liga = new Liga();

        $liga->nombre = $request->nombre;
        $liga->id_usuario = $request->id_creador;


        $liga->n_equipos = 0;
        $liga->iniciada = false;
        $liga->jornada = 0;


        $liga->save();

        return response()->json($liga);

    }




    public function update(Request $request, $id)
    {

        $liga = Liga::findOrFail($id);

        $request->validate([
            'nombre' => 'required',

        ]);
        $liga->update($request->all());
        return response()->json($liga);
    }

    public function destroy($id)
    {

        $liga = Liga::findOrFail($id);
        $liga->delete();
        return response()->json(['message' => 'Liga eliminada correctamente'], 200);
    }

    public function misLigas($id)
    {
        $ligas = Liga::where('id_usuario', $id)->get();
        return response()->json($ligas);


    }

    public function perteneceLigaAlUsuario($id_liga,$id_usuario)
    {
        $pertenece = Liga::where('id', $id_liga)
            ->where('id_usuario', $id_usuario)
            ->exists();

        return $pertenece;
    }

    public function obtenerDatosLiga($idLiga)
    {
        $datos = Liga::where('id', $idLiga)

            ->select('iniciada', 'enfrentamientos', 'jornada', 'posiciones','resultados')
            ->first();

        return response()->json($datos);
    }




}
