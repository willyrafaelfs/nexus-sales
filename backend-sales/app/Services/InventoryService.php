<?php

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Product;
use App\Models\StockLog;
use Illuminate\Support\Facades\DB;

/**
 * InventoryService — mengelola stok produk + audit perubahan ke stock_logs.
 */
class InventoryService
{
    /**
     * Kurangi stok produk. Throw kalau stok tidak cukup.
     * Menggunakan lock pesimistik agar aman dari race condition (3 node backend).
     */
    public function decreaseStock(int $productId, int $qty, ?int $orderId = null, string $reason = 'sale'): Product
    {
        return DB::transaction(function () use ($productId, $qty, $orderId, $reason) {
            /** @var Product $product */
            $product = Product::lockForUpdate()->findOrFail($productId);

            if ($product->stock < $qty) {
                throw new InsufficientStockException(
                    "Stok '{$product->name}' tidak cukup (tersisa {$product->stock}, diminta {$qty})."
                );
            }

            $product->decrement('stock', $qty);

            StockLog::create([
                'product_id' => $product->id,
                'change'     => -$qty,
                'reason'     => $reason,
                'order_id'   => $orderId,
            ]);

            return $product->refresh();
        });
    }

    /**
     * Tambah stok produk (restock / pembatalan order).
     */
    public function increaseStock(int $productId, int $qty, ?int $orderId = null, string $reason = 'restock'): Product
    {
        return DB::transaction(function () use ($productId, $qty, $orderId, $reason) {
            /** @var Product $product */
            $product = Product::lockForUpdate()->findOrFail($productId);

            $product->increment('stock', $qty);

            StockLog::create([
                'product_id' => $product->id,
                'change'     => $qty,
                'reason'     => $reason,
                'order_id'   => $orderId,
            ]);

            return $product->refresh();
        });
    }

    /**
     * Validasi cepat tanpa mengubah stok (dipakai saat checkout).
     */
    public function assertAvailable(int $productId, int $qty): void
    {
        $product = Product::findOrFail($productId);
        if ($product->stock < $qty) {
            throw new InsufficientStockException(
                "Stok '{$product->name}' tidak cukup (tersisa {$product->stock}, diminta {$qty})."
            );
        }
    }
}
