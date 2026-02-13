import type {ApiResponse} from "./types";

export async function apiFetch<T>(
    url: string,
    options?: RequestInit & { adminSecret?: string }
): Promise<ApiResponse<T>> {
    const {adminSecret, headers: customHeaders, ...rest} = options ?? {};

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(adminSecret ? {"X-Admin-Secret": adminSecret} : {}),
    };

    if (customHeaders) {
        const h =
            customHeaders instanceof Headers
                ? Object.fromEntries(customHeaders.entries())
                : (customHeaders as Record<string, string>);
        Object.assign(headers, h);
    }

    const res = await fetch(url, {headers, ...rest});
    return res.json();
}
