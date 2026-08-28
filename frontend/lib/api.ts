const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchAPI(path: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

export async function postAPI(path: string, body: unknown) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}
