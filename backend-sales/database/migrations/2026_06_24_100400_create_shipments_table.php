<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id')->index();
            $table->string('courier')->default('NEXUS-LOG');
            $table->string('service')->default('REG');
            $table->string('tracking_number')->unique();
            // status: created, picked_up, in_transit, delivered
            $table->string('status')->default('created');
            // Simpan response mentah dari provider logistik (untuk audit & ganti provider)
            $table->json('raw_response')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
