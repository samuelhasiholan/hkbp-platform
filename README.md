# HKBP Platform

Monorepo untuk CMS dan backend HKBP Resort Srengseng Sawah. Project ini dipisah dari `hkbp-frontend` agar website publik tetap stabil saat API dan CMS dikembangkan.

## Struktur

```text
apps/api          REST API, auth, Prisma, upload file
apps/admin        Admin CMS berbasis Next.js
packages/shared   Tipe dan schema bersama
```

## Setup lokal

```bash
cp .env.example .env
docker compose up -d
yarn install
yarn db:generate
yarn db:migrate
yarn db:seed
yarn dev:api
yarn dev:admin
```

Admin seed awal:

```text
email: admin@hkbp.local
password: admin12345
```

## Integrasi ke hkbp-frontend

Tambahkan `.env.local` di project `hkbp-frontend`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Contoh fetch:

```ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/warta/current`, {
  next: { revalidate: 300 },
});
const result = await response.json();
const weeklyWarta = result.data;
```

## Auth admin

Endpoint backend:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Admin CMS memakai route handler internal Next untuk menyimpan token sebagai `httpOnly cookie`:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Setelah login berhasil, dashboard `/` akan memvalidasi cookie ke backend. Jika token tidak valid, user diarahkan ke `/login`.

## Endpoint publik awal

- `GET /api/health`
- `GET /api/public/site-settings`
- `GET /api/public/pages/*`
- `GET /api/public/publications`
- `GET /api/public/publications/:slug`
- `GET /api/public/warta/current`
- `GET /api/public/warta/archive`
- `GET /api/public/schedules`
