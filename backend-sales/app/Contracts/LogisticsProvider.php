<?php

namespace App\Contracts;

use App\Models\Order;
use App\Models\Shop;
use App\Models\Shipment;

/**
 * Abstraksi provider logistik. Implementasi default = simulasi,
 * dapat diganti ke API asli (KiriminAja) tanpa mengubah ShippingService.
 */
interface LogisticsProvider
{
    /**
     * Booking pengiriman untuk satu (order, shop).
     *
     * @param  string|null $manualResi Resi kurir asli dari seller; null = provider generate.
     * @return array  courier, service, tracking_number, status, tracking_events[], raw_response
     */
    public function createShipment(Order $order, Shop $shop, ?string $manualResi = null): array;

    /**
     * Lacak shipment: kembalikan status + events NYATA milik shipment ini.
     * @return array  tracking_number, status, events[] ({time, code, description})
     */
    public function track(Shipment $shipment): array;
}
