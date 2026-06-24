<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use App\Services\ShippingService;
use Illuminate\Http\Request;

class ShipmentController extends Controller
{
    public function __construct(private ShippingService $shipping) {}

    /**
     * GET /api/shipments/{tracking}/track — publik, lihat timeline status pengiriman.
     */
    public function track(string $tracking)
    {
        $shipment = Shipment::where('tracking_number', $tracking)->first();

        if (!$shipment) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Nomor resi tidak ditemukan.'
            ], 404);
        }

        $tracking = $this->shipping->trackShipment($shipment->tracking_number);

        return response()->json([
            'status' => 'Sukses!',
            'data'   => [
                'order_id'        => $shipment->order_id,
                'courier'         => $shipment->courier,
                'service'         => $shipment->service,
                'tracking_number' => $shipment->tracking_number,
                'current_status'  => $tracking['status'],
                'history'         => $tracking['history'],
            ]
        ]);
    }
}
