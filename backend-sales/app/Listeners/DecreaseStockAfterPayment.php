<?php

namespace App\Listeners;

use App\Events\PaymentPaid;
use App\Exceptions\InsufficientStockException;
use App\Models\StockLog;
use App\Services\AuditService;
use App\Services\InventoryService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class DecreaseStockAfterPayment implements ShouldQueue
{
    use InteractsWithQueue;

    public $tries = 3;

    public function __construct(
        private InventoryService $inventory,
        private AuditService $audit
    ) {}

    public function handle(PaymentPaid $event): void
    {
        $order = $event->order->loadMissing('orderItems');

        // IDEMPOTENT: jika stok untuk order ini sudah pernah dikurangi
        // (ada stock_logs reason=sale), jangan kurangi lagi saat retry.
        $alreadyDecreased = StockLog::where('order_id', $order->id)
            ->where('reason', 'sale')
            ->exists();

        if ($alreadyDecreased) {
            Log::info('[Stock] skip — stok order sudah dikurangi sebelumnya', [
                'order_id' => $order->id,
            ]);
            return;
        }

        foreach ($order->orderItems as $item) {
            try {
                $this->inventory->decreaseStock(
                    productId: $item->product_id,
                    qty: (int) $item->quantity,
                    orderId: $order->id,
                    reason: 'sale'
                );
            } catch (InsufficientStockException $e) {
                // Stok berubah setelah checkout — catat agar bisa ditindaklanjuti manual.
                // (Strategi rollback/refund SENGAJA ditunda; cukup terlihat di log.)
                Log::warning('[Stock] gagal kurangi stok setelah bayar', [
                    'order_id'   => $order->id,
                    'product_id' => $item->product_id,
                    'error'      => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Dipanggil saat job gagal permanen (melewati semua retry).
     */
    public function failed(PaymentPaid $event, Throwable $exception): void
    {
        $this->audit->record('listener_failed', [
            'listener' => self::class,
            'order_id' => $event->order->id,
            'error'    => $exception->getMessage(),
        ], $event->order->user_id);
    }
}
