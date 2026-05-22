<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Menambahkan ID pembeli agar pesanan tidak nyasar
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            // Menambahkan kolom untuk menyimpan link Midtrans
            $table->string('snap_token')->nullable()->after('status');
            $table->string('payment_url')->nullable()->after('snap_token');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['user_id', 'snap_token', 'payment_url']);
        });
    }
};
