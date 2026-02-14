import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Clean existing data
    await prisma.booking.deleteMany();
    await prisma.meetingRoom.deleteMany();
    await prisma.organization.deleteMany();

    // Create organizations
    const acme = await prisma.organization.create({
        data: {
            name: "Acme Corp",
            tag: "acmecorp",
            description: "Global headquarters — main campus",
        },
    });

    const startupHub = await prisma.organization.create({
        data: {
            name: "StartupHub",
            tag: "startuphub",
            description: "Co-working space — downtown",
        },
    });

    // Create rooms for Acme Corp
    const roomA = await prisma.meetingRoom.create({
        data: {
            name: "Room A",
            capacity: 8,
            location: "3rd Floor",
            organizationId: acme.id,
        },
    });

    const fishbowl = await prisma.meetingRoom.create({
        data: {
            name: "The Fishbowl",
            capacity: 12,
            location: "2nd Floor",
            organizationId: acme.id,
        },
    });

    const brainstorm = await prisma.meetingRoom.create({
        data: {
            name: "Brainstorm Suite",
            capacity: 6,
            location: "3rd Floor",
            organizationId: acme.id,
        },
    });

    // Create rooms for StartupHub
    await prisma.meetingRoom.create({
        data: {
            name: "Focus Pod",
            capacity: 4,
            location: "1st Floor",
            organizationId: startupHub.id,
        },
    });

    await prisma.meetingRoom.create({
        data: {
            name: "Workshop Room",
            capacity: 20,
            location: "2nd Floor",
            organizationId: startupHub.id,
        },
    });

    // Create sample bookings for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.booking.create({
        data: {
            bookerName: "John",
            startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
            endTime: new Date(today.getTime() + 10.5 * 60 * 60 * 1000), // 10:30
            roomId: roomA.id,
        },
    });

    await prisma.booking.create({
        data: {
            bookerName: "Sarah",
            startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 14:00
            endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 15:00
            roomId: roomA.id,
        },
    });

    await prisma.booking.create({
        data: {
            bookerName: "Mike",
            startTime: new Date(today.getTime() + 15.5 * 60 * 60 * 1000), // 15:30
            endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 16:00
            roomId: roomA.id,
        },
    });

    await prisma.booking.create({
        data: {
            bookerName: "Alice",
            startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 09:00
            endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
            roomId: fishbowl.id,
        },
    });

    await prisma.booking.create({
        data: {
            bookerName: "Bob",
            startTime: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11:00
            endTime: new Date(today.getTime() + 12.5 * 60 * 60 * 1000), // 12:30
            roomId: brainstorm.id,
        },
    });

    console.log("Seed complete: 2 orgs, 5 rooms, 5 bookings");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
