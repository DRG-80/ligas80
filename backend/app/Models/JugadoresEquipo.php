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
}
