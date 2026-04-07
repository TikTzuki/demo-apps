import {NextRequest} from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

async function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const search = req.nextUrl.search;
    const targetUrl = `${BACKEND_URL}${path}${search}`;

    const headers = new Headers(req.headers);
    headers.delete("host");

    const res = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: req.body,
        // @ts-expect-error -- Node.js fetch supports duplex for streaming request bodies
        duplex: "half",
    });

    return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
    });
}

export async function GET(req: NextRequest) {
    return proxy(req);
}

export async function POST(req: NextRequest) {
    return proxy(req);
}

export async function PUT(req: NextRequest) {
    return proxy(req);
}

export async function DELETE(req: NextRequest) {
    return proxy(req);
}

export async function PATCH(req: NextRequest) {
    return proxy(req);
}

// Allow long-running requests (AI review can take 60s+)
export const maxDuration = 120;
