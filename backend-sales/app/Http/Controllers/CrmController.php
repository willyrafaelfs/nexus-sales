<?php

namespace App\Http\Controllers;

use App\Models\CrmLog;
use Illuminate\Http\Request;

class CrmController extends Controller
{
    /**
     * GET /api/admin/crm/logs — Super Admin melihat seluruh jejak CRM.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'status'  => 'Gagal!',
                'message' => 'Hanya Super Admin yang boleh mengakses log CRM.'
            ], 403);
        }

        $logs = CrmLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json([
            'status' => 'Sukses!',
            'data'   => $logs
        ]);
    }

    /**
     * GET /api/customer/activity — riwayat aktivitas milik customer yang login.
     */
    public function myActivity(Request $request)
    {
        $user = $request->user();

        $logs = CrmLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'Sukses!',
            'data'   => $logs
        ]);
    }
}
