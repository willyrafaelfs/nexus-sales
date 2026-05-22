<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Shop;

class ShopController extends Controller
{
    // Endpoint untuk mengecek apakah user punya toko
    public function myShop(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['shop' => null], 401);

        $shop = Shop::where('user_id', $user->id)->first();
        return response()->json(['shop' => $shop]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_toko' => 'required|string|max:255',
            'deskripsi' => 'nullable|string'
        ]);

        $user = $request->user(); // Ambil data user yang sedang login

        // Cek apakah sudah punya toko
        $existingShop = Shop::where('user_id', $user->id)->first();
        if ($existingShop) {
            return response()->json(['message' => 'Anda sudah memiliki toko!'], 400);
        }

        // 1. Buat Tokonya
        $shop = Shop::create([
            'user_id' => $user->id,
            'nama_toko' => $request->nama_toko,
            'deskripsi' => $request->deskripsi
        ]);

        // 2. OTOMATIS NAIK PANGKAT! (Ubah role dari customer menjadi seller)
        // Pastikan kita tidak mengubah role jika dia kebetulan adalah 'admin'
        if ($user->role === 'customer') {
            $user->role = 'seller';
            $user->save();
        }

        return response()->json([
            'status' => 'Sukses!',
            'message' => 'Toko berhasil dibuat, dan akun Anda kini menjadi Penjual!',
            'shop' => $shop,
            'new_role' => $user->role // Kirim role baru ke frontend
        ]);
    }
    // 1. Menarik Metrik Penjualan Riil
    public function metrics(Request $request)
    {
        $shop = \App\Models\Shop::where('user_id', $request->user()->id)->first();
        if (!$shop) {
            return response()->json(['message' => 'Toko tidak ditemukan'], 404);
        }

        // Hitung total produk yang dimiliki toko
        $totalProducts = \App\Models\Product::where('shop_id', $shop->id)->count();

        // Hitung PENDAPATAN RIIL: (Harga x Jumlah) dari order_items milik toko ini
        // HANYA dihitung jika status pesanan induknya sudah 'paid' (lunas)
        $totalRevenue = \App\Models\OrderItem::whereHas('product', function($q) use ($shop) {
            $q->where('shop_id', $shop->id);
        })->whereHas('order', function($q) {
            $q->where('status', 'paid'); 
        })->sum(\DB::raw('price * quantity'));

        return response()->json([
            'status' => 'Sukses!',
            'data' => [
                'total_products' => $totalProducts,
                'total_revenue' => $totalRevenue
            ]
        ]);
    }

    // 2. Menarik Daftar Produk Khusus Milik Toko Ini
    public function myProducts(Request $request)
    {
        $shop = \App\Models\Shop::where('user_id', $request->user()->id)->first();
        if (!$shop) {
            return response()->json(['message' => 'Toko tidak ditemukan'], 404);
        }

        // Tarik produk berdasarkan ID toko
        $products = \App\Models\Product::where('shop_id', $shop->id)->latest()->get();

        return response()->json([
            'status' => 'Sukses!',
            'data' => $products
        ]);
    }
}