INSERT INTO "Page" (
  "id",
  "slug",
  "title",
  "eyebrow",
  "description",
  "summary",
  "layoutVariant",
  "seoTitle",
  "seoDescription",
  "status",
  "createdAt",
  "updatedAt",
  "deletedAt"
)
VALUES (
  'page-pelayanan-struktur-pelayanan',
  'pelayanan/struktur-pelayanan',
  'Struktur Pelayanan',
  'Pelayanan',
  'Susunan pelayan gereja yang mendukung penggembalaan, administrasi, persekutuan, kesaksian, dan pelayanan kasih.',
  'Halaman ini menggabungkan pendeta, fungsionaris, dan dewan pelayanan agar jemaat dapat melihat struktur pelayanan gereja secara utuh.',
  'service-structure',
  'Struktur Pelayanan',
  'Susunan pendeta, fungsionaris, dewan pelayanan, dan seksi-seksi pelayanan HKBP Resort Srengseng Sawah.',
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
  "deletedAt" = NULL,
  "updatedAt" = NOW();

DELETE FROM "PageHighlight"
WHERE "pageId" = (
  SELECT "id" FROM "Page" WHERE "slug" = 'pelayanan/struktur-pelayanan'
);

DELETE FROM "PageSection"
WHERE "pageId" = (
  SELECT "id" FROM "Page" WHERE "slug" = 'pelayanan/struktur-pelayanan'
);

INSERT INTO "PageHighlight" ("id", "pageId", "text", "sortOrder")
VALUES
  ('struktur-pelayanan-highlight-pelayan', (SELECT "id" FROM "Page" WHERE "slug" = 'pelayanan/struktur-pelayanan'), 'Pendeta dan fungsionaris', 0),
  ('struktur-pelayanan-highlight-dewan', (SELECT "id" FROM "Page" WHERE "slug" = 'pelayanan/struktur-pelayanan'), 'Dewan Koinonia, Marturia, dan Diakonia', 1),
  ('struktur-pelayanan-highlight-seksi', (SELECT "id" FROM "Page" WHERE "slug" = 'pelayanan/struktur-pelayanan'), 'Seksi-seksi pelayanan', 2);

INSERT INTO "PageSection" ("id", "pageId", "title", "body", "sortOrder")
VALUES
  (
    'struktur-pelayanan-section-koordinasi',
    (SELECT "id" FROM "Page" WHERE "slug" = 'pelayanan/struktur-pelayanan'),
    'Koordinasi Pelayanan',
    'Setiap bagian pelayanan saling terhubung melalui penggembalaan, administrasi, pembinaan, kesaksian, dan pelayanan kasih agar kebutuhan jemaat dapat dilayani dengan tertib.',
    0
  ),
  (
    'struktur-pelayanan-section-cms',
    (SELECT "id" FROM "Page" WHERE "slug" = 'pelayanan/struktur-pelayanan'),
    'Data CMS',
    'Profil pelayan dan kategori pelayanan dapat diperbarui melalui modul Pelayanan di CMS admin.',
    1
  );

UPDATE "Page"
SET
  "status" = 'ARCHIVED',
  "deletedAt" = COALESCE("deletedAt", NOW()),
  "updatedAt" = NOW()
WHERE "slug" IN (
  'pelayanan/pendeta',
  'pelayanan/fungsionaris',
  'pelayanan/dewan-koinonia',
  'pelayanan/dewan-marturia',
  'pelayanan/dewan-diakonia'
);
