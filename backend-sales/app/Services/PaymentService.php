<?php

namespace App\Services;

use App\Events\PaymentPaid;
use App\Models\Order;

/**
 * PaymentService — transisi status pembayaran yang IDEMPOTENT.
 * Memastikan event PaymentPaid hanya dipicu SEKALI per order,
 * walau webhook Midtrans + callback frontend sama-sama memanggil.
 */
class PaymentService
{
    /**
     * Tandai order lunas & picu event. Return true jika ini transisi BARU.
     */
    public function markAsPaid(Order $order): bool
    {
        // Sudah pernah lunas → jangan proses ulang (idempotent)
        if ($order->status === 'paid') {
            return false;
        }

        $order->update(['status' => 'paid']);

        // Satu event memicu: stok turun + shipment dibuat + CRM tercatat
        event(new PaymentPaid($order));

        return true;
    }

    /**
     * Ambil ID order dari format Midtrans "ORD-{id}-{time}".
     */
    public function resolveOrderId(string $midtransOrderId): ?int
    {
        $parts = explode('-', $midtransOrderId);
        return isset($parts[1]) ? (int) $parts[1] : null;
    }
}
