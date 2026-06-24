<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RajaOngkirController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\CrmController;
use App\Http\Controllers\ShipmentController;
use App\Http\Controllers\MidtransWebhookController;

// 1. Jalur Publik (Tanpa Login)
Route::get('/products', [ProductController::class, 'index']); // <-- Sekarang mengarah ke ProductController
Route::get('/products/{id}', [ProductController::class, 'show']);

// 2. Auth & SSO Google
Route::post('/login', [AuthController::class, 'login']);
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

// 3. RajaOngkir & Midtrans (Checkout Resmi)
Route::get('/rajaongkir/provinces', [RajaOngkirController::class, 'getProvinces']);
Route::get('/rajaongkir/cities/{provinceId}', [RajaOngkirController::class, 'getCities']);
Route::post('/rajaongkir/cost', [RajaOngkirController::class, 'checkCost']);
Route::middleware('throttle:30,1')->group(function () {
    Route::post('/checkout', [CheckoutController::class, 'process']); // <-- Hanya ini jalur checkout yang benar
    Route::post('/checkout/success', [CheckoutController::class, 'success']);
});

// Webhook resmi Midtrans — divalidasi signature, dibatasi rate limit
Route::middleware('throttle:60,1')
    ->post('/midtrans/notification', [MidtransWebhookController::class, 'handle']);

// 4. Setup MinIO — Buat bucket dan set public agar gambar bisa diakses browser
Route::get('/setup-minio', function () {
    try {
        $disk = Storage::disk('s3');
        $client = $disk->getClient();
        $bucket = config('filesystems.disks.s3.bucket');

        // Buat bucket jika belum ada
        if (!$client->doesBucketExist($bucket)) {
            $client->createBucket(['Bucket' => $bucket]);
        }

        // Set bucket policy ke Public Read agar browser bisa akses gambar
        $policy = json_encode([
            'Version' => '2012-10-17',
            'Statement' => [[
                'Sid' => 'PublicRead',
                'Effect' => 'Allow',
                'Principal' => '*',
                'Action' => ['s3:GetObject'],
                'Resource' => ["arn:aws:s3:::{$bucket}/*"]
            ]]
        ]);

        $client->putBucketPolicy([
            'Bucket' => $bucket,
            'Policy' => $policy
        ]);

        // Test upload file kecil
        $disk->put('halo-dosen.txt', 'Pak/Bu, ini bukti Minio Cloud Storage saya berjalan sempurna!');
        $url = $disk->url('halo-dosen.txt');

        return response()->json([
            'status' => 'Sukses!',
            'pesan' => "Bucket '{$bucket}' sudah dibuat dan policy di-set ke PUBLIC",
            'link_file' => $url
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// 5. Jalur Terkunci (Wajib Login/Punya KTP)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/shop', [ShopController::class, 'myShop']);
    Route::get('/orders', [OrderController::class, 'index']);
    // Tracking pembeli per-order (wajib pemilik order)
    Route::get('/orders/{order}/shipments', [OrderController::class, 'orderShipments']);
    Route::get('/seller/orders', [OrderController::class, 'sellerOrders']);
    Route::put('/seller/orders/{itemId}/ship', [OrderController::class, 'shipItem']);
    // (Demo) majukan status pengiriman milik toko seller
    Route::put('/seller/shipments/{shipmentId}/advance', [OrderController::class, 'advanceShipment']);
    // Tracking internal by resi (dibatasi: pemilik order / toko)
    Route::get('/shipments/{tracking}/track', [ShipmentController::class, 'track']);
    Route::get('/seller/metrics', [ShopController::class, 'metrics']);
    Route::get('/seller/products', [ShopController::class, 'myProducts']);
    Route::post('/shop', [ShopController::class, 'store']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::get('/seller/products/{id}', [ProductController::class, 'show']);

    // CRM — Super Admin & riwayat aktivitas customer
    Route::get('/admin/crm/logs', [CrmController::class, 'index']);
    Route::get('/customer/activity', [CrmController::class, 'myActivity']);
});