<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
use App\Models\LigaEquipo;
use Illuminate\Http\Request;
use App\Models\Liga;
use Termwind\Components\Li;


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

    // Obtener las ligas de un usuaro
    public function misLigas($id)
    {
        $ligas = Liga::where('id_usuario', $id)->get();
        return response()->json($ligas);


    }

    // Comprobar si una liga le pertenece al usuario
    public function perteneceLigaAlUsuario($id_liga,$id_usuario)
    {
        $pertenece = Liga::where('id', $id_liga)
            ->where('id_usuario', $id_usuario)
            ->exists();

        return $pertenece;
    }

    // Función para obtener los datos de la liga
    public function obtenerDatosLiga($idLiga)
    {
        $datos = Liga::with(['equipos' => function($query) {

            $query->select('equipo.id', 'equipo.nombre');
        }])
            ->where('id', $idLiga)

            ->select('id', 'iniciada', 'enfrentamientos', 'jornada', 'posiciones', 'resultados')
            ->first();

        return response()->json($datos);
    }

    public function generarCalendario($idLiga)
    {


        $liga = Liga::findOrFail($idLiga);
        $equiposLiga = LigaEquipo::where('id_liga', $idLiga)->get();
        $encuentros =[];
        //Mezclar la lista
        $equiposMezclados = $equiposLiga->shuffle();

        //Convierte el objeto a un array de los id
        $equiposArray = $equiposMezclados->pluck('id_equipo')->values()->toArray();

        $totalEquipos = count($equiposArray);
        $partidosPorJornada = $totalEquipos / 2;

        //Primera vuelta
        for ($i = 0; $i < 19; $i++) {

            $partidosDeEstaJornada = [];


            for ($cruce = 0; $cruce < $partidosPorJornada; $cruce++) {

                $equipoA = $equiposArray[$cruce];
                $equipoB = $equiposArray[$totalEquipos - 1 - $cruce];


                //Alternar entre local y visitante
                if ($i % 2 === 0) {
                    $partidosDeEstaJornada[] = $equipoA . '-' . $equipoB;
                } else {
                    $partidosDeEstaJornada[] = $equipoB . '-' . $equipoA;
                }
            }


            $encuentros[$i + 1] = $partidosDeEstaJornada;



            //Sacamos el último equipo de la lista
            $ultimoEquipo = array_pop($equiposArray);

            //Insertamos en la posicion  del array el ultimo equipo para que giren
            array_splice($equiposArray, 1, 0, $ultimoEquipo);

        }

        //Segunda vuelta
        for ($i = 1; $i <= 19; $i++) {

            $partidosIda = $encuentros[$i];
            $partidosVuelta = [];

            foreach ($partidosIda as $partidoString) {


                $equipos = explode('-', $partidoString);




                $partidoVuelta = $equipos[1]. '-' . $equipos[0];

                $partidosVuelta[] = $partidoVuelta;
            }

            $encuentros[$i + 19] = $partidosVuelta;
        }

        $jsonEncuentros = json_encode($encuentros);

        $liga->enfrentamientos=$jsonEncuentros;
        $liga->save();





    }

    // Función para iniciar la liga
    public function iniciarLiga($idLiga)
    {

        $liga = Liga::findOrFail($idLiga);
        $liga->iniciada=1;
        $liga->jornada=1;
        $liga->save();


        $equiposUso = Equipo::whereIn('id', function($query) use ($idLiga) {
            $query->select('id_equipo')
                ->from('liga_equipos')
                ->where('id_liga', $idLiga);
        })->get();

        Equipo::whereIn('id', $equiposUso->pluck('id'))->increment('n_usos');


    }

    // Función para simular las jornadas
    public function simularJornada($idLiga)
    {

        $ligaEquipo=LigaEquipo::where('id_liga',$idLiga)->where('elegido',1)->first();

        $alineacion = is_string($ligaEquipo->alineacion) ? json_decode($ligaEquipo->alineacion, true) : $ligaEquipo->alineacion;
        $totalJugadoresAlineados = array_sum(array_map('count', $alineacion));

        // Si el usuario no tiene 11 jugadores alineados
        if ($totalJugadoresAlineados != 11) {
            return response()->json([
                'message' => 'Debes alinear exactamente a 11 jugadores para poder continuar.',
                'actuales' => $totalJugadoresAlineados
            ], 422);
        }


        $liga = Liga::findOrFail($idLiga);
        $idsEquipos = LigaEquipo::where('id_liga', $idLiga)->pluck('id_equipo');
        $enfrentamientos = $liga->enfrentamientos;
        $jornada = $liga->jornada;
        $resultados[$jornada]=[];
        $puntos=[];


        // Parseo
        if (is_string($enfrentamientos)) {
            $enfrentamientos = json_decode($enfrentamientos, true);
        }

        // Recorre todos los enfrentamientos
        foreach ($enfrentamientos as $numJornada => $partidos){

            // Si es la jornada que toca
            if ($numJornada == $jornada ){

                // Recorre los encuentros
                foreach ($partidos as $encuentro){

                    $equipos = explode('-', $encuentro);

                    $equipoLocal=LigaEquipo::where('id_equipo', $equipos[0])->first();
                    $equipoVisitante=LigaEquipo::where('id_equipo', $equipos[1])->first();
                    $golLocal=0;
                    $golVisitante=0;



                    // Bucle para simular los goles
                    for ($i = 0; $i < 4; $i++) {


                        $probabilidadGolL = rand(1, 100);

                        // Probabilidades
                        switch (true) {
                            case ($equipoLocal->media >= 90):

                                if ($probabilidadGolL <= 65) $golLocal++;
                                break;

                            case ($equipoLocal->media >= 85):

                                if ($probabilidadGolL <= 60) $golLocal++;
                                break;

                            case ($equipoLocal->media >= 80):

                                if ($probabilidadGolL <= 55) $golLocal++;
                                break;

                            case ($equipoLocal->media >= 75):

                                if ($probabilidadGolL <= 50) $golLocal++;
                                break;

                            case ($equipoLocal->media >= 70):

                                if ($probabilidadGolL <= 45) $golLocal++;
                                break;

                            case ($equipoLocal->media >= 65):

                                if ($probabilidadGolL <= 40) $golLocal++;
                                break;


                            default:

                                if (rand(1, 100) <= 30) $golLocal++;
                                break;
                        }

                        $probabilidadGolV = rand(1, 100);

                        switch (true) {
                            case ($equipoVisitante->media >= 90):

                                if ($probabilidadGolV <= 65) $golVisitante++;
                                break;

                            case ($equipoVisitante->media >= 85):

                                if ($probabilidadGolV <= 60) $golVisitante++;
                                break;

                            case ($equipoVisitante->media >= 80):

                                if ($probabilidadGolV <= 55) $golVisitante++;
                                break;

                            case ($equipoVisitante->media >= 75):

                                if ($probabilidadGolV <= 50) $golVisitante++;
                                break;

                            case ($equipoVisitante->media >= 70):
                                if ($probabilidadGolV <= 45) $golVisitante++;
                                break;

                            case ($equipoVisitante->media >= 65):
                                if ($probabilidadGolV <= 40) $golVisitante++;
                                break;

                            default:

                                if (rand(1, 100) <= 30) $golVisitante++;
                                break;
                        }


                    }

                    $puntosL=0;
                    $puntosV=0;

                    // Puntuaciones
                    if ($golLocal>$golVisitante){
                        $puntosL=3;
                    }elseif ($golVisitante>$golLocal){
                        $puntosV=3;
                    }else{
                        $puntosL=1;
                        $puntosV=1;

                    }

                    $resultados[$jornada][$encuentro]=$golLocal.'-'.$golVisitante;
                    $puntos[$equipoLocal->id_equipo]=$puntosL.';'.$golLocal.';'.$golVisitante;
                    $puntos[$equipoVisitante->id_equipo]=$puntosV.';'.$golVisitante.';'.$golLocal;



                }

                break;
            }




        }

        $posiciones = $liga->posiciones ? json_decode($liga->posiciones, true) : [];

        // Si es la primera vez
        if ($posiciones==null){
            $posiciones=[];

            foreach ($idsEquipos as $equipo){

                // Se cogen los puntos del equipo
                $datosJornada=explode(';', $puntos[$equipo]);

                // Se cogen los datos
                $puntosEquipo = (int)$datosJornada[0];
                $golesFavor= (int)$datosJornada[1];
                $golesContra= (int)$datosJornada[2];
                $diferenciaGoles=$golesFavor-$golesContra;
               $V=0;
               $E=0;
               $D=0;
                if ($puntosEquipo==3){
                   $V=1;
                }elseif ($puntosEquipo==1){
                   $E=1;
                }else{
                    $D=1;
                }



                // Se guarda con todos sus datos
                $posiciones[$equipo]=$puntosEquipo.';'.$V.';'.$E.';'.$D.';'.$golesFavor.';'.$golesContra.';'.$diferenciaGoles;

            }




        }else{

            foreach ($posiciones as $equipo  => $datosActualesStr){

                $datosJornada=explode(';', $puntos[$equipo]);

                $puntosEquipo = (int)$datosJornada[0];
                $golesFavor= (int)$datosJornada[1];
                $golesContra= (int)$datosJornada[2];

                $V=0;
                $E=0;
                $D=0;
                if ($puntosEquipo==3){
                    $V=1;
                }elseif ($puntosEquipo==1){
                    $E=1;
                }else{
                    $D=1;
                }

                $datosActuales = explode(';', $datosActualesStr);

                // Le suma los datos a los que ya tenía
                $puntosActuales  = (int)$datosActuales[0] + $puntosEquipo;
                $victorias       = (int)$datosActuales[1] + $V;
                $empates         = (int)$datosActuales[2] + $E;
                $derrotas        = (int)$datosActuales[3] + $D;
                $golesFavorActuales= (int)$datosActuales[4] + $golesFavor;
                $golesContraActuales= (int)$datosActuales[5] + $golesContra;
                $diferenciaGoles = $golesFavorActuales-$golesContraActuales;

                $posiciones[$equipo]= $puntosActuales.';'.$victorias.';'.$empates.';'.$derrotas.';'.$golesFavorActuales.';'.$golesContraActuales.';'.$diferenciaGoles;




            }

        }


        // Ordenar la clasificación
        uasort($posiciones, function ($a, $b) {


            $datosA = explode(';', $a);
            $datosB = explode(';', $b);

            $puntosA = (int)$datosA[0];
            $puntosB = (int)$datosB[0];


            $dgA = (int)$datosA[6];
            $dgB = (int)$datosB[6];

            //Orden desdendente, el comparador nave espacial hace ($puntosb<puntosa) devuelve -1 (sube el a  al tener mas puntos), si (puntosb>puntosa) devuelve 1 (baja el a  al tener menos puntos)
            if ($puntosA !== $puntosB) {
                return $puntosB <=> $puntosA;
            }

            //Diferencia de Goles (Mayor a menor)
            return $dgB <=> $dgA;
        });


        $liga->resultados=json_encode($resultados);
        $liga->posiciones=json_encode($posiciones);

        $liga->save();


    }

    // Obtener los resultados

    public function obtenerResultados($idLiga)
    {

        $liga = Liga::findOrFail($idLiga);
        $jornada = $liga->jornada;


        $historialResultados = is_string($liga->resultados)
            ? json_decode($liga->resultados, true)
            : ($liga->resultados ?? []);


        $resultados = $historialResultados[$jornada] ?? [];

        return response()->json($resultados);

    }

    // Terminar jornada
    public function terminarJornada($idLiga)
    {
        $liga = Liga::findOrFail($idLiga);


        if ($liga->jornada <= 38) {
            $liga->jornada++;
            $liga->save();
            return response()->json(['message' => 'Jornada avanzada correctamente']);
        }

        return response()->json(['message' => 'Liga finalizada'], 200);

    }



}
