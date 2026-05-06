<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\RajaOngkirController;
use App\Http\Controllers\CheckoutController;

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