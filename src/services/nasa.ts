import { NASA_API_KEY } from "../config";

/* ============================
   Types
============================ */

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

export type MarsResponse = {
    photos: MarsPhoto[];
};

export type ImageSearchItem = {
    title: string;
    description: string;
    imageUrl: string;
};

export type ImageSearchResponse = ImageSearchItem[];

export type EPICImage = {
    identifier: string;
    caption: string;
    image: string;
    date: string;
    centroid_coordinates: {
        lat: number;
        lon: number;
    };
};

/* ============================
   API Core
============================ */

const NASA_BASE_URL = "https://api.nasa.gov";

async function apiGet<T>(
    endpoint: string,
    params: Record<string, string | undefined> = {}
): Promise<T> {
    const query = new URLSearchParams({
        api_key: NASA_API_KEY,
        ...Object.fromEntries(
            Object.entries(params).filter(([, value]) => value !== undefined)
        ),
    });

    const url = `${NASA_BASE_URL}${endpoint}?${query.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`NASA API error (${response.status})`);
    }

    return (await response.json()) as T;
}

/* ============================
   Endpoints
============================ */

export function getAPOD(date?: string): Promise<APODResponse> {
    return apiGet<APODResponse>("/planetary/apod", {
        date,
    });
}

export async function getMarsPhotos(
    rover: string,
    date: string
): Promise<MarsPhoto[]> {
    const query = new URLSearchParams({
        earth_date: date,
        api_key: NASA_API_KEY,
    });
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover.toLowerCase()}/photos?${query.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`NASA API error (${response.status})`);
    }

    const result = await response.json();
    return result.photos;
}

export async function searchImages(
    query: string
): Promise<ImageSearchResponse> {
    const data = await apiGet<any>("/search", { q: query });

    const collection = data.collection?.items ?? [];

    return collection
        .map((item: any) => {
            const info = item.data?.[0];
            const img = item.links?.find((l: any) => l.render === "image");

            if (!info || !img) return null;

            return {
                title: info.title,
                description: info.description || "",
                imageUrl: img.href,
            };
        })
        .filter(Boolean) as ImageSearchItem[];
}

export async function getEPICImages(date: string): Promise<EPICImage[]> {
    const response = await fetch(
        `https://api.nasa.gov/EPIC/api/natural/date/${date}?api_key=${NASA_API_KEY}`
    );

    if (!response.ok) {
        throw new Error(`NASA EPIC API error (${response.status})`);
    }

    return (await response.json()) as EPICImage[];
}

export function getEPICImageUrl(date: string, imageName: string): string {
    // Date format: YYYY-MM-DD -> YYYY/MM/DD for the URL
    const [year, month, day] = date.split("-");
    return `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/${imageName}.png?api_key=${NASA_API_KEY}`;
}

