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



}
