<?php

namespace App\Http\Controllers;

use App\Models\Jugador;
use App\Models\JugadoresEquipo;
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

    public function obtenerPresupuesto($idLiga, $idEquipo)
    {

        $inscripcion = LigaEquipo::where('id_liga', $idLiga)
            ->where('id_equipo', $idEquipo)
            ->select('presupuesto')
            ->firstOrFail();


        return response()->json([
            'presupuesto' => $inscripcion->presupuesto
        ]);
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

    public function guardarAlineacion(Request $request)
    {

        $inscripcion = LigaEquipo::where('id_liga', $request->id_liga)
            ->where('id_equipo', $request->id_equipo)
            ->firstOrFail();



        $titulares = array_merge(
            $request->portero ?? [],
            $request->defensas ?? [],
            $request->medios ?? [],
            $request->delanteros ?? []
        );


        $valoresMedia = array_column($titulares, 'media');


        $sumaTotal = array_sum($valoresMedia);


        $mediaCalculada = count($valoresMedia) > 0 ? round($sumaTotal / 11, 2) : 0;

        $alineacion = [
            'portero'    => $request->portero,
            'defensas'   => $request->defensas,
            'medios'     => $request->medios,
            'delanteros' => $request->delanteros,

        ];




        $inscripcion->alineacion = $alineacion;
        $inscripcion->media=$mediaCalculada;


        $inscripcion->update();

        return response()->json(['message' => 'Alineación guardada correctamente']);
    }

    public function obtenerAlineacion($idLiga, $idEquipo)
    {

        $inscripcion = LigaEquipo::where('id_liga', $idLiga)
            ->where('id_equipo', $idEquipo)
            ->first();


        $datosGuardados = ($inscripcion && !empty($inscripcion->alineacion))
            ? $inscripcion->alineacion
            : [];



        $porteroIds    = array_column($datosGuardados['portero'] ?? [], 'id');
        $defensasIds   = array_column($datosGuardados['defensas'] ?? [], 'id');
        $mediosIds     = array_column($datosGuardados['medios'] ?? [], 'id');
        $delanterosIds = array_column($datosGuardados['delanteros'] ?? [], 'id');

        $todosMisJugadores = JugadoresEquipo::where('id_liga', $idLiga)
            ->where('id_equipo', $idEquipo)
            ->pluck('id_jugador')
            ->toArray();


        $titularesIds = array_merge($porteroIds, $defensasIds, $mediosIds, $delanterosIds);


        $idsBanquilloReal = array_diff($todosMisJugadores, $titularesIds);



        return response()->json([
            'portero'    => Jugador::whereIn('id', $porteroIds)->whereIn('id', $todosMisJugadores)->get(),
            'defensas'   => Jugador::whereIn('id', $defensasIds)->whereIn('id', $todosMisJugadores)->get(),
            'medios'     => Jugador::whereIn('id', $mediosIds)->whereIn('id', $todosMisJugadores)->get(),
            'delanteros' => Jugador::whereIn('id', $delanterosIds)->whereIn('id', $todosMisJugadores)->get(),


            'banquillo'  => Jugador::whereIn('id', array_values($idsBanquilloReal))->get(),
        ]);
    }

}


