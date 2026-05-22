<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;
use App\Models\Order;
use App\Models\OrderItem;

class CheckoutController extends Controller
{
    public function process(Request $request)
    {
        // Tangkap ID pembeli jika mereka menggunakan token login (Sanctum)
        $userId = auth('sanctum')->check() ? auth('sanctum')->id() : null;

        // 1. Simpan order ke database
        $order = Order::create([
            'user_id' => $userId, // Menyambungkan pesanan dengan pembeli
            'customer_name' => $request->customer_name ?? 'Guest User',
            'total_price' => $request->total_price,
            'status' => 'pending'
        ]);

        if ($request->has('items') && is_array($request->items)) {
            foreach($request->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price']
                ]);
            }
        }

        // 2. Konfigurasi Midtrans
        Config::$serverKey = env('MIDTRANS_SERVER_KEY');
        Config::$isProduction = env('MIDTRANS_IS_PRODUCTION', false);
        Config::$isSanitized = true;
        Config::$is3ds = true; 

        // 3. Buat Nomor Pesanan Unik berdasarkan ID database
        $orderId = 'ORD-' . $order->id . '-' . time();

        // 4. Siapkan Data Transaksi untuk dikirim ke Midtrans
        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $request->total_price,
            ],
            'customer_details' => [
                'first_name' => $request->customer_name ?? 'Guest User',
                'email' => 'customer@contoh.com', 
            ]
        ];

        try {
            // 5. Minta Token Pembayaran ke Server Midtrans
            $snapToken = Snap::getSnapToken($params);

            // 6. Buat URL Pembayaran Langsung (Tergantung mode Sandbox/Production)
            $paymentUrl = env('MIDTRANS_IS_PRODUCTION', false) 
                ? "https://app.midtrans.com/snap/v2/vtweb/" . $snapToken
                : "https://app.sandbox.midtrans.com/snap/v2/vtweb/" . $snapToken;

            // 7. Simpan Token dan URL ke Database agar bisa dilanjutkan nanti
            $order->update([
                'snap_token' => $snapToken,
                'payment_url' => $paymentUrl
            ]);

            // 8. Kembalikan respons ke React
            return response()->json([
                'status' => 'success',
                'order_id' => $orderId,
                'snap_token' => $snapToken,
                'payment_url' => $paymentUrl,
                'message' => 'Token berhasil dibuat!'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function success(Request $request)
    {
        $parts = explode('-', $request->order_id);
        if (count($parts) >= 2) {
            $id = $parts[1];
            $order = Order::find($id);
            if ($order) {
                $order->status = 'paid';
                $order->save();
                return response()->json(['status' => 'success', 'message' => 'Status pesanan berhasil diupdate']);
            }
        }
        return response()->json(['status' => 'error', 'message' => 'Pesanan tidak ditemukan'], 400);
    }
}