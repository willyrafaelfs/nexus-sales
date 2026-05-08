<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\RajaOngkirController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ShopController;

Route::get('/products', [ApiController::class, 'getProducts']);
Route::post('/checkout', [ApiController::class, 'checkout']);
Route::get('/orders', [ApiController::class, 'getOrders']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::get('/rajaongkir/provinces', [RajaOngkirController::class, 'getProvinces']);
Route::get('/rajaongkir/cities/{provinceId}', [RajaOngkirController::class, 'getCities']);
Route::post('/rajaongkir/cost', [RajaOngkirController::class, 'checkCost']);
Route::post('/checkout', [CheckoutController::class, 'process']);
Route::post('/checkout/success', [CheckoutController::class, 'success']);
Route::get('/test-minio', function () {
    try {
        Storage::disk('s3')->put('halo-dosen.txt', 'Pak/Bu, ini bukti Minio Cloud Storage saya berjalan sempurna!');
        
        $url = Storage::disk('s3')->url('halo-dosen.txt');
        
        return response()->json([
            'status' => 'Sukses!',
            'pesan' => 'File berhasil di-upload ke Minio',
            'link_file' => $url
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/shop', [ShopController::class, 'myShop']);
    Route::post('/shop', [ShopController::class, 'store']);
    Route::post('/products', [ProductController::class, 'store']);
});