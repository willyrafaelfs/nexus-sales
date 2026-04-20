<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat Akun Admin
        User::create([
            'name' => 'Commander Admin',
            'email' => 'admin@nexus.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin'
        ]);

        // 2. Buat Akun Customer (Menggunakan namamu!)
        User::create([
            'name' => 'Willy',
            'email' => 'willy@nexus.com',
            'password' => Hash::make('willy123'),
            'role' => 'customer'
        ]);

        // 3. Masukkan Data Produk (Yang sudah kita buat sebelumnya)
        Product::create(['name' => 'Quantum Core Processor', 'price' => 4500000, 'category' => 'Hardware']);
        Product::create(['name' => 'Neural Mechanical Keyboard', 'price' => 1250000, 'category' => 'Peripherals']);
        Product::create(['name' => 'Holographic Monitor 27"', 'price' => 5600000, 'category' => 'Display']);
        Product::create(['name' => 'Cyber-Optic Mouse', 'price' => 750000, 'category' => 'Peripherals']);
    }
}