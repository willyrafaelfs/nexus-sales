<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\InventoryService;
use App\Services\PaymentService;
use App\Exceptions\InsufficientStockException;

class CheckoutController extends Controller
{
    public function __construct(
        private InventoryService $inventory,
        private PaymentService $payments
    ) {}

    public function process(Request $request)
    {
        // Identitas pembeli WAJIB dari token (route di balik auth:sanctum),
        // JANGAN percaya user_id yang dikirim frontend.
        $user = $request->user();
        $userId = $user->id;

        // 0. Validasi stok SEBELUM membuat order — tolak jika tidak cukup
        if ($request->has('items') && is_array($request->items)) {
            try {
                foreach ($request->items as $item) {
                    $this->inventory->assertAvailable((int) $item['id'], (int) $item['quantity']);
                }
            } catch (InsufficientStockException $e) {
                return response()->json([
                    'status'  => 'error',
                    'message' => $e->getMessage()
                ], 422);
            }
        }

        // 1. Simpan order ke database
        $order = Order::create([
            'user_id' => $userId, // Identitas dari token, bukan dari frontend
            'customer_name' => $request->customer_name ?? $user->name,
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
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production', false);
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
                'first_name' => $request->customer_name ?? $user->name,
                'email' => $user->email,
            ]
        ];

        try {
            // 5. Minta Token Pembayaran ke Server Midtrans
            $snapToken = Snap::getSnapToken($params);

            // 6. Buat URL Pembayaran Langsung (Tergantung mode Sandbox/Production)
            $paymentUrl = config('services.midtrans.is_production', false)
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
        // Callback frontend setelah Snap sukses. Tetap melalui PaymentService
        // agar idempotent & memicu event yang sama dengan webhook resmi.
        $id = $this->payments->resolveOrderId((string) $request->order_id);
        $order = $id ? Order::find($id) : null;

        if (!$order) {
            return response()->json(['status' => 'error', 'message' => 'Pesanan tidak ditemukan'], 400);
        }

        $this->payments->markAsPaid($order);

        return response()->json(['status' => 'success', 'message' => 'Status pesanan berhasil diupdate']);
    }
}