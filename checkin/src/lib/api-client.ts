import type {ApiResponse} from "@/lib/types";

/** Thin fetch wrapper: one place that knows the ApiResponse envelope. */
export async function apiFetch<T>(
    url: string,
    init?: RequestInit & { json?: unknown }
): Promise<ApiResponse<T>> {
    const {json, ...rest} = init ?? {};
    try {
        const response = await fetch(url, {
            ...rest,
            headers: json ? {"Content-Type": "application/json", ...rest.headers} : rest.headers,
            body: json ? JSON.stringify(json) : rest.body,
        });
        return (await response.json()) as ApiResponse<T>;
    } catch {
        return {success: false, error: "Mất kết nối tới máy chủ"};
    }
}

/** Trigger a browser download for an endpoint that returns a file. */
export async function downloadFile(url: string, fallbackName: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const payload = await response.json().catch(() => null);
            return payload?.error ?? "Không thể tải tệp";
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const filename =
            response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ??
            fallbackName;

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
        return null;
    } catch {
        return "Không thể tải tệp";
    }
}
