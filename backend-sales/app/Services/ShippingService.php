<?php

namespace App\Services;

use App\Contracts\LogisticsProvider;
use App\Models\Order;
use App\Models\Shipment;

/**
 * ShippingService — orkestrasi pengiriman lewat provider logistik (abstraksi).
 */
class ShippingService
{
    public function __construct(private LogisticsProvider $provider) {}

    /**
     * Buat shipment untuk sebuah order. Idempotent: jika sudah ada, kembalikan yang lama.
     */
    public function createShipment(Order $order): Shipment
    {
        $existing = Shipment::where('order_id', $order->id)->first();
        if ($existing) {
            return $existing;
        }

        $data = $this->provider->createShipment($order);

        return Shipment::create([
            'order_id'        => $order->id,
            'courier'         => $data['courier'],
            'service'         => $data['service'],
            'tracking_number' => $data['tracking_number'],
            'status'          => $data['status'],
            'raw_response'    => $data['raw_response'] ?? null,
        ]);
    }

    /**
     * Lacak shipment berdasarkan nomor resi (status + history).
     */
    public function trackShipment(string $trackingNumber): array
    {
        return $this->provider->track($trackingNumber);
    }
}
