import { NASA_API_KEY } from "../config";
import { ApiHttpError } from "../types/errors";

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

/**
 * Timeout pour les requêtes API (en ms)
 */
const API_TIMEOUT = 15000;

/**
 * Mode debug - mettre à false en production
 */
const DEBUG_MODE = __DEV__ ?? true;

function debugLog(message: string, data?: any) {
    if (DEBUG_MODE) {
        console.log(`[NASA API] ${message}`, data !== undefined ? data : "");
    }
}

/**
 * Effectue une requête avec timeout
 */
async function fetchWithTimeout(url: string, timeout: number = API_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    debugLog("Fetching URL:", url.replace(NASA_API_KEY, "***API_KEY***"));

    try {
        const response = await fetch(url, { signal: controller.signal });
        debugLog(`Response status: ${response.status} ${response.statusText}`);
        return response;
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            debugLog("Request timeout");
            throw new ApiHttpError(408, "La requête a pris trop de temps. Veuillez réessayer.");
        }
        debugLog("Fetch error:", error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Gère la réponse HTTP et renvoie une erreur appropriée si nécessaire
 */
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        debugLog(`API Error (${response.status}):`, errorText);
        throw new ApiHttpError(response.status, `NASA API error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    debugLog("Response data received:", Array.isArray(data) ? `Array[${data.length}]` : typeof data);
    return data as T;
}

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
    const response = await fetchWithTimeout(url);
    return handleResponse<T>(response);
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
    // Valider le nom du rover
    const validRovers = ["curiosity", "opportunity", "spirit"];
    const normalizedRover = rover.toLowerCase();

    if (!validRovers.includes(normalizedRover)) {
        debugLog(`Invalid rover name: ${rover}`);
        throw new ApiHttpError(400, `Rover invalide: ${rover}. Rovers valides: ${validRovers.join(", ")}`);
    }

    // Valider le format de la date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        debugLog(`Invalid date format: ${date}`);
        throw new ApiHttpError(400, `Format de date invalide: ${date}. Format attendu: YYYY-MM-DD`);
    }

    debugLog(`Fetching Mars photos for rover: ${normalizedRover}, date: ${date}`);

    const query = new URLSearchParams({
        earth_date: date,
        api_key: NASA_API_KEY,
    });
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${normalizedRover}/photos?${query.toString()}`;

    try {
        const response = await fetchWithTimeout(url);
        const result = await handleResponse<MarsResponse>(response);

        debugLog(`Mars photos received: ${result.photos?.length ?? 0} photos`);

        // L'API peut retourner un objet vide ou photos undefined
        if (!result.photos) {
            debugLog("No photos array in response");
            return [];
        }

        return result.photos;
    } catch (error) {
        debugLog("Mars API error:", error);
        throw error;
    }
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
    // Valider le format de la date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        debugLog(`Invalid date format: ${date}`);
        throw new ApiHttpError(400, `Format de date invalide: ${date}. Format attendu: YYYY-MM-DD`);
    }

    debugLog(`Fetching EPIC images for date: ${date}`);

    const url = `https://api.nasa.gov/EPIC/api/natural/date/${date}?api_key=${NASA_API_KEY}`;

    try {
        const response = await fetchWithTimeout(url);
        const data = await handleResponse<EPICImage[]>(response);

        debugLog(`EPIC images received: ${data?.length ?? 0} images`);

        // L'API peut retourner un tableau vide ou null
        if (!Array.isArray(data)) {
            debugLog("EPIC response is not an array:", typeof data);
            return [];
        }

        return data;
    } catch (error) {
        debugLog("EPIC API error:", error);
        throw error;
    }
}

/**
 * Récupère les dates disponibles pour EPIC
 * Utile pour trouver la dernière date avec des images
 */
export async function getEPICAvailableDates(): Promise<string[]> {
    debugLog("Fetching EPIC available dates");

    const url = `https://api.nasa.gov/EPIC/api/natural/all?api_key=${NASA_API_KEY}`;

    try {
        const response = await fetchWithTimeout(url);
        const data = await handleResponse<Array<{ date: string }>>(response);

        const dates = data.map(item => item.date.split(" ")[0]);
        debugLog(`EPIC available dates: ${dates.length} dates, latest: ${dates[0]}`);

        return dates;
    } catch (error) {
        debugLog("EPIC available dates error:", error);
        throw error;
    }
}

export function getEPICImageUrl(date: string, imageName: string): string {
    // Date format: YYYY-MM-DD -> YYYY/MM/DD for the URL
    const [year, month, day] = date.split("-");
    return `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/${imageName}.png?api_key=${NASA_API_KEY}`;
}
