<?php

namespace App\Services\Logistics;

use App\Contracts\LogisticsProvider;
use App\Models\Order;
use App\Models\Shop;
use App\Models\Shipment;

/**
 * Provider logistik MODE SIMULASI.
 * Generate resi "KRM..." (atau pakai resi manual seller) dan simpan
 * tracking_events NYATA per shipment. Ganti binding di AppServiceProvider
 * ke provider asli (KiriminAja) tanpa mengubah ShippingService.
 */
class SimulatedLogisticsProvider implements LogisticsProvider
{
    public function createShipment(Order $order, Shop $shop, ?string $manualResi = null): array
    {
        $tracking = $manualResi ?: 'KRM' . strtoupper(uniqid());
        $now = now();

        // Event pertama yang nyata (waktu sesungguhnya shipment dibuat)
        $firstEvent = [
            'time'        => $now->toIso8601String(),
            'code'        => 'shipped',
            'description' => 'Paket diserahkan ke kurir, menunggu penjemputan.',
        ];

        return [
            'courier'         => 'NEXUS-LOG',
            'service'         => 'REG',
            'tracking_number' => $tracking,
            'status'          => 'shipped',
            'tracking_events' => [$firstEvent],
            'raw_response'    => [
                'provider'    => 'simulated',
                'order_id'    => $order->id,
                'shop_id'     => $shop->id,
                'manual_resi' => $manualResi !== null,
                'created_at'  => $now->toIso8601String(),
            ],
        ];
    }

    public function track(Shipment $shipment): array
    {
        // Kembalikan events TERSIMPAN milik shipment ini (bukan hardcoded).
        return [
            'tracking_number' => $shipment->tracking_number,
            'status'          => $shipment->status,
            'events'          => $shipment->tracking_events ?? [],
        ];
    }
}
