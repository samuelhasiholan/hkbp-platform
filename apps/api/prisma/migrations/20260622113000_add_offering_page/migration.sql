WITH upserted_page AS (
  INSERT INTO "Page" (
    "id",
    "slug",
    "title",
    "eyebrow",
    "description",
    "summary",
    "callout",
    "layoutVariant",
    "seoTitle",
    "seoDescription",
    "status",
    "createdAt",
    "updatedAt",
    "deletedAt"
  )
  VALUES (
    'page-persembahan',
    'persembahan',
    'Persembahan',
    'Dukungan Pelayanan',
    'Informasi persembahan jemaat untuk mendukung pelayanan, persekutuan, kesaksian, dan pekerjaan kasih gereja.',
    'Jemaat dapat memberikan persembahan melalui rekening gereja atau kanal pembayaran resmi yang diinformasikan oleh gereja.',
    NULL,
    'offering',
    'Persembahan',
    'Informasi persembahan jemaat untuk mendukung pelayanan gereja melalui rekening resmi dan QRIS.',
    'PUBLISHED',
    NOW(),
    NOW(),
    NULL
  )
  ON CONFLICT ("slug") DO UPDATE SET
    "title" = EXCLUDED."title",
    "eyebrow" = EXCLUDED."eyebrow",
    "description" = EXCLUDED."description",
    "summary" = EXCLUDED."summary",
    "layoutVariant" = EXCLUDED."layoutVariant",
    "seoTitle" = EXCLUDED."seoTitle",
    "seoDescription" = EXCLUDED."seoDescription",
    "status" = 'PUBLISHED',
    "updatedAt" = NOW(),
    "deletedAt" = NULL
  RETURNING "id"
),
removed_highlights AS (
  DELETE FROM "PageHighlight"
  WHERE "pageId" = (SELECT "id" FROM upserted_page)
),
removed_sections AS (
  DELETE FROM "PageSection"
  WHERE "pageId" = (SELECT "id" FROM upserted_page)
)
INSERT INTO "PageHighlight" ("id", "pageId", "text", "sortOrder")
VALUES
  ('persembahan-highlight-informasi', (SELECT "id" FROM upserted_page), 'Informasi persembahan', 0),
  ('persembahan-highlight-rekening', (SELECT "id" FROM upserted_page), 'Rekening gereja', 1),
  ('persembahan-highlight-qris', (SELECT "id" FROM upserted_page), 'QRIS resmi', 2);

WITH offering_page AS (
  SELECT "id" FROM "Page" WHERE "slug" = 'persembahan'
)
INSERT INTO "PageSection" ("id", "pageId", "title", "body", "sortOrder")
VALUES
  (
    'persembahan-section-informasi',
    (SELECT "id" FROM offering_page),
    'Informasi Persembahan',
    'Persembahan adalah bagian dari ungkapan syukur jemaat kepada Tuhan dan dukungan bagi pelayanan gereja. Setiap persembahan yang diterima akan digunakan untuk mendukung ibadah, pelayanan kategorial, kegiatan jemaat, pemeliharaan sarana gereja, serta pelayanan kasih sesuai tata kelola gereja.

Mohon pastikan setiap persembahan diberikan melalui kanal resmi gereja. Informasi rekening dan QRIS dapat diperbarui oleh admin melalui CMS agar selalu sesuai dengan data terbaru.',
    0
  ),
  (
    'persembahan-section-rekening',
    (SELECT "id" FROM offering_page),
    'Rekening Gereja',
    'Bank: -
Nomor Rekening: -
Atas Nama: -

Silakan lengkapi informasi rekening resmi gereja melalui CMS sebelum halaman ini dipublikasikan untuk jemaat.',
    1
  ),
  (
    'persembahan-section-qris',
    (SELECT "id" FROM offering_page),
    'QRIS',
    'QRIS resmi gereja dapat ditampilkan pada bagian ini. Tempel URL gambar QRIS pada isi section ini agar gambar tampil otomatis di halaman publik.

Contoh:
https://domain-gereja.org/uploads/qris.png',
    2
  );
