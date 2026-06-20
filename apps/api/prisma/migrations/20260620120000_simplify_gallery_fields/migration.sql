-- Preserve a required gallery description before removing legacy fields.
UPDATE "GalleryItem"
SET "description" = COALESCE(NULLIF("GalleryItem"."description", ''), "GalleryItem"."title", "MediaAsset"."description", "MediaAsset"."url")
FROM "MediaAsset"
WHERE "GalleryItem"."mediaId" = "MediaAsset"."id"
  AND ("GalleryItem"."description" IS NULL OR "GalleryItem"."description" = '');

ALTER TABLE "GalleryItem"
  ALTER COLUMN "description" SET NOT NULL,
  DROP COLUMN "title",
  DROP COLUMN "category",
  DROP COLUMN "eventDate",
  DROP COLUMN "sortOrder";

ALTER TABLE "MediaAsset"
  DROP COLUMN "type",
  DROP COLUMN "fileName",
  DROP COLUMN "mimeType",
  DROP COLUMN "sizeBytes",
  DROP COLUMN "altText",
  DROP COLUMN "description";

DROP TYPE "MediaType";
