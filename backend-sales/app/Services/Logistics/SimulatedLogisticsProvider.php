<?php

namespace App\Services\Logistics;

use App\Contracts\LogisticsProvider;
use App\Models\Order;
use App\Models\Shipment;

/**
 * Provider logistik MODE SIMULASI.
 * Menghasilkan nomor resi "KRM..." dan timeline tracking buatan.
 * Cukup ganti binding di AppServiceProvider ke KiriminAjaProvider nanti.
 */
class SimulatedLogisticsProvider implements LogisticsProvider
{
    public function createShipment(Order $order): array
    {
        $tracking = 'KRM' . strtoupper(uniqid());

        return [
            'courier'         => 'NEXUS-LOG',
            'service'         => 'REG',
            'tracking_number' => $tracking,
            'status'          => 'created',
            'raw_response'    => [
                'provider'    => 'simulated',
                'order_id'    => $order->id,
                'created_at'  => now()->toIso8601String(),
                'message'     => 'Shipment booked (simulation).',
            ],
        ];
    }

    public function track(string $trackingNumber): array
    {
        // Ambil shipment untuk tahu kapan dibuat & status terkini
        $shipment = Shipment::where('tracking_number', $trackingNumber)->first();
        $createdAt = $shipment?->created_at ?? now();
        $status = $shipment?->status ?? 'created';

        // Bangun timeline simulasi yang konsisten dengan status saat ini
        $history = [
            [
                'status'      => 'created',
                'description' => 'Pesanan dibuat, menunggu penjemputan kurir.',
                'timestamp'   => $createdAt->toIso8601String(),
            ],
        ];

        if (in_array($status, ['picked_up', 'in_transit', 'delivered'])) {
            $history[] = [
                'status'      => 'picked_up',
                'description' => 'Paket telah dijemput kurir.',
                'timestamp'   => $createdAt->copy()->addHours(2)->toIso8601String(),
            ];
        }
        if (in_array($status, ['in_transit', 'delivered'])) {
            $history[] = [
                'status'      => 'in_transit',
                'description' => 'Paket dalam perjalanan menuju alamat tujuan.',
                'timestamp'   => $createdAt->copy()->addHours(8)->toIso8601String(),
            ];
        }
        if ($status === 'delivered') {
            $history[] = [
                'status'      => 'delivered',
                'description' => 'Paket telah diterima.',
                'timestamp'   => $createdAt->copy()->addDay()->toIso8601String(),
            ];
        }

        return [
            'tracking_number' => $trackingNumber,
            'status'          => $status,
            'history'         => $history,
        ];
    }
}
