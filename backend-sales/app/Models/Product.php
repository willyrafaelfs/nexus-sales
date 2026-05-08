<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
    'name', 
    'price', 
    'category', 
    'description', 
    'shop_id', 
    'image'
];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
