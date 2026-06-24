<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmLog extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'event_type',
        'description',
        'payload',
    ];

    // payload disimpan sebagai JSON, otomatis di-cast ke array
    protected $casts = [
        'payload' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
