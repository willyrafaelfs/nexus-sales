<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_logs', function (Blueprint $table) {
            $table->id();
            // Pelanggan/aktor yang terkait event (nullable untuk event sistem)
            $table->unsignedBigInteger('user_id')->nullable()->index();
            // Order terkait jika event berasal dari transaksi
            $table->unsignedBigInteger('order_id')->nullable()->index();
            // Jenis event, mis: order_paid, order_shipped, order_created
            $table->string('event_type')->index();
            // Deskripsi singkat yang mudah dibaca manusia
            $table->string('description')->nullable();
            // Data mentah tambahan (snapshot) untuk audit
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_logs');
    }
};
