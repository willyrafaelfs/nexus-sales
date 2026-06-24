<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'ip_address',
        'context',
    ];

    protected $casts = [
        'context' => 'array',
    ];
}
