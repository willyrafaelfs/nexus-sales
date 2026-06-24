<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            // Shipment kini bercakupan per (order, shop) — marketplace multi-seller.
            // Nullable agar baris lama (per-order, shop_id null) tidak menggagalkan migrate.
            $table->unsignedBigInteger('shop_id')->nullable()->after('order_id')->index();
            // Timeline tracking NYATA milik shipment ini: [{time, code, description}]
            $table->json('tracking_events')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn(['shop_id', 'tracking_events']);
        });
    }
};
