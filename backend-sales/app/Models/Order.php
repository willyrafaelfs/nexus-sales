<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    // Tambahkan user_id, snap_token, dan payment_url
    protected $fillable = ['user_id', 'customer_name', 'total_price', 'status', 'snap_token', 'payment_url'];

    // Relasi ke order_items (Wajib ada agar riwayat belanja bisa ditarik lengkap)
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}