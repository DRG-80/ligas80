<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JugadoresEquipo extends Model
{

    protected $table = 'jugadores_equipo';


    protected $fillable = [
        'id_liga',
        'id_jugador',
        'id_equipo',
        'clausula',

    ];

    //Relaciones necesarias

    public function jugador()
    {
        return $this->belongsTo(Jugador::class, 'id_jugador');
    }

    public function equipo()
    {
        return $this->belongsTo(Equipo::class, 'id_equipo');
    }



}
