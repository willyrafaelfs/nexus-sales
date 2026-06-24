<?php

namespace App\Listeners;

use App\Events\PaymentPaid;
use App\Services\AuditService;
use App\Services\ShippingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Throwable;

class CreateShipmentAfterPayment implements ShouldQueue
{
    use InteractsWithQueue;

    public $tries = 3;

    public function __construct(
        private ShippingService $shipping,
        private AuditService $audit
    ) {}

    public function handle(PaymentPaid $event): void
    {
        // IDEMPOTENT: createShipment mengembalikan shipment yang sudah ada
        // bila order ini sudah punya (aman dipanggil ulang saat retry).
        $this->shipping->createShipment($event->order);
    }

    public function failed(PaymentPaid $event, Throwable $exception): void
    {
        $this->audit->record('listener_failed', [
            'listener' => self::class,
            'order_id' => $event->order->id,
            'error'    => $exception->getMessage(),
        ], $event->order->user_id);
    }
}
