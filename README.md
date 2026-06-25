# NEXUS SALES

![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Queue_&_Cache-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-LB_/_FastCGI-009639?logo=nginx&logoColor=white)
![MinIO](https://img.shields.io/badge/MinIO-S3_Storage-C72E49?logo=minio&logoColor=white)

**NEXUS SALES** adalah platform **e-commerce multi-seller** — studi kasus mata kuliah
**Sistem Integrasi**. Monorepo ini berisi API Laravel (`backend-sales/`) dan SPA React/Vite
(`frontend-sales/`), diorkestrasi dengan Docker Compose (3 node backend di belakang Nginx
load balancer, plus Redis, MinIO, Traefik, dan PostgreSQL di Neon).

## Identitas

| Keterangan | Isi |
|---|---|
| **Nama** | Willy Rafael F. Silalahi |
| **NIM** | 23083000168 |
| **Kelas** | 6A2 |
| **Mata Kuliah** | Sistem Integrasi |

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Arsitektur](#arsitektur)
- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Prasyarat](#prasyarat)
- [Instalasi dan Menjalankan](#instalasi-dan-menjalankan)
- [Akun Demo](#akun-demo)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Peran Pengguna (RBAC)](#peran-pengguna-rbac)
- [Alur Transaksi](#alur-transaksi)
- [Daftar Endpoint API](#daftar-endpoint-api)
- [Skema Database](#skema-database)
- [Pengujian (Postman)](#pengujian-postman)
- [Catatan Integrasi](#catatan-integrasi)
- [Keamanan](#keamanan)
- [Kredit dan Kontak](#kredit-dan-kontak)

---

## Fitur Utama

- **Autentikasi**: Laravel Sanctum (Bearer token) + registrasi akun + **Login Google**
  (Laravel Socialite).
- **RBAC**: tiga peran pada kolom `users.role` — `customer`, `seller`, `admin`.
- **Katalog & produk**: CRUD produk milik seller, gambar disimpan di MinIO (S3),
  **soft delete** produk (riwayat pesanan tetap utuh).
- **Inventory / stok**: kolom `products.stock`, `InventoryService` (kurangi/tambah stok),
  audit perubahan stok di tabel `stock_logs`.
- **Keranjang & checkout**: cart per-user (React Context + localStorage), checkout
  **wajib login** (dipagari di backend).
- **Pembayaran Midtrans**: pembuatan Snap token + **webhook dengan validasi signature SHA-512**.
- **Integrasi berbasis event + Redis queue**: event `PaymentPaid` memicu listener
  (`DecreaseStockAfterPayment`, `MarkItemsProcessingAfterPayment`, `SendOrderToCrm`) yang
  diproses worker queue Redis (idempotent, `tries=3`).
- **Pengiriman per-seller + tracking**: shipment dibuat saat seller menekan "Kirim Barang"
  (resi otomatis simulasi atau manual), timeline `tracking_events`, tracking per-order untuk pembeli.
- **CRM**: tabel `crm_logs` (mis. `order_paid`, `order_shipped`) + endpoint log admin & aktivitas customer.
- **Audit log**: tabel `audit_logs` untuk aksi penting (mis. webhook ditolak, listener gagal,
  produk dihapus).
- **RajaOngkir**: cek provinsi/kota/ongkir.

---

## Arsitektur

```
                Browser
                   │
        ┌──────────┴───────────┐
        ▼                      ▼
 Frontend React/Vite     Nginx Load Balancer  ──FastCGI(round-robin)──┐
   (:5173)                 (:8888)                                     │
                                                                       ▼
                                                  backend1 / backend2 / backend3
                                                     (PHP-FPM :9000 + OPcache)
                                                                       │
                       ┌───────────────────────────┬──────────────────┼───────────────┐
                       ▼                            ▼                  ▼                ▼
                 PostgreSQL (Neon, remote)   Redis (queue+cache)   MinIO (S3)    queue-worker
                                               (:6379)          (:9000 / :9001)  (queue:work)

 Traefik (:80, :8080) — reverse proxy / dashboard
```

Port diambil dari `docker-compose.yml`:

| Service (compose) | Image / Build | Port host | Keterangan |
|---|---|---|---|
| `frontend_service` | build `./frontend-sales` | `5173` | SPA React (Vite dev server) |
| `loadbalancer` | `nginx:alpine` | `8888` → 80 | Gateway FastCGI ke 3 node FPM |
| `backend1` / `backend2` / `backend3` | build `./backend-sales` | — (internal :9000) | PHP-FPM, `depends_on: redis` |
| `queue-worker` | build `./backend-sales` | — | `php artisan queue:work redis --tries=3 --backoff=5` |
| `redis` | `redis:alpine` | `6379` | Broker queue + cache |
| `minio` | `minio/minio` | `9000`, `9001` | S3 API + console |
| `traefik` | `traefik:v3.7` | `80`, `8080` | Reverse proxy + dashboard |

> Database **tidak** ada sebagai service compose — memakai **PostgreSQL Neon (remote)** via `.env`.

---

## Tech Stack

#### Backend
* **Core**: PHP `^8.3` & Laravel Framework `^13.0`
* **Authentication**: Laravel Sanctum `^4.0` & Laravel Socialite `^5.26`
* **Utilities**: Laravel Tinker `^3.0` & Midtrans PHP SDK `^2.6`
* **Storage**: League Flysystem AWS S3 V3 `^3.0`
* **Runtime**: PHP-FPM 8.3 + OPcache
* **Web Server**: Nginx (FastCGI load balancing ke 3 node)
* **Config File**: `backend-sales/composer.json`

#### Frontend
* **Core**: React `^19.2.4` & React DOM `^19.2.4`
* **Routing**: React Router DOM `^7.14.0`
* **Build Tool**: Vite `^8.0.4`
* **Styling**: Tailwind CSS `^4.2.2`
* **Config File**: `frontend-sales/package.json`

#### Infrastructure & Databases
* **Containerization**: Docker Compose
* **Reverse Proxy**: Traefik v3.7 & Nginx
* **Database**: PostgreSQL (Neon Serverless)
* **Cache & Queue**: Redis
* **Object Storage**: MinIO (S3 Compatible)

---

## Struktur Folder

Cerminan isi repo nyata:

```
Nexus Sales/
├─ docker-compose.yml          # orkestrasi seluruh stack (jalankan dari root)
├─ README.md
├─ .gitignore
├─ backend-sales/
│  ├─ app/
│  │  ├─ Http/Controllers/     # Auth, Product, Shop, Order, Checkout,
│  │  │                        #   MidtransWebhook, Shipment, RajaOngkir, Admin, Crm
│  │  ├─ Models/               # User, Shop, Product, Order, OrderItem,
│  │  │                        #   Shipment, CrmLog, StockLog, AuditLog
│  │  ├─ Services/             # Payment, Inventory, Shipping, Crm, Audit,
│  │  │                        #   Logistics/SimulatedLogisticsProvider
│  │  ├─ Events/               # PaymentPaid
│  │  ├─ Listeners/            # DecreaseStockAfterPayment,
│  │  │                        #   MarkItemsProcessingAfterPayment, SendOrderToCrm
│  │  ├─ Contracts/            # LogisticsProvider
│  │  ├─ Exceptions/           # InsufficientStockException
│  │  └─ Providers/            # AppServiceProvider
│  ├─ routes/                  # api.php, web.php, console.php
│  ├─ database/migrations/
│  ├─ config/
│  ├─ docker/opcache.ini
│  ├─ Dockerfile               # php:8.3-fpm + opcache + pdo_pgsql + redis
│  ├─ nginx.conf               # FastCGI upstream ke backend1/2/3:9000
│  └─ .env.example
└─ frontend-sales/
   ├─ src/
   │  ├─ pages/                # Shop, ProductDetail, Login, Register, MyOrders,
   │  │  │                     #   Tracking, AdminDashboard, AdminCrmLogs, Admin*
   │  │  └─ seller/            # SellerDashboard, CreateShop, components/
   │  ├─ components/           # Navbar, CartPanel
   │  ├─ context/              # CartContext
   │  ├─ App.jsx, main.jsx
   ├─ Dockerfile
   ├─ package.json
   └─ .env.example
```

> Catatan: `src/pages/Admin.jsx` ADA di repo tetapi **tidak dirujuk di `App.jsx`**
> (kemungkinan legacy). Halaman admin yang dipakai adalah `AdminDashboard.jsx` dan `AdminCrmLogs.jsx`.

---

## Prasyarat

- Docker & Docker Compose
- Akun **Neon** (PostgreSQL), kredensial **Midtrans** (sandbox), **Google OAuth**, dan
  **RajaOngkir** untuk mengisi `.env`.

---

## Instalasi dan Menjalankan

```bash
# 1. Siapkan environment (lihat tabel variabel di bawah)
cp backend-sales/.env.example backend-sales/.env
cp frontend-sales/.env.example frontend-sales/.env
#    isi nilai asli HANYA di backend-sales/.env

# 2. Build & jalankan seluruh stack DARI ROOT
docker compose build
docker compose up -d

# 3. Generate APP_KEY (sekali)
docker compose exec backend1 php artisan key:generate

# 4. Migrasi database — JALANKAN SEKALI dari SATU node saja
#    (ketiga node berbagi DB Neon yang sama)
docker compose exec backend1 php artisan migrate

# 5. Inisialisasi bucket MinIO (sekali) — buat bucket + set public-read
curl http://localhost:8888/api/setup-minio
```

Akses: Frontend `http://localhost:5173`, API `http://localhost:8888`,
MinIO console `http://localhost:9001`, Traefik dashboard `http://localhost:8080`.

> **Catatan OPcache**: image FPM memakai `opcache.validate_timestamps=0`, jadi setelah
> mengubah kode backend jalankan `docker compose restart backend1 backend2 backend3`.
> Setelah mengubah `.env`: `docker compose exec backend1 php artisan optimize:clear` lalu restart.

---

## Akun Demo

Tersedia di `backend-sales/database/seeders/DatabaseSeeder.php` (opsional, jalankan
`docker compose exec backend1 php artisan db:seed`):

| Email | Password | Role |
|---|---|---|
| `admin@nexus.com` | `admin123` | admin |
| `willy@nexus.com` | `willy123` | customer |
| `rizky@nexus.com` | `satria123` | customer |

> Kredensial demo lokal — ganti/jangan dipakai di lingkungan publik.

---

## Konfigurasi Environment

Nama variabel diambil dari `backend-sales/.env.example` & `config/services.php`
(**tanpa nilai asli**). Isi nilai hanya di `.env` lokal.

### Backend (`backend-sales/.env`)

| Variabel | Keterangan |
|---|---|
| `APP_KEY` | App key Laravel (`php artisan key:generate`) |
| `APP_URL` | Base URL aplikasi |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | Host Neon (gunakan host **pooled**, suffix `-pooler`) |
| `DB_PORT` | Port PostgreSQL (5432) |
| `DB_DATABASE` | Nama database Neon |
| `DB_USERNAME` | User database |
| `DB_PASSWORD` | Password database |
| `DB_SSLMODE` | `require` (Neon) |
| `QUEUE_CONNECTION` | `redis` |
| `CACHE_STORE` | Driver cache (`file`); cache katalog memakai store `redis` |
| `REDIS_CLIENT` | `phpredis` |
| `REDIS_HOST` | `redis` (nama service compose) |
| `REDIS_PASSWORD` / `REDIS_PORT` | Kredensial/port Redis |
| `FILESYSTEM_DISK` | `s3` (MinIO) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Kredensial MinIO/S3 |
| `AWS_DEFAULT_REGION` / `AWS_BUCKET` | Region & nama bucket |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `true` untuk MinIO |
| `AWS_ENDPOINT` | Endpoint internal MinIO (mis. `http://minio:9000`) |
| `AWS_URL` | URL publik object (diakses browser) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Kredensial Google OAuth |
| `GOOGLE_REDIRECT_URI` | Callback (harus identik dengan Google Console) |
| `RAJAONGKIR_API_KEY` | API key RajaOngkir |
| `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` | Kredensial Midtrans |
| `MIDTRANS_IS_PRODUCTION` | `false` (sandbox) |

### Frontend (`frontend-sales/.env`)

| Variabel | Keterangan |
|---|---|
| `VITE_API_BASE_URL` | Base URL API (placeholder) |

> ⚠️ **Tidak ditemukan di kode**: frontend saat ini **meng-hardcode** `http://localhost:8888`
> di kode (tidak ada penggunaan `import.meta.env`/`VITE_*`). `VITE_API_BASE_URL` disediakan
> sebagai placeholder; **harap lengkapi/refactor** bila ingin benar-benar dipakai.

---

## Peran Pengguna (RBAC)

Kolom `users.role` (default `customer`):

- **Customer** — browsing, kelola keranjang, checkout, lihat pesanan & tracking sendiri.
- **Seller** — punya 1 toko (`shops`), kelola produk & stok, proses pengiriman pesanan.
  Customer "naik pangkat" jadi seller otomatis saat membuat toko (`POST /api/shop`).
- **Admin (Super Admin)** — dashboard metrik platform & log CRM (`role === 'admin'`).

---

## Alur Transaksi

1. Customer login → tambah produk ke keranjang → **checkout** (`POST /api/checkout`, wajib auth) →
   stok divalidasi → order `pending` dibuat → Snap token Midtrans dikembalikan.
2. Customer bayar via Snap. Midtrans memanggil **webhook** (`POST /api/midtrans/notification`)
   yang **memvalidasi signature SHA-512**; frontend juga memanggil `POST /api/checkout/success`.
3. Transisi ke `paid` bersifat **idempotent** (`PaymentService`) → memicu event **`PaymentPaid`**
   → listener (queue Redis): **kurangi stok**, **tandai item `diproses`**, **catat CRM `order_paid`**.
4. **Seller** menekan "Kirim Barang" (`PUT /api/seller/orders/{itemId}/ship`) → shipment per
   (order, shop) dibuat, resi otomatis (`KRM…`) atau manual, item jadi `shipped`, CRM `order_shipped`.
5. **Customer** melacak via `GET /api/orders/{order}/shipments` (timeline `tracking_events`).
   Seller dapat memajukan status demo via `PUT /api/seller/shipments/{shipmentId}/advance`.

---

## Daftar Endpoint API

Semua route ada di `routes/api.php` (prefix `/api`). `routes/web.php` hanya `GET /` (welcome view).

### Publik (tanpa token)

| Method | Path | Handler | Catatan |
|---|---|---|---|
| GET | `/api/products` | `ProductController@index` | katalog (cache Redis 60s) |
| GET | `/api/products/{id}` | `ProductController@show` | detail produk |
| POST | `/api/login` | `AuthController@login` | |
| POST | `/api/register` | `AuthController@register` | role default `customer` |
| GET | `/api/auth/google` | `AuthController@redirectToGoogle` | mulai OAuth |
| GET | `/api/auth/google/callback` | `AuthController@handleGoogleCallback` | callback OAuth |
| GET | `/api/rajaongkir/provinces` | `RajaOngkirController@getProvinces` | |
| GET | `/api/rajaongkir/cities/{provinceId}` | `RajaOngkirController@getCities` | |
| POST | `/api/rajaongkir/cost` | `RajaOngkirController@checkCost` | |
| POST | `/api/checkout/success` | `CheckoutController@success` | `throttle:30,1`, callback Snap |
| POST | `/api/midtrans/notification` | `MidtransWebhookController@handle` | `throttle:60,1`, validasi signature |
| GET | `/api/setup-minio` | closure | buat bucket + policy public-read |

### Terproteksi (`auth:sanctum`, header `Authorization: Bearer <token>`)

| Method | Path | Handler | Catatan |
|---|---|---|---|
| POST | `/api/checkout` | `CheckoutController@process` | `throttle:30,1`, user dari token |
| GET | `/api/admin/dashboard` | `AdminController@dashboard` | role admin |
| GET | `/api/shop` | `ShopController@myShop` | |
| POST | `/api/shop` | `ShopController@store` | customer → seller |
| GET | `/api/orders` | `OrderController@index` | pesanan milik user |
| GET | `/api/orders/{order}/shipments` | `OrderController@orderShipments` | tracking, wajib pemilik order |
| GET | `/api/seller/orders` | `OrderController@sellerOrders` | |
| PUT | `/api/seller/orders/{itemId}/ship` | `OrderController@shipItem` | buat shipment + resi |
| PUT | `/api/seller/shipments/{shipmentId}/advance` | `OrderController@advanceShipment` | majukan status (demo) |
| GET | `/api/shipments/{tracking}/track` | `ShipmentController@track` | dibatasi pemilik order/toko |
| GET | `/api/seller/metrics` | `ShopController@metrics` | |
| GET | `/api/seller/products` | `ShopController@myProducts` | |
| GET | `/api/seller/products/{id}` | `ProductController@show` | |
| POST | `/api/products` | `ProductController@store` | |
| PUT | `/api/products/{id}` | `ProductController@update` | |
| DELETE | `/api/products/{id}` | `ProductController@destroy` | soft delete |
| GET | `/api/admin/crm/logs` | `CrmController@index` | role admin |
| GET | `/api/customer/activity` | `CrmController@myActivity` | aktivitas customer |

---

## Skema Database

Dari `database/migrations/`:

| Tabel | Kolom kunci | Relasi / catatan |
|---|---|---|
| `users` | `id, name, email (unique), password, role (default customer), google_id (nullable), remember_token, timestamps` | role: customer/seller/admin |
| `shops` | `id, user_id → users (cascade), nama_toko, deskripsi, timestamps` | 1 user : 1 shop |
| `products` | `id, shop_id → shops (nullable, cascade), name, price (15,2), stock (int, default 100), category, description, image, deleted_at, timestamps` | **soft deletes** |
| `orders` | `id, user_id (nullable), customer_name, status (default pending), total_price (15,2), snap_token, payment_url, timestamps` | status: pending/paid/… |
| `order_items` | `id, order_id → orders (cascade), shipment_id (nullable), product_id → products (cascade), quantity, price (15,2), resi, status (default pending), timestamps` | item ↔ shipment |
| `shipments` | `id, order_id, shop_id (nullable), courier (default NEXUS-LOG), service (default REG), tracking_number (unique), status (default created), tracking_events (json), raw_response (json), timestamps` | per (order, shop) |
| `crm_logs` | `id, user_id (nullable), order_id (nullable), event_type, description, payload (json), timestamps` | jejak CRM |
| `stock_logs` | `id, product_id, change (int), reason (default sale), order_id (nullable), timestamps` | audit stok |
| `audit_logs` | `id, user_id (nullable), action, ip_address, context (json), timestamps` | aksi sensitif |
| `personal_access_tokens` | tabel token Sanctum (default) | |
| Bawaan Laravel | `password_reset_tokens`, `sessions`, `cache`, `jobs`, `job_batches`, `failed_jobs` | |

---

## Pengujian (Postman)

1. **Register/Login** → simpan `token` dari respons, pakai sebagai `Authorization: Bearer <token>`.
2. **Checkout tanpa token** → `POST /api/checkout` harus **401**; dengan token customer → order
   tercatat atas nama user token.
3. **Webhook Midtrans** → `POST /api/midtrans/notification`:

```json
{
  "order_id": "ORD-<id>-<time>",
  "status_code": "200",
  "gross_amount": "<total>.00",
  "transaction_status": "settlement",
  "signature_key": "<sha512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)>"
}
```

- **Signature** = `hash('sha512', order_id . status_code . gross_amount . SERVER_KEY)`.
  Signature salah → **403**. Status `settlement`/`capture` (fraud `accept`/kosong) → order `paid`
  (idempotent; kiriman ulang tidak menggandakan efek).

---

## Catatan Integrasi

- **Webhook Midtrans**: saat lokal, Midtrans tidak bisa menjangkau `localhost`. Gunakan tunnel
  (mis. ngrok) dan set Notification URL Midtrans ke `https://<tunnel>/api/midtrans/notification`.
- **Google OAuth**: `GOOGLE_REDIRECT_URI` di `.env` **harus identik** dengan Authorized Redirect
  URI di Google Cloud Console (default: `http://localhost:8888/api/auth/google/callback`).
- **Migrasi**: jalankan **sekali** dari satu node (`docker compose exec backend1 php artisan migrate`)
  karena ketiga node berbagi DB Neon yang sama.
- **Queue worker** harus berjalan agar listener `PaymentPaid` (stok/shipment/CRM) diproses:
  `docker compose logs -f queue-worker`.

---

## Keamanan

- **Jangan commit `.env`** (backend & frontend) — sudah diabaikan via `.gitignore`. Hanya
  `*.env.example` (placeholder) yang di-track.
- Jika `.env` pernah ter-commit / ter-push, **rotasi semua kredensial** (DB Neon, Midtrans,
  Google, MinIO) karena riwayat git menyimpannya.
- **Webhook Midtrans** divalidasi **signature SHA-512** sebelum diproses.
- **Rate limiting**: `throttle:30,1` (checkout & checkout/success) dan `throttle:60,1` (webhook).
- Checkout dipagari `auth:sanctum`; `user_id` order diambil dari token (bukan input frontend).
- **Audit log** (`audit_logs`) mencatat aksi penting (webhook ditolak, listener gagal, produk dihapus).

---

## Kredit dan Kontak

- **Nama**: `Willy Rafael F. Silalahi`
- **GitHub**: [@willyrafaelfs](https://github.com/willyrafaelfs)
- **Email**: [willy.rafaelfs@gmail.com](mailto:willy.rafaelfs@gmail.com)

>Proyek ini dibuat untuk keperluan akademik (tugas mata kuliah Sistem Integrasi).