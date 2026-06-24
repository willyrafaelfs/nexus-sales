<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event yang dipicu sekali saat sebuah Order benar-benar LUNAS (paid).
 * Menggantikan logika prosedural di dalam webhook controller.
 */
class PaymentPaid
{
    use Dispatchable, SerializesModels;

    public function __construct(public Order $order) {}
}
