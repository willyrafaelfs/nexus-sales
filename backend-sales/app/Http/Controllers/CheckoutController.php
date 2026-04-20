<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;

class CheckoutController extends Controller
{
    public function process(Request $request)
    {
        // 1. Konfigurasi Midtrans
        Config::$serverKey = env('MIDTRANS_SERVER_KEY');
        Config::$isProduction = env('MIDTRANS_IS_PRODUCTION', false);
        Config::$isSanitized = true;
        Config::$is3ds = true; // Fitur keamanan wajib untuk kartu kredit

        // 2. Buat Nomor Pesanan Unik (Kombinasi tulisan ORD dan angka acak)
        $orderId = 'ORD-' . time() . '-' . rand(100, 999);

        // 3. Siapkan Data Transaksi untuk dikirim ke Midtrans
        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $request->total_price, // Total harga dari React
            ],
            'customer_details' => [
                'first_name' => $request->customer_name,
                // Email aslinya harus dinamis, ini kita pakai dummy untuk contoh
                'email' => 'customer@contoh.com', 
            ]
        ];

        try {
            // 4. Minta Token Pembayaran ke Server Midtrans
            $snapToken = Snap::getSnapToken($params);

            // 5. Kembalikan Token dan Nomor Pesanan ke React
            return response()->json([
                'status' => 'success',
                'order_id' => $orderId,
                'snap_token' => $snapToken,
                'message' => 'Token berhasil dibuat!'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}