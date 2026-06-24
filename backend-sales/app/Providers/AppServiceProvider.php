<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Contracts\LogisticsProvider;
use App\Services\Logistics\SimulatedLogisticsProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Provider logistik default = simulasi.
        // Ganti baris ini ke KiriminAjaProvider::class saat integrasi API asli.
        $this->app->bind(LogisticsProvider::class, SimulatedLogisticsProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Event → listener didaftarkan eksplisit di EventServiceProvider.
    }
}
