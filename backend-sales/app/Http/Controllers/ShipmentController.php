<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use App\Models\Shop;
use App\Services\ShippingService;
use Illuminate\Http\Request;

class ShipmentController extends Controller
{
    public function __construct(private ShippingService $shipping) {}

    /**
     * GET /api/shipments/{tracking}/track — internal, butuh login.
     * Dibatasi: hanya pemilik order atau pemilik toko shipment yang boleh,
     * supaya nomor resi tidak bisa dienumerasi sembarang orang.
     */
    public function track(Request $request, string $tracking)
    {
        $user = $request->user();

        $shipment = Shipment::with('order')->where('tracking_number', $tracking)->first();
        if (!$shipment) {
            return response()->json(['status' => 'error', 'message' => 'Nomor resi tidak ditemukan.'], 404);
        }

        $isOrderOwner = $shipment->order && $shipment->order->user_id === $user->id;
        $isShopOwner  = Shop::where('id', $shipment->shop_id)->where('user_id', $user->id)->exists();

        if (!$isOrderOwner && !$isShopOwner) {
            return response()->json(['status' => 'error', 'message' => 'Tidak berhak melihat resi ini.'], 403);
        }

        $track = $this->shipping->trackShipment($shipment);

        return response()->json([
            'status' => 'Sukses!',
            'data'   => [
                'order_id'        => $shipment->order_id,
                'courier'         => $shipment->courier,
                'service'         => $shipment->service,
                'tracking_number' => $shipment->tracking_number,
                'current_status'  => $track['status'],
                'events'          => $track['events'],
            ]
        ]);
    }
}
