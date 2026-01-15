<?php

namespace App\Http\Controllers;

use App\Models\Liga;
use Illuminate\Http\Request;
use App\Models\LigaEquipo;


class LigaEquipoController extends Controller
{
    public function index($id)
    {
        $equiposDisponibles = LigaEquipo::where('id_liga', $id)
            ->join('equipo', 'liga_equipos.id_equipo', '=', 'equipo.id')
            ->select(
                'liga_equipos.*',
                'equipo.nombre as nombre_equipo'
            )
            ->get();

        return response()->json($equiposDisponibles);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_liga' => 'required|exists:liga,id',
            'equipos_ids' => 'required|array'
        ]);


        $liga = Liga::findOrFail($request->id_liga);


        if ($liga->n_equipos >= 20) {
            return response()->json(['error' => 'La liga ya está completa (Máx. 20)'], 422);
        }


        $equiposNuevos = [];
        foreach ($request->equipos_ids as $idEquipo) {
            $yaExiste = LigaEquipo::where('id_liga', $liga->id)
                ->where('id_equipo', $idEquipo)
                ->exists();
            if (!$yaExiste) {
                $equiposNuevos[] = $idEquipo;
            }
        }


        $cantidadNuevos = count($equiposNuevos);

        if (($liga->n_equipos + $cantidadNuevos) > 20) {
            return response()->json([
                'error' => "No caben tantos equipos. Espacios libres: " . (20 - $liga->n_equipos)
            ], 422);
        }


        $guardados = [];
        foreach ($equiposNuevos as $idEquipo) {
            $inscripcion = new LigaEquipo();
            $inscripcion->id_liga = $liga->id;
            $inscripcion->id_equipo = $idEquipo;

            $inscripcion->elegido = 0;
            $inscripcion->media = 0;
            $inscripcion->presupuesto = 150000000;

            $inscripcion->save();
            $guardados[] = $inscripcion;
        }


        if ($cantidadNuevos > 0) {
            $liga->n_equipos += $cantidadNuevos;
            $liga->save();
        }

        return response()->json([
            'message' => 'Equipos guardados correctamente',
            'data' => $guardados
        ]);
    }

    public function hayEquipoElegido($idLiga)
    {

        $existe = LigaEquipo::where('id_liga', $idLiga)
            ->where('elegido', 1)
            ->exists();

        return $existe;
    }

    public function obtenerEquipoElegido($id_liga)
    {
        $equipo = LigaEquipo::where('id_liga', $id_liga)
            ->where('elegido', 1)

            ->join('equipo', 'liga_equipos.id_equipo', '=', 'equipo.id')

            ->select(
                'liga_equipos.id_equipo',
                'equipo.nombre as nombre_equipo'
            )
            ->first();

        return response()->json($equipo);
    }

    public function elegirEquipo(Request $request, $idLiga)
    {
        $request->validate([
            'id_equipo' => 'required|integer'
        ]);


        $eleccion = LigaEquipo::where('id_liga', $idLiga)
            ->where('id_equipo', $request->id_equipo)
            ->firstOrFail();


        if ($eleccion->elegido == 1) {
            return response()->json(['message' => 'Este equipo ya ha sido elegido por otro usuario'], 409);
        }


        $eleccion->elegido = 1;



        $eleccion->save();

        return response()->json(['message' => 'Equipo elegido correctamente', 'data' => $eleccion]);
    }

}


