<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id')->index();
            // Perubahan stok: negatif = berkurang, positif = bertambah
            $table->integer('change');
            // Alasan: sale, restock, cancel, manual_adjust
            $table->string('reason')->default('sale');
            $table->unsignedBigInteger('order_id')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_logs');
    }
};
