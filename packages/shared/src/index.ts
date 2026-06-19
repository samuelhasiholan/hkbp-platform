import { z } from "zod";

export const contentStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const publicationCategorySchema = z.enum(["BERITA_KEGIATAN", "ARTIKEL_RENUNGAN", "PUBLIKASI_RESMI"]);
export const wartaLanguageSchema = z.enum(["INDONESIA", "BATAK"]);

export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type PublicationCategory = z.infer<typeof publicationCategorySchema>;
export type WartaLanguage = z.infer<typeof wartaLanguageSchema>;
