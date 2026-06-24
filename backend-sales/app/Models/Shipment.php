<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    protected $fillable = [
        'order_id',
        'shop_id',
        'courier',
        'service',
        'tracking_number',
        'status',
        'raw_response',
        'tracking_events',
    ];

    protected $casts = [
        'raw_response'    => 'array',
        'tracking_events' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    // Item-item yang menempel ke shipment ini (satu shipment = bagian satu shop dalam order)
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
