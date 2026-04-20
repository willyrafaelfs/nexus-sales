<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite; // Tambahkan ini

class AuthController extends Controller
{
    // Fungsi Login Manual (yang sudah kita buat)
    public function login(Request $request) {
        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Akses Ditolak! Email atau password salah.'], 401);
        }
        return response()->json(['message' => 'Login berhasil!', 'user' => $user]);
    }

    // --- FUNGSI BARU UNTUK GOOGLE ---

    // 1. Mengarahkan user ke halaman login Google
    public function redirectToGoogle() {
        return Socialite::driver('google')->stateless()->redirect();
    }

    // 2. Menerima data dari Google setelah user berhasil login
    public function handleGoogleCallback() {
        try {
            // Ambil data user dari Google
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Cek apakah email ini sudah ada di database kita. 
            // Jika belum ada, buatkan akun baru secara otomatis!
            $user = User::updateOrCreate(
                ['email' => $googleUser->email],
                [
                    'name' => $googleUser->name,
                    'password' => Hash::make(uniqid()), // Beri password acak karena loginnya pakai Google
                    'role' => 'customer' // Default role
                ]
            );

            // Karena kita menggunakan React yang terpisah, kita harus mengirim datanya
            // lewat URL saat kembali ke React (di-encode agar rapi).
            $userData = base64_encode(json_encode($user));
            
            // Lemparkan kembali ke React beserta data user-nya
            return redirect('http://localhost:5173/login?auth=' . $userData);

        } catch (\Exception $e) {
            return redirect('http://localhost:5173/login?error=google_auth_failed');
        }
    }
}