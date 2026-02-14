import {z} from "zod";

export const orgTagSchema = z.string()
    .min(1, "Tag is required")
    .max(50)
    .trim()
    .regex(/^[a-z0-9]+$/, "Tag must be lowercase letters and numbers only (e.g. myorg4)");

export const createBookingSchema = z.object({
    roomId: z.string().uuid(),
    bookerName: z.string().min(1, "Name is required").max(100).trim(),
    startTime: z.string().datetime(),
    durationMinutes: z.number().int().min(30).max(720).refine(
        (v) => v % 30 === 0,
        {message: "Duration must be a multiple of 30 minutes"}
    ),
});

export const createOrgSchema = z.object({
    name: z.string().min(1, "Name is required").max(200).trim(),
    tag: orgTagSchema,
    description: z.string().max(500).trim().optional(),
});

export const createRoomSchema = z.object({
    name: z.string().min(1, "Name is required").max(200).trim(),
    capacity: z.number().int().min(1).max(1000),
    location: z.string().max(200).trim().optional(),
});
