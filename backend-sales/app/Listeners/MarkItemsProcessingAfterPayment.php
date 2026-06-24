<?php

namespace App\Listeners;

use App\Events\PaymentPaid;
use App\Models\OrderItem;
use App\Services\AuditService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Throwable;

/**
 * Saat order LUNAS: tandai item sebagai "diproses" (menunggu seller mengirim).
 * Shipment & resi BELUM dibuat di sini — itu terjadi saat seller menekan
 * "Kirim Barang". Lihat ShippingService::shipForShop().
 */
class MarkItemsProcessingAfterPayment implements ShouldQueue
{
    use InteractsWithQueue;

    public $tries = 3;

    public function __construct(private AuditService $audit) {}

    public function handle(PaymentPaid $event): void
    {
        // Idempotent: hanya item yang masih 'pending' yang dinaikkan ke 'diproses'.
        // Item yang sudah 'shipped' tidak diutak-atik.
        OrderItem::where('order_id', $event->order->id)
            ->where('status', 'pending')
            ->update(['status' => 'diproses']);
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
