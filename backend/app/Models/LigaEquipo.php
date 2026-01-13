<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LigaEquipo extends Model
{

    protected $table = 'liga_equipos';


    protected $fillable = [
        'id_liga',
        'id_liga',
        'elegido',
        'media',
        'presupuesto',

    ];
}
