import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
    return new PrismaClient({
        adapter: new PrismaPg({connectionString: process.env.DATABASE_URL}),
    });
}

// Reuse the client across hot reloads; a fresh one per reload leaks a
// connection pool, which exhausts a database quickly in development.
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
