<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    // Tambahkan baris ini juga
    protected $guarded = []; 

    // Relasi ke Order (Setiap item pesanan dimiliki oleh satu pesanan induk)
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Relasi ke Product (Setiap item pesanan merujuk ke satu produk).
    // withTrashed(): riwayat pesanan tetap menampilkan produk walau sudah di-soft-delete.
    public function product()
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    // Relasi ke Shipment (item menempel ke shipment saat seller mengirim)
    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }

    protected $fillable = ['order_id', 'shipment_id', 'product_id', 'quantity', 'price', 'resi', 'status'];
}