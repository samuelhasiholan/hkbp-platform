-- Canonicalize public page slugs after simplifying the main navigation labels.

UPDATE "Page"
SET
  "slug" = regexp_replace("slug", '^tentang-gereja', 'tentang'),
  "title" = CASE WHEN "slug" = 'tentang-gereja' THEN 'Tentang' ELSE "title" END,
  "eyebrow" = CASE WHEN "eyebrow" = 'Tentang Gereja' THEN 'Tentang' ELSE "eyebrow" END,
  "updatedAt" = NOW()
WHERE ("slug" = 'tentang-gereja' OR "slug" LIKE 'tentang-gereja/%')
  AND NOT EXISTS (
    SELECT 1
    FROM "Page" existing
    WHERE existing."slug" = regexp_replace("Page"."slug", '^tentang-gereja', 'tentang')
  );

UPDATE "Page"
SET
  "slug" = regexp_replace("slug", '^warta-jemaat', 'warta'),
  "title" = CASE WHEN "slug" = 'warta-jemaat' THEN 'Warta' ELSE "title" END,
  "eyebrow" = CASE WHEN "eyebrow" = 'Warta Jemaat' THEN 'Warta' ELSE "eyebrow" END,
  "updatedAt" = NOW()
WHERE ("slug" = 'warta-jemaat' OR "slug" LIKE 'warta-jemaat/%')
  AND NOT EXISTS (
    SELECT 1
    FROM "Page" existing
    WHERE existing."slug" = regexp_replace("Page"."slug", '^warta-jemaat', 'warta')
  );

UPDATE "Page"
SET
  "slug" = 'publikasi',
  "title" = 'Publikasi',
  "updatedAt" = NOW()
WHERE "slug" = 'berita-publikasi'
  AND NOT EXISTS (
    SELECT 1 FROM "Page" existing WHERE existing."slug" = 'publikasi'
  );

UPDATE "Page"
SET
  "eyebrow" = CASE
    WHEN "eyebrow" = 'Tentang Gereja' THEN 'Tentang'
    WHEN "eyebrow" = 'Warta Jemaat' THEN 'Warta'
    ELSE "eyebrow"
  END,
  "updatedAt" = NOW()
WHERE "eyebrow" IN ('Tentang Gereja', 'Warta Jemaat');

UPDATE "SiteSetting"
SET
  "value" = jsonb_set(
    jsonb_set("value"::jsonb, '{secondaryLabel}', '"Baca Warta"', true),
    '{secondaryHref}',
    '"/warta/warta-mingguan"',
    true
  ),
  "updatedAt" = NOW()
WHERE "key" = 'homeHero';
