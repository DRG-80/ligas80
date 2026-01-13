<?php

namespace App\Http\Controllers;

use App\Models\Liga;
use Illuminate\Http\Request;
use App\Models\LigaEquipo;


class LigaEquipoController extends Controller
{
    public function index($id)
    {

        $ligas = LigaEquipo::where('id_liga', $id)

            ->join('equipo', 'liga_equipos.id_equipo', '=', 'equipo.id')
            ->select(
                'liga_equipos.*',
                'equipo.nombre as nombre_equipo',
                'equipo.n_usos'
            )
            ->get();

        return response()->json($ligas);
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
}


