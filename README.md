# NEXUS SALES

Platform e-commerce multi-seller (tugas Sistem Integrasi). Monorepo berisi backend
Laravel dan frontend React, diorkestrasi dengan Docker Compose.

## Arsitektur

```
Browser / React (Vite :5173)
        │
        ▼
Nginx Load Balancer (:8888)  ──FastCGI──►  backend1 / backend2 / backend3  (PHP-FPM :9000)
        │                                            │
   Traefik (:80, :8080)                         PostgreSQL @ Neon (remote)
                                                Redis (queue + cache)
                                                MinIO (S3 object storage :9000 / console :9001)
                                                queue-worker (php artisan queue:work)
```

- **Backend** (`backend-sales/`): Laravel REST API, auth Sanctum + Google OAuth (Socialite),
  Midtrans (payment, webhook signature), RajaOngkir (ongkir), event-based integration
  (PaymentPaid → stok turun / shipment / CRM), cache katalog ke Redis.
- **Frontend** (`frontend-sales/`): React + Vite + Tailwind + React Router + Context API.
- **Database**: PostgreSQL (Neon, pakai host pooled).

## Menjalankan (Docker)

```bash
# 1. Siapkan environment
cp backend-sales/.env.example backend-sales/.env
cp frontend-sales/.env.example frontend-sales/.env
#   isi kredensial (Neon, Midtrans, Google, MinIO) di backend-sales/.env

# 2. Build & jalankan seluruh stack dari root
docker compose build
docker compose up -d

# 3. Generate APP_KEY & migrasi (sekali)
docker compose exec backend1 php artisan key:generate
docker compose exec backend1 php artisan migrate

# 4. Buat bucket MinIO (sekali)
curl http://localhost:8888/api/setup-minio
```

### Port yang bisa diakses
| Layanan | URL |
|---|---|
| Frontend (React) | http://localhost:5173 |
| API (via Nginx LB) | http://localhost:8888 |
| Traefik dashboard | http://localhost:8080 |
| MinIO console | http://localhost:9001 |
| MinIO S3 API | http://localhost:9000 |
| Redis | localhost:6379 |

## Catatan operasional

- **OPcache** memakai `validate_timestamps=0` → setelah ubah kode backend:
  `docker compose restart backend1 backend2 backend3`.
- **Config cache**: setelah ubah `.env` → `docker compose exec backend1 php artisan optimize:clear`
  lalu restart backend.
- Queue worker: pantau dengan `docker compose logs -f queue-worker`.

## Keamanan

`.env` (backend & frontend) **tidak** di-commit. Lihat `*.env.example` untuk struktur variabel.
Isi nilai asli (DB Neon, Midtrans, Google, MinIO) hanya di `.env` lokal.
