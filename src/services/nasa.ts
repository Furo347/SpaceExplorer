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

export type NeoWsLinkCollection = {
    next?: string;
    prev?: string;
    self?: string;
};

export type NeoWsEstimatedDiameter = {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
};

export type NeoWsAsteroid = {
    id: string;
    neo_reference_id: string;
    name: string;
    nasa_jpl_url: string;
    absolute_magnitude_h: number;
    estimated_diameter: {
        kilometers: NeoWsEstimatedDiameter;
        meters: NeoWsEstimatedDiameter;
        miles: NeoWsEstimatedDiameter;
        feet: NeoWsEstimatedDiameter;
    };
    is_potentially_hazardous_asteroid: boolean;
    is_sentry_object: boolean;
    close_approach_data: Array<{
        close_approach_date: string;
        close_approach_date_full?: string;
        epoch_date_close_approach?: number;
        orbiting_body: string;
        relative_velocity: {
            kilometers_per_second: string;
            kilometers_per_hour: string;
            miles_per_hour: string;
        };
        miss_distance: {
            astronomical: string;
            lunar: string;
            kilometers: string;
            miles: string;
        };
    }>;
};

export type NeoWsFeedResponse = {
    links: NeoWsLinkCollection;
    element_count: number;
    near_earth_objects: Record<string, NeoWsAsteroid[]>;
};

export type DonkiEventType =
    | "all"
    | "FLR"
    | "SEP"
    | "CME"
    | "IPS"
    | "MPC"
    | "GST"
    | "RBE"
    | "report";

export type DonkiEvent = {
    messageID: string;
    messageType: string;
    messageIssueTime: string;
    messageURL: string;
    messageBody: string;
};

/* ============================
   API Core
============================ */

const NASA_BASE_URL = "https://api.nasa.gov";

const API_TIMEOUT = 15000;

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const NEO_WS_MAX_RANGE_DAYS = 7;

const DEBUG_MODE = __DEV__ ?? true;

function debugLog(message: string, data?: any) {
    if (DEBUG_MODE) {
        console.log(`[NASA API] ${message}`, data ?? "");
    }
}

function assertIsoDate(date: string, fieldName: string): void {
    if (!ISO_DATE_REGEX.test(date)) {
        debugLog(`Invalid ${fieldName} format: ${date}`);
        throw new ApiHttpError(400, `Format de date invalide pour ${fieldName}: ${date}. Format attendu: YYYY-MM-DD`);
    }
}

function parseIsoDate(date: string, fieldName: string): Date {
    assertIsoDate(date, fieldName);

    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
        throw new ApiHttpError(400, `Date invalide pour ${fieldName}: ${date}`);
    }

    return parsed;
}

function diffDays(startDate: string, endDate: string): number {
    const start = parseIsoDate(startDate, "startDate");
    const end = parseIsoDate(endDate, "endDate");
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay);
}

function normalizeApiError(error: unknown, fallbackMessage: string): ApiHttpError {
    if (error instanceof ApiHttpError) {
        return error;
    }

    if (error instanceof Error) {
        return new ApiHttpError(503, `${fallbackMessage} (${error.message})`);
    }

    return new ApiHttpError(503, fallbackMessage);
}

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

export async function getNearEarthObjects(date: string): Promise<NeoWsAsteroid[]> {
    assertIsoDate(date, "date");

    debugLog(`Fetching NeoWs feed for date: ${date}`);

    try {
        const data = await apiGet<NeoWsFeedResponse>("/neo/rest/v1/feed", {
            start_date: date,
            end_date: date,
        });

        const asteroids = data.near_earth_objects?.[date] ?? [];
        debugLog(`NeoWs asteroids received for ${date}: ${asteroids.length}`);

        return asteroids;
    } catch (error) {
        debugLog("NeoWs API error:", error);
        throw normalizeApiError(error, "Service NeoWs temporairement indisponible");
    }
}

export async function getDonkiEvents(startDate: string, endDate: string): Promise<DonkiEvent[]> {
    const rangeDays = diffDays(startDate, endDate);

    if (rangeDays < 0) {
        throw new ApiHttpError(400, "La date de fin doit être supérieure ou égale à la date de début.");
    }

    if (rangeDays > NEO_WS_MAX_RANGE_DAYS) {
        throw new ApiHttpError(400, "La plage de dates est trop grande. Limite: 7 jours.");
    }

    debugLog(`Fetching DONKI events from ${startDate} to ${endDate}`);

    try {
        const data = await apiGet<DonkiEvent[]>("/DONKI/notifications", {
            startDate,
            endDate,
            type: "all",
        });

        if (!Array.isArray(data)) {
            debugLog("DONKI response is not an array:", typeof data);
            return [];
        }

        debugLog(`DONKI events received: ${data.length}`);
        return data;
    } catch (error) {
        debugLog("DONKI API error:", error);
        throw normalizeApiError(error, "Service DONKI temporairement indisponible");
    }
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

    assertIsoDate(date, "date");

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
    assertIsoDate(date, "date");

    debugLog(`Fetching EPIC images for date: ${date}`);

    const url = `https://api.nasa.gov/EPIC/api/natural/date/${date}?api_key=${NASA_API_KEY}`;

    try {
        const response = await fetchWithTimeout(url);
        const data = await handleResponse<EPICImage[]>(response);

        debugLog(`EPIC images received: ${data?.length ?? 0} images`);

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
    const [year, month, day] = date.split("-");
    return `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/${imageName}.png?api_key=${NASA_API_KEY}`;
}
