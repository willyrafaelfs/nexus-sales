<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
    'name',
    'price',
    'stock',
    'category',
    'description',
    'shop_id',
    'image'
];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function stockLogs()
    {
        return $this->hasMany(StockLog::class);
    }
}
