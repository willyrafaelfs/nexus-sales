<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    // Fungsi untuk mengambil riwayat pesanan khusus pembeli yang sedang login
    public function index(Request $request) {
        $user = $request->user();

        // Tarik pesanan miliknya, sertakan detail barang (orderItems) dan info produknya
        $orders = Order::with('orderItems.product')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'status' => 'Sukses!',
            'data' => $orders
        ]);
    }

    // Menarik daftar pesanan khusus untuk barang milik toko yang sedang login
    public function sellerOrders(Request $request)
    {
        $user = $request->user();
        $shop = \App\Models\Shop::where('user_id', $user->id)->first();

        if (!$shop) {
            return response()->json(['message' => 'Anda belum memiliki toko!'], 404);
        }

        try {
            $sellerItems = \App\Models\OrderItem::with(['order', 'product'])
                ->whereHas('product', function($query) use ($shop) {
                    $query->where('shop_id', $shop->id);
                })
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->select('order_items.*')
                ->orderBy('orders.created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'Sukses!',
                'data' => $sellerItems
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal mengambil pesanan: ' . $e->getMessage()], 500);
        }
    }

    // Fungsi untuk memproses resi dan mengubah status barang menjadi dikirim
    public function shipItem(Request $request, $itemId)
    {
        $request->validate([
            'resi' => 'required|string|max:100'
        ]);

        try {
            $item = \App\Models\OrderItem::findOrFail($itemId);
            
            // Update resi dan status
            $item->update([
                'resi' => $request->resi,
                'status' => 'shipped'
            ]);

            return response()->json([
                'status' => 'Sukses!',
                'message' => 'Resi berhasil disimpan dan barang dikirim!',
                'data' => $item
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal menyimpan resi: ' . $e->getMessage()], 500);
        }
    }
}