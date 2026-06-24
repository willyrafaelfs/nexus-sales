<?php

namespace App\Listeners;

use App\Events\PaymentPaid;
use App\Exceptions\InsufficientStockException;
use App\Services\InventoryService;
use Illuminate\Support\Facades\Log;

class DecreaseStockAfterPayment
{
    public function __construct(private InventoryService $inventory) {}

    public function handle(PaymentPaid $event): void
    {
        $order = $event->order->loadMissing('orderItems');

        foreach ($order->orderItems as $item) {
            try {
                $this->inventory->decreaseStock(
                    productId: $item->product_id,
                    qty: (int) $item->quantity,
                    orderId: $order->id,
                    reason: 'sale'
                );
            } catch (InsufficientStockException $e) {
                // Stok berubah setelah checkout — catat agar bisa ditindaklanjuti manual
                Log::warning('[Stock] gagal kurangi stok setelah bayar', [
                    'order_id'   => $order->id,
                    'product_id' => $item->product_id,
                    'error'      => $e->getMessage(),
                ]);
            }
        }
    }
}
