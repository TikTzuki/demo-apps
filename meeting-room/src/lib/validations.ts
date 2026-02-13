import {z} from "zod";

export const createBookingSchema = z.object({
    roomId: z.string().uuid(),
    bookerName: z.string().min(1, "Name is required").max(100).trim(),
    startTime: z.string().datetime(),
    durationMinutes: z.union([
        z.literal(15),
        z.literal(30),
        z.literal(45),
        z.literal(60),
        z.literal(90),
        z.literal(120),
    ]),
});

export const createOrgSchema = z.object({
    name: z.string().min(1, "Name is required").max(200).trim(),
    description: z.string().max(500).trim().optional(),
});

export const createRoomSchema = z.object({
    name: z.string().min(1, "Name is required").max(200).trim(),
    capacity: z.number().int().min(1).max(1000),
    location: z.string().max(200).trim().optional(),
});
