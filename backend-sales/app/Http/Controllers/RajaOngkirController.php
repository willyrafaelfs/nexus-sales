<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class RajaOngkirController extends Controller
{
    // Menggunakan Base URL RajaOngkir V2 (Komerce)
    private $baseUrl = 'https://rajaongkir.komerce.id/api/v1';

    // Asumsi ID Kota/Kabupaten asal pengiriman (Kita coba 256 untuk Malang)
    private $originId = 256; 

    public function getProvinces() {
        $response = Http::withHeaders(['key' => config('services.rajaongkir.key')])
                        ->get("{$this->baseUrl}/destination/province");
        
        $data = $response->json();

        // Di sistem baru, datanya dibungkus di dalam array 'data'
        if (!isset($data['data'])) {
            return response()->json([
                'pesan' => 'Gagal terhubung ke server baru RajaOngkir',
                'alasan_dari_server' => $data
            ], 500);
        }

        return response()->json($data['data']);
    }

    public function getCities($provinceId) {
        $response = Http::withHeaders(['key' => config('services.rajaongkir.key')])
                        ->get("{$this->baseUrl}/destination/city/{$provinceId}");
        
        $data = $response->json();
        
        if (!isset($data['data'])) {
            return response()->json(['pesan' => 'Gagal mengambil kota', 'alasan' => $data], 500);
        }

        return response()->json($data['data']);
    }

    public function checkCost(Request $request) {
        // Komerce mewajibkan format pengiriman form-urlencoded (asForm)
        $response = Http::withHeaders(['key' => config('services.rajaongkir.key')])
                        ->asForm() 
                        ->post("{$this->baseUrl}/calculate/domestic-cost", [
                            'origin' => $this->originId,
                            'destination' => $request->destination,
                            'weight' => $request->weight ?? 1000, 
                            'courier' => $request->courier
                        ]);
                        
        $data = $response->json();
        
        if (!isset($data['data'])) {
            return response()->json(['pesan' => 'Gagal cek ongkir', 'alasan' => $data], 500);
        }

        return response()->json($data['data']);
    }
}