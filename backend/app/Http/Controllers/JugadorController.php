<?php

namespace App\Http\Controllers;


use App\Models\Jugador;
use Illuminate\Http\Request;


class JugadorController extends Controller
{
    public function index(){
        $jugadores = Jugador::all();

        return response()->json($jugadores);
    }

    /*public function create(){
        return view('jugador.create');
    }*/

    public function store(Request $request)
    {

        $request->validate([
            'nombre' => 'required',
            'apellidos' => 'required',
            'precio' => 'numeric'
        ]);

        $jugador = new Jugador();
        $jugador->nombre = $request->nombre;
        $jugador->apellidos = $request->apellidos;
        $jugador->posicion = $request->posicion;
        $jugador->media = $request->media;
        $jugador->precio = $request->precio;
        $jugador->save();

        return response()->json($jugador);

    }


    /*public function edit($id)
    {

        $jugador=Jugador::find($id);
        return view('jugador.edit',compact('jugador'));


    }*/

    public function update(Request $request){
        $id=$request->id;
        $jugador = Jugador::find($id);

        if ($request->archivo && $request->urlImagen ){

            return back()->withErrors(['imagen' => 'Debes elegir solo una opción (archivo o URL).']);

        }

        if ($request->hasFile('archivoImagen')) {


            if ($jugador->imagen && file_exists(public_path($jugador->imagen))) {
                unlink(public_path($jugador->imagen));
            }

            $imagen = $request->file('archivoImagen');
            $nombreImagen = time() . '_' . $imagen->getClientOriginalName();
            $imagen->move(public_path('imagenes'), $nombreImagen);
            $imagenUrl = 'imagenes/' . $nombreImagen;

            $jugador->imagen = $imagenUrl;
        }

        if ($request->urlImagen){

            $jugador->imagen=$request->urlImagen;

        }

        $jugador->nombre=$request->nombre;
        $jugador->apellidos=$request->apellidos;
        $jugador->posicion=$request->posicion;
        $jugador->media=$request->media;
        $jugador->precio=$request->precio;
        $jugador->save();
        return redirect()->route('jugador.index');






    }

    public function destroy($id)
    {
        $jugador= Jugador::find($id);


        if ($jugador->imagen && file_exists(public_path($jugador->imagen))) {
            unlink(public_path($jugador->imagen));
        }



        $jugador->delete();
        return redirect()->route('jugador.index');

    }
}
