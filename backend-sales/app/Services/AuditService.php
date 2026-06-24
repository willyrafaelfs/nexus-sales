<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Request;

/**
 * AuditService — mencatat aksi penting/sensitif (keamanan & jejak).
 */
class AuditService
{
    public function record(string $action, array $context = [], ?int $userId = null): AuditLog
    {
        return AuditLog::create([
            'user_id'    => $userId,
            'action'     => $action,
            'ip_address' => Request::ip(),
            'context'    => $context,
        ]);
    }
}
