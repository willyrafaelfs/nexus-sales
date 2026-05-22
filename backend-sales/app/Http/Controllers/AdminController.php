<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Shop;
use App\Models\Order;

class AdminController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        // Validasi Role Super Admin
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'status' => 'Gagal!',
                'message' => 'Anda tidak memiliki akses ke halaman ini'
            ], 403);
        }

        try {
            // 1. Hitung total user terdaftar
            $totalUsers = User::count();

            // 2. Hitung total toko aktif
            $totalShops = Shop::count();

            // 3. Hitung total pendapatan dari pesanan yang sukses terbayar (status 'paid')
            $totalRevenue = Order::where('status', 'paid')->sum('total_price');

            // 4. Ambil 10 transaksi teranyar
            $recentOrders = Order::orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'customer_name' => $order->customer_name,
                        'total_price' => (int) $order->total_price,
                        'status' => $order->status
                    ];
                });

            return response()->json([
                'status' => 'Sukses!',
                'data' => [
                    'metrics' => [
                        'total_users' => $totalUsers,
                        'total_shops' => $totalShops,
                        'total_revenue' => (int) $totalRevenue
                    ],
                    'recent_orders' => $recentOrders
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'Gagal!',
                'error' => 'Gagal memuat data dashboard: ' . $e->getMessage()
            ], 500);
        }
    }
}