import {prisma} from "./prisma";

const GLOBAL_SESSION_ID = "lixi-2025";

export async function getOrCreateLixiSession(total: number, amounts: number[]) {
    const existing = await prisma.lixiSession.findUnique({
        where: {id: GLOBAL_SESSION_ID},
        include: {spins: {orderBy: {spinOrder: "asc"}}},
    });
    if (existing) return existing;

    return prisma.lixiSession.create({
        data: {id: GLOBAL_SESSION_ID, total, amounts},
        include: {spins: {orderBy: {spinOrder: "asc"}}},
    });
}

export async function recordLixiSpin(
    playerName: string,
    amount: number,
    spinOrder: number
) {
    return prisma.lixiSpin.create({
        data: {sessionId: GLOBAL_SESSION_ID, playerName, amount, spinOrder},
    });
}

export async function getLixiSession() {
    return prisma.lixiSession.findUnique({
        where: {id: GLOBAL_SESSION_ID},
        include: {spins: {orderBy: {spinOrder: "asc"}}},
    });
}

export async function resetLixiSession(total: number, amounts: number[]) {
    await prisma.lixiSpin.deleteMany({where: {sessionId: GLOBAL_SESSION_ID}});
    await prisma.lixiSession.deleteMany({where: {id: GLOBAL_SESSION_ID}});
    return prisma.lixiSession.create({
        data: {id: GLOBAL_SESSION_ID, total, amounts},
        include: {spins: {orderBy: {spinOrder: "asc"}}},
    });
}
