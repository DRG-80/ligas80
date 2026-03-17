<?php

namespace App\Http\Controllers;

use App\Models\Jugador;
use App\Models\JugadoresEquipo;
use App\Models\Liga;
use Illuminate\Http\Request;
use App\Models\LigaEquipo;


class LigaEquipoController extends Controller
{

    // Equipos que pertenecen a una liga
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
            // Comprueba que no estén ya
            $yaExiste = LigaEquipo::where('id_liga', $liga->id)
                ->where('id_equipo', $idEquipo)
                ->exists();
            if (!$yaExiste) {
                $equiposNuevos[] = $idEquipo;
            }
        }

        // Comprobar que los nuevos mas lo que habia no sea mayor que 20
        $cantidadNuevos = count($equiposNuevos);

        if (($liga->n_equipos + $cantidadNuevos) > 20) {
            return response()->json([
                'error' => "No caben tantos equipos. Espacios libres: " . (20 - $liga->n_equipos)
            ], 422);
        }


        $guardados = [];
        // Se inscribien en la liga
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


        // Se guarda
        if ($cantidadNuevos > 0) {
            $liga->n_equipos += $cantidadNuevos;
            $liga->save();
        }

        return response()->json([
            'message' => 'Equipos guardados correctamente',
            'data' => $guardados
        ]);
    }

    // Comprobar si hay un equipo elegido
    public function hayEquipoElegido($idLiga)
    {

        $existe = LigaEquipo::where('id_liga', $idLiga)
            ->where('elegido', 1)
            ->exists();

        return $existe;
    }

    // Devuelve el equipo elegido
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

    // Obtiene el presupuesto
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

    // Función para elegir a un equipo
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

        // Buscamos la inscripción exacta del equipo en esa liga.
        $inscripcion = LigaEquipo::where('id_liga', $request->id_liga)
            ->where('id_equipo', $request->id_equipo)
            ->firstOrFail();


        // Fusionamos los arrays de las distintas líneas en uno de titulares.
        // El operador (?? []) previene errores fatales de tipo 'null' si el Frontend envía alguna línea vacía.

        $titulares = array_merge(
            $request->portero ?? [],
            $request->defensas ?? [],
            $request->medios ?? [],
            $request->delanteros ?? []
        );

       // Extraemos la media
        $valoresMedia = array_column($titulares, 'media');


        // Sumamos todas las medias extraídas.
        $sumaTotal = array_sum($valoresMedia);


        $mediaCalculada = count($valoresMedia) > 0 ? round($sumaTotal / 11, 2) : 0;

        // Estructura para el json
        $alineacion = [
            'portero'    => $request->portero,
            'defensas'   => $request->defensas,
            'medios'     => $request->medios,
            'delanteros' => $request->delanteros,
        ];



        $inscripcion->alineacion = $alineacion;
        $inscripcion->media = $mediaCalculada;

        $inscripcion->update();

        return response()->json(['message' => 'Alineación guardada correctamente']);
    }

    public function obtenerAlineacion($idLiga, $idEquipo)
    {

        $inscripcion = LigaEquipo::where('id_liga', $idLiga)
            ->where('id_equipo', $idEquipo)
            ->first();

        // Extraemos el JSON de la alineación. Si es nuevo o nulo, inicializamos un array vacío
        $datosGuardados = ($inscripcion && !empty($inscripcion->alineacion))
            ? $inscripcion->alineacion
            : [];


        // Usamos array_column para sacar solo las IDs de los objetos JSON anidados
        $porteroIds    = array_column($datosGuardados['portero'] ?? [], 'id');
        $defensasIds   = array_column($datosGuardados['defensas'] ?? [], 'id');
        $mediosIds     = array_column($datosGuardados['medios'] ?? [], 'id');
        $delanterosIds = array_column($datosGuardados['delanteros'] ?? [], 'id');


        // Obtenemos un array plano (pluck) con los IDs de todos los jugadores
        $todosMisJugadores = JugadoresEquipo::where('id_liga', $idLiga)
            ->where('id_equipo', $idEquipo)
            ->pluck('id_jugador')
            ->toArray();


        // Agrupamos todos los titulares guardados en un solo array
        $titularesIds = array_merge($porteroIds, $defensasIds, $mediosIds, $delanterosIds);

        // Obtener el banquillo
        $idsBanquilloReal = array_diff($todosMisJugadores, $titularesIds);


        return response()->json([

            // Filtro extra para quitar a jugadores que ya no estén en todosMisJugadores
            'portero'    => Jugador::whereIn('id', $porteroIds)->whereIn('id', $todosMisJugadores)->get(),
            'defensas'   => Jugador::whereIn('id', $defensasIds)->whereIn('id', $todosMisJugadores)->get(),
            'medios'     => Jugador::whereIn('id', $mediosIds)->whereIn('id', $todosMisJugadores)->get(),
            'delanteros' => Jugador::whereIn('id', $delanterosIds)->whereIn('id', $todosMisJugadores)->get(),

            // array_values resetea las claves del array asociativo que deja array_diff
            'banquillo'  => Jugador::whereIn('id', array_values($idsBanquilloReal))->get(),
        ]);
    }

    public function obtenerAlineaciones($idLiga)
    {

        $alineaciones = LigaEquipo::where('id_liga', $idLiga)
            ->select('id_equipo', 'alineacion')
            ->get();


        $alineaciones->transform(function ($equipo) {


            // Decodificamos
            if (!empty($equipo->alineacion) && is_string($equipo->alineacion)) {
                $equipo->alineacion = json_decode($equipo->alineacion);
            }

            if (empty($equipo->alineacion)) {
                $equipo->alineacion = null;
            }


            return $equipo;
        });

        return response()->json($alineaciones);
    }

    public function simularFichajes(Request $request) {

        // Limite de tiempo
        set_time_limit(1200);
        $request->validate([
            'id_liga' => 'required|exists:liga,id'
        ]);

        $idLiga = $request->id_liga;


        $equipos = LigaEquipo::where('id_liga', $idLiga)
            ->whereNull('alineacion')
            ->get();


        $jugadoresLibres = Jugador::whereNotIn('id', function($query) use ($idLiga) {
            $query->select('id_jugador')
                ->from('jugadores_equipo')
                ->where('id_liga', $idLiga);
        })->get();


        $esquema = [
            'POR' => 1,
            'DEF' => 4,
            'MC'  => 3,
            'DEL' => 3
        ];

        // Recorremos equipo a equipo
        foreach ($equipos as $equipo) {

            //recorremos el esquema
            foreach ($esquema as $posicionBuscada => $cantidadNecesaria) {

                $fichadosEnPosicion = 0;



                // Mientras que no cumpla el cupo de cada posición
                while ($fichadosEnPosicion < $cantidadNecesaria) {




                    // Filtra por posicion y presupuesto
                    $candidatos = $jugadoresLibres->filter(function ($j) use ($posicionBuscada, $equipo) {

                        return trim($j->posicion) === $posicionBuscada && $j->precio <= $equipo->presupuesto && ($equipo->presupuesto-$j->precio)!=0;
                    });

                    // Si no hay se sale
                    if ($candidatos->isEmpty()) {

                        break;
                    }

                    // Se un índice aleatorio
                    $indiceAleatorio = $candidatos->keys()->random();
                    $jugador = $jugadoresLibres[$indiceAleatorio];

                    // Se hace el fichaje
                    $nuevoFichaje = new JugadoresEquipo();
                    $nuevoFichaje->id_liga = $idLiga;
                    $nuevoFichaje->id_jugador = $jugador->id;
                    $nuevoFichaje->id_equipo = $equipo->id_equipo;
                    $nuevoFichaje->clausula = $jugador->precio * 2;
                    $nuevoFichaje->save();


                    $equipo->presupuesto -= $jugador->precio;
                    $equipo->save();


                    $fichadosEnPosicion++;

                    // Se saca al jugador de los jugadores libres
                    $jugadoresLibres->forget($indiceAleatorio);
                }
            }


            $plantilla = JugadoresEquipo::where('id_equipo', $equipo->id_equipo)
                ->where('id_liga', $idLiga)
                ->join('jugador', 'jugadores_equipo.id_jugador', '=', 'jugador.id')
                ->select('jugador.id', 'jugador.posicion', 'jugador.media')
                ->orderBy('jugador.media', 'desc')
                ->get();

            $alineacion = [
                'portero' => [], 'defensas' => [], 'medios' => [], 'delanteros' => [], 'banquillo' => []
            ];


            // Ponemos a los jugadores en su posición
            foreach ($plantilla as $j) {
                if ($j->posicion == 'POR') {
                    $alineacion['portero'][] = $j->id;
                }
                elseif ($j->posicion == 'DEF') {
                    $alineacion['defensas'][] = $j->id;
                }
                elseif ($j->posicion == 'MC') {
                    $alineacion['medios'][] = $j->id;
                }
                elseif ($j->posicion == 'DEL') {
                    $alineacion['delanteros'][] = $j->id;
                }
                else {
                    $alineacion['banquillo'][] = $j->id;
                }
            }

            // Calculamos media
            $mediaEquipo = $plantilla->count() > 0 ? round($plantilla->avg('media'), 2) : 0;


            $equipo->alineacion = $alineacion;
            $equipo->media = $mediaEquipo;
            $equipo->save();
        }

        return response()->json(['message' => 'Simulación completada con éxito']);
    }

}


