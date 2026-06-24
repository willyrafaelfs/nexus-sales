<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    protected $fillable = [
        'order_id',
        'courier',
        'service',
        'tracking_number',
        'status',
        'raw_response',
    ];

    protected $casts = [
        'raw_response' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
