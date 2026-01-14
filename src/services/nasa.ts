// services/nasa.ts
import { NASA_API_KEY } from "../config";

const NASA_BASE_URL = "https://api.nasa.gov";

/* =========================
   Types
========================= */

export type APODResponse = {
    title: string;
    explanation: string;
    url: string;
    hdurl?: string;
    date: string;
    media_type: "image" | "video";
};

export type MarsPhoto = {
    id: number;
    img_src: string;
    earth_date: string;
    rover: {
        name: string;
        landing_date: string;
        launch_date: string;
        status: string;
    };
    camera: {
        name: string;
        full_name: string;
    };
};

type MarsResponse = {
    photos: MarsPhoto[];
};

export type ImageSearchItem = {
    title: string;
    description: string;
    imageUrl: string;
};

/* =========================
   API helper
========================= */

async function apiGet<T>(
    endpoint: string,
    params: Record<string, string> = {}
): Promise<T> {
    const query = new URLSearchParams({
        api_key: NASA_API_KEY,
        ...params,
    });

    const response = await fetch(
        `${NASA_BASE_URL}${endpoint}?${query.toString()}`
    );

    if (!response.ok) {
        throw new Error(`NASA API error (${response.status})`);
    }

    return response.json() as Promise<T>;
}

/* =========================
   APOD
========================= */

export function getAPOD(date?: string): Promise<APODResponse> {
    return apiGet<APODResponse>("/planetary/apod", date ? { date } : {});
}

/* =========================
   Mars Rover
========================= */

export async function getMarsPhotos(
    rover: string,
    date: string
): Promise<MarsPhoto[]> {
    const result = await apiGet<MarsResponse>(
        `/mars-photos/api/v1/rovers/${rover}/photos`,
        { earth_date: date }
    );

    return result.photos;
}

/* =========================
   Image Search
========================= */

export async function searchImages(
    query: string
): Promise<ImageSearchItem[]> {
    const data = await apiGet<any>("/search", { q: query });

    const items = data.collection?.items ?? [];

    return items
        .map((item: any): ImageSearchItem | null => {
            const info = item.data?.[0];
            const img = item.links?.find((l: any) => l.render === "image");

            if (!info || !img) return null;

            return {
                title: info.title,
                description: info.description ?? "",
                imageUrl: img.href,
            };
        })
        .filter(Boolean) as ImageSearchItem[];
}
