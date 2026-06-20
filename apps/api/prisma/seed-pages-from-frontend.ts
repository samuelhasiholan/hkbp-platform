import path from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), "../../.env") });

const prisma = new PrismaClient();

type FrontendPageContent = {
  title: string;
  eyebrow: string;
  description: string;
  summary: string;
  highlights: string[];
  sections: { title: string; body: string }[];
  callout?: string;
  layoutVariant?: string;
};

async function loadFrontendPages() {
  const contentPath = path.resolve(process.cwd(), "../../../hkbp-frontend/app/_data/site-content.ts");
  const module = (await import(pathToFileURL(contentPath).href)) as {
    pageContent: Record<string, FrontendPageContent>;
  };
  return module.pageContent;
}

async function main() {
  const pageContent = await loadFrontendPages();

  for (const [slug, content] of Object.entries(pageContent)) {
    await prisma.page.upsert({
      where: { slug },
      update: {
        title: content.title,
        eyebrow: content.eyebrow,
        description: content.description,
        summary: content.summary,
        callout: content.callout ?? null,
        layoutVariant: content.layoutVariant ?? null,
        status: "PUBLISHED",
        deletedAt: null,
        highlights: {
          deleteMany: {},
          create: content.highlights.map((text, sortOrder) => ({ text, sortOrder })),
        },
        sections: {
          deleteMany: {},
          create: content.sections.map((section, sortOrder) => ({
            title: section.title,
            body: section.body,
            sortOrder,
          })),
        },
      },
      create: {
        slug,
        title: content.title,
        eyebrow: content.eyebrow,
        description: content.description,
        summary: content.summary,
        callout: content.callout ?? null,
        layoutVariant: content.layoutVariant ?? null,
        status: "PUBLISHED",
        highlights: {
          create: content.highlights.map((text, sortOrder) => ({ text, sortOrder })),
        },
        sections: {
          create: content.sections.map((section, sortOrder) => ({
            title: section.title,
            body: section.body,
            sortOrder,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${Object.keys(pageContent).length} pages from hkbp-frontend.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
