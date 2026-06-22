-- Rename public CMS page slugs from Organisasi to Pelayanan.
UPDATE "Page"
SET
    "slug" = regexp_replace("slug", '^organisasi', 'pelayanan'),
    "eyebrow" = CASE WHEN "eyebrow" = 'Organisasi' THEN 'Pelayanan' ELSE "eyebrow" END,
    "title" = CASE WHEN "slug" = 'organisasi' THEN 'Pelayanan' ELSE "title" END,
    "summary" = CASE
        WHEN "slug" = 'organisasi' THEN 'Pelayanan jemaat menolong pelayanan berjalan tertib: pendeta, parhalado, fungsionaris, dewan, dan wijk bekerja bersama sesuai tugas masing-masing.'
        ELSE "summary"
    END,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE ("slug" = 'organisasi' OR "slug" LIKE 'organisasi/%')
  AND NOT EXISTS (
    SELECT 1
    FROM "Page" existing
    WHERE existing."slug" = regexp_replace("Page"."slug", '^organisasi', 'pelayanan')
  );

-- Move Jadwal Pelayanan into the new Pelayanan route.
UPDATE "Page"
SET
    "slug" = 'pelayanan/jadwal-pelayanan',
    "layoutVariant" = 'article',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'jadwal-pelayanan'
  AND NOT EXISTS (
    SELECT 1 FROM "Page" existing WHERE existing."slug" = 'pelayanan/jadwal-pelayanan'
  );

-- Archive old child schedule pages because their content is now merged into the parent page.
UPDATE "Page"
SET
    "status" = 'ARCHIVED',
    "deletedAt" = COALESCE("deletedAt", CURRENT_TIMESTAMP),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" IN (
    'jadwal-pelayanan/ibadah-minggu',
    'jadwal-pelayanan/partangiangan',
    'jadwal-pelayanan/pelayanan-khusus'
);

-- Replace the parent schedule sections with the merged one-page structure.
DELETE FROM "PageSection"
WHERE "pageId" IN (
    SELECT "id" FROM "Page" WHERE "slug" = 'pelayanan/jadwal-pelayanan'
);

INSERT INTO "PageSection" ("id", "pageId", "title", "body", "sortOrder")
SELECT
    'jadwal-pelayanan-section-ibadah-minggu',
    "id",
    'Ibadah Minggu',
    'Ibadah Minggu dilaksanakan sebagai ruang utama persekutuan jemaat untuk memuji Tuhan, mendengar firman, berdoa, dan menerima penguatan iman bersama keluarga besar HKBP Resort Srengseng Sawah.

Ibadah Pagi: 06.30 - selesai
Ibadah Siang: 09.30 - selesai
Ibadah Sore: 18.00 - selesai
Ibadah Remaja: 09.00 - selesai
Sekolah Minggu: 07.00 - selesai

Bagian ini juga dapat memuat nama pengkhotbah, liturgis, pembaca epistel, song leader, pemusik, kolektan, penerima tamu, petugas multimedia, dan pelayan lain yang bertugas dalam ibadah Minggu.',
    0
FROM "Page"
WHERE "slug" = 'pelayanan/jadwal-pelayanan'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PageSection" ("id", "pageId", "title", "body", "sortOrder")
SELECT
    'jadwal-pelayanan-section-partangiangan',
    "id",
    'Partangiangan',
    'Partangiangan wijk menjadi ruang persekutuan keluarga jemaat untuk berdoa, bernyanyi, membaca firman Tuhan, dan saling menguatkan dalam kehidupan sehari-hari. Melalui partangiangan, warga jemaat dapat semakin dekat satu sama lain dan semakin terhubung dengan pelayanan gereja.

Jadwal dapat menampilkan nama wijk, tanggal, waktu, alamat atau tuan rumah, pelayan firman, serta catatan khusus bagi warga yang hadir. Persekutuan doa kategorial juga dapat diumumkan di bagian ini sesuai program pembinaan jemaat.',
    1
FROM "Page"
WHERE "slug" = 'pelayanan/jadwal-pelayanan'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PageSection" ("id", "pageId", "title", "body", "sortOrder")
SELECT
    'jadwal-pelayanan-section-pelayanan-khusus',
    "id",
    'Pelayanan Khusus',
    'Pelayanan khusus meliputi baptisan kudus, naik sidi, pemberkatan pernikahan, perkunjungan orang sakit, penghiburan dukacita, dan pelayanan pastoral lainnya. Setiap pelayanan dilaksanakan dengan pendampingan firman, doa, serta tata pelayanan gereja yang tertib.

Warga jemaat dapat menghubungi kantor gereja, pendeta, atau parhalado wijk untuk mengetahui persyaratan, jadwal, dokumen yang perlu disiapkan, serta bentuk pendampingan yang diperlukan.',
    2
FROM "Page"
WHERE "slug" = 'pelayanan/jadwal-pelayanan'
ON CONFLICT ("id") DO NOTHING;
