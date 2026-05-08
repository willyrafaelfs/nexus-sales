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
    }}