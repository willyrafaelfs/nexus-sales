<?php

namespace App\Services;

use App\Models\CrmLog;
use Illuminate\Support\Facades\Log;

/**
 * CrmService — pusat pencatatan aktivitas pelanggan (Customer Relationship).
 * Dipakai oleh listener event maupun controller untuk mencatat jejak interaksi.
 */
class CrmService
{
    /**
     * Catat satu event CRM.
     *
     * @param  string      $eventType   mis: order_paid, order_shipped
     * @param  string|null $description deskripsi human-readable
     * @param  int|null    $userId      id pelanggan/aktor
     * @param  int|null    $orderId     id order terkait (opsional)
     * @param  array       $payload     data mentah tambahan
     */
    public function logEvent(
        string $eventType,
        ?string $description = null,
        ?int $userId = null,
        ?int $orderId = null,
        array $payload = []
    ): CrmLog {
        $log = CrmLog::create([
            'user_id'     => $userId,
            'order_id'    => $orderId,
            'event_type'  => $eventType,
            'description' => $description,
            'payload'     => $payload,
        ]);

        // Audit ringan ke log aplikasi
        Log::info("[CRM] {$eventType}", [
            'user_id'  => $userId,
            'order_id' => $orderId,
        ]);

        return $log;
    }
}
