<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Liga extends Model
{
    protected $table = 'liga';


    protected $fillable = [
        'nombre',
        'id_usuario',
        'posiciones',
        'resultados',
        'n_equipos',
        'iniciada',
        'jornada',
        'enfrentamientos'

    ];

    public function equipos()
    {
        //Puente necesario para conectar las tablas
        return $this->belongsToMany(Equipo::class, 'liga_equipos', 'id_liga', 'id_equipo');
    }
}
