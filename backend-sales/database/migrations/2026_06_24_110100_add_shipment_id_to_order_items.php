<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // Item mana ikut shipment yang mana (null = belum dikirim seller / "diproses")
            $table->unsignedBigInteger('shipment_id')->nullable()->after('order_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('shipment_id');
        });
    }
};
