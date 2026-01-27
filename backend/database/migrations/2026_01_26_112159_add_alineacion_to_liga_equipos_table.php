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
        Schema::table('liga_equipos', function (Blueprint $table) {

            $table->json('alineacion')->nullable()->after('presupuesto');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('liga_equipos', function (Blueprint $table) {

            $table->dropColumn('alineacion');
        });
    }
};
