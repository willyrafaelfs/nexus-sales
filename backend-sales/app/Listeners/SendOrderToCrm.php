<?php

namespace App\Listeners;

use App\Events\PaymentPaid;
use App\Models\CrmLog;
use App\Services\AuditService;
use App\Services\CrmService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendOrderToCrm implements ShouldQueue
{
    use InteractsWithQueue;

    public $tries = 3;

    public function __construct(
        private CrmService $crm,
        private AuditService $audit
    ) {}

    public function handle(PaymentPaid $event): void
    {
        $order = $event->order;

        // IDEMPOTENT: kalau log order_paid untuk order ini sudah ada,
        // jangan buat lagi saat retry (hindari log ganda).
        $alreadyLogged = CrmLog::where('order_id', $order->id)
            ->where('event_type', 'order_paid')
            ->exists();

        if ($alreadyLogged) {
            Log::info('[CRM] skip — order_paid sudah tercatat', ['order_id' => $order->id]);
            return;
        }

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

    public function failed(PaymentPaid $event, Throwable $exception): void
    {
        $this->audit->record('listener_failed', [
            'listener' => self::class,
            'order_id' => $event->order->id,
            'error'    => $exception->getMessage(),
        ], $event->order->user_id);
    }
}
