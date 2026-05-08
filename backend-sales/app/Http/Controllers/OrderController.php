<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    // Fungsi untuk mengambil semua riwayat pesanan
    public function index() {
        $orders = Order::orderBy('created_at', 'desc')->get();
        return response()->json($orders);
    }
}