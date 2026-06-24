<?php

namespace App\Listeners;

use App\Events\PaymentPaid;
use App\Services\ShippingService;

class CreateShipmentAfterPayment
{
    public function __construct(private ShippingService $shipping) {}

    public function handle(PaymentPaid $event): void
    {
        // Buat shipment + nomor resi otomatis (idempotent di dalam service)
        $this->shipping->createShipment($event->order);
    }
}
