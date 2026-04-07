const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Department {
    id: number;
    name: string;
    description?: string;
    cv_count?: number;
}

export interface CV {
    id: number;
    filename: string;
    original_filename: string;
    department_id: number;
    uploaded_at: string;
    status: "pending" | "passed" | "failed";
    review_score?: number | null;
    best_match_percentage?: number | null;
    review?: Review | null;
    has_review?: boolean;
}

export interface Review {
    id: number;
    cv_id: number;
    overall_score: number;
    strengths: string[];
    weaknesses: string[];
    detailed_review: string;
    created_at: string;
}

export interface JD {
    id: number;
    department_id: number;
    title: string;
    description: string;
    requirements: string;
    created_at: string;
    updated_at?: string;
}

export interface MatchedItem {
    requirement: string;
    status: "matched" | "partial" | "missing";
    evidence: string;
}

export interface Match {
    id: number;
    cv_id: number;
    jd_id: number;
    jd_title?: string;
    match_percentage: number;
    match_details: string;
    matched_items: MatchedItem[];
    created_at: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function getAdminKey(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("admin_key") || "";
}

export function setAdminKey(key: string) {
    localStorage.setItem("admin_key", key);
}

export function clearAdminKey() {
    localStorage.removeItem("admin_key");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "X-Admin-Key": getAdminKey(),
            ...(options?.body instanceof FormData
                ? {}
                : {"Content-Type": "application/json"}),
            ...options?.headers,
        },
    });

    if (res.status === 401) {
        clearAdminKey();
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        const errorBody = await res.text().catch(() => "Unknown error");
        throw new Error(`API error ${res.status}: ${errorBody}`);
    }

    return res.json();
}

// ─── Departments ─────────────────────────────────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
    return request<Department[]>("/api/departments");
}

export async function createDepartment(
    data: Pick<Department, "name" | "description">
): Promise<Department> {
    return request<Department>("/api/departments", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ─── CVs ─────────────────────────────────────────────────────────────────────

export async function getDepartmentCVs(departmentId: number): Promise<CV[]> {
    return request<CV[]>(`/api/departments/${departmentId}/cvs`);
}

export async function uploadCV(
    departmentId: number,
    file: File
): Promise<CV> {
    const formData = new FormData();
    formData.append("file", file);

    return request<CV>(`/api/departments/${departmentId}/cvs`, {
        method: "POST",
        body: formData,
    });
}

export async function getCV(cvId: number): Promise<CV> {
    return request<CV>(`/api/cvs/${cvId}`);
}

export async function updateCVStatus(
    cvId: number,
    status: "pending" | "passed" | "failed"
): Promise<CV> {
    return request<CV>(`/api/cvs/${cvId}/status`, {
        method: "PATCH",
        body: JSON.stringify({status}),
    });
}

export async function deleteCV(cvId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/cvs/${cvId}`, {
        method: "DELETE",
        headers: {"X-Admin-Key": getAdminKey()},
    });
    if (res.status === 401) {
        clearAdminKey();
        window.location.href = "/login";
    }
}

export function getCVFileUrl(cvId: number): string {
    return `${API_BASE}/api/cvs/${cvId}/file?key=${encodeURIComponent(getAdminKey())}`;
}

export function getCVDownloadUrl(cvId: number): string {
    return `${API_BASE}/api/cvs/${cvId}/file?download=true&key=${encodeURIComponent(getAdminKey())}`;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function triggerReview(
    cvId: number,
    note: string = ""
): Promise<Review> {
    return request<Review>(`/api/cvs/${cvId}/review`, {
        method: "POST",
        body: JSON.stringify({note}),
    });
}

export async function getReview(cvId: number): Promise<Review> {
    return request<Review>(`/api/cvs/${cvId}/review`);
}

// ─── Job Descriptions ────────────────────────────────────────────────────────

export async function getAllJDs(): Promise<JD[]> {
    return request<JD[]>("/api/jds");
}

export async function getDepartmentJDs(departmentId: number): Promise<JD[]> {
    return request<JD[]>(`/api/departments/${departmentId}/jds`);
}

export async function createJD(
    departmentId: number,
    data: Pick<JD, "title" | "description" | "requirements">
): Promise<JD> {
    return request<JD>(`/api/departments/${departmentId}/jds`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getJD(jdId: number): Promise<JD> {
    return request<JD>(`/api/jds/${jdId}`);
}

export async function updateJD(
    jdId: number,
    data: Partial<Pick<JD, "title" | "description" | "requirements">>
): Promise<JD> {
    return request<JD>(`/api/jds/${jdId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteJD(jdId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/jds/${jdId}`, {
        method: "DELETE",
        headers: {"X-Admin-Key": getAdminKey()},
    });
    if (res.status === 401) {
        clearAdminKey();
        window.location.href = "/login";
    }
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export async function triggerMatch(
    cvId: number,
    jdId: number
): Promise<Match> {
    return request<Match>(`/api/cvs/${cvId}/match/${jdId}`, {method: "POST"});
}

export async function getMatches(cvId: number): Promise<Match[]> {
    return request<Match[]>(`/api/cvs/${cvId}/matches`);
}
