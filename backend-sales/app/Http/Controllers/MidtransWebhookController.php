<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\AuditService;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class MidtransWebhookController extends Controller
{
    public function __construct(
        private PaymentService $payments,
        private AuditService $audit
    ) {}

    /**
     * POST /api/midtrans/notification
     * Webhook resmi Midtrans. WAJIB lolos validasi signature sebelum diproses.
     */
    public function handle(Request $request)
    {
        $orderId      = (string) $request->input('order_id');
        $statusCode   = (string) $request->input('status_code');
        $grossAmount  = (string) $request->input('gross_amount');
        $signatureKey = (string) $request->input('signature_key');
        $trxStatus    = (string) $request->input('transaction_status');
        $fraudStatus  = (string) $request->input('fraud_status');

        // 1. Validasi signature: sha512(order_id + status_code + gross_amount + server_key)
        $serverKey = env('MIDTRANS_SERVER_KEY');
        $expected  = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        if (!hash_equals($expected, $signatureKey)) {
            $this->audit->record('webhook_rejected', [
                'reason'   => 'invalid_signature',
                'order_id' => $orderId,
            ]);
            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        // 2. Temukan order di database
        $dbId  = $this->payments->resolveOrderId($orderId);
        $order = $dbId ? Order::find($dbId) : null;

        if (!$order) {
            $this->audit->record('webhook_rejected', [
                'reason'   => 'order_not_found',
                'order_id' => $orderId,
            ]);
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $this->audit->record('webhook_received', [
            'order_id'           => $orderId,
            'transaction_status' => $trxStatus,
            'fraud_status'       => $fraudStatus,
        ], $order->user_id);

        // 3. Hanya status sukses yang melunasi order
        $isPaid = in_array($trxStatus, ['settlement', 'capture'])
            && ($fraudStatus === '' || $fraudStatus === 'accept');

        if ($isPaid) {
            $newlyPaid = $this->payments->markAsPaid($order);
            return response()->json([
                'message'    => 'OK',
                'newly_paid' => $newlyPaid, // false jika webhook duplikat
            ]);
        }

        // Status lain (pending/expire/cancel/deny) — cukup catat
        return response()->json(['message' => 'Acknowledged, status: ' . $trxStatus]);
    }
}
