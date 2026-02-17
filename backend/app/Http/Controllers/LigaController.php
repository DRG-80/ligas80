<?php

namespace App\Http\Controllers;

use App\Models\Equipo;
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

    public function simularJornada($idLiga)
    {

        $liga = Liga::findOrFail($idLiga);
        $idsEquipos = LigaEquipo::where('id_liga', $idLiga)->pluck('id_equipo');
        $enfrentamientos = $liga->enfrentamientos;
        $jornada = $liga->jornada;
        $resultados[$jornada]=[];
        $puntos=[];

        if (is_string($enfrentamientos)) {
            $enfrentamientos = json_decode($enfrentamientos, true);
        }

        foreach ($enfrentamientos as $numJornada => $partidos){

            if ($numJornada == $jornada ){

                foreach ($partidos as $encuentro){

                    $equipos = explode('-', $encuentro);

                    $equipoLocal=LigaEquipo::where('id_equipo', $equipos[0])->first();
                    $equipoVisitante=LigaEquipo::where('id_equipo', $equipos[1])->first();
                    $golLocal=0;
                    $golVisitante=0;

                    for ($i = 0; $i < 2; $i++) {

                        if ($equipoLocal->media<=90 || $equipoVisitante->media<=90 ){

                            $probabilidad = rand(1, 100);

                            if ($probabilidad<=85 && $equipoLocal->media<=85){
                                $golLocal++;

                            }elseif ($probabilidad<=85 && $equipoVisitante->media<=85){
                                $golVisitante++;
                            }

                        }elseif ($equipoLocal->media<=85 || $equipoVisitante->media<=85){

                            $probabilidad = rand(1, 100);

                            if ($probabilidad<=80 && $equipoLocal->media<=80){
                                $golLocal++;

                            }elseif ($probabilidad<=80 && $equipoVisitante->media<=80){
                                $golVisitante++;
                            }

                        }elseif ($equipoLocal->media<=80 || $equipoVisitante->media<=80){

                            $probabilidad = rand(1, 100);

                            if ($probabilidad<=75 && $equipoLocal->media<=75){
                                $golLocal++;

                            }elseif ($probabilidad<=75 && $equipoVisitante->media<=75){
                                $golVisitante++;
                            }

                        }elseif ($equipoLocal->media<=75 || $equipoVisitante->media<=75){

                            $probabilidad = rand(1, 100);

                            if ($probabilidad<=50 && $equipoLocal->media<=50){
                                $golLocal++;

                            }elseif ($probabilidad<=50 && $equipoVisitante->media<=50){
                                $golVisitante++;
                            }

                        }elseif ($equipoLocal->media<=70 || $equipoVisitante->media<=70){

                            $probabilidad = rand(1, 100);

                            if ($probabilidad<=30 && $equipoLocal->media<=30){
                                $golLocal++;

                            }elseif ($probabilidad<=30 && $equipoVisitante->media<=30){
                                $golVisitante++;
                            }

                        }elseif ($equipoLocal->media<=65 || $equipoVisitante->media<=65){

                            $probabilidad = rand(1, 100);

                            if ($probabilidad<=25 && $equipoLocal->media<=25){
                                $golLocal++;

                            }elseif ($probabilidad<=25 && $equipoVisitante->media<=25){
                                $golVisitante++;
                            }

                        }else{
                            $probabilidad = rand(1, 100);

                            if ($probabilidad<=10 && $equipoLocal->media<=10){
                                $golLocal++;

                            }elseif ($probabilidad<=10 && $equipoVisitante->media<=10){
                                $golVisitante++;
                            }


                        }

                    }

                    $puntosL=0;
                    $puntosV=0;

                    if ($golLocal>$golVisitante){
                        $puntosL=3;
                    }elseif ($golVisitante>$golLocal){
                        $puntosV=3;
                    }else{
                        $puntosL=1;
                        $puntosV=1;

                    }

                    $resultados[$jornada][$encuentro]=$golLocal.'-'.$golVisitante;
                    $puntos[$equipoLocal->id_equipo]=$puntosL.'-'.$golLocal.'-'.$golVisitante;
                    $puntos[$equipoVisitante->id_equipo]=$puntosV.'-'.$golVisitante.'-'.$golLocal;



                }

                break;
            }




        }

        $posiciones = $liga->posiciones ? json_decode($liga->posiciones, true) : [];

        if ($posiciones==null){
            $posiciones=[];

            foreach ($idsEquipos as $equipo){

                $datosJornada=explode('-', $puntos[$equipo]);

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



                $posiciones[$equipo]=$puntosEquipo.'-'.$V.'-'.$E.'-'.$D.'-'.$golesFavor.'-'.$golesContra.'-'.$diferenciaGoles;

            }



        }else{

            foreach ($posiciones as $equipo  => $datosActualesStr){

                $datosJornada=explode('-', $puntos[$equipo]);

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

                $datosActuales = explode('-', $datosActualesStr);

                $puntosActuales  = (int)$datosActuales[0] + $puntosEquipo;
                $victorias       = (int)$datosActuales[1] + $V;
                $empates         = (int)$datosActuales[2] + $E;
                $derrotas        = (int)$datosActuales[3] + $D;
                $golesFavorActuales= (int)$datosActuales[4] + $golesFavor;
                $golesContraActuales= (int)$datosActuales[5] + $golesContra;
                $diferenciaGoles = $golesFavorActuales-$golesContraActuales;

                $posiciones[$equipo]= $puntosActuales.'-'.$victorias.'-'.$empates.'-'.$derrotas.'-'.$golesFavorActuales.'-'.$golesContraActuales.'-'.$diferenciaGoles;




            }

        }


        uasort($posiciones, function ($a, $b) {


            $datosA = explode('-', $a);
            $datosB = explode('-', $b);

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



}
