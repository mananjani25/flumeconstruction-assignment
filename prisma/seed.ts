import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type SeedProduct = {
  product_name: string;
  category: string;
  unit_price: number;
  currency: string;
  unit_of_measure: string;
  lead_time_days: number;
};

type SeedSupplier = {
  name: string;
  country: string;
  website?: string;
  products: SeedProduct[];
};

async function main() {
  const raw = readFileSync(join(process.cwd(), "seed.json"), "utf-8");
  const suppliers: SeedSupplier[] = JSON.parse(raw);

  // Idempotent: wipe existing catalog data before importing.
  await prisma.sourcingOption.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();

  let productCount = 0;
  for (const s of suppliers) {
    await prisma.supplier.create({
      data: {
        name: s.name,
        country: s.country,
        website: s.website ?? null,
        products: {
          create: s.products.map((p) => ({
            name: p.product_name,
            category: p.category,
            unitPrice: p.unit_price,
            currency: p.currency,
            unitOfMeasure: p.unit_of_measure,
            leadTimeDays: p.lead_time_days,
          })),
        },
      },
    });
    productCount += s.products.length;
  }

  console.log(
    `Seeded ${suppliers.length} suppliers and ${productCount} products.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
