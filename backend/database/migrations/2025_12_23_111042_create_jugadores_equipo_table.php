<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('jugadores_equipo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_liga')->constrained('liga')->onDelete('cascade');
            $table->foreignId('id_jugador')->constrained('jugador')->onDelete('cascade');
            $table->foreignId('id_equipo')->constrained('equipo')->onDelete('cascade');
            $table->double('clausula');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('jugadores_equipo');
    }
};
