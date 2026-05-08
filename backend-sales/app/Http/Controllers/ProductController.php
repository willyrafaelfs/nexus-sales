<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Product; 

class ProductController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validasi Data Lengkap
        $request->validate([
            'name' => 'required|string',
            'price' => 'required|numeric',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'shop_id' => 'required|integer', // Sementara kita pakai integer bebas sebelum ada fitur Login
            'foto_produk' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        try {
            // 2. Tembakkan gambar ke awan Minio
            $path = $request->file('foto_produk')->store('products', 's3');
            
            // 3. Simpan data ke Database PostgreSQL (Neon)
            $product = Product::create([
                'name' => $request->name,
                'price' => $request->price,
                'category' => $request->category,
                'description' => $request->description,
                'shop_id' => $request->shop_id,
                'image' => $path // Kita simpan path-nya saja, URL lengkap nanti digenerate di Frontend
            ]);

            return response()->json([
                'status' => 'Sukses!',
                'pesan' => 'Produk berhasil ditambahkan ke Toko dan foto mendarat di Minio',
                'data' => $product,
                'link_gambar' => Storage::disk('s3')->url($path)
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memproses: ' . $e->getMessage()], 500);
        }
    }
}