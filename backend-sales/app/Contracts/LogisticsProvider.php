<?php

namespace App\Contracts;

use App\Models\Order;

/**
 * Abstraksi provider logistik. Implementasi default = simulasi,
 * dapat diganti ke API asli (KiriminAja) tanpa mengubah ShippingService.
 */
interface LogisticsProvider
{
    /**
     * Buat pengiriman di sisi provider.
     * Return array: courier, service, tracking_number, status, raw_response.
     */
    public function createShipment(Order $order): array;

    /**
     * Lacak pengiriman berdasarkan nomor resi.
     * Return array: status, history[] (masing-masing: status, description, timestamp).
     */
    public function track(string $trackingNumber): array;
}
