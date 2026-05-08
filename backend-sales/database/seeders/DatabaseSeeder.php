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
        
    }
}