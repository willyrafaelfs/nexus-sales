<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;

    // Mengizinkan Tinker (Mass Assignment) untuk mengisi kolom ini
    protected $fillable = [
        'user_id',
        'nama_toko',
        'deskripsi',
    ];

    // Relasi balik ke User (Satu toko dimiliki satu user)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke Product (Satu toko punya banyak produk)
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}