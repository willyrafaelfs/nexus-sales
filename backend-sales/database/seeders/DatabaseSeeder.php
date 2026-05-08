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

        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@nexus.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin'
        ]);

        User::create([
            'name' => 'Willy',
            'email' => 'willy@nexus.com',
            'password' => Hash::make('willy123'),
            'role' => 'customer'
        ]);

        User::create([
            'name' => 'Rizky',
            'email' => 'rizky@nexus.com',
            'password' => Hash::make('satria123'),
            'role' => 'customer'
        ]);
    }
}