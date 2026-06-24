<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Product;
use App\Services\AuditService;

class ProductController extends Controller
{
    public function __construct(private AuditService $audit) {}

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

    // Mengambil detail satu produk spesifik
    public function show($id)
    {
        try {
            // Ambil produk berdasarkan ID, sertakan juga nama tokonya
            $product = Product::with('shop:id,nama_toko')->findOrFail($id);

            return response()->json([
                'status' => 'Sukses!',
                'data' => $product
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Produk tidak ditemukan'], 404);
        }
    }

    // Update produk (termasuk stok). Foto opsional saat edit.
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::with('shop')->findOrFail($id);

        // Ownership: hanya pemilik toko yang boleh mengedit produknya
        if (!$product->shop || $product->shop->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak berhak mengubah produk ini.'], 403);
        }

        $request->validate([
            'name' => 'required|string',
            'price' => 'required|numeric',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'stock' => 'required|integer|min:0',
            'foto_produk' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        try {
            $payload = [
                'name' => $request->name,
                'price' => $request->price,
                'category' => $request->category,
                'description' => $request->description,
                'stock' => $request->stock,
            ];

            // Ganti foto hanya jika seller mengunggah yang baru
            if ($request->hasFile('foto_produk')) {
                $path = $request->file('foto_produk')->store('products', 's3');
                if (!$path) {
                    return response()->json([
                        'error' => 'Gagal mengunggah gambar ke storage (MinIO). Pastikan bucket sudah dibuat dan MinIO berjalan.'
                    ], 502);
                }
                $payload['image'] = Storage::disk('s3')->url($path);
            }

            $product->update($payload);

            return response()->json([
                'status' => 'Sukses!',
                'message' => 'Produk berhasil diperbarui',
                'product' => $product->refresh()
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal memperbarui: ' . $e->getMessage()], 500);
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
            'stock' => 'nullable|integer|min:0',
            'shop_id' => 'required|integer',
            'foto_produk' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        try {
            $path = $request->file('foto_produk')->store('products', 's3');

            // Disk s3 di-set throw=false → upload gagal mengembalikan false (tidak melempar).
            // Cegah produk tersimpan dengan gambar rusak: tolak kalau upload gagal.
            if (!$path) {
                return response()->json([
                    'error' => 'Gagal mengunggah gambar ke storage (MinIO). Pastikan bucket sudah dibuat (akses /api/setup-minio) dan MinIO berjalan.'
                ], 502);
            }

            $fullUrl = Storage::disk('s3')->url($path);

            $product = Product::create([
                'name' => $request->name,
                'price' => $request->price,
                'category' => $request->category,
                'description' => $request->description,
                'stock' => $request->stock ?? 100,
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

    // Hapus produk (SOFT DELETE) — riwayat pesanan (order_items) tetap utuh.
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::with('shop')->findOrFail($id);

        // Otorisasi: hanya pemilik toko yang boleh menghapus produknya
        if (!$product->shop || $product->shop->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak berhak menghapus produk ini.'], 403);
        }

        // Soft delete: produk hilang dari katalog & dashboard, order_items lama tetap utuh.
        // File gambar di MinIO sengaja DIBIARKAN agar riwayat pesanan tetap menampilkannya.
        $product->delete();

        // Audit log
        $this->audit->record('product_deleted', [
            'product_id'   => $product->id,
            'product_name' => $product->name,
            'shop_id'      => $product->shop_id,
        ], $user->id);

        return response()->json([
            'status'  => 'Sukses!',
            'message' => 'Produk berhasil dihapus dari katalog.',
        ]);
    }
}