<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Product; 

class ProductController extends Controller
{
    // Fungsi baru untuk menarik daftar katalog ke halaman utama
    public function index()
    {
        try {
            // Tarik data produk beserta nama toko penjualnya, urutkan dari yang terbaru
            $products = Product::with('shop:id,nama_toko')->latest()->get();

            return response()->json([
                'status' => 'Sukses!',
                'data' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memuat katalog: ' . $e->getMessage()], 500);
        }
    }

    // Fungsi lama milikmu untuk upload barang
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'price' => 'required|numeric',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'shop_id' => 'required|integer', 
            'foto_produk' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        try {
            $path = $request->file('foto_produk')->store('products', 's3');
            $fullUrl = Storage::disk('s3')->url($path);
            
            $product = Product::create([
                'name' => $request->name,
                'price' => $request->price,
                'category' => $request->category,
                'description' => $request->description,
                'shop_id' => $request->shop_id,
                'image' => $fullUrl 
            ]);

            $product->link_gambar = $fullUrl;

            return response()->json([
                'status' => 'Sukses!',
                'message' => 'Produk berhasil ditambahkan ke Toko dan foto mendarat di Minio',
                'product' => $product 
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memproses: ' . $e->getMessage()], 500);
        }
    }
}