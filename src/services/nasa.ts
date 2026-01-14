import { NASA_API_KEY } from "../config";

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

const NASA_BASE_URL = "https://api.nasa.gov";

async function apiGet<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const query = new URLSearchParams({
        api_key: NASA_API_KEY,
        ...params,
    });

    const url = `${NASA_BASE_URL}${endpoint}?${query.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`NASA API error (${response.status})`);
    }

    return (await response.json()) as T;
}


export const getAPOD = async (date?: string) => {
    const url = new URL("https://api.nasa.gov/planetary/apod");
    url.searchParams.append("api_key", "DEMO_KEY");

    if (date) url.searchParams.append("date", date);

    const response = await fetch(url.toString());
    return response.json();
};




export async function getMarsPhotos(rover: string, date: string): Promise<MarsPhoto[]> {
    const result = await apiGet<MarsResponse>(`/mars-photos/api/v1/rovers/${rover}/photos`, {
        earth_date: date,
    });

    return result.photos;
}

export async function searchImages(query: string): Promise<ImageSearchResponse> {
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
