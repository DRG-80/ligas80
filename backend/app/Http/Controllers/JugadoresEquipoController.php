<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\Jugador;
use App\Models\LigaEquipo;
use Illuminate\Http\Request;
use App\Models\JugadoresEquipo;


class JugadoresEquipoController extends Controller
{

    public function index($idLiga)
    {

        $idsJugadoresOcupados = JugadoresEquipo::where('id_liga', $idLiga)
            ->pluck('id_jugador');

        $jugadoresLibres = Jugador::whereNotIn('id', $idsJugadoresOcupados)
            ->get();

        return response()->json($jugadoresLibres);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_liga' => 'required|exists:liga,id',
            'id_jugador' => 'required|exists:jugador,id',
            'id_equipo' => 'required|exists:equipo,id',
        ]);


        $jugador = Jugador::findOrFail($request->id_jugador);


        $equipoEnLiga = LigaEquipo::where('id_equipo', $request->id_equipo)
            ->where('id_liga', $request->id_liga)
            ->firstOrFail();


        if ($equipoEnLiga->presupuesto < $jugador->precio) {
            return response()->json(['message' => 'No tienes suficiente presupuesto.'], 422);
        }


        $equipoEnLiga->presupuesto -= $jugador->precio;
        $equipoEnLiga->save();


        $jugadorEquipo = new JugadoresEquipo();
        $jugadorEquipo->id_liga = $request->id_liga;
        $jugadorEquipo->id_jugador = $request->id_jugador;
        $jugadorEquipo->id_equipo = $request->id_equipo;


        $jugadorEquipo->clausula = $jugador->precio * 2;



        $jugadorEquipo->save();

        return response()->json([
            'message' => 'Jugador fichado correctamente',
            'clausula' => $jugadorEquipo->clausula,
            'presupuesto_restante' => $equipoEnLiga->presupuesto
        ]);
    }

    public function obtenerMisJugadores($idLiga, $idEquipo)
    {
        $jugadores = JugadoresEquipo::where('id_liga', $idLiga)
            ->where('id_equipo', $idEquipo)

            ->join('jugador', 'jugadores_equipo.id_jugador', '=', 'jugador.id')
            ->select(
                'jugadores_equipo.*',
                'jugador.nombre',
                'jugador.apellidos',
                'jugador.posicion',
                'jugador.media',
                'jugador.precio as valor_mercado'
            )
            ->get();

        return response()->json($jugadores);
    }

}
