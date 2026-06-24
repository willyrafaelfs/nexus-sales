<?php

namespace App\Listeners;

use App\Events\PaymentPaid;
use App\Services\CrmService;

class SendOrderToCrm
{
    public function __construct(private CrmService $crm) {}

    public function handle(PaymentPaid $event): void
    {
        $order = $event->order;

        $this->crm->logEvent(
            eventType: 'order_paid',
            description: "Order #{$order->id} lunas senilai Rp" . number_format((float) $order->total_price, 0, ',', '.'),
            userId: $order->user_id,
            orderId: $order->id,
            payload: [
                'total_price' => (float) $order->total_price,
                'snap_token'  => $order->snap_token,
            ]
        );
    }
}
