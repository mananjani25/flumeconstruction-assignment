import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Mirror of src/lib/auth.hashPassword. Inlined here so the seed script doesn't
// import the request-scoped auth module (which pulls in next/headers).
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const DEMO_USER = { email: "demo@litesourcing.dev", password: "password123" };

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

  // Seed a demo login (idempotent). Reset the password on every seed so the
  // documented credentials always work.
  await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { passwordHash: hashPassword(DEMO_USER.password) },
    create: {
      email: DEMO_USER.email,
      name: "Demo Buyer",
      passwordHash: hashPassword(DEMO_USER.password),
    },
  });

  console.log(
    `Seeded ${suppliers.length} suppliers and ${productCount} products.`
  );
  console.log(
    `Demo login: ${DEMO_USER.email} / ${DEMO_USER.password}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
