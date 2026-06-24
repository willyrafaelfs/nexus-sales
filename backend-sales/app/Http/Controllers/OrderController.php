<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shipment;
use App\Models\Shop;
use App\Services\CrmService;
use App\Services\ShippingService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private CrmService $crm,
        private ShippingService $shipping
    ) {}

    // Riwayat pesanan milik pembeli yang sedang login
    public function index(Request $request)
    {
        $user = $request->user();

        $orders = Order::with(['orderItems.product', 'shipments'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'Sukses!',
            'data' => $orders
        ]);
    }

    // Daftar item pesanan untuk barang milik toko yang sedang login
    public function sellerOrders(Request $request)
    {
        $user = $request->user();
        $shop = Shop::where('user_id', $user->id)->first();

        if (!$shop) {
            return response()->json(['message' => 'Anda belum memiliki toko!'], 404);
        }

        try {
            $sellerItems = OrderItem::with(['order', 'product', 'shipment'])
                ->whereHas('product', function ($query) use ($shop) {
                    $query->where('shop_id', $shop->id);
                })
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->select('order_items.*')
                ->orderBy('orders.created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'Sukses!',
                'data' => $sellerItems
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal mengambil pesanan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/seller/orders/{itemId}/ship
     * Seller menekan "Kirim Barang": buat (find-or-create) shipment per (order, shop),
     * generate resi otomatis ATAU pakai resi manual, lalu tempelkan item-item shop tsb.
     */
    public function shipItem(Request $request, $itemId)
    {
        // Resi opsional: kosong = generate otomatis (simulasi)
        $request->validate([
            'tracking_number' => 'nullable|string|max:100',
        ]);

        $user = $request->user();
        $shop = Shop::where('user_id', $user->id)->first();
        if (!$shop) {
            return response()->json(['message' => 'Anda belum memiliki toko!'], 404);
        }

        try {
            $item = OrderItem::with(['order', 'product'])->findOrFail($itemId);

            // Otorisasi: item harus produk milik toko seller ini
            if (!$item->product || $item->product->shop_id !== $shop->id) {
                return response()->json([
                    'message' => 'Anda tidak berhak mengirim item dari toko lain.'
                ], 403);
            }

            $order = $item->order;
            $manualResi = $request->filled('tracking_number') ? trim($request->tracking_number) : null;

            // 1. Find-or-create shipment untuk (order, shop) — idempotent
            $shipment = $this->shipping->shipForShop($order, $shop, $manualResi);

            // 2. Tempelkan SEMUA item shop ini dalam order yang sama ke shipment (resi sama)
            $shopProductIds = Product::where('shop_id', $shop->id)->pluck('id');
            OrderItem::where('order_id', $order->id)
                ->whereIn('product_id', $shopProductIds)
                ->update([
                    'shipment_id' => $shipment->id,
                    'status'      => 'shipped',
                    'resi'        => $shipment->tracking_number,
                ]);

            // 3. CRM order_shipped — idempotent: hanya saat shipment BARU dibuat
            if ($shipment->wasRecentlyCreated) {
                $this->crm->logEvent(
                    eventType: 'order_shipped',
                    description: "Pengiriman {$shipment->tracking_number} dibuat oleh toko {$shop->nama_toko}.",
                    userId: $order->user_id,
                    orderId: $order->id,
                    payload: [
                        'shipment_id'     => $shipment->id,
                        'shop_id'         => $shop->id,
                        'tracking_number' => $shipment->tracking_number,
                        'manual_resi'     => $manualResi !== null,
                    ]
                );
            }

            return response()->json([
                'status'  => 'Sukses!',
                'message' => $manualResi
                    ? 'Resi tersimpan, barang dikirim!'
                    : 'Resi otomatis dibuat, barang dikirim!',
                'data'    => [
                    'tracking_number' => $shipment->tracking_number,
                    'status'          => $shipment->status,
                    'shipment_id'     => $shipment->id,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal mengirim barang: ' . $e->getMessage()], 500);
        }
    }

    /**
     * PUT /api/seller/shipments/{shipmentId}/advance
     * (Demo) Majukan status shipment milik toko seller ke tahap berikutnya.
     */
    public function advanceShipment(Request $request, $shipmentId)
    {
        $user = $request->user();
        $shop = Shop::where('user_id', $user->id)->first();
        if (!$shop) {
            return response()->json(['message' => 'Anda belum memiliki toko!'], 404);
        }

        $shipment = Shipment::findOrFail($shipmentId);
        if ($shipment->shop_id !== $shop->id) {
            return response()->json(['message' => 'Bukan pengiriman toko Anda.'], 403);
        }

        $shipment = $this->shipping->advanceStatus($shipment);

        return response()->json([
            'status' => 'Sukses!',
            'data'   => [
                'tracking_number' => $shipment->tracking_number,
                'status'          => $shipment->status,
                'tracking_events' => $shipment->tracking_events,
            ],
        ]);
    }

    /**
     * GET /api/orders/{order}/shipments
     * Tracking pembeli per-order: daftar shipment (per shop) + item yang belum dikirim.
     * Wajib pemilik order.
     */
    public function orderShipments(Request $request, $orderId)
    {
        $user = $request->user();

        $order = Order::with([
            'shipments.shop',
            'shipments.items.product',
            'orderItems.product.shop',
        ])->findOrFail($orderId);

        // Otorisasi: hanya pemilik order
        if ($order->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak berhak melihat pengiriman order ini.'], 403);
        }

        // Shipment per shop + timeline nyata
        $shipments = $order->shipments->map(function (Shipment $s) {
            $track = $this->shipping->trackShipment($s);
            return [
                'shipment_id'     => $s->id,
                'shop'            => $s->shop?->nama_toko,
                'courier'         => $s->courier,
                'service'         => $s->service,
                'tracking_number' => $s->tracking_number,
                'status'          => $track['status'],
                'tracking_events' => $track['events'],
                'items'           => $s->items->map(fn ($it) => [
                    'name'     => $it->product?->name,
                    'quantity' => $it->quantity,
                ])->values(),
            ];
        })->values();

        // Item yang BELUM punya shipment (masih "diproses, belum dikirim penjual")
        $unshipped = $order->orderItems
            ->whereNull('shipment_id')
            ->map(fn ($it) => [
                'order_item_id' => $it->id,
                'name'          => $it->product?->name,
                'shop'          => $it->product?->shop?->nama_toko,
                'quantity'      => $it->quantity,
                'status'        => $it->status, // diproses / pending
            ])->values();

        return response()->json([
            'status' => 'Sukses!',
            'data'   => [
                'order_id'         => $order->id,
                'order_status'     => $order->status,
                'shipments'        => $shipments,
                'unshipped_items'  => $unshipped,
            ],
        ]);
    }
}
