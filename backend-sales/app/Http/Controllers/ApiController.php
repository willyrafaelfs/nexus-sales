<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;

class ApiController extends Controller
{
    // Fungsi untuk mengirim daftar produk ke React
    public function getProducts() {
        $products = Product::all();
        return response()->json($products);
    }

    // Fungsi untuk menerima pesanan dari React
    public function checkout(Request $request) {
        // 1. Buat data pesanan utama
        $order = Order::create([
            'customer_name' => $request->customer_name ?? 'Guest User',
            'total_price' => $request->total_price,
            'status' => 'pending'
        ]);

        // 2. Simpan detail barang yang dibeli
        foreach($request->items as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['id'],
                'quantity' => $item['quantity'],
                'price' => $item['price']
            ]);
        }

        return response()->json(['message' => 'Pesanan berhasil dibuat!', 'order_id' => $order->id]);
    }

    public function getOrders() {
        // Mengambil semua pesanan dan diurutkan dari yang paling baru
        $orders = Order::orderBy('created_at', 'desc')->get();
        return response()->json($orders);
    }
}