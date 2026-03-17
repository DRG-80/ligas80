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
            ->pluck('id_jugador');// Saca los id solamente

        $jugadoresLibres = Jugador::whereNotIn('id', $idsJugadoresOcupados)
            ->get();

        return response()->json($jugadoresLibres);
    }

    // Obtener los jugadores fichados por otros equipos
    public function jugadoresEquipo($idLiga, $idEquipo)
    {

        $jugadoresOtrosEquipos = JugadoresEquipo::with(['jugador', 'equipo'])
            ->where('id_liga', $idLiga)
            ->whereNotNull('id_equipo')
            ->where('id_equipo', '!=', $idEquipo)
            ->get();


        return response()->json($jugadoresOtrosEquipos);
    }

    // Fichar un jugador para un equipo
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

    // Obteenr los jugadores del equipo elegido por el usuario
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



        // Sacamos la alineación
        $alineacion = is_string($equipoB->alineacion) ? json_decode($equipoB->alineacion, true) : $equipoB->alineacion;


        $lineas = ['portero', 'defensas', 'medios', 'delanteros'];


        // Sacamos al jugador de la alineación
        // Se recorre cada posicion
        foreach ($lineas as $linea) {
            if (isset($alineacion[$linea]) && is_array($alineacion[$linea])) {


                // Filtra y mete a todos los jugadores cuyo id no sea el de $request->id_jugador
                $alineacion[$linea] = array_filter($alineacion[$linea], function ($idAlineado) use ($request) {
                    return $idAlineado != $request->id_jugador;
                });


                $alineacion[$linea] = array_values($alineacion[$linea]);
            }
        }




        // Obtenemos la posición del jugador clausulado
        $jugador = Jugador::where('id', $request->id_jugador)->first();
        $posicion = $jugador->posicion;

        $idLiga = $request->id_liga;


        // Se busca un nuevo jugador aleatorio libre de la misma posición, y que pueda ser pagado
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

            // Se realiza el fichaje
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



            // Se mete al nuevo jugador en la alineación en su posición
            if ($claveSustitucion && isset($alineacion[$claveSustitucion])) {
                $alineacion[$claveSustitucion][] = [$nuevoJugadorLibre->id,];
            }
        }



        // Se actualiza la media
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
        // Al vender, recuperas un 75% del valor del jugador
        $equipo->presupuesto += ($precio * 0.75);


        // Lo sacamos de la alineación
        $alineacion = is_string($equipo->alineacion) ? json_decode($equipo->alineacion, true) : $equipo->alineacion;
        $lineas = ['portero', 'defensas', 'medios', 'delanteros'];

        foreach ($lineas as $linea) {
            if (isset($alineacion[$linea]) && is_array($alineacion[$linea])) {


                //Pasan el filtro los que no tengan el id del jugador
                $alineacion[$linea] = array_filter($alineacion[$linea], function ($jugadorAlineado) use ($idJugador) {


                    return $jugadorAlineado['id'] != $idJugador;

                });

                // Se guarda la alineación sin el jugador
                $alineacion[$linea] = array_values($alineacion[$linea]);
            }
        }


        // Se actualiza la media
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
