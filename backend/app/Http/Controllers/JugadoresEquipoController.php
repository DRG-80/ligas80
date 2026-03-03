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

    public function jugadoresEquipo($idLiga, $idEquipo)
    {

        $jugadoresOtrosEquipos = JugadoresEquipo::with(['jugador', 'equipo'])
            ->where('id_liga', $idLiga)
            ->whereNotNull('id_equipo')
            ->where('id_equipo', '!=', $idEquipo)
            ->get();


        return response()->json($jugadoresOtrosEquipos);
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

    public function clausularJugador(Request $request)
    {

        $request->validate([
            'id_liga' => 'required|exists:liga,id',
            'id_jugador' => 'required|exists:jugador,id',
            'id_equipo_a' => 'required|exists:equipo,id',
            'id_equipo_b' => 'required|exists:equipo,id',

        ]);


        $jugadorEquipo = JugadoresEquipo::where('id_liga', $request->id_liga)
            ->where('id_jugador', $request->id_jugador)
            ->where('id_equipo', $request->id_equipo_b)->first();

        $equipoA = LigaEquipo::where('id_liga', $request->id_liga)->where('id_equipo', $request->id_equipo_a)->first();
        $equipoB = LigaEquipo::where('id_liga', $request->id_liga)->where('id_equipo', $request->id_equipo_b)->first();

        if (!$jugadorEquipo || !$equipoA || !$equipoB) {
            return response()->json(['message' => 'Datos no encontrados.'], 404);
        }

        if ($equipoA->presupuesto < $jugadorEquipo->clausula) {
            return response()->json(['message' => 'No tienes suficiente presupuesto.'], 422);
        }

        $equipoA->presupuesto -= $jugadorEquipo->clausula;

        $equipoB->presupuesto += $jugadorEquipo->clausula;

        $jugadorEquipo->id_equipo = $request->id_equipo_a;



        $alineacion = is_string($equipoB->alineacion) ? json_decode($equipoB->alineacion, true) : $equipoB->alineacion;


        $lineas = ['portero', 'defensas', 'medios', 'delanteros'];


        foreach ($lineas as $linea) {
            if (isset($alineacion[$linea]) && is_array($alineacion[$linea])) {


                $alineacion[$linea] = array_filter($alineacion[$linea], function ($idAlineado) use ($request) {
                    return $idAlineado != $request->id_jugador;
                });


                $alineacion[$linea] = array_values($alineacion[$linea]);
            }
        }




        $jugador = Jugador::where('id', $request->id_jugador)->first();
        $posicion = $jugador->posicion;

        $idLiga = $request->id_liga;



        $nuevoJugadorLibre = Jugador::where('posicion', $posicion)
            ->where('precio', '<=', $equipoB->presupuesto)
            ->whereNotIn('id', function ($query) use ($idLiga) {

                $query->select('id_jugador')
                    ->from('jugadores_equipo')
                    ->where('id_liga', $idLiga);
            })
            ->inRandomOrder()
            ->first();



        if ($nuevoJugadorLibre && ($equipoB->presupuesto - $nuevoJugadorLibre->precio) >= 0) {

            $nuevoFichaje = new JugadoresEquipo();
            $nuevoFichaje->id_liga = $idLiga;
            $nuevoFichaje->id_equipo = $request->id_equipo_b;
            $nuevoFichaje->id_jugador = $nuevoJugadorLibre->id;
            $nuevoFichaje->clausula = $nuevoJugadorLibre->precio * 2;
            $nuevoFichaje->save();

            $equipoB->presupuesto -= $nuevoJugadorLibre->precio;

            $mapaPosiciones = [
                'POR' => 'portero',
                'DEF' => 'defensas',
                'MED' => 'medios',
                'MC'  => 'medios',
                'DEL' => 'delanteros'
            ];

            $claveSustitucion = $mapaPosiciones[$posicion] ?? null;



            if ($claveSustitucion && isset($alineacion[$claveSustitucion])) {
                $alineacion[$claveSustitucion][] = [$nuevoJugadorLibre->id,];
            }
        }




        $plantilla = JugadoresEquipo::with('jugador')
            ->where('id_equipo', $request->id_equipo_b)
            ->where('id_liga', $idLiga)
            ->get();


        $mediaEquipo = $plantilla->count() > 0 ? round($plantilla->avg('jugador.media'), 2) : 0;



        $equipoB->alineacion = json_encode($alineacion);
        $equipoB->media = $mediaEquipo;
        $equipoB->save();
        $equipoA->save();
        $jugadorEquipo->save();


        return response()->json(['message' => 'Jugador clausulado con éxito'], 200);
    }

    public function venderJugador($idLiga, $idEquipo, $idJugador)
    {

        $jugador = JugadoresEquipo::where('id_liga', $idLiga)
            ->where('id_equipo', $idEquipo)
            ->where('id_jugador', $idJugador)
            ->first();



        $equipo = LigaEquipo::where('id_liga', $idLiga)
        ->where('id_equipo', $idEquipo)
            ->first();


        $precio = Jugador::where('id', $idJugador)->value('precio');

        if (!$jugador || !$equipo || !$precio) {

            return response()->json(['message' => 'No se encontró el jugador o el equipo.'], 404);
        }


        $jugador->delete();
        $equipo->presupuesto += ($precio * 0.75);


        $alineacion = is_string($equipo->alineacion) ? json_decode($equipo->alineacion, true) : $equipo->alineacion;
        $lineas = ['portero', 'defensas', 'medios', 'delanteros'];

        foreach ($lineas as $linea) {
            if (isset($alineacion[$linea]) && is_array($alineacion[$linea])) {
                $alineacion[$linea] = array_filter($alineacion[$linea], function ($idAlineado) use ($idJugador) {
                    return $idAlineado != $idJugador;
                });
                $alineacion[$linea] = array_values($alineacion[$linea]);
            }
        }


        $plantilla = JugadoresEquipo::with('jugador')
            ->where('id_equipo', $idEquipo)
            ->where('id_liga', $idLiga)
            ->get();

        $mediaEquipo = $plantilla->count() > 0 ? round($plantilla->avg('jugador.media'), 2) : 0;


        $equipo->alineacion = $alineacion;
        $equipo->media = $mediaEquipo;
        $equipo->save();


        return response()->json([
            'message' => 'Jugador vendido con éxito.',

        ], 200);
    }


}
