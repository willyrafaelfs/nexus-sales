<?php

namespace App\Services;

use App\Contracts\LogisticsProvider;
use App\Models\Order;
use App\Models\Shop;
use App\Models\Shipment;

/**
 * ShippingService — orkestrasi pengiriman per (order, shop) lewat provider logistik.
 */
class ShippingService
{
    // Urutan status untuk simulasi kemajuan pengiriman
    private const FLOW = ['shipped', 'picked_up', 'in_transit', 'delivered'];

    private const LABELS = [
        'picked_up'  => 'Paket telah dijemput kurir.',
        'in_transit' => 'Paket dalam perjalanan menuju alamat tujuan.',
        'delivered'  => 'Paket telah diterima pembeli.',
    ];

    public function __construct(private LogisticsProvider $provider) {}

    /**
     * Find-or-create shipment untuk (order, shop). Idempotent:
     * pemanggilan berikutnya mengembalikan shipment yang sama (wasRecentlyCreated=false).
     */
    public function shipForShop(Order $order, Shop $shop, ?string $manualResi = null): Shipment
    {
        $existing = Shipment::where('order_id', $order->id)
            ->where('shop_id', $shop->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        $data = $this->provider->createShipment($order, $shop, $manualResi);

        return Shipment::create([
            'order_id'        => $order->id,
            'shop_id'         => $shop->id,
            'courier'         => $data['courier'],
            'service'         => $data['service'],
            'tracking_number' => $data['tracking_number'],
            'status'          => $data['status'],
            'tracking_events' => $data['tracking_events'] ?? [],
            'raw_response'    => $data['raw_response'] ?? null,
        ]);
    }

    /**
     * Lacak shipment — status + timeline events nyata milik shipment tsb.
     */
    public function trackShipment(Shipment $shipment): array
    {
        return $this->provider->track($shipment);
    }

    /**
     * (Demo) Majukan status shipment ke tahap berikutnya + append event nyata.
     * shipped → picked_up → in_transit → delivered.
     */
    public function advanceStatus(Shipment $shipment): Shipment
    {
        $idx = array_search($shipment->status, self::FLOW, true);

        // Status tidak dikenal atau sudah delivered → tidak ada perubahan
        if ($idx === false || $idx >= count(self::FLOW) - 1) {
            return $shipment;
        }

        $next = self::FLOW[$idx + 1];
        $events = $shipment->tracking_events ?? [];
        $events[] = [
            'time'        => now()->toIso8601String(),
            'code'        => $next,
            'description' => self::LABELS[$next] ?? $next,
        ];

        $shipment->update([
            'status'          => $next,
            'tracking_events' => $events,
        ]);

        return $shipment->refresh();
    }
}
