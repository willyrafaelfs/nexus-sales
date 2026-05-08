<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Shop;

class ShopController extends Controller
{
    // Endpoint untuk mengecek apakah user yang sedang login punya toko
    public function myShop(Request $request)
    {
        // Catatan: Jika autentikasi token (Sanctum) belum sepenuhnya aktif, 
        // kita gunakan user_id = 1 sebagai fallback (pengaman) untuk testing.
        $userId = $request->user() ? $request->user()->id : 1; 

        $shop = Shop::where('user_id', $userId)->first();

        if ($shop) {
            return response()->json(['shop' => $shop]);
        } else {
            return response()->json(['shop' => null], 200);
        }
    }

    // Endpoint untuk mendaftarkan toko baru
    public function store(Request $request)
    {
        $request->validate([
            'nama_toko' => 'required|string|max:255',
            'deskripsi' => 'nullable|string'
        ]);

        $userId = $request->user() ? $request->user()->id : 1;

        // Cek apakah user sudah punya toko (mencegah 1 user punya 2 toko)
        $existingShop = Shop::where('user_id', $userId)->first();
        if ($existingShop) {
            return response()->json(['message' => 'Anda sudah memiliki toko!'], 400);
        }

        $shop = Shop::create([
            'user_id' => $userId,
            'nama_toko' => $request->nama_toko,
            'deskripsi' => $request->deskripsi
        ]);

        return response()->json([
            'status' => 'Sukses!',
            'message' => 'Toko berhasil dibuat',
            'shop' => $shop
        ]);
    }
}