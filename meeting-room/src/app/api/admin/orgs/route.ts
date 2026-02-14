import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAdmin} from "@/lib/admin-auth";
import {createOrgSchema} from "@/lib/validations";

export async function POST(request: NextRequest) {
    const authError = requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const parsed = createOrgSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.errors[0].message},
                {status: 400}
            );
        }

        // Check tag uniqueness
        const existing = await prisma.organization.findUnique({
            where: {tag: parsed.data.tag},
        });
        if (existing) {
            return NextResponse.json(
                {success: false, error: "Tag is already taken"},
                {status: 409}
            );
        }

        const org = await prisma.organization.create({
            data: parsed.data,
        });

        return NextResponse.json(
            {success: true, data: {id: org.id, name: org.name, tag: org.tag, description: org.description}},
            {status: 201}
        );
    } catch (e) {
        return NextResponse.json(
            {success: false, error: "Failed to create organization"},
            {status: 500}
        );
    }
}
