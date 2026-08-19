/**
 * Idempotent startup seed: one admin account and the attendance policy row.
 *
 * Runs on every boot (see entrypoint.sh). Re-running is a no-op, and it never
 * overwrites a password an admin has since changed.
 */
import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";

const SETTINGS_ID = "default";

async function main() {
    const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD ?? "";
    const name = process.env.ADMIN_NAME ?? "Quản trị viên";

    if (!email || !password) {
        throw new Error("ADMIN_EMAIL và ADMIN_PASSWORD phải được cấu hình trong biến môi trường");
    }
    if (password.length < 8) {
        throw new Error("ADMIN_PASSWORD phải có tối thiểu 8 ký tự");
    }

    const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
    const prisma = new PrismaClient({adapter});

    try {
        await prisma.attendanceSetting.upsert({
            where: {id: SETTINGS_ID},
            create: {id: SETTINGS_ID},
            update: {},
        });
        console.log("Attendance settings ready.");

        const existing = await prisma.adminUser.findUnique({where: {email}});
        if (existing) {
            // Only reactivate; leave the stored hash alone so a rotated password
            // is not silently reverted to the env value on the next deploy.
            if (!existing.isActive) {
                await prisma.adminUser.update({where: {email}, data: {isActive: true}});
                console.log(`Admin reactivated: ${email}`);
            } else {
                console.log(`Admin already exists: ${email}`);
            }
            return;
        }

        await prisma.adminUser.create({
            data: {email, name, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN"},
        });
        console.log(`Admin created: ${email}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
